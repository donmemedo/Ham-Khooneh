"""HamEghamat API — short-term stays marketplace for Iran."""
import hashlib
import json
import os
import re
import secrets
import sqlite3
import threading
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Annotated, Literal

from fastapi import Cookie, Depends, FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, BeforeValidator, Field

from seed import AMENITIES, CITIES, TYPES, seed

GUEST_FEE, HOST_COMMISSION, MAX_NIGHTS = 0.03, 0.10, 30  # business plan: 3% guest fee, 10% host commission
OTP_TTL, OTP_COOLDOWN, OTP_TRIES, SESSION_DAYS = 120, 60, 5, 30
OTP_DEV = os.getenv("OTP_DEV", "1") == "1"  # no SMS provider yet: the code is echoed back to the client
COOKIE_SECURE = os.getenv("COOKIE_SECURE") == "1"
DATA = Path(os.getenv("DATA_DIR", "data"))
UPLOADS = DATA / "uploads"
UPLOADS.mkdir(parents=True, exist_ok=True)
IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}

# ponytail: one connection + lock; fine for a single-instance app, move to Postgres when scaling out
LOCK = threading.RLock()
DB = sqlite3.connect(DATA / "app.db", check_same_thread=False, isolation_level=None)
DB.row_factory = sqlite3.Row
DB.executescript("""
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, phone TEXT UNIQUE, name TEXT, name_en TEXT, national_id TEXT, verified INT DEFAULT 0, created TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id INT, expires TEXT);
CREATE TABLE IF NOT EXISTS otps(phone TEXT PRIMARY KEY, code TEXT, expires TEXT, sent TEXT, tries INT DEFAULT 0);
CREATE TABLE IF NOT EXISTS listings(id INTEGER PRIMARY KEY, host_id INT, city TEXT, type TEXT, title TEXT, area TEXT, description TEXT, price INT,
  guests INT, bedrooms INT, baths INT, rating REAL DEFAULT 0, reviews_count INT DEFAULT 0, images TEXT, amenities TEXT, instant INT, active INT DEFAULT 1, created TEXT);
CREATE TABLE IF NOT EXISTS bookings(id INTEGER PRIMARY KEY, code TEXT UNIQUE, listing_id INT, guest_id INT, check_in TEXT, check_out TEXT, guests INT,
  nights INT, subtotal INT, fee INT, total INT, payout INT, status TEXT, created TEXT);
CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY, listing_id INT, user_id INT, booking_id INT UNIQUE, name TEXT, rating INT, text TEXT, created TEXT);
CREATE TABLE IF NOT EXISTS tickets(id INTEGER PRIMARY KEY, user_id INT, booking_code TEXT, subject TEXT, message TEXT, status TEXT, created TEXT);
CREATE INDEX IF NOT EXISTS ix_bookings_listing ON bookings(listing_id, status);
""")


def q(sql, *args):
    with LOCK:
        return DB.execute(sql, args).fetchall()


def one(sql, *args):
    r = q(sql, *args)
    return r[0] if r else None


with LOCK:
    if not one("SELECT 1 FROM listings"):
        seed(q)

app = FastAPI(title="HamEghamat API")
app.mount("/api/uploads", StaticFiles(directory=UPLOADS), name="uploads")

J, P = (lambda v: json.dumps(v, ensure_ascii=False)), json.loads
now = lambda: datetime.now().isoformat(timespec="seconds")
sha = lambda s: hashlib.sha256(s.encode()).hexdigest()
FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
Digits = lambda pattern: Annotated[str, BeforeValidator(lambda v: str(v).translate(FA_DIGITS).strip()), Field(pattern=pattern)]
Phone = Digits(r"^09\d{9}$")
ACTIVE = "('pending','confirmed')"


def err(status, code):
    raise HTTPException(status, code)


def valid_national_id(s: str) -> bool:
    if not re.fullmatch(r"\d{10}", s) or len(set(s)) == 1:
        return False
    c = sum(int(s[i]) * (10 - i) for i in range(9)) % 11
    return int(s[9]) == (c if c < 2 else 11 - c)


# ---------- auth ----------
def optional_user(session: str | None = Cookie(None)):
    return one("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?", sha(session), now()) if session else None


def user(u=Depends(optional_user)):
    return u or err(401, "auth")


def user_out(u):
    return {"id": u["id"], "phone": u["phone"], "name": u["name"], "verified": bool(u["verified"]),
            "national_id": u["national_id"] and "******" + u["national_id"][-4:],
            "is_host": bool(one("SELECT 1 FROM listings WHERE host_id=?", u["id"]))}


class OtpIn(BaseModel):
    phone: Phone


class VerifyIn(OtpIn):
    code: Digits(r"^\d{5}$")
    name: str | None = Field(None, max_length=60)


@app.post("/api/auth/otp")
def send_otp(b: OtpIn):
    o = one("SELECT sent FROM otps WHERE phone=?", b.phone)
    if o and datetime.fromisoformat(o["sent"]) > datetime.now() - timedelta(seconds=OTP_COOLDOWN):
        err(429, "otp_wait")
    code = f"{secrets.randbelow(10**5):05d}"
    q("INSERT OR REPLACE INTO otps(phone,code,expires,sent,tries) VALUES(?,?,?,?,0)", b.phone, sha(code),
      (datetime.now() + timedelta(seconds=OTP_TTL)).isoformat(timespec="seconds"), now())
    # ponytail: plug an SMS gateway (Kavenegar etc.) here and set OTP_DEV=0
    return {"sent": True, "is_new": not one("SELECT 1 FROM users WHERE phone=?", b.phone), "ttl": OTP_TTL,
            "dev_code": code if OTP_DEV else None}


@app.post("/api/auth/verify")
def verify_otp(b: VerifyIn, res: Response):
    o = one("SELECT * FROM otps WHERE phone=?", b.phone)
    if not o or o["expires"] < now():
        err(400, "otp_expired")
    if o["tries"] >= OTP_TRIES:
        err(429, "otp_locked")
    if not secrets.compare_digest(o["code"], sha(b.code)):
        q("UPDATE otps SET tries=tries+1 WHERE phone=?", b.phone)
        err(400, "otp_wrong")
    u = one("SELECT * FROM users WHERE phone=?", b.phone)
    if not u:
        name = (b.name or "").strip()
        if len(name) < 2:
            err(422, "name_required")
        q("INSERT INTO users(phone,name,created) VALUES(?,?,?)", b.phone, name, now())
        u = one("SELECT * FROM users WHERE phone=?", b.phone)
    q("DELETE FROM otps WHERE phone=?", b.phone)
    token = secrets.token_urlsafe(32)
    q("INSERT INTO sessions VALUES(?,?,?)", sha(token), u["id"], (datetime.now() + timedelta(days=SESSION_DAYS)).isoformat(timespec="seconds"))
    res.set_cookie("session", token, max_age=SESSION_DAYS * 86400, httponly=True, samesite="lax", secure=COOKIE_SECURE)
    return user_out(u)


@app.post("/api/auth/logout")
def logout(res: Response, session: str | None = Cookie(None)):
    if session:
        q("DELETE FROM sessions WHERE token=?", sha(session))
    res.delete_cookie("session")
    return {"ok": True}


@app.get("/api/me")
def me(u=Depends(user)):
    return user_out(u)


class ProfileIn(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=60)
    national_id: Digits(r"^\d{10}$") | None = None


@app.patch("/api/me")
def update_me(b: ProfileIn, u=Depends(user)):
    if b.national_id is not None:
        if not valid_national_id(b.national_id):
            err(422, "bad_national_id")
        q("UPDATE users SET national_id=?, verified=1 WHERE id=?", b.national_id, u["id"])
    if b.name:
        q("UPDATE users SET name=? WHERE id=?", b.name.strip(), u["id"])
    return user_out(one("SELECT * FROM users WHERE id=?", u["id"]))


# ---------- listings ----------
LISTING_SQL = "SELECT l.*, u.name hname, u.name_en hname_en, u.created hcreated, u.verified hverified FROM listings l JOIN users u ON u.id=l.host_id"


def listing_out(r, full=False):
    out = {k: r[k] for k in ("id", "city", "type", "price", "guests", "bedrooms", "baths", "reviews_count")}
    out |= {"title": P(r["title"]), "area": P(r["area"]), "images": P(r["images"]), "amenities": P(r["amenities"]),
            "rating": round(r["rating"], 2), "instant": bool(r["instant"]), "active": bool(r["active"]),
            "superhost": r["rating"] >= 4.85 and r["reviews_count"] >= 10,
            "host": {"fa": r["hname"], "en": r["hname_en"] or r["hname"], "verified": bool(r["hverified"]),
                     "years": max(1, (date.today() - date.fromisoformat(r["hcreated"][:10])).days // 365)}}
    if full:
        out["description"] = P(r["description"])
    return out


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/cities")
def cities():
    counts = dict(q("SELECT city, COUNT(*) FROM listings WHERE active=1 GROUP BY city"))
    return [{**c, "count": counts.get(c["key"], 0)} for c in CITIES]


SORTS = {"price_asc": "l.price", "price_desc": "l.price DESC", "rating": "l.rating DESC", "": "l.rating * l.reviews_count DESC"}


@app.get("/api/listings")
def listings(city: str = "", type: str = "", guests: int = 1, check_in: date | None = None, check_out: date | None = None,
             sort: str = "", ids: str = ""):
    sql, args = LISTING_SQL + " WHERE l.active=1 AND l.guests>=?", [guests]
    if city:
        sql += " AND l.city=?"; args.append(city)
    if type:
        sql += " AND l.type=?"; args.append(type)
    if ids:
        id_list = [int(x) for x in ids.split(",") if x.isdigit()][:100]
        sql += f" AND l.id IN ({','.join('?' * len(id_list)) or 'NULL'})"; args += id_list
    if check_in and check_out and check_in < check_out:
        sql += f" AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.listing_id=l.id AND b.status IN {ACTIVE} AND b.check_in<? AND ?<b.check_out)"
        args += [str(check_out), str(check_in)]
    return [listing_out(r) for r in q(sql + " ORDER BY " + SORTS.get(sort, SORTS[""]), *args)]


@app.get("/api/listings/{listing_id}")
def listing(listing_id: int, u=Depends(optional_user)):
    r = one(LISTING_SQL + " WHERE l.id=?", listing_id)
    if not r or (not r["active"] and not (u and u["id"] == r["host_id"])):
        err(404, "not_found")
    reviews = [{"name": P(x["name"]), "rating": x["rating"], "text": P(x["text"]), "created": x["created"][:10]}
               for x in q("SELECT * FROM reviews WHERE listing_id=? ORDER BY id DESC LIMIT 6", listing_id)]
    booked = [dict(b) for b in q(f"SELECT check_in, check_out FROM bookings WHERE listing_id=? AND status IN {ACTIVE} AND check_out>=?",
                                  listing_id, str(date.today()))]
    return {**listing_out(r, True), "reviews": reviews, "booked": booked, "guest_fee": GUEST_FEE,
            "is_mine": bool(u and u["id"] == r["host_id"])}


# ---------- bookings ----------
class BookingIn(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1, le=20)


def quote(price: int, nights: int) -> dict:
    subtotal = price * nights
    fee = round(subtotal * GUEST_FEE)
    return {"nights": nights, "subtotal": subtotal, "fee": fee, "total": subtotal + fee, "payout": subtotal - round(subtotal * HOST_COMMISSION)}


def booking_out(b):
    today = str(date.today())
    out = {k: b[k] for k in b.keys() if k not in ("id", "guest_id")}
    if "title" in b.keys():
        out |= {"title": P(b["title"]), "area": P(b["area"]), "images": P(b["images"])}
    out["can_cancel"] = b["status"] in ("pending", "confirmed") and b["check_in"] > today
    out["can_review"] = b["status"] == "confirmed" and b["check_out"] <= today and not one("SELECT 1 FROM reviews WHERE booking_id=?", b["id"])
    return out


@app.post("/api/bookings", status_code=201)
def book(b: BookingIn, u=Depends(user)):
    l = one("SELECT * FROM listings WHERE id=? AND active=1", b.listing_id) or err(404, "not_found")
    nights = (b.check_out - b.check_in).days
    if b.check_in < date.today():
        err(422, "past_date")
    if not 0 < nights <= MAX_NIGHTS:
        err(422, "bad_dates")
    if b.guests > l["guests"]:
        err(422, "too_many_guests")
    if l["host_id"] == u["id"]:
        err(422, "own_listing")
    with LOCK:  # overlap check + insert must be atomic
        if one(f"SELECT 1 FROM bookings WHERE listing_id=? AND status IN {ACTIVE} AND check_in<? AND ?<check_out", b.listing_id, str(b.check_out), str(b.check_in)):
            err(409, "unavailable")
        code = "HE-" + secrets.token_hex(3).upper()
        p = quote(l["price"], nights)
        q("INSERT INTO bookings(code,listing_id,guest_id,check_in,check_out,guests,nights,subtotal,fee,total,payout,status,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
          code, b.listing_id, u["id"], str(b.check_in), str(b.check_out), b.guests, p["nights"], p["subtotal"], p["fee"], p["total"], p["payout"],
          "confirmed" if l["instant"] else "pending", now())
    return booking_out(one("SELECT * FROM bookings WHERE code=?", code))


TRIP_SQL = "SELECT b.*, l.title, l.area, l.images, l.city FROM bookings b JOIN listings l ON l.id=b.listing_id"


@app.get("/api/me/bookings")
def my_bookings(u=Depends(user)):
    return [booking_out(b) for b in q(TRIP_SQL + " WHERE b.guest_id=? ORDER BY b.check_in DESC", u["id"])]


def my_booking(code, u):
    return one("SELECT * FROM bookings WHERE code=? AND guest_id=?", code, u["id"]) or err(404, "not_found")


@app.post("/api/bookings/{code}/cancel")
def cancel(code: str, u=Depends(user)):
    if not booking_out(my_booking(code, u))["can_cancel"]:
        err(422, "cannot_cancel")
    q("UPDATE bookings SET status='cancelled' WHERE code=?", code)
    return {"ok": True}


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str = Field(min_length=3, max_length=600)


@app.post("/api/bookings/{code}/review", status_code=201)
def review(code: str, r: ReviewIn, u=Depends(user)):
    b = my_booking(code, u)
    if not booking_out(b)["can_review"]:
        err(422, "cannot_review")
    with LOCK:
        q("INSERT INTO reviews(listing_id,user_id,booking_id,name,rating,text,created) VALUES(?,?,?,?,?,?,?)", b["listing_id"], u["id"], b["id"],
          J({"fa": u["name"], "en": u["name"]}), r.rating, J({"fa": r.text.strip(), "en": r.text.strip()}), now())
        q("UPDATE listings SET rating=(rating*reviews_count+?)/(reviews_count+1), reviews_count=reviews_count+1 WHERE id=?", r.rating, b["listing_id"])
    return {"ok": True}


# ---------- host ----------
@app.get("/api/host")
def host_dashboard(u=Depends(user)):
    mine = q(LISTING_SQL + " WHERE l.host_id=? ORDER BY l.id DESC", u["id"])
    res = q("SELECT b.*, l.title, l.area, l.images, l.city, g.name guest_name, g.verified guest_verified FROM bookings b "
            "JOIN listings l ON l.id=b.listing_id JOIN users g ON g.id=b.guest_id WHERE l.host_id=? ORDER BY b.status='pending' DESC, b.check_in", u["id"])
    today = str(date.today())
    stats = {r["listing_id"]: r for r in q("SELECT listing_id, COUNT(*) n, SUM(payout) s FROM bookings WHERE status='confirmed' GROUP BY listing_id")}
    return {
        "listings": [listing_out(l) | {"bookings": stats[l["id"]]["n"] if l["id"] in stats else 0,
                                       "earnings": stats[l["id"]]["s"] if l["id"] in stats else 0} for l in mine],
        "reservations": [booking_out(b) | {"guest_name": b["guest_name"], "guest_verified": bool(b["guest_verified"])} for b in res],
        "stats": {"earnings": sum(b["payout"] for b in res if b["status"] == "confirmed"),
                  "upcoming": sum(b["status"] == "confirmed" and b["check_in"] >= today for b in res),
                  "pending": sum(b["status"] == "pending" for b in res),
                  "rating": round(sum(l["rating"] for l in mine) / len(mine), 2) if mine else 0},
        "commission": HOST_COMMISSION,
    }


@app.post("/api/host/listings", status_code=201)
async def create_listing(
    title: Annotated[str, Form(min_length=3, max_length=80)], area: Annotated[str, Form(min_length=2, max_length=60)],
    description: Annotated[str, Form(min_length=20, max_length=2000)], city: Annotated[str, Form()], type: Annotated[str, Form()],
    price: Annotated[int, Form(ge=100_000, le=500_000_000)], guests: Annotated[int, Form(ge=1, le=20)],
    bedrooms: Annotated[int, Form(ge=0, le=20)], baths: Annotated[int, Form(ge=1, le=20)],
    amenities: Annotated[str, Form()] = "", instant: Annotated[bool, Form()] = False,
    photos: Annotated[list[UploadFile], File()] = [], u=Depends(user),
):
    if city not in {c["key"] for c in CITIES} or type not in TYPES:
        err(422, "bad_listing")
    if not 1 <= len(photos) <= 8:
        err(422, "photos_count")
    images = []
    for f in photos:
        ext = IMAGE_TYPES.get(f.content_type or "")
        data = await f.read(5 * 1024 * 1024 + 1)
        if not ext or len(data) > 5 * 1024 * 1024:
            err(422, "bad_photo")
        name = uuid.uuid4().hex + ext
        (UPLOADS / name).write_bytes(data)
        images.append("u/" + name)
    am = [a for a in amenities.split(",") if a in AMENITIES]
    tr = lambda s: J({"fa": s.strip(), "en": s.strip()})
    with LOCK:
        q("INSERT INTO listings(host_id,city,type,title,area,description,price,guests,bedrooms,baths,images,amenities,instant,active,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)",
          u["id"], city, type, tr(title), tr(area), tr(description), price, guests, bedrooms, baths, J(images), J(am), int(instant), now())
        new_id = one("SELECT last_insert_rowid() id")["id"]
    return {"id": new_id}


class ListingPatch(BaseModel):
    price: int | None = Field(None, ge=100_000, le=500_000_000)
    active: bool | None = None
    instant: bool | None = None


@app.patch("/api/host/listings/{listing_id}")
def update_listing(listing_id: int, b: ListingPatch, u=Depends(user)):
    one("SELECT 1 FROM listings WHERE id=? AND host_id=?", listing_id, u["id"]) or err(404, "not_found")
    for k, v in b.model_dump(exclude_none=True).items():
        q(f"UPDATE listings SET {k}=? WHERE id=?", int(v), listing_id)  # k comes from the model's fixed field names
    return {"ok": True}


@app.post("/api/host/bookings/{code}/{action}")
def host_decide(code: str, action: Literal["confirm", "decline"], u=Depends(user)):
    b = one("SELECT b.status FROM bookings b JOIN listings l ON l.id=b.listing_id WHERE b.code=? AND l.host_id=?", code, u["id"]) or err(404, "not_found")
    if b["status"] != "pending":
        err(422, "not_pending")
    q("UPDATE bookings SET status=? WHERE code=?", "confirmed" if action == "confirm" else "declined", code)
    return {"ok": True}


# ---------- support (پشتیبانی آنلاین) ----------
class TicketIn(BaseModel):
    subject: str = Field(min_length=3, max_length=120)
    message: str = Field(min_length=10, max_length=2000)
    booking_code: str | None = Field(None, max_length=20)


@app.post("/api/support", status_code=201)
def create_ticket(t: TicketIn, u=Depends(user)):
    q("INSERT INTO tickets(user_id,booking_code,subject,message,status,created) VALUES(?,?,?,?,?,?)",
      u["id"], t.booking_code or None, t.subject.strip(), t.message.strip(), "open", now())
    return {"ok": True}


@app.get("/api/me/tickets")
def my_tickets(u=Depends(user)):
    return [dict(t) for t in q("SELECT id, booking_code, subject, message, status, created FROM tickets WHERE user_id=? ORDER BY id DESC", u["id"])]

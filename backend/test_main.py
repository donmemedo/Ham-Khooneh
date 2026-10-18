"""Run: python test_main.py  (needs httpx). Uses a throwaway DB."""
import os
import tempfile
from datetime import date, timedelta

os.environ["DATA_DIR"] = tempfile.mkdtemp()
from fastapi.testclient import TestClient  # noqa: E402

from main import app, valid_national_id  # noqa: E402

d = lambda n: str(date.today() + timedelta(n))


def login(c, phone, name=None):
    r = c.post("/api/auth/otp", json={"phone": phone})
    assert r.status_code == 200, r.text
    code = r.json()["dev_code"]
    assert c.post("/api/auth/verify", json={"phone": phone, "code": "11111" if code != "11111" else "22222"}).json()["detail"] == "otp_wrong"
    r = c.post("/api/auth/verify", json={"phone": phone, "code": code, "name": name})
    assert r.status_code == 200, r.text
    return r.json()


guest, host = TestClient(app), TestClient(app)
assert guest.get("/api/me").status_code == 401
assert guest.post("/api/bookings", json={"listing_id": 1, "check_in": d(5), "check_out": d(8), "guests": 2}).status_code == 401

# new user needs a name; Persian digits accepted
guest.post("/api/auth/otp", json={"phone": "۰۹۳۵۰۰۰۰۰۰۰"})
assert guest.post("/api/auth/otp", json={"phone": "09350000000"}).json()["detail"] == "otp_wait"
me = login(TestClient(app), "09351111111", "Test Guest")
assert me["name"] == "Test Guest" and not me["verified"]
login(guest, "09351111111")
assert guest.get("/api/me").json()["phone"] == "09351111111"

# national id checksum
nid = "123456789"; c = sum(int(nid[i]) * (10 - i) for i in range(9)) % 11; nid += str(c if c < 2 else 11 - c)
assert valid_national_id(nid) and not valid_national_id("1111111111") and not valid_national_id(nid[:9] + str((int(nid[9]) + 1) % 10))
assert guest.patch("/api/me", json={"national_id": "1234567890"}).json()["detail"] == "bad_national_id"
assert guest.patch("/api/me", json={"national_id": nid}).json()["verified"]

# booking: listing 1 is request-to-book (instant=False) and already has a pending demo booking d(5)..d(8)
body = {"listing_id": 1, "check_in": d(10), "check_out": d(13), "guests": 2}
r = guest.post("/api/bookings", json=body)
assert r.status_code == 201, r.text
b = r.json()
assert b["status"] == "pending" and b["total"] == 3 * 4_800_000 + round(3 * 4_800_000 * 0.03) and b["payout"] == 3 * 4_800_000 * 0.9
assert guest.post("/api/bookings", json={**body, "check_in": d(12), "check_out": d(14)}).json()["detail"] == "unavailable"
assert guest.post("/api/bookings", json={**body, "check_in": d(6), "check_out": d(7)}).json()["detail"] == "unavailable"  # demo pending
assert guest.post("/api/bookings", json={**body, "check_in": d(13), "check_out": d(14)}).status_code == 201  # back-to-back ok
assert guest.post("/api/bookings", json={**body, "check_in": d(-1)}).json()["detail"] == "past_date"
assert guest.post("/api/bookings", json={**body, "check_out": d(10)}).json()["detail"] == "bad_dates"
assert guest.post("/api/bookings", json={**body, "check_in": d(40), "check_out": d(49), "guests": 9}).json()["detail"] == "too_many_guests"
assert guest.post("/api/bookings", json={**body, "listing_id": 6, "check_in": d(60), "check_out": d(62)}).json()["status"] == "confirmed"  # instant

# availability filter hides listing 1 for booked dates
assert 1 not in [x["id"] for x in guest.get(f"/api/listings?check_in={d(11)}&check_out={d(12)}").json()]
assert 1 in [x["id"] for x in guest.get(f"/api/listings?check_in={d(100)}&check_out={d(102)}").json()]

# host (demo Kaveh owns listings 1 and 7) confirms, can't book own listing
login(host, "09121111111")
dash = host.get("/api/host").json()
assert {x["id"] for x in dash["listings"]} == {1, 7} and dash["stats"]["pending"] >= 2
assert host.post(f"/api/host/bookings/{b['code']}/confirm").json()["ok"]
assert host.post(f"/api/host/bookings/{b['code']}/confirm").json()["detail"] == "not_pending"
assert guest.post(f"/api/host/bookings/{b['code']}/decline").status_code == 404  # not guest's listing
assert host.post("/api/bookings", json={**body, "check_in": d(80), "check_out": d(81)}).json()["detail"] == "own_listing"
assert host.patch("/api/host/listings/1", json={"price": 5_000_000}).json()["ok"]
assert guest.patch("/api/host/listings/1", json={"price": 1}).status_code == 422
assert guest.patch("/api/host/listings/1", json={"price": 200_000}).status_code == 404

# trips: cancel upcoming; demo past trip (Kaveh @ listing 3) is reviewable once
assert guest.post(f"/api/bookings/{b['code']}/cancel").json()["ok"]
assert guest.post(f"/api/bookings/{b['code']}/cancel").json()["detail"] == "cannot_cancel"
past = next(t for t in host.get("/api/me/bookings").json() if t["can_review"])
assert host.post(f"/api/bookings/{past['code']}/review", json={"rating": 5, "text": "عالی بود"}).status_code == 201
assert host.post(f"/api/bookings/{past['code']}/review", json={"rating": 5, "text": "again"}).json()["detail"] == "cannot_review"

# host creates a listing with an upload; pause hides it
png = b"\x89PNG\r\n\x1a\n" + b"0" * 100
form = {"title": "Test Loft", "area": "Tajrish", "description": "A bright loft with a mountain view and fast wifi.", "city": "tehran",
        "type": "apartment", "price": "2000000", "guests": "3", "bedrooms": "1", "baths": "1", "amenities": "wifi,bogus", "instant": "true"}
assert guest.post("/api/host/listings", data=form).json()["detail"] == "photos_count"
assert guest.post("/api/host/listings", data=form, files=[("photos", ("x.txt", b"hi", "text/plain"))]).json()["detail"] == "bad_photo"
new = guest.post("/api/host/listings", data=form, files=[("photos", ("a.png", png, "image/png"))]).json()["id"]
nl = guest.get(f"/api/listings/{new}").json()
assert nl["amenities"] == ["wifi"] and nl["is_mine"] and guest.get("/api/" + nl["images"][0].replace("u/", "uploads/")).content == png
guest.patch(f"/api/host/listings/{new}", json={"active": False})
assert new not in [x["id"] for x in guest.get("/api/listings").json()] and TestClient(app).get(f"/api/listings/{new}").status_code == 404

# support + logout
assert guest.post("/api/support", json={"subject": "Refund", "message": "Please help with my booking."}).status_code == 201
assert guest.get("/api/me/tickets").json()[0]["status"] == "open"
guest.post("/api/auth/logout")
assert guest.get("/api/me").status_code == 401
assert [x["price"] for x in TestClient(app).get("/api/listings?sort=price_asc").json()] == sorted(x["price"] for x in TestClient(app).get("/api/listings").json())
print("ok")

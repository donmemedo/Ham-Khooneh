"""Demo seed data. Demo login: 09121111111 (Kaveh — hosts 2 stays, has trips)."""
import json
from datetime import date, timedelta

CITIES = [
    {"key": "tehran", "fa": "تهران", "en": "Tehran", "image": "261102"},
    {"key": "north", "fa": "شمال", "en": "North", "image": "280222"},
    {"key": "isfahan", "fa": "اصفهان", "en": "Isfahan", "image": "2102587"},
    {"key": "shiraz", "fa": "شیراز", "en": "Shiraz", "image": "1029599"},
    {"key": "kish", "fa": "کیش", "en": "Kish", "image": "258154"},
    {"key": "qeshm", "fa": "قشم", "en": "Qeshm", "image": "1732414"},
    {"key": "mashhad", "fa": "مشهد", "en": "Mashhad", "image": "2462015"},
]
TYPES = ["villa", "apartment", "suite", "ecolodge", "cabin"]
AMENITIES = ["wifi", "pool", "parking", "ac", "kitchen", "workspace", "bbq", "heating", "breakfast", "sea_view", "washer", "tv"]

HOSTS = [("مریم", "Maryam"), ("کاوه", "Kaveh"), ("نگار", "Negar"), ("رضا", "Reza"), ("سارا", "Sara"), ("بهرام", "Bahram")]

REVIEWS = [
    ("آیدا", "Aida", 5, "دقیقاً مثل عکس‌ها بود. تمیز، آرام و میزبانی فوق‌العاده.", "Exactly like the photos. Spotless, calm and a wonderful host."),
    ("امیر", "Amir", 5, "ورود بدون دردسر و پاسخ‌گویی سریع. حتماً دوباره رزرو می‌کنم.", "Effortless check-in and fast replies. Booking again for sure."),
    ("شیرین", "Shirin", 4, "موقعیت عالی و منظره‌ی بی‌نظیر. آشپزخانه کامل بود.", "Great location and a stunning view. Fully equipped kitchen."),
    ("پویا", "Pouya", 5, "برای سفر خانوادگی بهترین انتخاب بود. بچه‌ها عاشقش شدند.", "Perfect for a family trip. The kids loved it."),
    ("لیلا", "Leila", 4, "فضای دلنشین و محله‌ی امن. پارکینگ هم داشت.", "Lovely space in a safe neighborhood, with parking too."),
    ("حامد", "Hamed", 5, "میزبان با حوصله همه‌چیز را توضیح داد. تجربه‌ای به‌یادماندنی.", "The host patiently explained everything. Unforgettable."),
]

# (city, type, fa title, en title, fa area, en area, price toman/night, guests, bedrooms, baths, rating, images, amenities)
LISTINGS = [
    ("tehran", "apartment", "پنت‌هاوس ابری با استخر روباز", "Cloud Penthouse with Rooftop Pool", "الهیه", "Elahiyeh", 4_800_000, 4, 2, 2, 4.97, ["261102", "1571460", "164595", "2724749"], ["wifi", "pool", "parking", "ac", "kitchen", "workspace"]),
    ("tehran", "villa", "ویلای مدرن لواسان", "Modern Villa in Lavasan", "لواسان", "Lavasan", 9_500_000, 8, 4, 3, 4.92, ["323780", "1643383", "2029731", "3935350"], ["wifi", "pool", "parking", "bbq", "kitchen", "heating"]),
    ("isfahan", "ecolodge", "خانه‌باغ سنتی نقش جهان", "Naqsh-e Jahan Heritage House", "جلفا", "Jolfa", 2_900_000, 5, 3, 2, 4.95, ["2102587", "3209045", "271624", "1080696"], ["wifi", "breakfast", "heating", "ac", "kitchen"]),
    ("shiraz", "cabin", "کوتاژ باغ ارم", "Eram Garden Cottage", "قصردشت", "Ghasrodasht", 2_400_000, 4, 2, 1, 4.88, ["1029599", "1918291", "2029731", "1457842"], ["wifi", "parking", "bbq", "kitchen", "heating"]),
    ("mashhad", "apartment", "آپارتمان مبله نزدیک حرم", "Furnished Flat near the Shrine", "امام رضا", "Imam Reza", 1_800_000, 6, 2, 1, 4.81, ["2462015", "1643383", "271624", "2724749"], ["wifi", "parking", "ac", "kitchen", "washer", "tv"]),
    ("kish", "suite", "سوئیت ساحلی مرجان", "Marjan Beach Suite", "ساحل مرجان", "Marjan Beach", 5_200_000, 2, 1, 1, 4.96, ["258154", "164595", "3209045", "1571460"], ["wifi", "sea_view", "pool", "ac", "breakfast"]),
    ("kish", "villa", "ویلای استخردار نخل", "Palm Pool Villa", "میرمهنا", "Mirmohanna", 7_900_000, 10, 4, 4, 4.9, ["189296", "1457842", "3935350", "2029731"], ["wifi", "pool", "sea_view", "parking", "bbq", "ac"]),
    ("qeshm", "ecolodge", "بوم‌گردی دریاکنار", "Seaside Eco-lodge", "روستای لافت", "Laft Village", 2_100_000, 4, 2, 1, 4.93, ["1732414", "1080696", "271624", "3209045"], ["wifi", "sea_view", "breakfast", "ac"]),
    ("north", "villa", "ویلای جنگلی رامسر", "Ramsar Forest Villa", "جواهرده", "Javaherdeh", 6_400_000, 8, 3, 2, 4.94, ["280222", "1918291", "1643383", "2724749"], ["wifi", "parking", "bbq", "heating", "kitchen", "tv"]),
    ("north", "villa", "خانه‌ی کنار آب چالوس", "Chalus Waterfront Home", "نمک‌آبرود", "Namakabrood", 5_600_000, 6, 3, 2, 4.89, ["1438832", "1571460", "164595", "3935350"], ["wifi", "sea_view", "parking", "kitchen", "washer"]),
    ("north", "cabin", "کلبه‌ی سبز ماسوله", "Masuleh Green Cabin", "ماسوله", "Masuleh", 1_600_000, 3, 1, 1, 4.98, ["2581922", "1080696", "2029731", "1457842"], ["wifi", "heating", "breakfast", "kitchen"]),
    ("north", "villa", "ویلای دشت سبز", "Green Meadow Villa", "کلاردشت", "Kelardasht", 4_300_000, 7, 3, 2, 4.86, ["460695", "3209045", "271624", "1918291"], ["wifi", "parking", "bbq", "heating", "workspace"]),
]

J = lambda v: json.dumps(v, ensure_ascii=False)


def seed(q):
    """q(sql, *args) executes one statement. Runs once on an empty DB."""
    today = date.today()
    d = lambda n: str(today + timedelta(n))
    for k, (fa, en) in enumerate(HOSTS):
        phone = "09121111111" if en == "Kaveh" else f"0912000000{k + 1}"
        q("INSERT INTO users(phone,name,name_en,verified,created) VALUES(?,?,?,1,?)", phone, fa, en, d(-365 * (1 + k % 5)))
    for i, (c, t, tf, te, af, ae, p, g, br, ba, r, imgs, am) in enumerate(LISTINGS, 1):
        desc = {
            "fa": f"{tf} در {af}؛ اقامتگاهی تاییدشده با عکس‌های واقعی، ورود آسان و میزبانی که منطقه را مثل کف دستش می‌شناسد. مناسب {g} نفر، با {br} اتاق خواب.",
            "en": f"{te} in {ae} — a verified stay with real photos, easy check-in and a host who knows the area inside out. Sleeps {g} across {br} bedrooms.",
        }
        q("INSERT INTO listings(host_id,city,type,title,area,description,price,guests,bedrooms,baths,rating,reviews_count,images,amenities,instant,active,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?)",
          i % 6 + 1, c, t, J({"fa": tf, "en": te}), J({"fa": af, "en": ae}), J(desc), p, g, br, ba, r, 18 + i * 7, J(imgs), J(am), int(i % 2 == 0), d(-400))
        for j in range(3):
            n1, n2, rt, x1, x2 = REVIEWS[(i + j) % 6]
            q("INSERT INTO reviews(listing_id,name,rating,text,created) VALUES(?,?,?,?,?)", i, J({"fa": n1, "en": n2}), rt, J({"fa": x1, "en": x2}), d(-30 - j))
    # (listing, guest user, check_in offset, nights, status)
    for n, (lid, uid, off, nights, st) in enumerate([(3, 2, -20, 3, "confirmed"), (6, 2, 14, 3, "confirmed"), (1, 3, 5, 3, "pending"),
                                                      (7, 4, 20, 4, "confirmed"), (1, 5, -40, 3, "confirmed")]):
        price = LISTINGS[lid - 1][6]
        sub = price * nights
        q("INSERT INTO bookings(code,listing_id,guest_id,check_in,check_out,guests,nights,subtotal,fee,total,payout,status,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
          f"HE-DEMO{n}", lid, uid, d(off), d(off + nights), 2, nights, sub, round(sub * 0.03), sub + round(sub * 0.03), sub - round(sub * 0.10), st, d(min(off, 0) - 5))

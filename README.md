# هم‌اقامت · HamEghamat

Short-term stays marketplace for Iran (Airbnb model from the business plan: 10% host commission + 3% guest fee).

- `frontend/` — Next.js 16 (App Router, Tailwind v4). fa/en with RTL/LTR, light/dark/system, responsive, Jalali calendar.
- `backend/` — FastAPI + SQLite (`/data/app.db`, uploads in `/data/uploads`).

## Features

| Guest | Host |
| --- | --- |
| Search by city, dates (availability), guests, type; sort | Dashboard: earnings, upcoming, pending, rating |
| Listing page, Jalali range calendar with booked nights | Accept / decline booking requests |
| OTP login (phone), instant book or request-to-book | Create listing wizard with photo upload (≤ 8 × 5 MB) |
| Trips: cancel upcoming, review past stays | Edit nightly price, pause / activate listing |
| Favorites, profile, national-ID verification, support tickets | |

## Run

```bash
DOCKER_CONTEXT=default docker compose up --build   # web http://localhost:3053 · api http://localhost:8053/docs
```

Override ports with `WEB_PORT` / `API_PORT`. Data persists in the `data` volume (`docker compose down -v` resets to the demo seed).

**Demo login:** `09121111111` (Kaveh: hosts 2 stays, has a past trip to review and a pending request to accept).
There is no SMS gateway yet: with `OTP_DEV=1` (compose default) the code is shown on the login screen. Set `OTP_DEV=0` and plug a provider into `send_otp` in `backend/main.py` for production; set `COOKIE_SECURE=1` behind HTTPS.

## Dev without Docker

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload     # :8000
cd frontend && npm install && npm run dev                                       # :3000, proxies /api → :8000
cd backend && pip install httpx && python test_main.py                         # API tests (throwaway DB)
```

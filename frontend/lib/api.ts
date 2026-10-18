import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dicts, type Locale } from "./i18n";

type T = { fa: string; en: string };
export type City = { key: string; fa: string; en: string; image: string; count: number };
export type Listing = {
  id: number; city: string; type: string; title: T; area: T; price: number; guests: number; bedrooms: number;
  baths: number; rating: number; reviews_count: number; images: string[]; amenities: string[]; superhost: boolean;
  instant: boolean; active: boolean; host: T & { years: number; verified: boolean };
};
export type Range = { check_in: string; check_out: string };
export type ListingDetail = Listing & {
  description: T; reviews: { name: T; rating: number; text: T; created: string }[];
  booked: Range[]; guest_fee: number; is_mine: boolean;
};
export type Me = { id: number; phone: string; name: string; verified: boolean; national_id: string | null; is_host: boolean };
export type Booking = Range & {
  code: string; listing_id: number; guests: number; nights: number; subtotal: number; fee: number; total: number; payout: number;
  status: "pending" | "confirmed" | "declined" | "cancelled"; created: string; title: T; area: T; images: string[]; city: string;
  can_cancel: boolean; can_review: boolean; guest_name?: string; guest_verified?: boolean;
};
export type Ticket = { id: number; booking_code: string | null; subject: string; message: string; status: string; created: string };
export type HostData = {
  listings: (Listing & { bookings: number; earnings: number })[]; reservations: Booking[];
  stats: { earnings: number; upcoming: number; pending: number; rating: number }; commission: number;
};

const API = process.env.API_URL ?? "http://localhost:8000";

/** Server-side fetch to FastAPI, forwarding the session cookie. */
export async function api<R>(path: string): Promise<R | null> {
  const session = (await cookies()).get("session")?.value;
  const r = await fetch(API + path, { cache: "no-store", headers: session ? { cookie: `session=${session}` } : {} }).catch(() => null);
  return r?.ok ? r.json() : null;
}

export async function locale(): Promise<{ l: Locale; t: (typeof dicts)["fa"] }> {
  const l: Locale = (await cookies()).get("locale")?.value === "en" ? "en" : "fa";
  return { l, t: dicts[l] };
}

/** Logged-in user or redirect to login. */
export async function requireMe(next: string) {
  return (await api<Me>("/api/me")) ?? redirect(`/login?next=${encodeURIComponent(next)}`);
}

export { img } from "./img";

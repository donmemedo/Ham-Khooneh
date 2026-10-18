// stock photos ship in /public/img; host uploads are "u/<file>" served by the API
export const img = (id: string) => (id.startsWith("u/") ? `/api/uploads/${id.slice(2)}` : `/img/${id}.jpg`);

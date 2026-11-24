export type Role = "user" | "admin";
// Logged-in user as returned by the API (never contains the password hash)
export type Me = {
  id: string; email: string; name: string; role: Role; plan: "free" | "pro"; proUntil: number; used1080: number;
  createdAt: number; lastLogin: number; banned: boolean;
};
export type Plan = { name: string; price: number; oldPrice?: number; days: number; features?: string };
export type Tool = { icon?: string; tag?: string; name: string; short?: string; details?: string; url?: string };
export type Payment = {
  id: string; uid: string; email: string; trxId: string; sender: string; planName?: string; price?: number; days?: number;
  status: "pending" | "approved" | "rejected"; createdAt: number; reviewedAt?: number;
};
export type Settings = {
  brand: string; whatsapp: string; bkash: string; price: number; proDays: number; free1080Limit: number; notice: string;
  ticker: string; tools: Tool[]; plans: Plan[]; guide: string; promptTemplate: string;
};

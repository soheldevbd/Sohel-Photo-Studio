import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/context/AppContext";
import { Chrome } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = { title: "Sohel Photo Studio", description: "প্রিমিয়াম 4K ব্যাকগ্রাউন্ড এক ক্লিকে বানান" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f0a14" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body>
        <AppProvider>
          <Chrome />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}

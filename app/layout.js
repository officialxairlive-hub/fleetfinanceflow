import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

export const metadata = {
  title: "Fleet Finance Flow — Shop Management Built for Time, Jobs & Profit",
  description:
    "Run your entire heavy-duty repair shop from one screen. Track jobs, technician hours, parts, estimates, invoices, and profit — no whiteboards, no spreadsheets, no guesswork.",
  keywords: [
    "heavy duty shop management",
    "truck repair software",
    "fleet management",
    "shop management software",
    "repair order tracking",
    "technician time tracking",
  ],
  openGraph: {
    title: "Fleet Finance Flow — Shop Management Built for Time, Jobs & Profit",
    description:
      "Run your entire heavy-duty repair shop from one screen. Track jobs, technician hours, parts, estimates, invoices, and profit.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable}`}>
        {children}
      </body>
    </html>
  );
}

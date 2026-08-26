import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Body font — Inter: clean, neutral, industry standard for SaaS
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Heading font — Plus Jakarta Sans: geometric, modern, startup-y
// Used by Notion, Coda, and many top SaaS products
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading-var",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
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
      <body className={`${inter.variable} ${plusJakarta.variable}`}>
        {children}
      </body>
    </html>
  );
}

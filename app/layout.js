import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "Fleet Finance Flow — Commercial Shop Intelligence & Profit Visibility",
  description:
    "Run your heavy-duty repair shop from one screen. Live dispatch, technician floor time tracking, parts margin shielding, and instant customer approvals.",
  keywords: [
    "heavy duty shop management",
    "truck repair software",
    "fleet management",
    "shop management software",
    "repair order tracking",
    "technician time tracking",
  ],
  openGraph: {
    title: "Fleet Finance Flow — Commercial Shop Intelligence & Profit Visibility",
    description:
      "Run your heavy-duty repair shop from one screen. Live dispatch, technician floor time tracking, parts margin shielding, and instant customer approvals.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}

import "./globals.css";
import { ToastProvider } from "./context/ToastContext";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

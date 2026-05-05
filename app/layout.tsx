import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";

// next/font/google constraint: `axes` requires `weight: 'variable'` —
// you can't pin static weights AND request the opsz axis. Going variable
// gives us the full wght range (100–900) plus opsz for the hero number's
// `font-variation-settings: 'opsz' 144` per MASTER §4.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  weight: "variable",
  axes: ["opsz"],
});

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
  weight: ["100", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Catalst Market — what's blowing up in business right now",
  description:
    "A live, mood-first feed of business and startup stories built for the general public, not VCs. Every story is a copy-able opportunity — one tap to start building.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geist.variable}`}
    >
      <body className="font-sans bg-paper text-text antialiased">
        {children}
      </body>
    </html>
  );
}

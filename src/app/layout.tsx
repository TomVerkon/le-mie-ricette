import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Le Mie Ricette",
  description: "Your favorite recipes, all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="flex gap-4 border-b border-taupe bg-semolina px-4 py-3 text-sm">
          <Link href="/" className="font-medium hover:underline">
            Favorites
          </Link>
          <Link href="/recipes" className="text-espresso/60 hover:underline">
            Library
          </Link>
          <Link href="/compare" className="text-espresso/60 hover:underline">
            Compare
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NodeBricks — School Management",
  description: "Natural, simple, and reliable school management and attendance application.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#5B4B8A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full w-full m-0 p-0 antialiased`}>
      <body className="h-full w-full m-0 p-0 flex flex-col font-sans bg-white text-nb-main overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {Navbar} from '../components/Navbar.jsx'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F1 Story | Sezon & Kariyer Simülasyonu",
  description: "İnteraktif Formula 1 Kariyer ve Sezon Simülasyonu",
  icons: {
    icon: "/renv.png",
    apple: "/renv.png",
  },
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
        <Navbar></Navbar>
        {children}
        
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import './globals.css';
import type { ReactNode } from 'react';

//added outfit font
import { Outfit } from 'next/font/google';

const outfit = Outfit({
  weight: ['400', '500', '600', '700'], // pick the weights you need (e.g. 400 = regular, 700 = bold)
  subsets: ['latin'],                   // usually 'latin' is enough
  variable: '--font-outfit',            // optional: CSS variable if you want to reference it in CSS
  display: 'swap',                      // 'swap' strategy to avoid invisible text
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

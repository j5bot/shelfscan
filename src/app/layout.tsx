import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from 'next/image';
import React from 'react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShelfScan",
  description: "Scan board game UPCs and assign them to the correct game versions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
          <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
              <div className="absolute flex flex-row gap-4 top-3 left-2 z-40">
                  <Image
                      priority={true}
                      src={'/shelfscan-wordmark.png'}
                      alt="ShelfScan"
                      width={64} height={85}
                  />
              </div>
              <div className="z-0 relative">
                  {children}
              </div>
          </body>
      </html>
  );
}

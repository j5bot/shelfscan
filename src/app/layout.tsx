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
  title: "GameUPC Scanner",
  description: "Scan board game UPCs and assign them to the correct game versions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Image
              className="absolute top-1 left-1"
              src={'/shelfscan.png'}
              alt="ShelfScan"
              width={128} height={128}
          />
          <>
            {children}
          </>
        </body>
      </html>
  );
}

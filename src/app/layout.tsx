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
      <div className="absolute flex flex-row gap-4 top-1 left-1 z-40">
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
      {/*<div className="w-2 h-2 sm:w-0 sm:h-0 md:w-0 md:h-0 lg:w-0 lg:h-0 xl:w-0 xl:h-0 2xl:w-0 2xl:h-0"*/}
      {/*     id="mobile-breakpoint-detect" />*/}
      {/*<div className="w-0 h-0 sm:w-2 sm:h-2 md:w-0 md:h-0 lg:w-0 lg:h-0 xl:w-0 xl:h-0 2xl:w-0 2xl:h-0"*/}
      {/*     id="sm-breakpoint-detect" />*/}
      {/*<div className="w-0 h-0 sm:w-0 sm:h-0 md:w-2 md:h-2 lg:w-0 lg:h-0 xl:w-0 xl:h-0 2xl:w-0 2xl:h-0"*/}
      {/*     id="md-breakpoint-detect" />*/}
      {/*<div className="w-0 h-0 sm:w-0 sm:h-0 md:w-0 md:h-0 lg:w-2 lg:h-2 xl:w-0 xl:h-0 2xl:w-0 2xl:h-0"*/}
      {/*     id="lg-breakpoint-detect" />*/}
      {/*<div className="w-0 h-0 sm:w-0 sm:h-0 md:w-0 md:h-0 lg:w-0 lg:h-0 xl:w-2 xl:h-2 2xl:w-0 2xl:h-0"*/}
      {/*     id="xl-breakpoint-detect" />*/}
      {/*<div className="w-0 h-0 sm:w-0 sm:h-0 md:w-0 md:h-0 lg:w-0 lg:h-0 xl:w-0 xl:h-0 2xl:w-2 2xl:h-2"*/}
      {/*     id="2xl-breakpoint-detect" />*/}
      </body>
      </html>
  );
}

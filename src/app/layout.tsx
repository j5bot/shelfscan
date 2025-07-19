import type { Metadata } from 'next';
import { Geist, Geist_Mono, Share_Tech } from 'next/font/google';
import './globals.css';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const shareTech = Share_Tech({
    variable: '--font-share-tech',
    weight: '400',
    subsets: ['latin'],
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
    title: `ShelfScan`,
    description: 'Board game UPC scanner / GameUPC.com API updater',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
          <head>
              <title>ShelfScan</title>
              <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
              <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
              <link rel="manifest" href="/site.webmanifest" />
          </head>
          <body className={`
          w-full min-h-screen ${geistSans.variable} ${geistMono.variable} ${shareTech.variable} antialiased
          bg-[image:url(/images/flair-bg.png)]
          md:bg-[image:url(/images/flair-bg-md.png)]
          lg:bg-[image:url(/images/flair-bg-lg.png)]
          xl:bg-[image:url(/images/flair-bg-xl.png)]
          2xl:bg-[image:url(/images/flair-bg-2xl.png)]
          bg-repeat bg-contain
          `}>
              <div id="shelfscan-logo" className="absolute flex flex-row gap-4 top-3 left-2 z-40">
                  <Link href={'/'}>
                      <Image
                          className="dark:hidden"
                          priority={true}
                          src={'/shelfscan-wordmark.png'}
                          alt="ShelfScan"
                          width={64} height={85}
                      />
                      <Image
                          className="hidden dark:block"
                          priority={true}
                          src={'/shelfscan-wordmark-dark.png'}
                          alt="ShelfScan"
                          width={64} height={85}
                      />
                  </Link>
              </div>
              {children}
          </body>
      </html>
  );
}

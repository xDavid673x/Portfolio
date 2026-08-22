import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { assetPath } from "@/lib/asset-path";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ka Chong | Intelligent Systems Portfolio",
  description:
    "A Computer Science portfolio spanning reinforcement-learning robotics, autonomous systems, and full-stack engineering.",
  keywords: [
    "computer science portfolio",
    "machine learning",
    "reinforcement learning",
    "robotics",
    "autonomous systems",
    "software engineering",
  ],
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
      suppressHydrationWarning
    >
      {/* Browser extensions can annotate document nodes before React hydrates. */}
      <head>
        <link
          rel="preload"
          as="image"
          href={assetPath("/images/avatar/david-hero-portrait-v2-1440.webp")}
          media="(min-width: 1101px)"
          type="image/webp"
        />
        <link
          rel="preload"
          as="image"
          href={assetPath("/images/avatar/david-hero-portrait-v2-960.webp")}
          media="(min-width: 681px) and (max-width: 1100px)"
          type="image/webp"
        />
        <link
          rel="preload"
          as="image"
          href={assetPath("/images/avatar/david-hero-portrait-v2-640.webp")}
          media="(max-width: 680px)"
          type="image/webp"
        />
        <link
          rel="preload"
          as="fetch"
          href={assetPath("/models/zero-robotic-arm/zero-robotic-arm.glb")}
          crossOrigin="anonymous"
          type="model/gltf-binary"
        />
        <link
          rel="preload"
          as="fetch"
          href={assetPath("/models/robosoc-spider.glb")}
          crossOrigin="anonymous"
          type="model/gltf-binary"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

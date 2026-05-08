/**
 * Root layout — loads self-hosted Geist fonts via next/font/google (no external
 * network requests at runtime), wraps the entire app in TRPCProvider for tRPC
 * + React Query client-side state, and imports global CSS.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TRPCProvider from "@/components/providers/TRPCProvider";
import "./globals.css";

// next/font/google self-hosts the font files and sets a CSS custom property
// (--font-geist-sans) on the element, referenced in globals.css.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskArtefact",
  description: "Gerenciador de tarefas com Next.js e tRPC",
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
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}

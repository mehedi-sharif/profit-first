import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { DataMigrationHandler } from "@/components/DataMigrationHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Profit First - Startup Finance",
  description: "Manage your startup finances using the Profit First methodology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50/50`}
        suppressHydrationWarning
      >
        <DataMigrationHandler>
          <Navbar />
          <main className="container mx-auto p-4 md:p-8 max-w-7xl">
            {children}
          </main>
        </DataMigrationHandler>
      </body>
    </html>
  );
}

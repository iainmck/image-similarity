import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import Sidebar from "./sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Image Similarity",
  description: "",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Theme appearance="light" accentColor="green">
          <div className="flex flex-row h-screen w-screen">
            <Sidebar />
            
            {/* Main Content */}
            <div className="flex-grow p-8 h-full overflow-x-hidden">
              {children}
            </div>
          </div>
        </Theme>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast-provider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitOps",
  description: "Revenue growth dashboard for local gyms in India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

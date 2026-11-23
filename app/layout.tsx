import React from "react";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast/ToastProvider";
import { fontVariables } from "@/lib/theme/fonts";

export const metadata = {
  title: "MyCalTravels",
  description: "Travel can be big or small and I'm here to write it all",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

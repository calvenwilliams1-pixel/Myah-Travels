import React from "react";
import "./globals.css";

export const metadata = {
  title: "Myah Travels",
  description: "Travel can be big or small and I'm here to write it all",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
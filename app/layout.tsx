import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wade & Annabella | Party Jeopardy",
  description: "One happy couple. A room full of competitors. Join from your phone.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

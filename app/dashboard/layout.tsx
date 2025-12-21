import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "2Track-QCMS",
  description: "Quality Control Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-base-200 overflow-x-hidden" data-theme="light">
      <body>{children}</body>
    </html>
  );
}

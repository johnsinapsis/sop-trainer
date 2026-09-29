import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOP Trainer",
  description: "Turn a Standard Operating Procedure into a training module and quiz.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

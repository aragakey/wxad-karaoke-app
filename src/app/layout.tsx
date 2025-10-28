import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "合唱 Karaoke",
  description: "多人一起合唱歌曲的应用",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

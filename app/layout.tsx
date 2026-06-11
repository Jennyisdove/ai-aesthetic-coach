import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Aesthetic Coach",
  description:
    "把你喜欢的审美翻译成适合你的个人风格。AI 穿搭顾问，从灵感出发提炼 Style DNA。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}

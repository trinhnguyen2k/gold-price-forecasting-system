import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import ChatBot from "@/components/dashboard/ChatbotBox";

export const metadata: Metadata = {
  title: "Gold Price Forecast Dashboard",
  description: "Hệ thống dự báo giá vàng",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {children}
          <ChatBot />
        </ThemeProvider>
      </body>
    </html>
  );
}

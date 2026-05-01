import type { Metadata } from "next";
import "./globals.css";

import ThemeProvider from "@/components/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Gold Price Forecast Dashboard",
  description: "Gold price dashboard with forecasting and chatbot support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

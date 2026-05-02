"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { dashboardHeaderStyles } from "./DashboardHeader.style";

const navItems = [
  { label: "Tổng quan", href: "/" },
  { label: "Giá vàng hiện tại", href: "/current-price" },
];

export default function DashboardHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <header className={dashboardHeaderStyles.wrapper}>
      <div className={dashboardHeaderStyles.topBar}>
        <div className={dashboardHeaderStyles.topBarInner}>
          <div className={dashboardHeaderStyles.left}>
            <h1 className={dashboardHeaderStyles.title}>
              Gold Price Forecast Dashboard
            </h1>
            <p className={dashboardHeaderStyles.subtitle}>
              Track gold prices, forecast insights, and AI-assisted Q&amp;A
            </p>
          </div>

          <div className={dashboardHeaderStyles.right}>
            <div className={dashboardHeaderStyles.switchWrapper}>
              <span className={dashboardHeaderStyles.switchLabel}>
                {isDark ? "Dark mode" : "Light mode"}
              </span>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  dashboardHeaderStyles.themeButton,
                  !isDark && dashboardHeaderStyles.themeButtonActive,
                )}
                aria-label="Chuyển sang light mode"
              >
                <Sun className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  dashboardHeaderStyles.themeButton,
                  isDark && dashboardHeaderStyles.themeButtonActive,
                )}
                aria-label="Chuyển sang dark mode"
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={dashboardHeaderStyles.navBar}>
        <nav className={dashboardHeaderStyles.navInner}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  dashboardHeaderStyles.navLink,
                  isActive && dashboardHeaderStyles.navLinkActive,
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

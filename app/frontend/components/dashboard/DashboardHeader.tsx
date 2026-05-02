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
              Hệ thống dự báo giá vàng
            </h1>
            <p className={dashboardHeaderStyles.subtitle}>
              Theo dõi giá vàng, kết quả dự báo và hỏi đáp dữ liệu bằng AI
            </p>
          </div>

          <div className={dashboardHeaderStyles.right}>
            <div className={dashboardHeaderStyles.switchWrapper}>
              <span className={dashboardHeaderStyles.switchLabel}>
                {isDark ? "Chế độ tối" : "Chế độ sáng"}
              </span>

              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  dashboardHeaderStyles.themeButton,
                  !isDark && dashboardHeaderStyles.themeButtonActive,
                )}
                aria-label="Chuyển sang chế độ sáng"
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
                aria-label="Chuyển sang chế độ tối"
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

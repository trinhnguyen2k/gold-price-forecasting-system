"use client";

import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { dashboardHeaderStyles } from "./DashboardHeader.style";
import { Moon, Sun } from "lucide-react";

export const DashboardHeader = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  return (
    <header className={dashboardHeaderStyles.wrapper}>
      <div className={dashboardHeaderStyles.inner}>
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
              aria-label="Switch to light mode"
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
              aria-label="Switch to dark mode"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

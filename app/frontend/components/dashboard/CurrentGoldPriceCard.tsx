"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentGoldPrice } from "@/libs/api";
import { CurrentGoldPrice } from "@/type/api.type";
import { currentGoldPriceCardStyles } from "./CurrentGoldPriceCard.style";
import { ChevronDown } from "lucide-react";

const goldOptions = [
  { value: "XAUUSD", label: "Vàng thế giới (XAU/USD)" },
  { value: "SJL1L10", label: "SJC 9999 (SJL1L10)" },
  { value: "SJ9999", label: "Nhẫn SJC (SJ9999)" },
  { value: "DOHNL", label: "DOJI Hà Nội (DOHNL)" },
  { value: "DOHCML", label: "DOJI HCM (DOHCML)" },
  { value: "BTSJC", label: "Bảo Tín SJC (BTSJC)" },
];

function formatGia(value: number, unit: string, typeCode: string) {
  if (!value || value <= 0) {
    return "Chưa có dữ liệu";
  }

  if (typeCode === "XAUUSD") {
    return `${Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${unit}`;
  }

  return `${Number(value).toLocaleString("vi-VN")} ${unit}`;
}

function formatThayDoi(value: number, unit: string, typeCode: string) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  let formattedValue = "";

  if (typeCode === "XAUUSD") {
    formattedValue = Number(Math.abs(value)).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formattedValue = Number(Math.abs(value)).toLocaleString("vi-VN");
  }

  if (!value || value === 0) {
    return {
      text: `0 ${unit}`,
      tone: "neutral" as const,
    };
  }

  return {
    text: `${isPositive ? "+" : "-"}${formattedValue} ${unit}`,
    tone: isPositive
      ? ("positive" as const)
      : isNegative
        ? ("negative" as const)
        : ("neutral" as const),
  };
}

function formatThoiGianCapNhat(
  timestamp: number,
  displayDate?: string,
  displayTime?: string,
) {
  if (displayDate && displayTime) {
    return `${displayTime} ${displayDate}`;
  }

  if (!timestamp) {
    return "Chưa có dữ liệu";
  }

  return new Date(timestamp * 1000).toLocaleString("vi-VN");
}

export default function CurrentGoldPriceCard() {
  const [selectedType, setSelectedType] = useState("XAUUSD");
  const [data, setData] = useState<CurrentGoldPrice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await getCurrentGoldPrice(selectedType);
        setData(response);
      } catch (error) {
        console.error(error);
        setErrorMessage("Không thể tải dữ liệu giá vàng hiện tại.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchData();
  }, [selectedType]);

  const buyChange = data
    ? formatThayDoi(data.change_buy, data.unit, data.type_code)
    : null;

  const sellChange = data
    ? formatThayDoi(data.change_sell, data.unit, data.type_code)
    : null;

  return (
    <Card
      className={currentGoldPriceCardStyles.card}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <CardHeader className={currentGoldPriceCardStyles.header}>
        <div>
          <div className={currentGoldPriceCardStyles.titleRow}>
            <CardTitle
              className={currentGoldPriceCardStyles.title}
              style={{ color: "var(--title-color)" }}
            >
              Giá vàng hiện tại
            </CardTitle>
          </div>

          {data?.name && (
            <p
              className={currentGoldPriceCardStyles.nameText}
              style={{ color: "var(--muted-color)" }}
            >
              {data.name}
            </p>
          )}
        </div>
        <div className={currentGoldPriceCardStyles.selectWrapper}>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className={currentGoldPriceCardStyles.select}
            style={{
              backgroundColor: "var(--panel-bg)",
              borderColor: "var(--border-color)",
              color: "var(--text-color)",
            }}
          >
            {goldOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className={currentGoldPriceCardStyles.selectIcon}
            style={{ color: "var(--muted-color)" }}
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <p
            className={currentGoldPriceCardStyles.loadingText}
            style={{ color: "var(--muted-color)" }}
          >
            Đang tải dữ liệu giá vàng...
          </p>
        )}

        {errorMessage && (
          <p
            className={currentGoldPriceCardStyles.errorText}
            style={{ color: "var(--warning-text)" }}
          >
            {errorMessage}
          </p>
        )}

        {!isLoading && !errorMessage && data && (
          <div className={currentGoldPriceCardStyles.grid}>
            <div
              className={currentGoldPriceCardStyles.statBox}
              style={{
                backgroundColor: "var(--gold-accent-soft)",
                borderColor: "var(--gold-border-soft)",
              }}
            >
              <p
                className={currentGoldPriceCardStyles.statLabel}
                style={{ color: "var(--text-color)" }}
              >
                Giá mua vào
              </p>
              <p
                className={currentGoldPriceCardStyles.statValue}
                style={{ color: "var(--gold-accent)" }}
              >
                {formatGia(data.buy, data.unit, data.type_code)}
              </p>
              <p
                className={currentGoldPriceCardStyles.statHint}
                style={{ color: "var(--muted-color)" }}
              >
                {data.name} • Mã {data.type_code}
              </p>
            </div>

            <div
              className={currentGoldPriceCardStyles.statBox}
              style={{
                backgroundColor: "var(--blue-accent-soft)",
                borderColor: "var(--blue-border-soft)",
              }}
            >
              <p
                className={currentGoldPriceCardStyles.statLabel}
                style={{ color: "var(--text-color)" }}
              >
                Giá bán ra
              </p>
              <p
                className={currentGoldPriceCardStyles.statValue}
                style={{ color: "var(--blue-accent)" }}
              >
                {formatGia(data.sell, data.unit, data.type_code)}
              </p>
              <p
                className={currentGoldPriceCardStyles.statHint}
                style={{ color: "var(--muted-color)" }}
              >
                Dữ liệu thời gian thực từ nguồn {data.source}
              </p>

              {sellChange && sellChange.tone !== "neutral" && (
                <div className={currentGoldPriceCardStyles.statusRow}>
                  <span
                    className={currentGoldPriceCardStyles.statusBadge}
                    style={{
                      backgroundColor:
                        sellChange.tone === "positive"
                          ? "var(--success-bg)"
                          : "var(--warning-bg)",
                      color:
                        sellChange.tone === "positive"
                          ? "var(--success-text)"
                          : "var(--warning-text)",
                    }}
                  >
                    Thay đổi: {sellChange.text}
                  </span>
                </div>
              )}
            </div>

            <div
              className={currentGoldPriceCardStyles.metaBox}
              style={{
                backgroundColor: "var(--panel-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <p
                className={currentGoldPriceCardStyles.metaLabel}
                style={{ color: "var(--muted-color)" }}
              >
                Thay đổi
              </p>
              <p
                className={currentGoldPriceCardStyles.metaValue}
                style={{
                  color:
                    buyChange?.tone === "positive"
                      ? "var(--success-text)"
                      : buyChange?.tone === "negative"
                        ? "var(--warning-text)"
                        : "var(--title-color)",
                }}
              >
                {buyChange ? buyChange.text : "Chưa có dữ liệu"}
              </p>
            </div>

            <div
              className={currentGoldPriceCardStyles.metaBox}
              style={{
                backgroundColor: "var(--panel-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <p
                className={currentGoldPriceCardStyles.metaLabel}
                style={{ color: "var(--muted-color)" }}
              >
                Cập nhật lúc
              </p>
              <p
                className={currentGoldPriceCardStyles.metaValue}
                style={{ color: "var(--title-color)" }}
              >
                {formatThoiGianCapNhat(
                  data.update_time,
                  data.display_date,
                  data.display_time,
                )}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

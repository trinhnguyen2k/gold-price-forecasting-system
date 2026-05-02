"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurrentGoldPrice } from "@/type/api.type";
import { getCurrentGoldPrice } from "@/libs/api";
import { currentGoldPriceCardStyles } from "./CurrentGoldPriceCard.style";

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

function formatChenhLechMuaBan(
  buy: number,
  sell: number,
  unit: string,
  typeCode: string,
) {
  if (!buy || !sell || buy <= 0 || sell <= 0) {
    return "Chưa có dữ liệu";
  }

  const spread = sell - buy;

  if (typeCode === "XAUUSD") {
    return `${spread.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${unit}`;
  }

  return `${spread.toLocaleString("vi-VN")} ${unit}`;
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

  return (
    <Card
      className={currentGoldPriceCardStyles.card}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "rgba(148, 163, 184, 0.38)",
        boxShadow: "0 10px 28px rgba(15, 39, 71, 0.05)",
      }}
    >
      <CardHeader className={currentGoldPriceCardStyles.header}>
        <div className={currentGoldPriceCardStyles.headerLeft}>
          <div className={currentGoldPriceCardStyles.titleRow}>
            <CardTitle
              className={currentGoldPriceCardStyles.title}
              style={{ color: "var(--title-color)" }}
            >
              Giá vàng hiện tại
            </CardTitle>

            {data?.name && (
              <span
                className={currentGoldPriceCardStyles.nameText}
                style={{ color: "var(--muted-color)" }}
              >
                {data.name}
              </span>
            )}
          </div>

          <p
            className={currentGoldPriceCardStyles.description}
            style={{ color: "var(--muted-color)" }}
          >
            Dữ liệu thời gian thực từ nguồn vang.today
          </p>
        </div>

        <div className={currentGoldPriceCardStyles.selectWrapper}>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            className={currentGoldPriceCardStyles.select}
            style={{
              backgroundColor: "var(--panel-bg)",
              borderColor: "rgba(148, 163, 184, 0.32)",
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

      <CardContent className={currentGoldPriceCardStyles.content}>
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
          <>
            <div className={currentGoldPriceCardStyles.topGrid}>
              <div
                className={currentGoldPriceCardStyles.statBox}
                style={{
                  backgroundColor: "var(--gold-accent-soft)",
                  borderColor: "rgba(216, 155, 29, 0.22)",
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
                  borderColor: "rgba(92, 200, 255, 0.22)",
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
                  Dữ liệu thời gian thực từ nguồn vang.today
                </p>
              </div>
            </div>

            <div className={currentGoldPriceCardStyles.bottomGrid}>
              <div
                className={currentGoldPriceCardStyles.metaBox}
                style={{
                  backgroundColor: "var(--panel-bg)",
                  borderColor: "rgba(148, 163, 184, 0.24)",
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
                  borderColor: "rgba(148, 163, 184, 0.24)",
                }}
              >
                <p
                  className={currentGoldPriceCardStyles.metaLabel}
                  style={{ color: "var(--muted-color)" }}
                >
                  Chênh lệch mua/bán
                </p>
                <p
                  className={currentGoldPriceCardStyles.metaValue}
                  style={{ color: "var(--title-color)" }}
                >
                  {formatChenhLechMuaBan(
                    data.buy,
                    data.sell,
                    data.unit,
                    data.type_code,
                  )}
                </p>
              </div>

              <div
                className={currentGoldPriceCardStyles.metaBox}
                style={{
                  backgroundColor: "var(--panel-bg)",
                  borderColor: "rgba(148, 163, 184, 0.24)",
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

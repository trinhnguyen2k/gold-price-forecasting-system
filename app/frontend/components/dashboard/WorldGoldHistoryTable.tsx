"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { WorldGoldHistoryItem } from "@/type/api.type";
import { getWorldGoldHistory } from "@/libs/api";
import { worldGoldHistoryTableStyles } from "./WorldGoldHistoryTable.style";

import { ChevronDown } from "lucide-react";

const dayOptions = [10, 15, 20, 25, 30];

function formatNgay(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatGiaUsd(value: number) {
  return `$${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatThayDoi(value: number) {
  if (value > 0) {
    return `+${Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (value < 0) {
    return `-${Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return "-";
}

export default function WorldGoldHistoryTable() {
  const [days, setDays] = useState(10);
  const [items, setItems] = useState<WorldGoldHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await getWorldGoldHistory(days);
        setItems(response);
      } catch (error) {
        console.error(error);
        setErrorMessage("Không thể tải lịch sử giá vàng thế giới.");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchHistory();
  }, [days]);

  return (
    <Card
      className={worldGoldHistoryTableStyles.card}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <CardHeader className={worldGoldHistoryTableStyles.header}>
        <div className={worldGoldHistoryTableStyles.titleGroup}>
          <CardTitle
            className={worldGoldHistoryTableStyles.title}
            style={{ color: "var(--title-color)" }}
          >
            Lịch sử giá vàng thế giới
          </CardTitle>

          <p
            className={worldGoldHistoryTableStyles.description}
            style={{ color: "var(--muted-color)" }}
          >
            Hiển thị lịch sử giá vàng thế giới (XAU/USD) theo từng ngày gần
            nhất.
          </p>
        </div>

        <div className={worldGoldHistoryTableStyles.selectWrapper}>
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className={worldGoldHistoryTableStyles.select}
            style={{
              backgroundColor: "var(--panel-bg)",
              borderColor: "var(--border-color)",
              color: "var(--text-color)",
            }}
          >
            {dayOptions.map((option) => (
              <option key={option} value={option}>
                {option} ngày gần nhất
              </option>
            ))}
          </select>

          <ChevronDown
            className={worldGoldHistoryTableStyles.selectIcon}
            style={{ color: "var(--muted-color)" }}
          />
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <p
            className={worldGoldHistoryTableStyles.emptyText}
            style={{ color: "var(--muted-color)" }}
          >
            Đang tải lịch sử giá vàng...
          </p>
        )}

        {errorMessage && (
          <p
            className={worldGoldHistoryTableStyles.emptyText}
            style={{ color: "var(--warning-text)" }}
          >
            {errorMessage}
          </p>
        )}

        {!isLoading && !errorMessage && (
          <div className={worldGoldHistoryTableStyles.tableWrapper}>
            <table className={worldGoldHistoryTableStyles.table}>
              <thead className={worldGoldHistoryTableStyles.thead}>
                <tr className={worldGoldHistoryTableStyles.headRow}>
                  <th
                    className={worldGoldHistoryTableStyles.th}
                    style={{
                      color: "var(--muted-color)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    Ngày
                  </th>

                  <th
                    className={worldGoldHistoryTableStyles.th}
                    style={{
                      color: "var(--muted-color)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    Giá (USD)
                  </th>

                  <th
                    className={worldGoldHistoryTableStyles.th}
                    style={{
                      color: "var(--muted-color)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    Thay đổi
                  </th>

                  <th
                    className={worldGoldHistoryTableStyles.th}
                    style={{
                      color: "var(--muted-color)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    Ngày cập nhật
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.date}
                    className={worldGoldHistoryTableStyles.tr}
                  >
                    <td
                      className={worldGoldHistoryTableStyles.td}
                      style={{
                        color: "var(--title-color)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      {formatNgay(item.date)}
                    </td>

                    <td
                      className={`${worldGoldHistoryTableStyles.td} ${worldGoldHistoryTableStyles.priceText}`}
                      style={{
                        color: "var(--title-color)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      {formatGiaUsd(item.price)}
                    </td>

                    <td
                      className={worldGoldHistoryTableStyles.td}
                      style={{
                        borderColor: "var(--border-color)",
                        color:
                          item.change > 0
                            ? "var(--success-text)"
                            : item.change < 0
                              ? "var(--warning-text)"
                              : "var(--muted-color)",
                      }}
                    >
                      {formatThayDoi(item.change)}
                    </td>

                    <td
                      className={worldGoldHistoryTableStyles.td}
                      style={{
                        color: "var(--muted-color)",
                        borderColor: "var(--border-color)",
                      }}
                    >
                      {formatNgay(item.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

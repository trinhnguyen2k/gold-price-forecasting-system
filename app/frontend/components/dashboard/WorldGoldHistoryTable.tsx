import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorldGoldHistoryItem } from "@/type/api.type";
import { worldGoldHistoryTableStyles } from "./WorldGoldHistoryTable.style";

interface WorldGoldHistoryTableProps {
  items: WorldGoldHistoryItem[];
}

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
    return `↑ +${Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (value < 0) {
    return `↓ -${Math.abs(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return "-";
}

export default function WorldGoldHistoryTable({
  items,
}: WorldGoldHistoryTableProps) {
  return (
    <Card
      className={worldGoldHistoryTableStyles.card}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <CardHeader>
        <div className={worldGoldHistoryTableStyles.titleRow}>
          <CardTitle
            className={worldGoldHistoryTableStyles.title}
            style={{ color: "var(--title-color)" }}
          >
            Lịch sử giá vàng thế giới 10 ngày gần nhất
          </CardTitle>
        </div>

        <p
          className={worldGoldHistoryTableStyles.description}
          style={{ color: "var(--muted-color)" }}
        >
          Giá vàng thế giới (XAU/USD) theo từng ngày gần nhất.
        </p>
      </CardHeader>

      <CardContent>
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
                  Cập nhật
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.date} className={worldGoldHistoryTableStyles.tr}>
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
                    {item.update_time || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

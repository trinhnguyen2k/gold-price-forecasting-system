import { Database, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";
import type { LatestPrice } from "@/type/api.type";
import { latestPriceCardStyles } from "./LatestPriceCard.style";

interface LatestPriceCardProps {
  latestPrice: LatestPrice;
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className={latestPriceCardStyles.infoRow}>
      <span
        className={latestPriceCardStyles.infoLabel}
        style={{ color: "var(--muted-color)" }}
      >
        {label}
      </span>
      <span
        className={latestPriceCardStyles.infoValue}
        style={{ color: "var(--title-color)" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function LatestPriceCard({ latestPrice }: LatestPriceCardProps) {
  return (
    <Card
      className={latestPriceCardStyles.card}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "rgba(148, 163, 184, 0.45)",
        boxShadow: "0 8px 24px rgba(15, 39, 71, 0.04)",
      }}
    >
      <CardHeader className={latestPriceCardStyles.header}>
        <div>
          <CardTitle
            className={latestPriceCardStyles.title}
            style={{ color: "var(--title-color)" }}
          >
            Giá gần nhất
          </CardTitle>
          <p
            className={latestPriceCardStyles.description}
            style={{ color: "var(--muted-color)" }}
          >
            Giá đóng cửa mới nhất trong hệ thống
          </p>
        </div>

        <div
          className={latestPriceCardStyles.iconWrapper}
          style={{
            backgroundColor: "var(--gold-accent-soft)",
            color: "var(--gold-accent)",
          }}
        >
          <TrendingUp className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className={latestPriceCardStyles.content}>
        <div
          className={latestPriceCardStyles.highlightBox}
          style={{
            backgroundColor: "var(--gold-accent-soft)",
            borderColor: "var(--gold-border-soft)",
          }}
        >
          <p
            className={latestPriceCardStyles.highlightLabel}
            style={{ color: "var(--text-color)" }}
          >
            Giá đóng cửa
          </p>
          <p
            className={latestPriceCardStyles.highlightValue}
            style={{ color: "var(--gold-accent)" }}
          >
            {formatPriceUsd(latestPrice.close)}
          </p>
          <p
            className={latestPriceCardStyles.highlightDate}
            style={{ color: "var(--muted-color)" }}
          >
            Cập nhật ngày {formatDateDdMmYyyy(latestPrice.price_date)}
          </p>
        </div>

        <div className={latestPriceCardStyles.infoGrid}>
          <div
            className={latestPriceCardStyles.infoPanel}
            style={{
              backgroundColor: "var(--panel-bg)",
              borderColor: "rgba(148, 163, 184, 0.35)",
            }}
          >
            <p
              className={latestPriceCardStyles.infoPanelTitle}
              style={{ color: "var(--title-color)" }}
            >
              Biến động trong ngày
            </p>

            <div className={latestPriceCardStyles.infoList}>
              <InfoRow
                label="Mở cửa"
                value={formatPriceUsd(latestPrice.open)}
              />
              <InfoRow
                label="Cao nhất"
                value={formatPriceUsd(latestPrice.high)}
              />
              <InfoRow
                label="Thấp nhất"
                value={formatPriceUsd(latestPrice.low)}
              />
            </div>
          </div>

          <div
            className={latestPriceCardStyles.infoPanel}
            style={{
              backgroundColor: "var(--panel-bg)",
              borderColor: "rgba(148, 163, 184, 0.35)",
            }}
          >
            <p
              className={latestPriceCardStyles.infoPanelTitle}
              style={{ color: "var(--title-color)" }}
            >
              Thông tin dữ liệu
            </p>

            <div className={latestPriceCardStyles.infoList}>
              <div className={latestPriceCardStyles.infoRow}>
                <span
                  className={latestPriceCardStyles.infoLabel}
                  style={{ color: "var(--muted-color)" }}
                >
                  Nguồn
                </span>
                <span
                  className={latestPriceCardStyles.sourceValue}
                  style={{ color: "var(--title-color)" }}
                >
                  {latestPrice.source ?? "N/A"}
                </span>
              </div>

              <div className={latestPriceCardStyles.infoRow}>
                <span
                  className={latestPriceCardStyles.infoLabel}
                  style={{ color: "var(--muted-color)" }}
                >
                  Loại dữ liệu
                </span>
                <span
                  className={latestPriceCardStyles.infoValue}
                  style={{ color: "var(--title-color)" }}
                >
                  Giá đóng cửa
                </span>
              </div>

              <div className={latestPriceCardStyles.infoRow}>
                <span
                  className={latestPriceCardStyles.infoLabel}
                  style={{ color: "var(--muted-color)" }}
                >
                  Cập nhật
                </span>
                <span
                  className={latestPriceCardStyles.infoValue}
                  style={{ color: "var(--title-color)" }}
                >
                  {formatDateDdMmYyyy(latestPrice.price_date)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

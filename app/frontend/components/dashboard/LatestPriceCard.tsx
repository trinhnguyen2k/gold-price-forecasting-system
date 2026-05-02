import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";
import type { LatestPrice } from "@/type/api.type";
import { latestPriceCardStyles } from "./LatestPriceCard.style";

interface LatestPriceCardProps {
  latestPrice: LatestPrice;
}

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div
      className={latestPriceCardStyles.statItem}
      style={{
        backgroundColor: "var(--panel-bg)",
        borderColor: "var(--border-color)",
      }}
    >
      <p
        className={latestPriceCardStyles.statLabel}
        style={{ color: "var(--muted-color)" }}
      >
        {label}
      </p>
      <p
        className={latestPriceCardStyles.statValue}
        style={{ color: "var(--title-color)" }}
      >
        {value}
      </p>
    </div>
  );
}

export default function LatestPriceCard({ latestPrice }: LatestPriceCardProps) {
  return (
    <Card
      className={latestPriceCardStyles.card}
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--border-color)",
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

        <div className={latestPriceCardStyles.statsGrid}>
          <StatItem label="Mở cửa" value={formatPriceUsd(latestPrice.open)} />
          <StatItem label="Cao nhất" value={formatPriceUsd(latestPrice.high)} />
          <StatItem label="Thấp nhất" value={formatPriceUsd(latestPrice.low)} />
          <StatItem label="Nguồn" value={latestPrice.source ?? "N/A"} />
        </div>
      </CardContent>
    </Card>
  );
}

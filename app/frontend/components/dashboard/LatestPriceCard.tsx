import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";

import { latestPriceCardStyles } from "./LatestPriceCard.style";
import { LatestPrice } from "@/type/api.type";

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
            Latest Price
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
            Closing Price
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
            Updated on {formatDateDdMmYyyy(latestPrice.price_date)}
          </p>
        </div>

        <div className={latestPriceCardStyles.statsGrid}>
          <StatItem label="Open" value={formatPriceUsd(latestPrice.open)} />
          <StatItem label="High" value={formatPriceUsd(latestPrice.high)} />
          <StatItem label="Low" value={formatPriceUsd(latestPrice.low)} />
          <StatItem label="Source" value={latestPrice.source ?? "N/A"} />
        </div>
      </CardContent>
    </Card>
  );
}

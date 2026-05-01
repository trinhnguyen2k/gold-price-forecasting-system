import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateDdMmYyyy, formatPriceUsd } from "@/libs/format";
import { LatestPrice } from "@/type/api.type";
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
    <div className={latestPriceCardStyles.statItem}>
      <p className={latestPriceCardStyles.statLabel}>{label}</p>
      <p className={latestPriceCardStyles.statValue}>{value}</p>
    </div>
  );
}

export default function LatestPriceCard({ latestPrice }: LatestPriceCardProps) {
  return (
    <Card className={latestPriceCardStyles.card}>
      <CardHeader className={latestPriceCardStyles.header}>
        <div className={latestPriceCardStyles.headerTextWrapper}>
          <CardTitle className={latestPriceCardStyles.title}>
            Latest Price
          </CardTitle>
          <p className={latestPriceCardStyles.description}>
            Giá đóng cửa mới nhất trong hệ thống
          </p>
        </div>

        <div className={latestPriceCardStyles.iconWrapper}>
          <TrendingUp className="h-5 w-5" />
        </div>
      </CardHeader>

      <CardContent className={latestPriceCardStyles.content}>
        <div className={latestPriceCardStyles.highlightBox}>
          <p className={latestPriceCardStyles.highlightLabel}>Closing Price</p>
          <p className={latestPriceCardStyles.highlightValue}>
            {formatPriceUsd(latestPrice.close)}
          </p>
          <p className={latestPriceCardStyles.highlightDate}>
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

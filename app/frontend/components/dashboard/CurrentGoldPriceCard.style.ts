export const currentGoldPriceCardStyles = {
  card: "border shadow-sm",
  header: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",

  titleRow: "flex flex-wrap items-center gap-3",
  title: "text-lg font-semibold",
  nameText: "text-sm font-medium",

  description: "mt-1 text-sm",

  select:
    "h-10 min-w-[220px] rounded-xl border pl-3 pr-3 text-sm outline-none transition-colors",

  grid: "mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2",

  statBox: "rounded-2xl border p-5",
  statLabel: "text-sm font-medium",
  statValue: "mt-2 text-3xl font-bold tracking-tight",
  statHint: "mt-2 text-sm",

  metaGrid: "grid grid-cols-1 gap-4 md:grid-cols-2",
  metaBox: "rounded-xl border p-4",
  metaLabel: "text-xs font-medium uppercase tracking-wide",
  metaValue: "mt-2 text-sm font-semibold",

  statusRow: "mt-2 flex flex-wrap items-center gap-2",
  statusBadge:
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",

  loadingText: "text-sm",
  errorText: "text-sm",
};

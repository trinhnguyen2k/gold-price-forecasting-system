export const latestForecastCardStyles = {
  card: "h-full border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm",

  header: "flex flex-row items-start justify-between space-y-0",

  title: "text-lg text-[var(--title-color)]",

  description: "mt-1 text-sm text-[var(--muted-color)]",

  headerIcon:
    "rounded-full bg-[var(--blue-accent-soft)] p-2 text-[var(--blue-accent)]",

  content: "space-y-6",

  badgeRow: "flex flex-wrap items-center gap-2",

  secondaryBadge: "rounded-full",
  sampleBadge:
    "rounded-full bg-[var(--warning-bg)] text-[var(--warning-text)] hover:bg-[var(--warning-bg)]",

  infoGrid: "grid gap-4 md:grid-cols-2",

  infoPanel:
    "rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] p-5",

  infoPanelHeader: "flex items-center gap-2 text-[var(--text-color)]",

  infoPanelHeaderText: "text-sm font-medium",

  infoPanelBody: "mt-4 space-y-2 text-sm text-[var(--text-color)]",

  infoLabel: "font-medium text-[var(--muted-color)]",

  predictionPanel:
    "rounded-2xl border border-[var(--blue-accent)]/25 bg-[var(--blue-accent-soft)] p-5",

  predictionDateLabel: "mt-4 text-sm text-[var(--muted-color)]",

  predictionValue:
    "mt-2 text-3xl font-bold tracking-tight text-[var(--blue-accent)]",

  metricGrid: "grid grid-cols-1 gap-4 md:grid-cols-2",

  metricPanel:
    "rounded-[28px] border border-[var(--border-color)] bg-[var(--card-bg)] p-6",

  metricHeader: "mb-4",

  metricTitle:
    "text-[1.05rem] font-semibold leading-none text-[var(--title-color)]",

  metricHint: "mt-2 text-xs font-medium text-[var(--muted-color)]",

  metricBody: "grid grid-cols-3 gap-3",

  metricItemMae:
    "rounded-2xl border border-[var(--border-color)] bg-[var(--blue-accent-soft)] px-4 py-4 text-center",

  metricItemRmse:
    "rounded-2xl border border-[var(--border-color)] bg-[var(--panel-bg)] px-4 py-4 text-center",

  metricItemMape:
    "rounded-2xl border border-[var(--gold-border-soft)] bg-[var(--gold-accent-soft)] px-4 py-4 text-center",
  metricValueMae:
    "text-[0.8rem] font-bold leading-none tracking-tight text-[var(--blue-accent)]",

  metricValueRmse:
    "text-[0.8rem] font-bold leading-none tracking-tight text-[var(--title-color)]",

  metricValueMape:
    "text-[0.8rem] font-bold leading-none tracking-tight text-[var(--gold-accent)]",

  metricLabel:
    "mt-2 text-[0.9rem] font-medium leading-none text-[var(--muted-color)]",

  emptyText: "text-sm text-[var(--muted-color)]",
  differenceBox: "rounded-xl border p-4",
  differenceLabel: "text-xs font-medium uppercase tracking-wide",
  differenceValue: "mt-2 text-base font-semibold",
};

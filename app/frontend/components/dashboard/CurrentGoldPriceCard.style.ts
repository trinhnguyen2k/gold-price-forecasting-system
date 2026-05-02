export const currentGoldPriceCardStyles = {
  card: "shadow-sm",
  header: "flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between",

  headerLeft: "min-w-0",
  titleRow: "flex flex-wrap items-center gap-3",
  title: "text-[30px] font-semibold leading-tight",
  nameText: "text-base font-medium",

  description: "mt-3 text-sm",

  selectWrapper: "relative w-full lg:w-[260px]",
  select:
    "h-12 w-full appearance-none rounded-2xl border pl-4 pr-12 text-sm outline-none transition-colors",
  selectIcon:
    "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2",

  content: "space-y-5",

  topGrid: "grid grid-cols-1 gap-4 xl:grid-cols-2",
  statBox: "rounded-[22px] border px-7 py-7",
  statLabel: "text-[15px] font-medium",
  statValue: "mt-4 text-[28px] font-bold leading-tight tracking-tight",
  statHint: "mt-4 text-[15px] leading-6",

  bottomGrid: "grid grid-cols-1 gap-4 md:grid-cols-3",
  metaBox: "rounded-2xl border px-5 py-5",
  metaLabel: "text-xs font-medium uppercase tracking-wide",
  metaValue: "mt-3 text-[15px] font-semibold leading-6",

  loadingText: "text-sm",
  errorText: "text-sm",
};

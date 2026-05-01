export const dashboardHeaderStyles = {
  wrapper:
    "sticky top-0 z-40 border-b border-white/10 bg-[#0B1F3A] text-white shadow-sm",

  inner:
    "mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8",

  left: "min-w-0",

  title: "truncate text-xl font-semibold tracking-tight text-white lg:text-2xl",

  subtitle: "mt-1 hidden text-sm text-slate-300 sm:block",

  right: "flex items-center gap-3",

  switchWrapper:
    "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm",

  switchLabel: "hidden text-xs font-medium text-slate-300 sm:inline",

  themeButton:
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20",

  themeButtonActive: "bg-amber-400 text-slate-950 hover:bg-amber-300",
};

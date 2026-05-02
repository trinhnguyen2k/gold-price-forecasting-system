export const dashboardHeaderStyles = {
  wrapper: "sticky top-0 z-40 shadow-sm",

  topBar: "border-b border-white/10 bg-[var(--header-bg)] text-white",

  topBarInner:
    "mx-auto flex w-full max-w-[1500px] items-center justify-between gap-4 px-6 py-4 lg:px-8",

  left: "min-w-0",

  title: "truncate text-xl font-semibold tracking-tight text-white lg:text-2xl",

  subtitle: "mt-1 hidden text-sm text-slate-300 sm:block",

  right: "flex items-center gap-3",

  switchWrapper:
    "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-sm",

  switchLabel: "hidden text-xs font-medium text-slate-300 sm:inline",

  themeButton:
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20",

  themeButtonActive: "bg-[var(--gold-accent)] text-slate-950 hover:opacity-90",

  navBar: "border-b border-white/10 bg-[var(--header-bg-soft)] text-white",

  navInner:
    "mx-auto flex w-full max-w-[1500px] items-center gap-2 overflow-x-auto px-6 py-3 lg:px-8",

  navLink:
    "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white",

  navLinkActive: "bg-white/12 text-white",
};

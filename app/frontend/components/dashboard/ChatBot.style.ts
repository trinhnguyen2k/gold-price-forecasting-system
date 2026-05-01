export const chatBotStyles = {
  launcher:
    "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800",

  popupBase: "fixed bottom-6 right-6 z-50 transition-all duration-200",

  popupCompact: "w-[380px] max-w-[calc(100vw-24px)]",

  popupExpanded: "w-[520px] max-w-[calc(100vw-24px)]",

  card: "border-slate-200 shadow-2xl",

  header:
    "flex flex-row items-start justify-between space-y-0 border-b border-slate-100",

  iconWrapper: "rounded-full bg-sky-100 p-2 text-sky-700",

  messageAreaBase: "overflow-y-auto rounded-xl bg-slate-50 p-4",

  messageAreaCompact: "h-[340px]",

  messageAreaExpanded: "h-[420px]",

  suggestedButton:
    "rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm text-slate-700 transition hover:border-sky-300 hover:bg-sky-50",

  userBubble:
    "max-w-[85%] rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white",

  botBubble:
    "max-w-[90%] rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm",

  loadingBubble:
    "max-w-[85%] rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm",

  errorBubble:
    "max-w-[85%] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700",

  textareaBase:
    "min-h-[96px] resize-none rounded-xl border-slate-300 focus-visible:ring-sky-300",

  textareaExpanded: "min-h-[120px]",

  clearButton: "rounded-xl",

  submitButton: "rounded-xl bg-slate-900 text-white hover:bg-slate-800",

  badgeBase: "rounded-full",

  badgeInScope: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",

  badgeOutOfScope: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

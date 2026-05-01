export const chatBotStyles = {
  launcher:
    "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--chat-fab-border)] bg-[var(--chat-fab-bg)] text-[var(--chat-fab-icon)] shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:opacity-100",
  popupBase: "fixed bottom-6 right-6 z-50 transition-all duration-200",
  popupCompact: "w-[380px] max-w-[calc(100vw-24px)]",
  popupExpanded: "w-[520px] max-w-[calc(100vw-24px)]",

  card: "border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_18px_40px_rgba(0,0,0,0.38)] backdrop-blur-sm",
  header:
    "flex flex-row items-start justify-between space-y-0 border-b border-[var(--border-color)]",

  headerLeft: "flex items-start gap-3",
  headerIcon:
    "rounded-full bg-[var(--blue-accent-soft)] p-2 text-[var(--blue-accent)]",
  headerTitle: "text-base text-[var(--title-color)]",
  headerDescription: "mt-1 text-xs text-[var(--muted-color)]",

  headerActions: "flex items-center gap-1",
  iconButton: "h-8 w-8",

  content: "space-y-4 p-4",

  messageAreaBase: "overflow-y-auto rounded-xl bg-[var(--chat-surface)] p-4",
  messageAreaCompact: "h-[340px]",
  messageAreaExpanded: "h-[420px]",

  introBubble:
    "rounded-2xl bg-[var(--chat-bot-bg)] p-4 text-sm leading-6 text-[var(--text-color)] shadow-sm",

  suggestedTitle:
    "mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-color)]",
  suggestedList: "flex flex-col gap-2",
  suggestedButton:
    "cursor-pointer rounded-xl border px-3 py-3 text-left text-sm transition-all duration-200 active:scale-[0.98]",
  messagesList: "space-y-4",
  userMessageRow: "flex justify-end",
  userBubble:
    "max-w-[85%] rounded-2xl bg-[var(--chat-user-bg)] px-4 py-3 text-sm text-white",

  botMessageWrapper: "space-y-2",
  botBubble:
    "max-w-[92%] rounded-2xl border border-[var(--chat-card-border)] bg-[var(--chat-bot-bg)] px-4 py-3 text-[var(--text-color)] leading-7 shadow-sm overflow-hidden break-words",
  loadingBubble:
    "max-w-[85%] rounded-2xl bg-[var(--chat-bot-bg)] px-4 py-3 text-sm text-[var(--muted-color)] shadow-sm",

  errorBubble:
    "max-w-[85%] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",

  badgeBase: "rounded-full",
  badgeInScope:
    "bg-[var(--success-bg)] text-[var(--success-text)] hover:bg-[var(--success-bg)]",
  badgeOutOfScope:
    "bg-[var(--warning-bg)] text-[var(--warning-text)] hover:bg-[var(--warning-bg)]",

  form: "space-y-3",
  textareaBase:
    "w-full rounded-2xl border border-[var(--chat-input-border)] bg-[var(--chat-input-bg)] px-4 py-3 text-[var(--text-color)] placeholder:text-[var(--chat-input-placeholder)] outline-none transition-all duration-200 focus:border-[var(--blue-accent)] focus:ring-2 focus:ring-[rgba(92,200,255,0.16)] resize-none",
  textareaExpanded: "min-h-[120px]",

  footerActions: "flex items-center justify-between gap-3",
  clearButton:
    "rounded-full border border-[var(--chat-card-border)] bg-transparent px-4 py-2 text-[var(--muted-color)] transition-all duration-200 hover:border-[var(--blue-accent)] hover:bg-[rgba(29,120,193,0.08)] hover:text-[var(--text-color)]",
  submitButton:
    "inline-flex items-center gap-2 rounded-full border border-[var(--chat-button-border)] bg-[var(--chat-button-bg)] px-5 py-2.5 text-[var(--chat-button-text)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--chat-button-hover)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.24)]",
};

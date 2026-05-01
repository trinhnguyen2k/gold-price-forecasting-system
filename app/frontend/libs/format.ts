export function formatPriceUsd(value: number | string): string {
  const numericValue = Number(value);
  return `${numericValue.toFixed(2)} USD`;
}

export function formatDateDdMmYyyy(value: string | Date): string {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

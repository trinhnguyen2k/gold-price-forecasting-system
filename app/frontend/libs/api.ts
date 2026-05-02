// Gom toàn bộ hàm gọi API backend vào 1 file để dễ maintain và tái sử dụng

import {
  ChatAskResponse,
  CurrentGoldPrice,
  LatestForecastResponse,
  LatestPrice,
  PriceHistoryItem,
} from "@/type/api.type";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_API_BASE_URL. Please check your .env.local file.",
  );
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getLatestPrice(): Promise<LatestPrice> {
  const response = await fetch(`${API_BASE_URL}/prices/latest`, {
    cache: "no-store",
  });

  return handleResponse<LatestPrice>(response);
}

export async function getPriceHistory(): Promise<PriceHistoryItem[]> {
  const response = await fetch(`${API_BASE_URL}/prices/history`, {
    cache: "no-store",
  });

  return handleResponse<PriceHistoryItem[]>(response);
}

export async function getLatestForecast(): Promise<LatestForecastResponse> {
  const response = await fetch(`${API_BASE_URL}/forecast/latest`, {
    cache: "no-store",
  });

  return handleResponse<LatestForecastResponse>(response);
}

export async function askChatbot(question: string): Promise<ChatAskResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  return handleResponse<ChatAskResponse>(response);
}

export async function getCurrentGoldPrice(
  type = "XAUUSD",
): Promise<CurrentGoldPrice> {
  const response = await fetch(
    `${API_BASE_URL}/prices/current?type=${encodeURIComponent(type)}`,
    {
      cache: "no-store",
    },
  );

  return handleResponse<CurrentGoldPrice>(response);
}

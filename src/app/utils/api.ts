let apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;

export async function fetchStockData(symbol: string) {
  const res = await fetch(`${apiUrl}/api/stocks/${symbol}`);

  return res.json();
}

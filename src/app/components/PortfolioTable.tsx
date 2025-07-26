"use client";
import { useEffect, useState } from "react";
import { fetchStockData } from "../utils/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

interface Stock {
  name: string;
  symbol: string;
  purchasePrice: number;
  qty: number;
  exchange: string;
  sector: string;
}

interface LiveData {
  cmp: number;
  peRatio: string;
  latestEarnings: string;
}

const SECTOR_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7f50",
  "#8dd1e1",
  "#a4de6c",
  "#d0ed57",
  "#f4a261",
];

export default function PortfolioTable({ data }: { data: Stock[] }) {
  const [liveData, setLiveData] = useState<Record<string, LiveData>>({});
  const [filter, setFilter] = useState("");
  const [intervalMs, setIntervalMs] = useState(15000);
  const [showGainers, setShowGainers] = useState<boolean | null>(null);

  const updateLiveData = async () => {
    const updates: Record<string, LiveData> = {};
    await Promise.all(
      data.map(async (stock) => {
        try {
          const res = await fetchStockData(stock.symbol);
          updates[stock.symbol] = res;
        } catch {
          updates[stock.symbol] = {
            cmp: 0,
            peRatio: "N/A",
            latestEarnings: "N/A",
          };
        }
      })
    );
    setLiveData(updates);
  };

  useEffect(() => {
    updateLiveData();
    const interval = setInterval(updateLiveData, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  const filteredStocks = data.filter((stock) => {
    const match =
      stock.name.toLowerCase().includes(filter) ||
      stock.symbol.toLowerCase().includes(filter);
    if (!match) return false;
    if (showGainers === null) return true;
    const live = liveData[stock.symbol];
    const gain = (live?.cmp || 0) * stock.qty - stock.qty * stock.purchasePrice;
    return showGainers ? gain >= 0 : gain < 0;
  });

  const grouped = filteredStocks.reduce(
    (acc: Record<string, Stock[]>, stock) => {
      if (!acc[stock.sector]) acc[stock.sector] = [];
      acc[stock.sector].push(stock);
      return acc;
    },
    {}
  );

  const totalInvestment = data.reduce(
    (acc, stock) => acc + stock.qty * stock.purchasePrice,
    0
  );

  const sectorData = Object.entries(grouped).map(([sector, stocks]) => {
    const total = stocks.reduce(
      (sum, s) => sum + s.qty * s.purchasePrice,
      0
    );
    return { sector, investment: total };
  });

  const gainsData = filteredStocks.map((stock) => {
    const live = liveData[stock.symbol];
    const cmp = live?.cmp || 0;
    const investment = stock.qty * stock.purchasePrice;
    const present = cmp * stock.qty;
    const gain = present - investment;
    return {
      name: stock.symbol,
      gain: Number(gain.toFixed(2)),
    };
  });

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search stock..."
          className="border p-2 rounded w-full md:w-1/3"
          onChange={(e) => setFilter(e.target.value.toLowerCase())}
        />
        <select
          className="border p-2 rounded w-full md:w-1/4"
          value={intervalMs}
          onChange={(e) => setIntervalMs(Number(e.target.value))}
        >
          <option value={10000}>10 sec</option>
          <option value={15000}>15 sec</option>
          <option value={30000}>30 sec</option>
          <option value={60000}>1 min</option>
        </select>
        <div className="flex gap-2 items-center">
          <button onClick={() => setShowGainers(null)} className="px-3 py-1 border rounded">
            All
          </button>
          <button onClick={() => setShowGainers(true)} className="px-3 py-1 border rounded text-green-600">
            Gainers
          </button>
          <button onClick={() => setShowGainers(false)} className="px-3 py-1 border rounded text-red-600">
            Losers
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart for Sector Investment */}
        <div className="h-64 w-full p-4 border rounded shadow bg-white">
          <h3 className="text-lg font-semibold mb-2">Sector-wise Investment</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectorData}
                dataKey="investment"
                nameKey="sector"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {sectorData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={SECTOR_COLORS[index % SECTOR_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart for Gain/Loss */}
        <div className="h-64 w-full p-4 border rounded shadow bg-white">
          <h3 className="text-lg font-semibold mb-2">Stock-wise Gain/Loss</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={gainsData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="gain" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      {Object.entries(grouped).map(([sector, stocks]) => (
        <div key={sector} className="mb-8">
          <h2 className="text-xl font-bold mb-2">{sector}</h2>
          <div className="rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm text-left text-gray-800">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold text-center">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Buy ₹</th>
                  <th className="px-4 py-3 font-semibold text-right">Invested</th>
                  <th className="px-4 py-3 font-semibold text-right">CMP</th>
                  <th className="px-4 py-3 font-semibold text-right">Present</th>
                  <th className="px-4 py-3 font-semibold text-right">Gain/Loss</th>
                  <th className="px-4 py-3 font-semibold text-center">P/E</th>
                  <th className="px-4 py-3 font-semibold text-center">Earnings</th>
                  <th className="px-4 py-3 font-semibold text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock, idx) => {
                  const live = liveData[stock.symbol];
                  const investment = stock.qty * stock.purchasePrice;
                  const cmp = live?.cmp || 0;
                  const present = cmp * stock.qty;
                  const gain = present - investment;
                  const percent = ((investment / totalInvestment) * 100).toFixed(2);

                  return (
                    <tr
                      key={stock.symbol + idx}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-2 font-medium">{stock.name}</td>
                      <td className="px-4 py-2 text-center">{stock.qty}</td>
                      <td className="px-4 py-2 text-right">₹{stock.purchasePrice}</td>
                      <td className="px-4 py-2 text-right">₹{investment.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-blue-600">₹{cmp.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right">₹{present.toFixed(2)}</td>
                      <td className={`px-4 py-2 text-right font-medium ${gain >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ₹{gain.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">{live?.peRatio}</td>
                      <td className="px-4 py-2 text-center">{live?.latestEarnings}</td>
                      <td className="px-4 py-2 text-right">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

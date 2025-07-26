import PortfolioTable from "../app/components/PortfolioTable";
import portfolio from "../app/utils/data.json";

export default function Home() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">📈 Portfolio Dashboard</h1>
      <PortfolioTable data={portfolio} />
    </div>
  );
}
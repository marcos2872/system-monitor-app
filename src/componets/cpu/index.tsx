import { CpuMetrics } from "../../interfaces";
import { useState, useEffect } from "react";
import { Chart, ChartWrapperOptions } from "react-google-charts";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

export function CpuUsage({ data }: { data: CpuMetrics }) {
  const [usageHistory, setUsageHistory] = useState<Array<[string, number]>>([]);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString();
    setUsageHistory((prev) => {
      const newHistory: Array<[string, number]> = [
        ...prev,
        [currentTime, data.usage_percent],
      ];
      return newHistory.length > 60 ? newHistory.slice(-60) : newHistory;
    });
  }, [data.usage_percent]);

  const chartData = [["Tempo", "CPU %"], ...usageHistory];

  const perCoreData = [
    ["Core", "Uso %"],
    ...data.per_core_usage.map((usage, index) => [`Core ${index}`, usage]),
  ];

  const options: ChartWrapperOptions["options"] = {
    title: "Histórico de Uso da CPU",
    hAxis: {
      title: "Tempo",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
    },
    vAxis: {
      title: "Uso (%)",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
      minValue: 0,
      maxValue: 100,
    },
    legend: "none",
    backgroundColor: "transparent",
    titleTextStyle: { color: "white" },
    curveType: "function",
    colors: ["#3b82f6"],
  };

  const coreOptions: ChartWrapperOptions["options"] = {
    title: "Uso por Core",
    hAxis: {
      title: "Cores",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
    },
    vAxis: {
      title: "Uso (%)",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
      minValue: 0,
      maxValue: 100,
    },
    legend: "none",
    backgroundColor: "transparent",
    titleTextStyle: { color: "white" },
    colors: ["#10b981"],
  };
  return (
    <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">CPU - {data.name}</h2>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="text-white hover:text-blue-400 transition-colors"
        >
          {showCharts ? <IoChevronUp size={24} /> : <IoChevronDown size={24} />}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Usage</p>
          <p className="text-2xl font-bold">{data.usage_percent.toFixed(2)}%</p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Cores</p>
          <p className="text-2xl font-bold">{data.core_count}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Frequency</p>
          <p className="text-2xl font-bold">{data.frequency} MHz</p>
        </div>
      </div>

      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div>
            <Chart
              chartType="LineChart"
              width="100%"
              height="300px"
              data={chartData}
              options={options}
            />
          </div>
          <div>
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="300px"
              data={perCoreData}
              options={coreOptions}
            />
          </div>
        </div>
      )}
    </section>
  );
}

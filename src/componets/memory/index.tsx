import { MemoryMetrics } from "../../interfaces";
import { useState, useEffect } from "react";
import { Chart, ChartWrapperOptions } from "react-google-charts";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

export function MemoryUsage({ data }: { data: MemoryMetrics }) {
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

  const chartData = [["Tempo", "Memória %"], ...usageHistory];

  const gaugeData = [
    ["Label", "Value"],
    ["Memory", Number((data.used_memory / 1024 / 1024 / 1024).toFixed(2))],
  ];

  const options: ChartWrapperOptions["options"] = {
    title: "Histórico de Uso da Memória",
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
    colors: ["#8b5cf6"],
  };

  const totalMemoryGB = data.total_memory / 1024 / 1024 / 1024;

  const gaugeOptions: ChartWrapperOptions["options"] = {
    title: "Uso da Memória (GB)",
    backgroundColor: "#374151",
    titleTextStyle: { color: "white" },
    width: 400,
    height: 300,
    redFrom: totalMemoryGB * 0.8,
    redTo: totalMemoryGB,
    yellowFrom: totalMemoryGB * 0.6,
    yellowTo: totalMemoryGB * 0.8,
    greenFrom: 0,
    greenTo: totalMemoryGB * 0.6,
    minorTicks: 5,
    max: totalMemoryGB.toFixed(2),
    majorTicks: [],
    textStyle: { color: "white", fontSize: 12 },
    animation: {
      duration: 1000,
      easing: "out"
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Memória</h2>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="text-white hover:text-purple-400 transition-colors"
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
          <p className="text-sm text-gray-300">Used</p>
          <p className="text-2xl font-bold">
            {(data.used_memory / 1024 / 1024 / 1024).toFixed(2)} GB
          </p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Total</p>
          <p className="text-2xl font-bold">
            {(data.total_memory / 1024 / 1024 / 1024).toFixed(2)} GB
          </p>
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
              chartType="Gauge"
              width="100%"
              height="300px"
              data={gaugeData}
              options={gaugeOptions}
            />
          </div>
        </div>
      )}
    </section>
  );
}

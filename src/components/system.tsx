import { SystemMetrics } from "../interfaces";
import { useState, useEffect } from "react";
import { Chart, ChartWrapperOptions } from "react-google-charts";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

export function SystemInfo({ data }: { data: SystemMetrics }) {
  const [loadAverageHistory, setLoadAverageHistory] = useState<
    Array<[string, number, number, number]>
  >([]);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString();
    setLoadAverageHistory((prev) => {
      const newHistory: Array<[string, number, number, number]> = [
        ...prev,
        [
          currentTime,
          data.load_average[0],
          data.load_average[1],
          data.load_average[2],
        ],
      ];
      return newHistory.length > 60 ? newHistory.slice(-60) : newHistory;
    });
  }, [data.load_average]);

  const loadAverageData = [
    ["Tempo", "1min", "5min", "15min"],
    ...loadAverageHistory,
  ];

  const systemStatsData = [
    ["Métrica", "Valor"],
    ["CPU Usage", data.cpu.usage_percent],
    ["Memory Usage", data.memory.usage_percent],
    ["Disk Usage", (data.disk.used_space / data.disk.total_space) * 100],
  ];

  const loadOptions: ChartWrapperOptions["options"] = {
    title: "Load Average (Carga do Sistema)",
    backgroundColor: "transparent",
    titleTextStyle: { color: "white" },
    hAxis: {
      title: "Tempo",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
    },
    vAxis: {
      title: "Load Average",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
      minValue: 0,
    },
    legend: {
      textStyle: { color: "white" },
      position: "top",
    },
    curveType: "function",
    colors: ["#f59e0b", "#f97316", "#dc2626"],
  };

  const statsOptions: ChartWrapperOptions["options"] = {
    title: "Resumo do Sistema (%)",
    backgroundColor: "transparent",
    titleTextStyle: { color: "white" },
    hAxis: {
      title: "Componentes",
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
    colors: ["#8b5cf6"],
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Sistema</h2>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="text-white hover:text-orange-400 transition-colors"
        >
          {showCharts ? <IoChevronUp size={24} /> : <IoChevronDown size={24} />}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Uptime</p>
          <p className="text-2xl font-bold">{formatUptime(data.uptime)}</p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Load Average (1m)</p>
          <p className="text-2xl font-bold">
            {data.load_average[0].toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Load Average (5m)</p>
          <p className="text-2xl font-bold">
            {data.load_average[1].toFixed(2)}
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
              data={loadAverageData}
              options={loadOptions}
            />
          </div>
          <div>
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="300px"
              data={systemStatsData}
              options={statsOptions}
            />
          </div>
        </div>
      )}
    </section>
  );
}

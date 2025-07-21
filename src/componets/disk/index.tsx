import { DiskMetrics } from "../../interfaces";
import { useState } from "react";
import { Chart, ChartWrapperOptions } from "react-google-charts";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

export function DiskUsage({ data }: { data: DiskMetrics }) {
  const [showCharts, setShowCharts] = useState(false);

  const diskUsageData = [
    ["Disco", "Usado (GB)", "Disponível (GB)"],
    ...data.disks.map((disk) => [
      disk.name,
      disk.used_space / 1024 / 1024 / 1024,
      disk.available_space / 1024 / 1024 / 1024,
    ]),
  ];
  const stackedOptions: ChartWrapperOptions["options"] = {
    title: "Uso do Disco por Unidade",
    isStacked: true,
    backgroundColor: "transparent",
    titleTextStyle: { color: "white" },
    hAxis: {
      title: "Discos",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
    },
    vAxis: {
      title: "Espaço (GB)",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
    },
    legend: {
      textStyle: { color: "white" },
      position: "top",
    },
    colors: ["#ef4444", "#22c55e"],
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Disco</h2>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="text-white hover:text-yellow-400 transition-colors"
        >
          {showCharts ? <IoChevronUp size={24} /> : <IoChevronDown size={24} />}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Total Space</p>
          <p className="text-2xl font-bold">
            {(data.total_space / 1024 / 1024 / 1024).toFixed(2)} GB
          </p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Used Space</p>
          <p className="text-2xl font-bold">
            {(data.used_space / 1024 / 1024 / 1024).toFixed(2)} GB
          </p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Available</p>
          <p className="text-2xl font-bold">
            {(data.available_space / 1024 / 1024 / 1024).toFixed(2)} GB
          </p>
        </div>
      </div>

      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div>
            <Chart
              chartType="ColumnChart"
              width="100%"
              height="300px"
              data={diskUsageData}
              options={stackedOptions}
            />
          </div>
        </div>
      )}
    </section>
  );
}

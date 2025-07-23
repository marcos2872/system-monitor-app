import { NetworkMetrics } from "../interfaces";
import { useState, useEffect } from "react";
import { Chart, ChartWrapperOptions } from "react-google-charts";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

export function NetworkUsage({ data }: { data: NetworkMetrics }) {
  const [downloadHistory, setDownloadHistory] = useState<
    Array<[string, number]>
  >([]);
  const [uploadHistory, setUploadHistory] = useState<Array<[string, number]>>(
    [],
  );
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString();
    const downloadSpeed = data.total_bytes_received / 2; // Simulando velocidade por segundo
    const uploadSpeed = data.total_bytes_transmitted / 2;

    setDownloadHistory((prev) => {
      const newHistory: Array<[string, number]> = [
        ...prev,
        [currentTime, downloadSpeed / 1024 / 1024], // MB/s
      ];
      return newHistory.length > 60 ? newHistory.slice(-60) : newHistory;
    });

    setUploadHistory((prev) => {
      const newHistory: Array<[string, number]> = [
        ...prev,
        [currentTime, uploadSpeed / 1024 / 1024], // MB/s
      ];
      return newHistory.length > 60 ? newHistory.slice(-60) : newHistory;
    });
  }, [data.total_bytes_received, data.total_bytes_transmitted]);

  const networkSpeedData = [
    ["Tempo", "Download (MB/s)", "Upload (MB/s)"],
    ...downloadHistory.map((download, index) => [
      download[0],
      download[1],
      uploadHistory[index] ? uploadHistory[index][1] : 0,
    ]),
  ];

  const speedOptions: ChartWrapperOptions["options"] = {
    title: "Velocidade da Rede",
    backgroundColor: "transparent",
    titleTextStyle: { color: "white" },
    hAxis: {
      title: "Tempo",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
    },
    vAxis: {
      title: "Velocidade (MB/s)",
      titleTextStyle: { color: "white" },
      textStyle: { color: "white" },
      minValue: 0,
    },
    legend: {
      textStyle: { color: "white" },
      position: "top",
    },
    curveType: "function",
    colors: ["#06b6d4", "#ec4899"],
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(2)} B/s`;
    if (bytesPerSec < 1024 * 1024)
      return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
    return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`;
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Rede</h2>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="text-white hover:text-cyan-400 transition-colors"
        >
          {showCharts ? <IoChevronUp size={24} /> : <IoChevronDown size={24} />}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Download Speed</p>
          <p className="text-2xl font-bold">
            {formatSpeed(data.total_bytes_received / 2)}
          </p>
        </div>
        <div className="bg-gray-700 p-4 rounded">
          <p className="text-sm text-gray-300">Upload Speed</p>
          <p className="text-2xl font-bold">
            {formatSpeed(data.total_bytes_transmitted / 2)}
          </p>
        </div>
      </div>

      {showCharts && (
        <div className="grid grid-cols-1 gap-6 mt-6">
          <div>
            <Chart
              chartType="LineChart"
              width="100%"
              height="300px"
              data={networkSpeedData}
              options={speedOptions}
            />
          </div>
        </div>
      )}
    </section>
  );
}

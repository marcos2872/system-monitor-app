import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SystemMetrics } from "./interfaces";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { MdClose, MdMinimize } from "react-icons/md";
import { CpuUsage } from "./components/cpu";
import { MemoryUsage } from "./components/memory";
import { DiskUsage } from "./components/disk";
import { NetworkUsage } from "./components/network";
import { SystemInfo } from "./components/system";

function App() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const appWindow = getCurrentWindow();

  async function generateTextIcon(
    cpu: string,
    ram: string,
  ): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const svgString = `
      <svg width="400" height="128" xmlns="http://www.w3.org/2000/svg">
        <text
          x="0"
          y="32"
          font-family="monospace"
          font-size="32px"
          font-weight="bold"
          fill="#00ff00"
          text-anchor="start"
          dominant-baseline="middle"
        >cpu:</text>
        <text
          x="80"
          y="32"
          font-family="monospace"
          font-size="32px"
          font-weight="bold"
          fill="#ffffff"
          text-anchor="start"
          dominant-baseline="middle"
        >${cpu}%</text>
        <text
          x="160"
          y="32"
          font-family="monospace"
          font-size="32px"
          font-weight="bold"
          fill="#ffffff"
          text-anchor="start"
          dominant-baseline="middle"
        >|</text>
        <text
          x="180"
          y="32"
          font-family="monospace"
          font-size="32px"
          font-weight="bold"
          fill="#00ff00"
          text-anchor="start"
          dominant-baseline="middle"
        >ram:</text>
        <text
          x="260"
          y="32"
          font-family="monospace"
          font-size="32px"
          font-weight="bold"
          fill="#ffffff"
          text-anchor="start"
          dominant-baseline="middle"
        >${ram}gb</text>
      </svg>
      `;

      const svgElement = new DOMParser().parseFromString(
        svgString,
        "image/svg+xml",
      ).documentElement;
      const serializer = new XMLSerializer();
      const svgData = serializer.serializeToString(svgElement);

      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, 400, 64);
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, 400, 64);

        resolve(new Uint8Array(imageData.data));
        URL.revokeObjectURL(img.src);
      };

      const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
      img.src = URL.createObjectURL(svgBlob);
    });
  }

  async function updateTrayText(cpu: string, ram: string) {
    try {
      const iconData = await generateTextIcon(cpu, ram);

      // await invoke("update_tray_text", { text: trayText });

      await invoke("update_tray_icon", {
        iconData: Array.from(iconData),
        width: 400,
        height: 64,
      });
    } catch (error) {
      console.error("Erro ao atualizar texto do tray:", error);
    }
  }

  async function monitor() {
    try {
      const monit: SystemMetrics = await invoke("monitor_sys");
      updateTrayText(
        monit.cpu.usage_percent.toFixed(0),
        (monit.memory.used_memory / 1024 / 1024 / 1024).toFixed(0),
      );
      setMetrics(monit);
      setError(null);
      if (loading) setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
      setLoading(false);
    }
  }
  useEffect(() => {
    monitor();
    const interval = setInterval(() => {
      monitor();
    }, 500);
    return () => clearInterval(interval);
  }, [loading]);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading system metrics...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-400 text-xl">Error: {error}</div>
      </main>
    );
  }
  return (
    <main className="h-screen cursor-default select-none relative overflow-hidden">
      <header className="w-full h-8 flex border-s-stone-300 border-b bg-gray-800 flex-shrink-0">
        <div
          data-tauri-drag-region
          className="flex w-full justify-center items-center relative"
        >
          <div>
            <h2 className="text-gray-200">Monitor de Sistema</h2>
          </div>
          <div className="flex absolute right-0 gap-4 px-4">
            <div>
              <MdMinimize
                color="white"
                onClick={() => {
                  appWindow.setSkipTaskbar(true);
                  appWindow.minimize();
                }}
              />
            </div>
            <div>
              <MdClose
                color="white"
                onClick={() => {
                  appWindow.close();
                }}
              />
            </div>
          </div>
        </div>
      </header>
      <div className="flex-1 h-screen bg-gray-600 p-4 pb-12 scroll-container">
        <div className="max-w-6xl mx-auto space-y-6">
          {metrics && (
            <>
              {/* CPU Metrics */}
              <CpuUsage data={metrics.cpu} />

              {/* Memory Metrics */}
              <MemoryUsage data={metrics.memory} />

              {/* Disk Metrics */}
              <DiskUsage data={metrics.disk} />

              {/* Network Metrics */}
              <NetworkUsage data={metrics.network} />

              {/* System Info */}
              <SystemInfo data={metrics} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;

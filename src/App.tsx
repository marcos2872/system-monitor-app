import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SystemMetrics } from "./interfaces";
import { MdMinimize, MdClose } from "react-icons/md";
import { getCurrentWindow } from "@tauri-apps/api/window";

function App() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const appWindow = getCurrentWindow();

  async function monitor() {
    try {
      const monit: SystemMetrics = await invoke("monitor_sys");
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
    const interval = setInterval(monitor, 1000);
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
      <div className="flex-1 h-screen bg-gray-600 p-4 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {metrics && (
            <>
              {/* CPU Metrics */}
              <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">
                  CPU - {metrics.cpu.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Usage</p>
                    <p className="text-2xl font-bold">
                      {metrics.cpu.usage_percent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Cores</p>
                    <p className="text-2xl font-bold">
                      {metrics.cpu.core_count}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Frequency</p>
                    <p className="text-2xl font-bold">
                      {metrics.cpu.frequency} MHz
                    </p>
                  </div>
                </div>
              </section>

              {/* Memory Metrics */}
              <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Memory</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Usage</p>
                    <p className="text-2xl font-bold">
                      {metrics.memory.usage_percent.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Used</p>
                    <p className="text-2xl font-bold">
                      {(
                        metrics.memory.used_memory /
                        1024 /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      GB
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Total</p>
                    <p className="text-2xl font-bold">
                      {(
                        metrics.memory.total_memory /
                        1024 /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      GB
                    </p>
                  </div>
                </div>
              </section>

              {/* Disk Metrics */}
              <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Disk</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Total Space</p>
                    <p className="text-2xl font-bold">
                      {(metrics.disk.total_space / 1024 / 1024 / 1024).toFixed(
                        2,
                      )}{" "}
                      GB
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Used Space</p>
                    <p className="text-2xl font-bold">
                      {(metrics.disk.used_space / 1024 / 1024 / 1024).toFixed(
                        2,
                      )}{" "}
                      GB
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Available</p>
                    <p className="text-2xl font-bold">
                      {(
                        metrics.disk.available_space /
                        1024 /
                        1024 /
                        1024
                      ).toFixed(2)}{" "}
                      GB
                    </p>
                  </div>
                </div>
              </section>

              {/* Network Metrics */}
              <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Network</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Download Speed</p>
                    <p className="text-2xl font-bold">
                      {(() => {
                        const bytesPerSec =
                          metrics.network.total_bytes_received / 2;
                        if (bytesPerSec < 1024)
                          return `${bytesPerSec.toFixed(2)} B/s`;
                        if (bytesPerSec < 1024 * 1024)
                          return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
                        return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`;
                      })()}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Upload Speed</p>
                    <p className="text-2xl font-bold">
                      {(() => {
                        const bytesPerSec =
                          metrics.network.total_bytes_transmitted / 2;
                        if (bytesPerSec < 1024)
                          return `${bytesPerSec.toFixed(2)} B/s`;
                        if (bytesPerSec < 1024 * 1024)
                          return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
                        return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`;
                      })()}
                    </p>
                  </div>
                </div>
              </section>

              {/* System Info */}
              <section className="bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">System</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Uptime</p>
                    <p className="text-2xl font-bold">
                      {Math.floor(metrics.uptime / 3600)}h{" "}
                      {Math.floor((metrics.uptime % 3600) / 60)}m
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Load Average (1m)</p>
                    <p className="text-2xl font-bold">
                      {metrics.load_average[0].toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-300">Load Average (5m)</p>
                    <p className="text-2xl font-bold">
                      {metrics.load_average[1].toFixed(2)}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;

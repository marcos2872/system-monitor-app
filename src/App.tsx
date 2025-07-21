import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SystemMetrics } from "./interfaces";
import { MdMinimize, MdClose } from "react-icons/md";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CpuUsage } from "./componets/cpu";
import { MemoryUsage } from "./componets/memory";
import { DiskUsage } from "./componets/disk";
import { NetworkUsage } from "./componets/network";
import { SystemInfo } from "./componets/system";

function App() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  // const [metricsGpu, setMetricsGpu] = useState<UnifiedGpuInfo[]>([]);
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

  // async function monitorGpu() {
  //   try {
  //     const monit: UnifiedGpuInfo[] = await invoke("monitor_gpu");
  //     setMetricsGpu(monit);
  //     setError(null);
  //     if (loading) setLoading(false);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : "Failed to fetch metrics");
  //     setLoading(false);
  //   }
  // }

  useEffect(() => {
    monitor();
    // monitorGpu();
    const interval = setInterval(() => {
      monitor();
      // monitorGpu();
    }, 1000);
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
          {/* {metricsGpu.length > 0 && (
            <>
              {metricsGpu.map((gpu, index) => (
                <section
                  key={index}
                  className="bg-gray-800 rounded-lg p-6 shadow-lg"
                >
                  <h2 className="text-2xl font-bold text-white mb-4">
                    GPU - {gpu.name}{" "}
                    {gpu.is_primary && (
                      <span className="text-green-400">(Primary)</span>
                    )}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white mb-4">
                    <div className="bg-gray-700 p-4 rounded">
                      <p className="text-sm text-gray-300">Vendor</p>
                      <p className="text-lg font-bold">{gpu.vendor}</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded">
                      <p className="text-sm text-gray-300">Device Type</p>
                      <p className="text-lg font-bold">{gpu.deviceType}</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded">
                      <p className="text-sm text-gray-300">Backend</p>
                      <p className="text-lg font-bold">{gpu.backend}</p>
                    </div>
                    {gpu.basicInfo && (
                      <div className="bg-gray-700 p-4 rounded">
                        <p className="text-sm text-gray-300">Estimated Memory</p>
                        <p className="text-lg font-bold">
                          {(gpu.basicInfo.estimatedMemoryMb / 1024).toFixed(1)} GB
                        </p>
                      </div>
                    )}
                  </div>

                  {gpu.metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                      {gpu.metrics.gpuUsagePercent !== undefined && (
                        <div className="bg-gray-700 p-4 rounded">
                          <p className="text-sm text-gray-300">GPU Usage</p>
                          <p className="text-2xl font-bold">
                            {gpu.metrics.gpuUsagePercent.toFixed(1)}%
                          </p>
                        </div>
                      )}

                      {gpu.metrics.memoryUsagePercent !== undefined && (
                        <div className="bg-gray-700 p-4 rounded">
                          <p className="text-sm text-gray-300">Memory Usage</p>
                          <p className="text-2xl font-bold">
                            {gpu.metrics.memoryUsagePercent.toFixed(1)}%
                          </p>
                          {gpu.metrics.memoryUsageMb !== undefined &&
                            gpu.metrics.memoryTotalMb !== undefined && (
                              <p className="text-sm text-gray-400">
                                {(gpu.metrics.memoryUsageMb / 1024).toFixed(1)}{" "}
                                GB /{" "}
                                {(gpu.metrics.memoryTotalMb / 1024).toFixed(1)}{" "}
                                GB
                              </p>
                            )}
                        </div>
                      )}

                      {gpu.metrics.temperatureC !== undefined && (
                        <div className="bg-gray-700 p-4 rounded">
                          <p className="text-sm text-gray-300">Temperature</p>
                          <p className="text-2xl font-bold">
                            {gpu.metrics.temperatureC}°C
                          </p>
                        </div>
                      )}

                      {gpu.metrics.powerUsageWatts !== undefined && (
                        <div className="bg-gray-700 p-4 rounded">
                          <p className="text-sm text-gray-300">Power Usage</p>
                          <p className="text-2xl font-bold">
                            {gpu.metrics.powerUsageWatts}W
                          </p>
                        </div>
                      )}

                      {gpu.metrics.fanSpeedPercent !== undefined && (
                        <div className="bg-gray-700 p-4 rounded">
                          <p className="text-sm text-gray-300">Fan Speed</p>
                          <p className="text-2xl font-bold">
                            {gpu.metrics.fanSpeedPercent}%
                          </p>
                        </div>
                      )}

                      {gpu.metrics.clockGpuMhz !== undefined && (
                        <div className="bg-gray-700 p-4 rounded">
                          <p className="text-sm text-gray-300">GPU Clock</p>
                          <p className="text-2xl font-bold">
                            {gpu.metrics.clockGpuMhz} MHz
                          </p>
                        </div>
                      )}

                      {gpu.metrics.clockMemoryMhz !== undefined && (
                        <div className="bg-gray-700 p-4 rounded">
                          <p className="text-sm text-gray-300">Memory Clock</p>
                          <p className="text-2xl font-bold">
                            {gpu.metrics.clockMemoryMhz} MHz
                          </p>
                        </div>
                      )}

                      {gpu.metrics.voltage !== undefined && (
                        <div className="bg-gray-700 p-4 rounded">
                          <p className="text-sm text-gray-300">Voltage</p>
                          <p className="text-2xl font-bold">
                            {gpu.metrics.voltage}V
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {gpu.error && (
                    <div className="bg-red-900 p-4 rounded mt-4">
                      <p className="text-red-300 text-sm">Error: {gpu.error}</p>
                    </div>
                  )}

                  {gpu.basicInfo && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
                      <div className="bg-gray-700 p-4 rounded">
                        <p className="text-sm text-gray-300">Max Buffer Size</p>
                        <p className="text-lg font-bold">
                          {(gpu.basicInfo.maxBufferSizeMb / 1024).toFixed(1)} GB
                        </p>
                      </div>
                      <div className="bg-gray-700 p-4 rounded">
                        <p className="text-sm text-gray-300">Compute Support</p>
                        <p className="text-lg font-bold">
                          {gpu.basicInfo.supportsCompute ? "Yes" : "No"}
                        </p>
                      </div>
                      <div className="bg-gray-700 p-4 rounded">
                        <p className="text-sm text-gray-300">Timestamp Support</p>
                        <p className="text-lg font-bold">
                          {gpu.basicInfo.supportsTimestamp ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </>
          )} */}
        </div>
      </div>
    </main>
  );
}

export default App;

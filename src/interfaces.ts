export interface CpuMetrics {
  usage_percent: number;
  core_count: number;
  per_core_usage: number[];
  frequency: number;
  name: string;
}

export interface MemoryMetrics {
  total_memory: number;
  used_memory: number;
  available_memory: number;
  usage_percent: number;
  total_swap: number;
  used_swap: number;
}

export interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  used_space: number;
  usage_percent: number;
}

export interface DiskMetrics {
  disks: DiskInfo[];
  total_space: number;
  used_space: number;
  available_space: number;
}

export interface NetworkInterface {
  bytes_received: number;
  bytes_transmitted: number;
  packets_received: number;
  packets_transmitted: number;
  errors_received: number;
  errors_transmitted: number;
}

export interface NetworkMetrics {
  interfaces: Record<string, NetworkInterface>;
  total_bytes_received: number;
  total_bytes_transmitted: number;
}

export interface SystemMetrics {
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  uptime: number;
  load_average: [number, number, number];
}

export enum GpuVendor {
  Nvidia = "Nvidia",
  Amd = "Amd",
  Intel = "Intel",
  Apple = "Apple",
  Unknown = "Unknown",
}

export interface BasicGpuInfo {
  maxBufferSizeMb: number;
  estimatedMemoryMb: number;
  supportsCompute: boolean;
  supportsTimestamp: boolean;
}

export interface GpuMetrics {
  gpuUsagePercent?: number;
  memoryUsageMb?: number;
  memoryTotalMb?: number;
  memoryUsagePercent?: number;
  temperatureC?: number;
  powerUsageWatts?: number;
  fanSpeedPercent?: number;
  clockGpuMhz?: number;
  clockMemoryMhz?: number;
  voltage?: number;
}

export interface UnifiedGpuInfo {
  name: string;
  vendor: GpuVendor;
  deviceType: string;
  backend: string;
  basicInfo: BasicGpuInfo;
  metrics?: GpuMetrics;
  error?: string;
}

export interface BasicGpuData {
  name: string;
  vendor: GpuVendor;
  deviceType: string;
  backend: string;
  maxBufferSizeMb: number;
  estimatedMemoryMb: number;
  supportsCompute: boolean;
  supportsTimestamp: boolean;
}

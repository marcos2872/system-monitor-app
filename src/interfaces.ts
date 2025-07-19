export interface CpuMetrics {
  usage_percent: number;
  core_count: number;
  per_core_usage: number[];
  frequency: number;
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

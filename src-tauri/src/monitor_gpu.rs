use serde::Serialize;
use std::collections::HashSet;
use std::process::Command;
use wgpu;

#[derive(Serialize, Debug, Clone)]
pub struct UnifiedGpuInfo {
    pub name: String,
    pub vendor: GpuVendor,
    pub device_type: String,
    pub backend: String,
    pub basic_info: BasicGpuInfo,
    pub metrics: Option<GpuMetrics>,
    pub error: Option<String>,
    pub is_primary: bool, // Nova flag para indicar se é a GPU principal
}

#[derive(Serialize, Debug, Clone)]
pub enum GpuVendor {
    Nvidia,
    Amd,
    Intel,
    Apple,
    Unknown,
}

#[derive(Serialize, Debug, Clone)]
pub struct BasicGpuInfo {
    pub max_buffer_size_mb: u64,
    pub estimated_memory_mb: u64,
    pub supports_compute: bool,
    pub supports_timestamp: bool,
}

#[derive(Serialize, Debug, Clone)]
pub struct GpuMetrics {
    pub gpu_usage_percent: Option<f32>,
    pub memory_usage_mb: Option<u64>,
    pub memory_total_mb: Option<u64>,
    pub memory_usage_percent: Option<f32>,
    pub temperature_c: Option<f32>,
    pub power_usage_watts: Option<f32>,
    pub fan_speed_percent: Option<f32>,
    pub clock_gpu_mhz: Option<u32>,
    pub clock_memory_mhz: Option<u32>,
    pub voltage: Option<f32>,
}

#[derive(Debug, Clone)]
struct BasicGpuData {
    name: String,
    vendor: GpuVendor,
    device_type: String,
    backend: String,
    max_buffer_size_mb: u64,
    estimated_memory_mb: u64,
    supports_compute: bool,
    supports_timestamp: bool,
}

pub struct GpuMonitor;

impl GpuMonitor {
    /// Retorna todas as GPUs (método original mantido para compatibilidade)
    pub async fn get_all_gpu_info() -> Vec<UnifiedGpuInfo> {
        let mut gpu_list = Vec::new();
        let basic_gpus = Self::get_wgpu_basic_info().await;

        for (index, basic_gpu) in basic_gpus.into_iter().enumerate() {
            let metrics = Self::get_gpu_metrics(&basic_gpu.vendor, &basic_gpu.name, index).await;

            gpu_list.push(UnifiedGpuInfo {
                name: basic_gpu.name.clone(),
                vendor: basic_gpu.vendor.clone(),
                device_type: basic_gpu.device_type,
                backend: basic_gpu.backend,
                basic_info: BasicGpuInfo {
                    max_buffer_size_mb: basic_gpu.max_buffer_size_mb,
                    estimated_memory_mb: basic_gpu.estimated_memory_mb,
                    supports_compute: basic_gpu.supports_compute,
                    supports_timestamp: basic_gpu.supports_timestamp,
                },
                metrics: metrics.0,
                error: metrics.1,
                is_primary: false, // Será definido pelo select_primary_gpu
            });
        }

        gpu_list
    }

    /// Seleciona a GPU principal baseada em critérios de prioridade
    fn select_primary_gpu(gpus: Vec<UnifiedGpuInfo>) -> Option<UnifiedGpuInfo> {
        if gpus.is_empty() {
            return None;
        }

        // Remover duplicatas baseadas no nome (diferentes backends da mesma GPU)
        let mut unique_gpus = Vec::new();
        let mut seen_names = HashSet::new();

        for gpu in gpus {
            let normalized_name = Self::normalize_gpu_name(&gpu.name);
            if !seen_names.contains(&normalized_name) {
                seen_names.insert(normalized_name);
                unique_gpus.push(gpu);
            }
        }

        if unique_gpus.len() == 1 {
            unique_gpus[0].is_primary = true;
            return Some(unique_gpus[0].clone());
        }

        // Critérios de prioridade para selecionar a GPU principal:
        // 1. GPU dedicada com métricas disponíveis
        // 2. GPU dedicada sem métricas
        // 3. GPU integrada com métricas
        // 4. Qualquer outra GPU

        // Primeiro: GPUs dedicadas com métricas
        for mut gpu in unique_gpus.iter().cloned() {
            if gpu.device_type == "DiscreteGpu" && gpu.metrics.is_some() {
                gpu.is_primary = true;
                return Some(gpu);
            }
        }

        // Segundo: GPUs dedicadas sem métricas
        for mut gpu in unique_gpus.iter().cloned() {
            if gpu.device_type == "DiscreteGpu" {
                gpu.is_primary = true;
                return Some(gpu);
            }
        }

        // Terceiro: GPUs integradas com métricas
        for mut gpu in unique_gpus.iter().cloned() {
            if gpu.device_type == "IntegratedGpu" && gpu.metrics.is_some() {
                gpu.is_primary = true;
                return Some(gpu);
            }
        }

        // Quarto: Qualquer GPU restante (priorizando por vendor)
        let vendor_priority = [
            GpuVendor::Nvidia,
            GpuVendor::Amd,
            GpuVendor::Apple,
            GpuVendor::Intel,
            GpuVendor::Unknown,
        ];

        for vendor in &vendor_priority {
            for mut gpu in unique_gpus.iter().cloned() {
                if std::mem::discriminant(&gpu.vendor) == std::mem::discriminant(vendor) {
                    gpu.is_primary = true;
                    return Some(gpu);
                }
            }
        }

        // Fallback: primeira GPU disponível
        if let Some(mut first_gpu) = unique_gpus.into_iter().next() {
            first_gpu.is_primary = true;
            Some(first_gpu)
        } else {
            None
        }
    }

    /// Normaliza nomes de GPU para detectar duplicatas
    fn normalize_gpu_name(name: &str) -> String {
        name.to_lowercase()
            .replace("(tgl gt2)", "")
            .replace("(dg2)", "")
            .replace("(llvm", "")
            .replace("llvm", "")
            .replace("mesa", "")
            .replace("intel(r)", "intel")
            .replace("(r)", "")
            .trim()
            .to_string()
    }

    /// Método para obter apenas GPUs físicas únicas
    pub async fn get_unique_physical_gpus() -> Vec<UnifiedGpuInfo> {
        let all_gpus = Self::get_all_gpu_info().await;
        let mut unique_gpus = Vec::new();
        let mut seen_names = HashSet::new();

        for gpu in all_gpus {
            let normalized_name = Self::normalize_gpu_name(&gpu.name);
            if !seen_names.contains(&normalized_name) {
                seen_names.insert(normalized_name);
                unique_gpus.push(gpu);
            }
        }

        // Marcar a GPU principal
        if let Some(primary_gpu) = Self::select_primary_gpu(unique_gpus.clone()) {
            for gpu in &mut unique_gpus {
                gpu.is_primary = gpu.name == primary_gpu.name;
            }
        }

        unique_gpus
    }

    // Resto dos métodos mantidos iguais...
    async fn get_wgpu_basic_info() -> Vec<BasicGpuData> {
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::all(),
            ..Default::default()
        });

        let adapters = instance.enumerate_adapters(wgpu::Backends::all());
        let mut gpu_list = Vec::new();

        for adapter in adapters {
            let info = adapter.get_info();
            let limits = adapter.limits();
            let features = adapter.features();

            let vendor = Self::detect_vendor(&info.name);
            let estimated_memory = Self::estimate_memory(&limits, &info.device_type);

            gpu_list.push(BasicGpuData {
                name: info.name,
                vendor,
                device_type: format!("{:?}", info.device_type),
                backend: format!("{:?}", info.backend),
                max_buffer_size_mb: limits.max_buffer_size / 1024 / 1024,
                estimated_memory_mb: estimated_memory,
                supports_compute: features.contains(wgpu::Features::SHADER_F16),
                supports_timestamp: features.contains(wgpu::Features::TIMESTAMP_QUERY),
            });
        }

        gpu_list
    }

    fn detect_vendor(name: &str) -> GpuVendor {
        let name_lower = name.to_lowercase();
        if name_lower.contains("nvidia")
            || name_lower.contains("geforce")
            || name_lower.contains("rtx")
            || name_lower.contains("gtx")
            || name_lower.contains("quadro")
        {
            GpuVendor::Nvidia
        } else if name_lower.contains("amd")
            || name_lower.contains("radeon")
            || name_lower.contains("rx ")
            || name_lower.contains("vega")
        {
            GpuVendor::Amd
        } else if name_lower.contains("intel")
            || name_lower.contains("uhd")
            || name_lower.contains("iris")
            || name_lower.contains("arc")
        {
            GpuVendor::Intel
        } else if name_lower.contains("apple")
            || name_lower.contains("m1")
            || name_lower.contains("m2")
            || name_lower.contains("m3")
        {
            GpuVendor::Apple
        } else {
            GpuVendor::Unknown
        }
    }

    fn estimate_memory(limits: &wgpu::Limits, device_type: &wgpu::DeviceType) -> u64 {
        match device_type {
            wgpu::DeviceType::DiscreteGpu => {
                std::cmp::max(limits.max_buffer_size / 1024 / 1024, 2048)
            }
            wgpu::DeviceType::IntegratedGpu => {
                std::cmp::max(limits.max_buffer_size / 1024 / 1024, 512)
            }
            wgpu::DeviceType::VirtualGpu => limits.max_buffer_size / 1024 / 1024,
            wgpu::DeviceType::Cpu => 256,
            _ => limits.max_buffer_size / 1024 / 1024,
        }
    }

    async fn get_gpu_metrics(
        vendor: &GpuVendor,
        _name: &str,
        index: usize,
    ) -> (Option<GpuMetrics>, Option<String>) {
        match vendor {
            GpuVendor::Nvidia => Self::get_nvidia_metrics(index).await,
            GpuVendor::Amd => Self::get_amd_metrics(index).await,
            GpuVendor::Intel => Self::get_intel_metrics(index).await,
            GpuVendor::Apple => Self::get_apple_metrics().await,
            GpuVendor::Unknown => (None, Some("Vendor desconhecido".to_string())),
        }
    }

    // Resto dos métodos de métricas mantidos iguais ao código original...
    async fn get_nvidia_metrics(index: usize) -> (Option<GpuMetrics>, Option<String>) {
        if let Ok(output) = Command::new("nvidia-smi")
            .args(&[
                "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,fan.speed,clocks.gr,clocks.mem",
                "--format=csv,noheader,nounits",
                &format!("--id={}", index)
            ])
            .output()
        {
            if output.status.success() {
                let result = String::from_utf8_lossy(&output.stdout);
                if let Some(metrics) = Self::parse_nvidia_smi_output(&result) {
                    return (Some(metrics), None);
                }
            }
        }

        (
            None,
            Some("NVIDIA GPU encontrada mas nvidia-smi não disponível".to_string()),
        )
    }

    fn parse_nvidia_smi_output(output: &str) -> Option<GpuMetrics> {
        let line = output.trim();
        let parts: Vec<&str> = line.split(", ").collect();

        if parts.len() >= 8 {
            Some(GpuMetrics {
                gpu_usage_percent: parts[0].parse().ok(),
                memory_usage_mb: parts[1].parse().ok(),
                memory_total_mb: parts[2].parse().ok(),
                memory_usage_percent: if let (Ok(used), Ok(total)) =
                    (parts[1].parse::<f32>(), parts[2].parse::<f32>())
                {
                    Some((used / total) * 100.0)
                } else {
                    None
                },
                temperature_c: parts[3].parse().ok(),
                power_usage_watts: parts[4].parse().ok(),
                fan_speed_percent: parts[5].parse().ok(),
                clock_gpu_mhz: parts[6].parse().ok(),
                clock_memory_mhz: parts[7].parse().ok(),
                voltage: None,
            })
        } else {
            None
        }
    }

    async fn get_amd_metrics(_index: usize) -> (Option<GpuMetrics>, Option<String>) {
        (None, Some("AMD metrics não implementado".to_string()))
    }

    async fn get_intel_metrics(_index: usize) -> (Option<GpuMetrics>, Option<String>) {
        (None, Some("Intel metrics não implementado".to_string()))
    }

    async fn get_apple_metrics() -> (Option<GpuMetrics>, Option<String>) {
        (None, Some("Apple metrics não implementado".to_string()))
    }
}

use serde::Serialize;

use std::fs;
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

#[derive(Debug)]
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
    pub async fn get_all_gpu_info() -> Vec<UnifiedGpuInfo> {
        let mut gpu_list = Vec::new();

        // Obter informações básicas via wgpu
        let basic_gpus = Self::get_wgpu_basic_info().await;

        // Para cada GPU, tentar obter métricas específicas
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
            });
        }

        gpu_list
    }

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

    // NVIDIA - Métricas usando nvidia-smi
    async fn get_nvidia_metrics(index: usize) -> (Option<GpuMetrics>, Option<String>) {
        // Tentar nvidia-smi primeiro
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

        // Fallback: NVML se disponível
        #[cfg(feature = "nvml")]
        {
            if let Ok(nvml) = nvml_wrapper::Nvml::init() {
                if let Ok(device) = nvml.device_by_index(index as u32) {
                    return Self::get_nvml_metrics(&device);
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

    // AMD - Métricas usando ROCm SMI ou sysfs
    async fn get_amd_metrics(index: usize) -> (Option<GpuMetrics>, Option<String>) {
        // Tentar rocm-smi primeiro (Linux)
        #[cfg(target_os = "linux")]
        {
            if let Ok(output) = Command::new("rocm-smi")
                .args(&[
                    "--showuse",
                    "--showmeminfo",
                    "--showtemp",
                    "--showpower",
                    "--showclocks",
                    "--json",
                ])
                .output()
            {
                if output.status.success() {
                    let result = String::from_utf8_lossy(&output.stdout);
                    if let Some(metrics) = Self::parse_rocm_smi_json(&result, index) {
                        return (Some(metrics), None);
                    }
                }
            }

            // Fallback: leitura direta do sysfs
            if let Some(metrics) = Self::read_amd_sysfs_metrics(index) {
                return (Some(metrics), None);
            }
        }

        // Windows: usar WMI
        #[cfg(target_os = "windows")]
        {
            if let Some(metrics) = Self::get_amd_wmi_metrics(index) {
                return (Some(metrics), None);
            }
        }

        (
            None,
            Some("AMD GPU encontrada mas ferramentas de monitoramento não disponíveis".to_string()),
        )
    }

    #[cfg(target_os = "linux")]
    fn read_amd_sysfs_metrics(index: usize) -> Option<GpuMetrics> {
        let base_path = format!("/sys/class/drm/card{}/device", index);

        let gpu_usage = Self::read_file_parse::<u32>(&format!("{}/gpu_busy_percent", base_path))
            .map(|v| v as f32);

        let memory_used =
            Self::read_file_parse::<u64>(&format!("{}/mem_info_vram_used", base_path))
                .map(|v| v / 1024 / 1024);
        let memory_total =
            Self::read_file_parse::<u64>(&format!("{}/mem_info_vram_total", base_path))
                .map(|v| v / 1024 / 1024);

        let memory_percent = if let (Some(used), Some(total)) = (memory_used, memory_total) {
            Some((used as f32 / total as f32) * 100.0)
        } else {
            None
        };

        // Temperatura (pode estar em diferentes locais)
        let temperature = Self::find_amd_temperature(&base_path);

        // Power
        let power = Self::find_amd_power(&base_path);

        // Clocks
        let gpu_clock = Self::read_amd_current_clock(&base_path, "pp_dpm_sclk");
        let mem_clock = Self::read_amd_current_clock(&base_path, "pp_dpm_mclk");

        Some(GpuMetrics {
            gpu_usage_percent: gpu_usage,
            memory_usage_mb: memory_used,
            memory_total_mb: memory_total,
            memory_usage_percent: memory_percent,
            temperature_c: temperature,
            power_usage_watts: power,
            fan_speed_percent: None, // Difícil de obter de forma consistente
            clock_gpu_mhz: gpu_clock,
            clock_memory_mhz: mem_clock,
            voltage: None,
        })
    }

    #[cfg(target_os = "linux")]
    fn find_amd_temperature(base_path: &str) -> Option<f32> {
        // Tentar diferentes localizações de temperatura
        let temp_paths = [
            format!("{}/hwmon/hwmon*/temp1_input", base_path),
            format!("{}/hwmon/hwmon*/temp2_input", base_path),
        ];

        for pattern in &temp_paths {
            if let Ok(paths) = glob::glob(pattern) {
                for path in paths {
                    if let Ok(path) = path {
                        if let Some(temp) = Self::read_file_parse::<u32>(path.to_str()?) {
                            return Some(temp as f32 / 1000.0); // miligraus para graus
                        }
                    }
                }
            }
        }
        None
    }

    #[cfg(target_os = "linux")]
    fn find_amd_power(base_path: &str) -> Option<f32> {
        let power_patterns = [
            format!("{}/hwmon/hwmon*/power1_average", base_path),
            format!("{}/hwmon/hwmon*/power1_input", base_path),
        ];

        for pattern in &power_patterns {
            if let Ok(paths) = glob::glob(pattern) {
                for path in paths {
                    if let Ok(path) = path {
                        if let Some(power) = Self::read_file_parse::<u64>(path.to_str()?) {
                            return Some(power as f32 / 1_000_000.0); // microwatts para watts
                        }
                    }
                }
            }
        }
        None
    }

    #[cfg(target_os = "linux")]
    fn read_amd_current_clock(base_path: &str, clock_file: &str) -> Option<u32> {
        let clock_path = format!("{}/{}", base_path, clock_file);
        if let Ok(content) = fs::read_to_string(clock_path) {
            // Formato: "0: 300Mhz\n1: 1500Mhz *\n2: 2000Mhz\n"
            for line in content.lines() {
                if line.contains('*') {
                    if let Some(freq_str) = line.split_whitespace().nth(1) {
                        let freq_clean = freq_str.replace("Mhz", "").replace("MHz", "");
                        if let Ok(freq) = freq_clean.parse::<u32>() {
                            return Some(freq);
                        }
                    }
                }
            }
        }
        None
    }

    fn parse_rocm_smi_json(_json_str: &str, _index: usize) -> Option<GpuMetrics> {
        // Implementar parsing do JSON do ROCm SMI
        // Formato complexo, seria necessário usar serde_json
        None // Placeholder - implementar se ROCm SMI estiver disponível
    }

    // Intel - Métricas usando intel_gpu_top ou sysfs
    async fn get_intel_metrics(index: usize) -> (Option<GpuMetrics>, Option<String>) {
        #[cfg(target_os = "linux")]
        {
            // Tentar intel_gpu_top
            if let Ok(output) = Command::new("intel_gpu_top")
                .args(&["-s", "1000", "-n", "1", "-J"]) // 1 amostra, JSON
                .output()
            {
                if output.status.success() {
                    let result = String::from_utf8_lossy(&output.stdout);
                    if let Some(metrics) = Self::parse_intel_gpu_top_json(&result) {
                        return (Some(metrics), None);
                    }
                }
            }

            // Fallback: ler sysfs
            if let Some(metrics) = Self::read_intel_sysfs_metrics(index) {
                return (Some(metrics), None);
            }
        }

        #[cfg(target_os = "windows")]
        {
            if let Some(metrics) = Self::get_intel_wmi_metrics(index) {
                return (Some(metrics), None);
            }
        }

        (
            None,
            Some(
                "Intel GPU encontrada mas ferramentas de monitoramento não disponíveis".to_string(),
            ),
        )
    }

    #[cfg(target_os = "linux")]
    fn read_intel_sysfs_metrics(index: usize) -> Option<GpuMetrics> {
        let base_paths = [
            format!("/sys/class/drm/card{}", index),
            format!("/sys/class/drm/card{}/gt/gt0", index),
        ];

        for base_path in &base_paths {
            // Frequência atual
            let current_freq =
                Self::read_file_parse::<u32>(&format!("{}/gt_cur_freq_mhz", base_path));

            if current_freq.is_some() {
                return Some(GpuMetrics {
                    gpu_usage_percent: None, // Difícil de obter para Intel
                    memory_usage_mb: None,
                    memory_total_mb: None,
                    memory_usage_percent: None,
                    temperature_c: None,
                    power_usage_watts: None,
                    fan_speed_percent: None,
                    clock_gpu_mhz: current_freq,
                    clock_memory_mhz: None,
                    voltage: None,
                });
            }
        }

        None
    }

    fn parse_intel_gpu_top_json(_json_str: &str) -> Option<GpuMetrics> {
        // Implementar parsing do JSON do intel_gpu_top
        // Formato: {"engines": {"Render/3D": {"busy": 45.2}}}
        None // Placeholder
    }

    // Apple Silicon - Métricas usando powermetrics
    async fn get_apple_metrics() -> (Option<GpuMetrics>, Option<String>) {
        #[cfg(target_os = "macos")]
        {
            if let Ok(output) = Command::new("powermetrics")
                .args(&["--samplers", "gpu_power", "-n", "1", "--show-process-gpu"])
                .output()
            {
                if output.status.success() {
                    let result = String::from_utf8_lossy(&output.stdout);
                    if let Some(metrics) = Self::parse_apple_powermetrics(&result) {
                        return (Some(metrics), None);
                    }
                }
            }
        }

        (
            None,
            Some("Apple GPU encontrada mas powermetrics não disponível".to_string()),
        )
    }

    #[cfg(target_os = "macos")]
    fn parse_apple_powermetrics(output: &str) -> Option<GpuMetrics> {
        // Parse da saída do powermetrics
        // Buscar por linhas como "GPU Power: 1234 mW"
        for line in output.lines() {
            if line.contains("GPU Power:") {
                if let Some(power_str) = line.split_whitespace().nth(2) {
                    if let Ok(power_mw) = power_str.parse::<f32>() {
                        return Some(GpuMetrics {
                            gpu_usage_percent: None,
                            memory_usage_mb: None,
                            memory_total_mb: None,
                            memory_usage_percent: None,
                            temperature_c: None,
                            power_usage_watts: Some(power_mw / 1000.0),
                            fan_speed_percent: None,
                            clock_gpu_mhz: None,
                            clock_memory_mhz: None,
                            voltage: None,
                        });
                    }
                }
            }
        }
        None
    }

    // Windows WMI fallbacks
    #[cfg(target_os = "windows")]
    fn get_amd_wmi_metrics(index: usize) -> Option<GpuMetrics> {
        // Implementar WMI queries para AMD
        None
    }

    #[cfg(target_os = "windows")]
    fn get_intel_wmi_metrics(index: usize) -> Option<GpuMetrics> {
        // Implementar WMI queries para Intel
        None
    }

    // Utilitários
    fn read_file_parse<T: std::str::FromStr>(path: &str) -> Option<T> {
        fs::read_to_string(path).ok()?.trim().parse().ok()
    }

    // pub async fn monitor_continuously(
    //     interval_seconds: u64,
    //     duration_seconds: u64,
    // ) -> Vec<Vec<UnifiedGpuInfo>> {
    //     let mut samples = Vec::new();
    //     let iterations = duration_seconds / interval_seconds;

    //     for i in 0..iterations {
    //         println!("Coletando amostra {} de {}...", i + 1, iterations);
    //         let sample = Self::get_all_gpu_info().await;
    //         samples.push(sample);

    //         if i < iterations - 1 {
    //             tokio::time::sleep(tokio::time::Duration::from_secs(interval_seconds)).await;
    //         }
    //     }

    //     samples
    // }
}

// // Exemplo de uso
// #[tokio::main]
// async fn main() {
//     println!("🔍 Coletando informações detalhadas das GPUs...\n");

//     let gpus = GpuMonitor::get_all_gpu_info().await;

//     for (i, gpu) in gpus.iter().enumerate() {
//         println!("🎮 GPU {}: {}", i + 1, gpu.name);
//         println!("   Vendor: {:?}", gpu.vendor);
//         println!("   Tipo: {}", gpu.device_type);
//         println!("   Backend: {}", gpu.backend);

//         println!("   📊 Informações Básicas:");
//         println!("      Buffer Máximo: {} MB", gpu.basic_info.max_buffer_size_mb);
//         println!("      Memória Estimada: {} MB", gpu.basic_info.estimated_memory_mb);
//         println!("      Suporte Compute: {}", gpu.basic_info.supports_compute);
//         println!("      Suporte Timestamp: {}", gpu.basic_info.supports_timestamp);

//         if let Some(metrics) = &gpu.metrics {
//             println!("   🔥 Métricas de Uso:");
//             if let Some(usage) = metrics.gpu_usage_percent {
//                 println!("      Uso GPU: {:.1}%", usage);
//             }
//             if let Some(mem_used) = metrics.memory_usage_mb {
//                 println!("      Memória Usada: {} MB", mem_used);
//             }
//             if let Some(mem_total) = metrics.memory_total_mb {
//                 println!("      Memória Total: {} MB", mem_total);
//             }
//             if let Some(mem_percent) = metrics.memory_usage_percent {
//                 println!("      Uso Memória: {:.1}%", mem_percent);
//             }
//             if let Some(temp) = metrics.temperature_c {
//                 println!("      Temperatura: {:.1}°C", temp);
//             }
//             if let Some(power) = metrics.power_usage_watts {
//                 println!("      Consumo: {:.1}W", power);
//             }
//             if let Some(fan) = metrics.fan_speed_percent {
//                 println!("      Ventilador: {:.0}%", fan);
//             }
//             if let Some(clock) = metrics.clock_gpu_mhz {
//                 println!("      Clock GPU: {} MHz", clock);
//             }
//             if let Some(mem_clock) = metrics.clock_memory_mhz {
//                 println!("      Clock Memória: {} MHz", mem_clock);
//             }
//         } else if let Some(error) = &gpu.error {
//             println!("   ⚠️  Erro: {}", error);
//         }

//         println!("   {}", "─".repeat(50));
//     }

//     // Exemplo de monitoramento contínuo
//     println!("\n🕐 Iniciando monitoramento por 30 segundos (amostras a cada 5s)...");
//     let samples = GpuMonitor::monitor_continuously(5, 30).await;

//     println!("\n📈 Resumo do Monitoramento:");
//     for (sample_idx, sample) in samples.iter().enumerate() {
//         println!("Amostra {} ({}s):", sample_idx + 1, sample_idx * 5);
//         for gpu in sample {
//             if let Some(metrics) = &gpu.metrics {
//                 print!("  {}: ", gpu.name);
//                 if let Some(usage) = metrics.gpu_usage_percent {
//                     print!("GPU: {:.1}% ", usage);
//                 }
//                 if let Some(temp) = metrics.temperature_c {
//                     print!("Temp: {:.1}°C ", temp);
//                 }
//                 if let Some(power) = metrics.power_usage_watts {
//                     print!("Power: {:.1}W", power);
//                 }
//                 println!();
//             }
//         }
//     }
// }

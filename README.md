# System Monitor App

Um monitor de sistema em tempo real construído com Tauri, React e TypeScript. Esta aplicação fornece uma interface moderna e elegante para monitoramento de métricas do sistema, incluindo CPU, memória, disco e rede.

## 📋 Funcionalidades

- **Monitoramento de CPU**: Uso por núcleo e geral
- **Monitoramento de Memória**: RAM e Swap utilizadas
- **Monitoramento de Disco**: Espaço usado e disponível
- **Monitoramento de Rede**: Bytes enviados e recebidos
- **Informações do Sistema**: OS, hostname, uptime e processos
- **Interface em Tempo Real**: Atualização automática a cada segundo
- **Interface Moderna**: UI responsiva com tema escuro
- **Multi-plataforma**: Funciona em Windows, Linux e macOS

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca para interface do usuário
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **React Google Charts** - Gráficos e visualizações
- **React Icons** - Ícones
- **Vite** - Build tool e dev server

### Backend
- **Tauri 2.0** - Framework para aplicações desktop
- **Rust** - Linguagem para o backend
- **sysinfo** - Coleta de métricas do sistema
- **tokio** - Runtime assíncrono
- **serde** - Serialização/deserialização

## 📦 Pré-requisitos

Antes de executar o projeto, certifique-se de ter instalado:

### Desenvolvimento
- **Deno** (versão 1.40 ou superior)
- **npm** (para gerenciamento de pacotes via Deno)
- **Rust** (versão estável mais recente)
- **Tauri CLI**

### Sistema Operacional
- **Windows**: Windows 10 ou superior
- **Linux**: Distribuições modernas com GTK 3
- **macOS**: macOS 10.15 ou superior

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd system-monitor-app
```

### 2. Instale as dependências
```bash
deno install
```

### 3. Execute em modo de desenvolvimento
```bash
deno task tauri dev
```

### 4. Build para produção
```bash
deno task tauri build
```

## 📱 Como Usar

1. **Inicie a aplicação** executando `deno task tauri dev`
2. **Interface Principal**: A aplicação abrirá uma janela com métricas em tempo real
3. **Navegação**: Use os botões da barra de título para minimizar ou fechar
4. **Métricas Exibidas**:
   - **CPU**: Gráficos de uso por núcleo
   - **Memória**: Uso de RAM e Swap
   - **Disco**: Espaço utilizado por partição
   - **Rede**: Tráfego de entrada e saída
   - **Sistema**: Informações gerais do OS

## 🎯 Scripts Disponíveis

```bash
# Desenvolvimento
deno task dev          # Inicia o servidor Vite
deno task tauri dev    # Inicia a aplicação Tauri em desenvolvimento

# Build
deno task build        # Build do frontend
deno task tauri build  # Build completo da aplicação

# Preview
deno task preview      # Preview da build web
```

## 🔧 Configuração

### Tauri
A configuração do Tauri está em `src-tauri/tauri.conf.json`. Principais configurações:
- Permissões de janela
- Ícones da aplicação
- Configurações de build

### Frontend
- **Vite Config**: `vite.config.ts`
- **TypeScript**: `tsconfig.json`
- **Tailwind**: `tailwind.config.ts`

## 📊 Estrutura do Projeto

```
system-monitor-app/
├── src/                    # Frontend React
│   ├── components/         # Componentes React
│   │   ├── cpu/           # Componente CPU
│   │   ├── memory/        # Componente Memória
│   │   ├── disk/          # Componente Disco
│   │   ├── network/       # Componente Rede
│   │   └── system/        # Componente Sistema
│   ├── App.tsx            # Componente principal
│   ├── interfaces.ts      # Tipos TypeScript
│   └── main.tsx          # Entrada da aplicação
├── src-tauri/             # Backend Rust
│   ├── src/
│   │   ├── main.rs       # Entrada principal
│   │   ├── monitor.rs    # Lógica de monitoramento
│   │   └── monitor_gpu.rs # Monitor GPU (experimental)
│   ├── Cargo.toml        # Dependências Rust
│   └── tauri.conf.json   # Configuração Tauri
└── public/               # Arquivos estáticos
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🐛 Problemas Conhecidos

- Monitor de GPU está desabilitado no código atual (experimental)
- Requer permissões do sistema em algumas distribuições Linux

## 📞 Suporte

Se você encontrar algum problema ou tiver sugestões, por favor:
1. Verifique as issues existentes
2. Crie uma nova issue com detalhes do problema
3. Inclua informações sobre seu sistema operacional e versão

---

**Desenvolvido usando Tauri + React + TypeScript**

import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [trayNumber, setTrayNumber] = useState(0);
  const [currentTrayNumber, setCurrentTrayNumber] = useState(0);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  // Função para gerar ícone com número usando Canvas
  function generateNumberIcon(number: number): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d')!;
      
      // Fundo com gradiente sutil
      const gradient = ctx.createLinearGradient(0, 0, 32, 32);
      gradient.addColorStop(0, '#4a4a4a');
      gradient.addColorStop(1, '#2a2a2a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
      
      // Borda arredondada
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, 30, 30);
      
      // Texto do número
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Limitar o número a 3 dígitos para caber no ícone
      const displayNumber = number > 999 ? '999+' : number.toString();
      
      // Ajustar tamanho da fonte se necessário
      if (displayNumber.length > 2) {
        ctx.font = 'bold 14px Arial, sans-serif';
      }
      
      ctx.fillText(displayNumber, 16, 16);
      
      // Converter para ImageData e extrair bytes RGBA
      const imageData = ctx.getImageData(0, 0, 32, 32);
      resolve(new Uint8Array(imageData.data));
    });
  }

  async function updateTrayNumber() {
    try {
      // Atualizar o estado no backend
      await invoke("update_tray_number", { number: trayNumber });
      // Atualizar o estado local (que vai automaticamente atualizar o ícone via useEffect)
      setCurrentTrayNumber(trayNumber);
    } catch (error) {
      console.error("Erro ao atualizar número do tray:", error);
    }
  }

  async function getCurrentTrayNumber() {
    try {
      const number = await invoke("get_tray_number") as number;
      setCurrentTrayNumber(number);
      setTrayNumber(number);
    } catch (error) {
      console.error("Erro ao buscar número do tray:", error);
    }
  }

  // Inicializar ícone quando o componente montar
  useEffect(() => {
    const initializeIcon = async () => {
      await getCurrentTrayNumber();
      // Gerar ícone inicial com o número carregado
      const iconData = await generateNumberIcon(currentTrayNumber);
      try {
        await invoke("update_tray_icon", { iconData: Array.from(iconData) });
      } catch (error) {
        console.error("Erro ao inicializar ícone:", error);
      }
    };
    
    initializeIcon();
  }, []);

  // Atualizar ícone quando currentTrayNumber mudar
  useEffect(() => {
    const updateIcon = async () => {
      if (currentTrayNumber !== undefined) {
        const iconData = await generateNumberIcon(currentTrayNumber);
        try {
          await invoke("update_tray_icon", { iconData: Array.from(iconData) });
        } catch (error) {
          console.error("Erro ao atualizar ícone:", error);
        }
      }
    };
    
    updateIcon();
  }, [currentTrayNumber]);

  return (
    <main className="container">
      <h1>System Monitor App</h1>

      <div className="card">
        <h2>Controle do Ícone do Tray</h2>
        <p>Número atual no tray: <strong>{currentTrayNumber}</strong></p>
        
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            updateTrayNumber();
          }}
        >
          <input
            type="number"
            value={trayNumber}
            onChange={(e) => setTrayNumber(parseInt(e.currentTarget.value) || 0)}
            placeholder="Digite um número"
            min="0"
            max="999"
          />
          <button type="submit">Atualizar Ícone</button>
        </form>
        
        <p className="info">
          O ícone mostra o número digitado (até 999).
          <br />
          Números maiores que 999 aparecerão como "999+".
        </p>
      </div>

      <div className="card">
        <h2>Teste de Saudação</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            greet();
          }}
        >
          <input
            id="greet-input"
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Digite um nome"
            value={name}
          />
          <button type="submit">Cumprimentar</button>
        </form>
        <p>{greetMsg}</p>
      </div>
    </main>
  );
}

export default App;

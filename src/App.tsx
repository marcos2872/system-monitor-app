import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [trayText, setTrayText] = useState("CPU-0%");
  const [currentTrayText, setCurrentTrayText] = useState("CPU-0%");
  const [textColor, setTextColor] = useState("#000000"); // Preto por padrão

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  // Função para gerar ícone com texto curto
  function generateTextIcon(text: string, color: string = textColor): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;

      // Limpar com transparente
      ctx.clearRect(0, 0, 64, 64);

      // Pegar apenas 3 caracteres para fonte ainda maior
      const shortText = text.substring(0, 3);
      
      console.log('Desenhando texto:', shortText, 'do original:', text, 'cor:', textColor);

      // Fonte MUITO maior
      ctx.fillStyle = color;
      ctx.font = 'bold 32px monospace'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Desenhar o texto centralizado
      ctx.fillText(shortText, 32, 32);

      const imageData = ctx.getImageData(0, 0, 64, 64);
      console.log('Texto renderizado:', shortText);
      
      resolve(new Uint8Array(imageData.data));
    });
  }

  async function updateTrayText() {
    try {
      // Gerar o ícone com o novo texto
      const iconData = await generateTextIcon(trayText, textColor);
      
      // Atualizar o estado no backend
      await invoke("update_tray_text", { text: trayText });
      
      // Atualizar o ícone
      await invoke("update_tray_icon", { iconData: Array.from(iconData) });
      
      // Atualizar o estado local
      setCurrentTrayText(trayText);
      
      console.log('Texto atualizado com sucesso:', trayText);
    } catch (error) {
      console.error("Erro ao atualizar texto do tray:", error);
    }
  }

  async function getCurrentTrayText() {
    try {
      const text = await invoke("get_tray_text") as string;
      setCurrentTrayText(text);
      setTrayText(text);
    } catch (error) {
      console.error("Erro ao buscar texto do tray:", error);
    }
  }


  // Inicializar ícone quando o componente montar
  useEffect(() => {
    const initializeIcon = async () => {
      await getCurrentTrayText();
      // Gerar ícone inicial com o texto carregado
      const iconData = await generateTextIcon(currentTrayText, textColor);
      try {
        await invoke("update_tray_icon", { iconData: Array.from(iconData) });
      } catch (error) {
        console.error("Erro ao inicializar ícone:", error);
      }
    };

    initializeIcon();
  }, []);

  // Atualizar ícone quando currentTrayText mudar
  useEffect(() => {
    const updateIcon = async () => {
      if (currentTrayText !== undefined && currentTrayText !== '') {
        const iconData = await generateTextIcon(currentTrayText, textColor);
        try {
          await invoke("update_tray_icon", { iconData: Array.from(iconData) });
        } catch (error) {
          console.error("Erro ao atualizar ícone:", error);
        }
      }
    };

    updateIcon();
  }, [currentTrayText]);

  return (
    <main className="container">
      <h1>System Monitor App</h1>

      <div className="card">
        <h2>Controle do Ícone do Tray</h2>
        <p>Texto atual no tray: <strong>{currentTrayText}</strong></p>

        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            updateTrayText();
          }}
        >
          <input
            type="text"
            value={trayText}
            onChange={(e) => setTrayText(e.currentTarget.value)}
            placeholder="Ex: CPU-13% MEM-23GB"
            maxLength={50}
            style={{ minWidth: '250px' }}
          />
          <button type="submit">Atualizar Ícone</button>
        </form>

        <div className="color-controls">
          <label>Cor do texto:</label>
          <div className="color-options">
            <button 
              type="button"
              className={`color-btn ${textColor === '#000000' ? 'active' : ''}`}
              onClick={() => setTextColor('#000000')}
              style={{ backgroundColor: '#000000' }}
            >
              Preto
            </button>
            <button 
              type="button"
              className={`color-btn ${textColor === '#ffffff' ? 'active' : ''}`}
              onClick={() => setTextColor('#ffffff')}
              style={{ backgroundColor: '#ffffff', color: '#000' }}
            >
              Branco
            </button>
            <button 
              type="button"
              className={`color-btn ${textColor === '#ff0000' ? 'active' : ''}`}
              onClick={() => setTextColor('#ff0000')}
              style={{ backgroundColor: '#ff0000' }}
            >
              Vermelho
            </button>
          </div>
        </div>


        <div className="examples">
          <p className="info">
            <strong>Exemplos de textos:</strong><br />
            • CPU-13% MEM-23GB<br />
            • Server Online<br />
            • 42 Users Connected<br />
            • Temp: 45°C Fan: 80%<br />
          </p>
          <p className="info">
            ✨ <strong>ÍCONE COM TEXTO GRANDE:</strong> Fundo branco, texto preto<br />
            📐 Ícone 128x128px para máxima legibilidade<br />
            🔤 Fonte grande (24px linha única, 18px duas linhas)<br />
            📝 Até 2 linhas com ~10 caracteres cada<br />
            💡 Digite "CPU 45%" ou "MEM 8GB" e clique "Atualizar Ícone"
          </p>
        </div>
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

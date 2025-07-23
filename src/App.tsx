import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [trayText, setTrayText] = useState("CPU-0%");
  const [currentTrayText, setCurrentTrayText] = useState("CPU-0%");
  const [textColor, setTextColor] = useState("#ffffff");

  // Função para gerar ícone com texto
  function generateTextIcon(
    text: string,
    color: string = textColor,
  ): Promise<Uint8Array> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext("2d")!;

      // Limpar com transparente
      ctx.clearRect(0, 0, 256, 64);

      console.log("Desenhando texto:", text, "cor:", textColor);

      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Calcular tamanho da fonte baseado no comprimento do texto
      let fontSize = 32;
      ctx.font = `${fontSize}px monospace`;

      // Ajustar fonte dinamicamente para caber no canvas com mínimo de 20px
      let textWidth = ctx.measureText(text).width;
      const maxWidth = 248; // Deixar margem de 4px de cada lado

      while (textWidth > maxWidth && fontSize > 20) {
        fontSize -= 2;
        ctx.font = `bold ${fontSize}px monospace`;
        textWidth = ctx.measureText(text).width;
      }

      // Desenhar o texto centralizado
      ctx.fillText(text, 128, 32);

      const imageData = ctx.getImageData(0, 0, 256, 64);
      console.log("Texto renderizado:", text, "com fonte:", fontSize + "px");

      resolve(new Uint8Array(imageData.data));
    });
  }

  async function updateTrayText() {
    try {
      // Gerar o ícone com o novo texto
      const iconData = await generateTextIcon(trayText, textColor);

      // Atualizar o estado no backend
      await invoke("update_tray_text", { text: trayText });

      // Atualizar o ícone com dimensões fixas
      await invoke("update_tray_icon", {
        iconData: Array.from(iconData),
        width: 256,
        height: 64,
      });

      // Atualizar o estado local
      setCurrentTrayText(trayText);

      console.log("Texto atualizado com sucesso:", trayText);
    } catch (error) {
      console.error("Erro ao atualizar texto do tray:", error);
    }
  }

  async function getCurrentTrayText() {
    try {
      const text = (await invoke("get_tray_text")) as string;
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
        await invoke("update_tray_icon", {
          iconData: Array.from(iconData),
          width: 256,
          height: 64,
        });
      } catch (error) {
        console.error("Erro ao inicializar ícone:", error);
      }
    };

    initializeIcon();
  }, []);

  // Atualizar ícone quando currentTrayText mudar
  useEffect(() => {
    const updateIcon = async () => {
      if (currentTrayText !== undefined && currentTrayText !== "") {
        const iconData = await generateTextIcon(currentTrayText, textColor);

        try {
          await invoke("update_tray_icon", {
            iconData: Array.from(iconData),
            width: 256,
            height: 64,
          });
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
        <p>
          Texto atual no tray: <strong>{currentTrayText}</strong>
        </p>

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
            style={{ minWidth: "250px" }}
          />
          <button type="submit">Atualizar Ícone</button>
        </form>

        <div className="color-controls">
          <label>Cor do texto:</label>
          <div className="color-options">
            <button
              type="button"
              className={`color-btn ${textColor === "#000000" ? "active" : ""}`}
              onClick={() => setTextColor("#000000")}
              style={{ backgroundColor: "#000000" }}
            >
              Preto
            </button>
            <button
              type="button"
              className={`color-btn ${textColor === "#ffffff" ? "active" : ""}`}
              onClick={() => setTextColor("#ffffff")}
              style={{ backgroundColor: "#ffffff", color: "#000" }}
            >
              Branco
            </button>
            <button
              type="button"
              className={`color-btn ${textColor === "#ff0000" ? "active" : ""}`}
              onClick={() => setTextColor("#ff0000")}
              style={{ backgroundColor: "#ff0000" }}
            >
              Vermelho
            </button>
          </div>
        </div>

        <div className="examples">
          <p className="info">
            <strong>Exemplos de textos:</strong>
            <br />
            • CPU-13% MEM-23GB
            <br />
            • Server Online Status OK
            <br />
            • 42 Users Connected Now
            <br />
            • Temperature: 45°C Fan: 80%
            <br />
          </p>
          <p className="info">
            ✨ <strong>ÍCONE COM TEXTO:</strong> Fundo transparente, texto
            colorido
            <br />
            📐 Ícone 256x64px (tamanho fixo otimizado)
            <br />
            🔤 Fonte dinâmica (bold monospace adaptável)
            <br />
            📝 Fonte mínima 20px (máxima legibilidade)
            <br />
            💡 Digite "CPU-13" ou "MEM8GB" e escolha a cor do texto
          </p>
        </div>
      </div>
    </main>
  );
}

export default App;

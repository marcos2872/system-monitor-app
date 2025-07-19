import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { SystemMetrics } from "./interfaces";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [test, setTest] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function monitor() {
    const monit: SystemMetrics = await invoke("monitor_sys");
    setTest(`${monit.cpu.usage_percent} ${monit.memory.usage_percent}`);
  }

  // useEffect(() => {
  //   monitor();
  // }, []);
  // monitor();
  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
          monitor();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => {
            setName(e.currentTarget.value);
          }}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>
      <p>{test}</p>
    </main>
  );
}

export default App;

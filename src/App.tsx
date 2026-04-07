import { useState } from "react";
import IntroView from "./views/IntroView";
import DiagnosticView from "./views/DiagnosticView";

type Stage = "intro" | "tool";

export default function App() {
  const [stage, setStage] = useState<Stage>("intro");

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <a href="https://www.cloudpedagogy.com/" target="_blank" rel="noopener noreferrer" className="brand__title">
            CloudPedagogy
          </a>
          <div className="brand__subtitle">Scenario Stress-Test</div>
        </div>
        <nav className="nav">
          <button className="link" onClick={() => setStage("intro")}>
            Restart
          </button>
        </nav>
      </header>

      <main className="main">
        {stage === "intro" ? (
          <IntroView onStart={() => setStage("tool")} />
        ) : (
          <DiagnosticView onRestart={() => setStage("intro")} />
        )}
      </main>

      <footer className="footer">
        <div className="fineprint">
          CloudPedagogy &middot; Governance-ready AI and curriculum systems
        </div>
      </footer>
    </div>
  );
}

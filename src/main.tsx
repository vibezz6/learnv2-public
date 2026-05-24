import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initTheme } from "./stores/preferences";
import { registerAppServiceWorker } from "./lib/serviceWorker";
import "./index.css";

initTheme();
registerAppServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

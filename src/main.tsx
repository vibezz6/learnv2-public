import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initTheme } from "./stores/preferences";
import { wireDataSyncEvents } from "./lib/dataSync";
import { runStoragePrune } from "./lib/storagePrune";
import { registerAppServiceWorker } from "./lib/serviceWorker";
import "./index.css";

initTheme();
wireDataSyncEvents();
runStoragePrune();
registerAppServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

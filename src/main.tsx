import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initTheme } from "./stores/preferences";
import { wireDataSyncEvents } from "./lib/dataSync";
import { runStoragePrune } from "./lib/storagePrune";
import { registerAppServiceWorker } from "./lib/serviceWorker";
import { initStudyStreakSync } from "./lib/studyStreakSync";
import { initReminders } from "./lib/reminders";
import "./index.css";

initTheme();
wireDataSyncEvents();
runStoragePrune();
initStudyStreakSync();
initReminders();
registerAppServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

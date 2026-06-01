type UpdateListener = () => void;

let registration: ServiceWorkerRegistration | null = null;
let updateListener: UpdateListener | null = null;

export function onServiceWorkerUpdate(listener: UpdateListener): () => void {
  updateListener = listener;
  return () => {
    if (updateListener === listener) updateListener = null;
  };
}

export function applyServiceWorkerUpdate(): void {
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
}

export function registerAppServiceWorker(): void {
  if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`.replace(/\/+/g, "/"))
      .then((reg) => {
        registration = reg;

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller &&
              updateListener
            ) {
              updateListener();
            }
          });
        });

        if (reg.waiting && navigator.serviceWorker.controller && updateListener) {
          updateListener();
        }
      })
      .catch(() => {
        // optional offline shell
      });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import SharedGainPage from "./components/SharedGainPage";
import { configureOwlbearAction, waitForOwlbearReady } from "./owlbear";

async function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const isGainModalView = params.get("view") === "gain-modal";

  if (isGainModalView) {
    ReactDOM.createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <SharedGainPage />
      </React.StrictMode>
    );
    return;
  }

  try {
    await waitForOwlbearReady();
    await configureOwlbearAction();
  } catch (error) {
    console.error("Initialisation Owlbear impossible :", error);
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
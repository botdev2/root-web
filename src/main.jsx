import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppStateProvider } from "./AppState.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </StrictMode>,
);

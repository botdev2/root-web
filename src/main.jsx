import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { AppStateProvider } from "./AppState.jsx";
import { queryClient, wagmiConfig } from "./web3/config.js";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { parseAuthenticatorId, parsePublicId } from "./version.js";

const root = createRoot(document.getElementById("root"));

// /tv (or ?tv) is the 24/7 episode channel for OBS. It needs no wallet or app state.
const isTV = /^\/tv\/?$/.test(window.location.pathname) || new URLSearchParams(window.location.search).has("tv");
const authenticatorId = parseAuthenticatorId();
const publicId = parsePublicId();

if (isTV) {
  import("./tv/TV.jsx").then(({ default: TV }) => {
    root.render(
      <StrictMode>
        <TV />
      </StrictMode>,
    );
  });
} else if (authenticatorId) {
  Promise.all([
    import("@tanstack/react-query"),
    import("wagmi"),
    import("./web3/config.js"),
    import("./components/PalmSealPage.jsx"),
  ]).then(([query, wagmi, web3, page]) => {
    const { QueryClientProvider } = query;
    const { WagmiProvider } = wagmi;
    const PalmSealPage = page.default;
    root.render(
      <StrictMode>
        <WagmiProvider config={web3.wagmiConfig}>
          <QueryClientProvider client={web3.queryClient}>
            <PalmSealPage />
          </QueryClientProvider>
        </WagmiProvider>
      </StrictMode>,
    );
  });
} else if (publicId) {
  import("./components/PalmIdPage.jsx").then(({ default: PalmIdPage }) => {
    root.render(
      <StrictMode>
        <PalmIdPage />
      </StrictMode>,
    );
  });
} else {
  Promise.all([
    import("@tanstack/react-query"),
    import("wagmi"),
    import("./AppState.jsx"),
    import("./web3/config.js"),
    import("./layout.jsx"),
    import("./App.jsx"),
  ]).then(([query, wagmi, state, web3, layout, app]) => {
    const { QueryClientProvider } = query;
    const { WagmiProvider } = wagmi;
    const { AppStateProvider } = state;
    const { LayoutProvider } = layout;
    const App = app.default;
    root.render(
      <StrictMode>
        <WagmiProvider config={web3.wagmiConfig}>
          <QueryClientProvider client={web3.queryClient}>
            <AppStateProvider>
              <LayoutProvider>
                <App />
              </LayoutProvider>
            </AppStateProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </StrictMode>,
    );
  });
}

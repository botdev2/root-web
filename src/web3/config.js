import { QueryClient } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet } from "@reown/appkit/networks";
import { fallback, http } from "viem";

export const REOWN_PROJECT_ID = "fba13dd09a60d41ad9c524c465aa2ab1";
const RPC_ENDPOINTS = ["https://0xrpc.io/eth"];

const projectId = REOWN_PROJECT_ID;
export const networks = [mainnet];

const customRpcUrls = {
  "eip155:1": RPC_ENDPOINTS.map((url) => ({ url })),
};

const publicMainnetTransport = fallback(RPC_ENDPOINTS.map((url) => http(url)));

const metadata = {
  name: "/root",
  description: "Local AI harness on the web",
  url: typeof window !== "undefined" ? window.location.origin : "https://useroot.sh",
  icons: [typeof window !== "undefined" ? `${window.location.origin}/palm.png` : "https://useroot.sh/palm.png"],
};

export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  customRpcUrls,
  transports: {
    [mainnet.id]: publicMainnetTransport,
  },
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  customRpcUrls,
  themeMode: "dark",
  features: {
    analytics: false,
    onramp: true,
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
export const queryClient = new QueryClient();

export function shortenAddress(address) {
  if (!address) return "";
  return address.slice(0, 6) + "…" + address.slice(-4);
}

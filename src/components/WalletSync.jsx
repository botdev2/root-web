import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useAppState } from "../AppState.jsx";
import { shortenAddress } from "../web3/config.js";

export default function WalletSync() {
  const { address, isConnected } = useAccount();
  const { signIn, signOut, session } = useAppState();

  useEffect(() => {
    if (isConnected && address) {
      if (session?.address !== address) {
        signIn({ name: shortenAddress(address), source: "wallet", address });
      }
      return;
    }
    if (session?.source === "wallet") {
      signOut();
    }
  }, [address, isConnected, session, signIn, signOut]);

  return null;
}

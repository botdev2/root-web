import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { shortenAddress } from "../web3/config.js";

export default function WalletButton({ className = "" }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => open({ view: "Account" })}
        className={`h-[30px] shrink-0 rounded-full border border-[var(--stroke)] px-3 text-[12.5px] text-[var(--ink)] hover:bg-[var(--hover)] ${className}`}
      >
        {shortenAddress(address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open({ view: "Connect" })}
        className={`h-[30px] shrink-0 rounded-full bg-[var(--accent)] px-3.5 text-[12.5px] text-[var(--bg)] hover:opacity-90 ${className}`}
    >
      Connect wallet
    </button>
  );
}

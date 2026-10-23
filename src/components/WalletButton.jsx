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
        className={`h-[30px] rounded-lg px-2.5 text-[12.5px] text-[var(--ink)] hover:bg-[var(--hover)] ${className}`}
      >
        {shortenAddress(address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open({ view: "Connect" })}
      className={`h-[30px] rounded-lg px-2.5 text-[12.5px] text-[var(--ink)] hover:bg-[var(--hover)] ${className}`}
    >
      Connect wallet
    </button>
  );
}

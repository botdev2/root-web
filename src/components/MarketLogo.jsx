import { useState } from "react";
import { logoCandidates } from "../market.js";

export default function MarketLogo({ symbol, src, size = 18, className = "" }) {
  const [failed, setFailed] = useState(0);
  const list = logoCandidates(symbol, src);
  const href = list[failed];
  if (!href) {
    return (
      <span
        className={`market-logo market-logo-fallback ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(8, size * 0.42) }}
      >
        {String(symbol || "?").slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      src={href}
      alt=""
      width={size}
      height={size}
      className={`market-logo ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed((value) => value + 1)}
    />
  );
}

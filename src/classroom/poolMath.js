/**
 * A toy constant-product pool: tokens x ETH = k. Shared by the lesson's drawn
 * curve and the live "buy" slider, so both sit on the same axes.
 */

export const POOL = { tokens: 1000, eth: 10 };
export const POOL_K = POOL.tokens * POOL.eth;

const X0 = 120;
const X1 = 900;
const Y0 = 470;
const E_MIN = 4;
const E_MAX = 20;
const T_MAX = 2500;
const PLOT_H = 340;

export function px(eth) {
  return X0 + ((eth - E_MIN) / (E_MAX - E_MIN)) * (X1 - X0);
}

export function py(tokens) {
  return Y0 - (tokens / T_MAX) * PLOT_H;
}

export function curvePath() {
  const points = [];
  for (let eth = E_MIN; eth <= E_MAX + 0.001; eth += 0.5) {
    points.push(`${Math.round(px(eth) * 10) / 10} ${Math.round(py(POOL_K / eth) * 10) / 10}`);
  }
  return `M${points.join(" L")}`;
}

/** Pay `paid` ETH into the pool and see what comes out. */
export function buy(paid) {
  const eth = POOL.eth + paid;
  const tokens = POOL_K / eth;
  const out = POOL.tokens - tokens;
  const start = POOL.eth / POOL.tokens;
  const spot = eth / tokens;
  const average = out > 0 ? paid / out : start;
  return {
    eth,
    tokens,
    out,
    spotMove: (spot / start - 1) * 100,
    slip: (average / start - 1) * 100,
  };
}

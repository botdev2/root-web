import { createPublicClient, formatEther, formatUnits, http, parseAbi, parseEther, parseUnits } from "viem";
import { mainnet } from "viem/chains";
import { PALM_TOKEN } from "./market.js";

export const UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAb19c2695a2698";
export const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const RPC = "https://0xrpc.io/eth";
const GAS_BUFFER = parseEther("0.003");

const routerAbi = parseAbi([
  "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
  "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)",
  "function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)",
]);

const erc20Abi = parseAbi([
  "function decimals() view returns (uint8)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
]);

const client = createPublicClient({
  chain: mainnet,
  transport: http(RPC),
});

function deadline() {
  return BigInt(Math.floor(Date.now() / 1000) + 1200);
}

export function minOut(amount, slippageBps) {
  const bps = BigInt(Math.max(0, Math.min(500, Number(slippageBps) || 0)));
  return (amount * (10000n - bps)) / 10000n;
}

export async function palmDecimals() {
  return client.readContract({ address: PALM_TOKEN, abi: erc20Abi, functionName: "decimals" });
}

export async function readBalances(address) {
  const account = String(address || "");
  const [eth, palm, decimals] = await Promise.all([
    client.getBalance({ address: account }),
    client.readContract({ address: PALM_TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [account] }),
    palmDecimals(),
  ]);
  return { eth, palm, decimals };
}

export async function quoteBuyPalm(ethAmount) {
  const amountIn = parseEther(String(ethAmount));
  const amounts = await client.readContract({
    address: UNISWAP_V2_ROUTER,
    abi: routerAbi,
    functionName: "getAmountsOut",
    args: [amountIn, [WETH, PALM_TOKEN]],
  });
  return { amountIn, amountOut: amounts[1], path: [WETH, PALM_TOKEN] };
}

export async function quoteSellPalm(palmAmount, decimals = 18) {
  const amountIn = parseUnits(String(palmAmount), decimals);
  const amounts = await client.readContract({
    address: UNISWAP_V2_ROUTER,
    abi: routerAbi,
    functionName: "getAmountsOut",
    args: [amountIn, [PALM_TOKEN, WETH]],
  });
  return { amountIn, amountOut: amounts[1], path: [PALM_TOKEN, WETH] };
}

export async function previewSwap(order) {
  const decimals = await palmDecimals();
  if (order.side === "buy") {
    const quote = await quoteBuyPalm(order.amount);
    return {
      side: "buy",
      inLabel: order.amount + " ETH",
      outLabel: Number(formatUnits(quote.amountOut, decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 }) + " PALM",
      minLabel: Number(formatUnits(minOut(quote.amountOut, order.slippageBps), decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 }) + " PALM",
      quote,
      decimals,
    };
  }
  const quote = await quoteSellPalm(order.amount, decimals);
  return {
    side: "sell",
    inLabel: order.amount + " PALM",
    outLabel: Number(formatEther(quote.amountOut)).toLocaleString(undefined, { maximumFractionDigits: 6 }) + " ETH",
    minLabel: Number(formatEther(minOut(quote.amountOut, order.slippageBps))).toLocaleString(undefined, { maximumFractionDigits: 6 }) + " ETH",
    quote,
    decimals,
  };
}

export async function executeLimit(walletClient, account, order) {
  const owner = String(account || "");
  if (!walletClient) throw new Error("Connect a wallet that can sign on Ethereum.");
  if (!/^0x[a-fA-F0-9]{40}$/.test(owner)) throw new Error("Connect a wallet first.");
  const preview = await previewSwap(order);
  const held = await readBalances(owner);
  if (order.side === "buy") {
    if (held.eth < preview.quote.amountIn + GAS_BUFFER) {
      throw new Error("Not enough ETH for the swap plus gas.");
    }
    const hash = await walletClient.writeContract({
      account: owner,
      chain: mainnet,
      address: UNISWAP_V2_ROUTER,
      abi: routerAbi,
      functionName: "swapExactETHForTokens",
      args: [minOut(preview.quote.amountOut, order.slippageBps), preview.quote.path, owner, deadline()],
      value: preview.quote.amountIn,
    });
    await client.waitForTransactionReceipt({ hash, timeout: 120000 });
    return { hash, preview };
  }
  if (held.palm < preview.quote.amountIn) throw new Error("Not enough PALM in this wallet.");
  const allowance = await client.readContract({
    address: PALM_TOKEN,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, UNISWAP_V2_ROUTER],
  });
  if (allowance < preview.quote.amountIn) {
    const approveHash = await walletClient.writeContract({
      account: owner,
      chain: mainnet,
      address: PALM_TOKEN,
      abi: erc20Abi,
      functionName: "approve",
      args: [UNISWAP_V2_ROUTER, preview.quote.amountIn],
    });
    await client.waitForTransactionReceipt({ hash: approveHash, timeout: 120000 });
  }
  const hash = await walletClient.writeContract({
    account: owner,
    chain: mainnet,
    abi: routerAbi,
    address: UNISWAP_V2_ROUTER,
    functionName: "swapExactTokensForETH",
    args: [preview.quote.amountIn, minOut(preview.quote.amountOut, order.slippageBps), preview.quote.path, owner, deadline()],
  });
  await client.waitForTransactionReceipt({ hash, timeout: 120000 });
  return { hash, preview };
}

export function txUrl(hash) {
  return hash ? "https://etherscan.io/tx/" + hash : "";
}

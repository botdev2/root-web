import { useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import { shortenAddress } from "../../web3/config.js";
import { Page, Card, Tabs, Row, Field, Ghost, Primary, Toggle, Section } from "../ui.jsx";

const TABS = [
  { id: "account", label: "Account" },
  { id: "manager", label: "Account Manager" },
  { id: "skills", label: "Skills" },
  { id: "profile", label: "Profile" },
];

export default function AccountView() {
  const { notice, completeOnboarding, session } = useAppState();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [tab, setTab] = useState("account");
  const [showWallet, setShowWallet] = useState(true);
  const [name, setName] = useState(session?.name || "you");
  const [github, setGithub] = useState("github.com/you");

  return (
    <Page>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "account" && (
        <Card>
          <Row label="Status" value={isConnected ? "Wallet connected" : "Guest — browsing"} />
          <Row label="Source" value={isConnected ? "WalletConnect" : "—"} />
          <Row label="Address" value={address ? shortenAddress(address) : "Not connected"} />
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {isConnected ? (
              <>
                <Primary onClick={() => open({ view: "Account" })}>Wallet</Primary>
                <Ghost
                  onClick={() => {
                    disconnect();
                    notice("Wallet disconnected.");
                  }}
                >
                  Disconnect
                </Ghost>
              </>
            ) : (
              <Primary onClick={() => open({ view: "Connect" })}>Connect wallet</Primary>
            )}
            <Ghost onClick={() => window.open("https://useroot.sh/account", "_blank", "noopener,noreferrer")}>
              useroot.sh/account
            </Ghost>
          </div>
        </Card>
      )}
      {tab === "manager" && (
        <Section title="Wallet">
          <Card>
            <Row label="Show Wallet tab" value="Balances and staking">
              <Toggle on={showWallet} onClick={() => setShowWallet((value) => !value)} />
            </Row>
            {showWallet && (
              <>
                <Row label="Wallet" value={address || "Connect to show address"}>
                  {address && (
                    <Ghost
                      onClick={() => {
                        navigator.clipboard?.writeText(address);
                        notice("Address copied.");
                      }}
                    >
                      Copy address
                    </Ghost>
                  )}
                </Row>
                <Row label="ETH" value="—" />
                <Row label="PALM" value="—" />
              </>
            )}
            <Row label="PALMStaking" value="Stake / withdraw from the wallet tab" />
          </Card>
        </Section>
      )}
      {tab === "skills" && (
        <Card>
          <Row label="Bridged skills" value="3 from Cursor / VS Code" />
          <Row label="Farm" value="Cloud Android phones" />
          <Row label="Ops" value="Anonymous hosting" />
          <div className="px-4 py-3">
            <Ghost
              onClick={() => {
                completeOnboarding("skills");
                notice("Skills bridged.");
              }}
            >
              Re-bridge
            </Ghost>
          </div>
        </Card>
      )}
      {tab === "profile" && (
        <Card className="space-y-3 p-4">
          <Field label="Display name" value={name} onChange={setName} />
          <Field label="GitHub" value={github} onChange={setGithub} />
          <Ghost
            onClick={() => {
              notice("Profile saved.");
            }}
          >
            Save profile
          </Ghost>
        </Card>
      )}
    </Page>
  );
}

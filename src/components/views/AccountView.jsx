import { useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Tabs, Row, Field, Ghost, Primary, Toggle, Section } from "../ui.jsx";

const TABS = [
  { id: "account", label: "Account" },
  { id: "manager", label: "Account Manager" },
  { id: "skills", label: "Skills" },
  { id: "profile", label: "Profile" },
];

const ADDRESS = "0xA19c4e81b2d04f9c7e11b0a4c21";

export default function AccountView() {
  const { notice, completeOnboarding, session, signOut } = useAppState();
  const [tab, setTab] = useState("account");
  const [showWallet, setShowWallet] = useState(false);
  const [name, setName] = useState(session?.name || "you");
  const [github, setGithub] = useState("github.com/you");

  return (
    <Page>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      {tab === "account" && (
        <Card>
          <Row label="Status" value="Root Account · unlocked" />
          <Row label="Source" value={session?.source || "useroot.sh/account"} />
          <Row label="Session" value="HTTPS · useroot.sh" />
          <div className="flex flex-wrap gap-2 px-4 py-3">
            <Primary onClick={() => window.open("https://useroot.sh/account", "_blank", "noopener,noreferrer")}>
              Manage on useroot.sh
            </Primary>
            <Ghost
              onClick={() => {
                signOut();
                notice("Signed out.");
              }}
            >
              Sign out
            </Ghost>
          </div>
        </Card>
      )}
      {tab === "manager" && (
        <Section title="Optional">
          <Card>
            <Row label="Show Wallet tab" value="Hidden by default">
              <Toggle on={showWallet} onClick={() => setShowWallet((value) => !value)} />
            </Row>
            {showWallet && (
              <>
                <Row label="Wallet" value={ADDRESS}>
                  <Ghost
                    onClick={() => {
                      navigator.clipboard?.writeText(ADDRESS);
                      notice("Address copied.");
                    }}
                  >
                    Copy address
                  </Ghost>
                </Row>
                <Row label="ETH" value="0.00" />
                <Row label="PALM" value="0.00" />
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

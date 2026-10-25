import { useEffect, useState } from "react";
import { useAppKit } from "@reown/appkit/react";
import { useAccount, useDisconnect } from "wagmi";
import { useAppState } from "../../AppState.jsx";
import { shortenAddress } from "../../web3/config.js";
import {
  ACCOUNT_URL,
  createVault,
  deleteVault,
  loadWalletSnapshot,
  readProfile,
  readShowWalletTab,
  readSkills,
  unlockVault,
  saveVault,
  vaultExists,
  writeProfile,
  writeShowWalletTab,
  writeSkills,
} from "../../account.js";
import { Page, Card, Tabs, Row, Field, Ghost, Primary, Toggle, Section } from "../ui.jsx";

export default function AccountView() {
  const { notice } = useAppState();
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [showWallet, setShowWallet] = useState(readShowWalletTab);
  const [tab, setTab] = useState("account");
  const tabs = [
    { id: "account", label: "Account" },
    { id: "manager", label: "Account Manager" },
    ...(showWallet ? [{ id: "wallet", label: "Wallet" }] : []),
    { id: "skills", label: "Skills" },
    { id: "profile", label: "Profile" },
  ];

  useEffect(() => {
    if (!showWallet && tab === "wallet") setTab("account");
  }, [showWallet, tab]);

  return (
    <Page>
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === "account" && (
        <AccountPanel
          address={address}
          isConnected={isConnected}
          showWallet={showWallet}
          onShowWallet={(value) => {
            setShowWallet(value);
            writeShowWalletTab(value);
            if (value) setTab("wallet");
          }}
          onConnect={() => open({ view: "Connect" })}
          onWallet={() => open({ view: "Account" })}
          onDisconnect={() => {
            disconnect();
            notice("Wallet disconnected.");
          }}
        />
      )}
      {tab === "manager" && <ManagerPanel notice={notice} />}
      {tab === "wallet" && showWallet && <WalletPanel address={address} isConnected={isConnected} notice={notice} onConnect={() => open({ view: "Connect" })} />}
      {tab === "skills" && <SkillsPanel notice={notice} />}
      {tab === "profile" && <ProfilePanel address={address} notice={notice} />}
    </Page>
  );
}

function AccountPanel({ address, isConnected, showWallet, onShowWallet, onConnect, onWallet, onDisconnect }) {
  return (
    <Card>
      <Row label="Status" value={isConnected ? "Wallet connected" : "Guest — browsing"} />
      <Row label="Web version" value="This harness. Lifetime unlock lives on the same wallet." />
      <Row label="Address" value={address ? shortenAddress(address) : "Not connected"} />
      <Row label="Show Wallet tab" value="Hidden until you turn it on. Balances and staking only.">
        <Toggle on={showWallet} onClick={() => onShowWallet(!showWallet)} />
      </Row>
      <div className="flex flex-wrap gap-2 px-4 py-3">
        {isConnected ? (
          <>
            <Primary onClick={onWallet}>Wallet</Primary>
            <Ghost onClick={onDisconnect}>Disconnect</Ghost>
          </>
        ) : (
          <Primary onClick={onConnect}>Connect wallet</Primary>
        )}
        <Ghost onClick={() => window.open(ACCOUNT_URL, "_blank", "noopener,noreferrer")}>useroot.sh/account</Ghost>
      </div>
      <div className="px-4 pb-4 text-[12px] leading-5 text-[var(--faint)]">
        Unlock at useroot.sh/account. Flash sale · $19.99 + VAT · or 20 USDC / 1,000 $PALM. The same address opens Ops.
      </div>
    </Card>
  );
}

function WalletPanel({ address, isConnected, notice, onConnect }) {
  const [snap, setSnap] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !address) {
      setSnap(null);
      return;
    }
    let cancel = false;
    setLoading(true);
    setError("");
    loadWalletSnapshot(address)
      .then((next) => {
        if (!cancel) setSnap(next);
      })
      .catch((err) => {
        if (!cancel) setError(err?.message || "Could not read the wallet.");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <Card className="p-4">
        <div className="text-[14px]">Connect a wallet to read ETH, $PALM, and stake.</div>
        <div className="mt-3">
          <Primary onClick={onConnect}>Connect wallet</Primary>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 text-center">
        <div className="text-[12px] text-[var(--faint)]">$PALM in wallet</div>
        <div className="mt-1 text-[40px] font-light leading-none">{loading && !snap ? "…" : snap?.palm || "—"}</div>
        <div className="mt-2 text-[13px] text-[var(--muted)]">{loading && !snap ? "Reading mainnet…" : snap ? snap.eth + " ETH" : ""}</div>
      </div>
      <Card>
        <Row label="Address" value={shortenAddress(address)}>
          <Ghost
            onClick={() => {
              navigator.clipboard?.writeText(address);
              notice("Address copied.");
            }}
          >
            Copy
          </Ghost>
        </Row>
        <Row label="Staked" value={snap ? snap.staked + " $PALM" : "—"} />
        <Row label="Protocol staked" value={snap ? snap.totalStaked + " $PALM · " + snap.stakers.toLocaleString() + " wallets" : "—"} />
        {error && <div className="px-4 py-3 text-[12px] text-[var(--rose)]">{error}</div>}
      </Card>
    </div>
  );
}

function ManagerPanel({ notice }) {
  const [exists, setExists] = useState(vaultExists);
  const [key, setKey] = useState(null);
  const [entries, setEntries] = useState([]);
  const [password, setPassword] = useState("");
  const [draft, setDraft] = useState(null);
  const [revealed, setRevealed] = useState("");
  const [error, setError] = useState("");

  const persist = async (next) => {
    await saveVault(key, next);
    setEntries(next);
  };

  if (!exists) {
    return (
      <Card className="space-y-3 p-4">
        <div className="text-[14px]">Account Manager</div>
        <div className="text-[12px] leading-5 text-[var(--muted)]">
          A passphrase encrypts logins in this browser. Nothing is sent with the vault.
        </div>
        <Field label="Passphrase" type="password" value={password} onChange={setPassword} />
        <Primary
          onClick={async () => {
            if (password.trim().length < 8) {
              setError("Use at least 8 characters.");
              return;
            }
            try {
              await createVault(password);
              const opened = await unlockVault(password);
              setKey(opened.key);
              setEntries(opened.entries);
              setExists(true);
              setPassword("");
              setError("");
              notice("Vault created.");
            } catch (err) {
              setError(err?.message || "Could not create the vault.");
            }
          }}
        >
          Create vault
        </Primary>
        {error && <div className="text-[12px] text-[var(--rose)]">{error}</div>}
      </Card>
    );
  }

  if (!key) {
    return (
      <Card className="space-y-3 p-4">
        <div className="text-[14px]">Vault locked</div>
        <Field label="Passphrase" type="password" value={password} onChange={setPassword} />
        <div className="flex flex-wrap gap-2">
          <Primary
            onClick={async () => {
              try {
                const opened = await unlockVault(password);
                setKey(opened.key);
                setEntries(opened.entries);
                setPassword("");
                setError("");
              } catch {
                setError("Wrong passphrase.");
              }
            }}
          >
            Unlock
          </Primary>
          <Ghost
            onClick={() => {
              deleteVault();
              setExists(false);
              setPassword("");
              setError("");
              notice("Vault deleted.");
            }}
          >
            Delete vault
          </Ghost>
        </div>
        {error && <div className="text-[12px] text-[var(--rose)]">{error}</div>}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13px] text-[var(--muted)]">{entries.length} saved</div>
        <div className="flex gap-2">
          <Ghost onClick={() => setDraft({ id: "", title: "", login: "", secret: "", notes: "" })}>Add</Ghost>
          <Ghost
            onClick={() => {
              setKey(null);
              setEntries([]);
              setRevealed("");
              setDraft(null);
            }}
          >
            Lock
          </Ghost>
        </div>
      </div>
      {draft && (
        <Card className="space-y-3 p-4">
          <Field label="Name" value={draft.title} onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))} />
          <Field label="Login" value={draft.login} onChange={(value) => setDraft((prev) => ({ ...prev, login: value }))} />
          <Field label="Secret" type="password" value={draft.secret} onChange={(value) => setDraft((prev) => ({ ...prev, secret: value }))} />
          <Field label="Notes" value={draft.notes} onChange={(value) => setDraft((prev) => ({ ...prev, notes: value }))} />
          <div className="flex gap-2">
            <Primary
              onClick={async () => {
                if (!draft.title.trim()) return;
                const row = { ...draft, id: draft.id || String(Date.now()), title: draft.title.trim() };
                const next = draft.id ? entries.map((item) => (item.id === draft.id ? row : item)) : [row, ...entries];
                await persist(next);
                setDraft(null);
                notice("Saved in the vault.");
              }}
            >
              Save
            </Primary>
            <Ghost onClick={() => setDraft(null)}>Cancel</Ghost>
          </div>
        </Card>
      )}
      {entries.length === 0 && !draft && <Card className="px-4 py-3 text-[13px] text-[var(--muted)]">No entries yet.</Card>}
      {entries.map((entry) => (
        <Card key={entry.id} className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[14px]">{entry.title}</div>
              <div className="mt-0.5 text-[12px] text-[var(--muted)]">{entry.login || "No login"}</div>
              {entry.notes && <div className="mt-1 text-[12px] text-[var(--faint)]">{entry.notes}</div>}
              {revealed === entry.id && <div className="mt-2 break-all text-[13px]">{entry.secret || "—"}</div>}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Ghost onClick={() => setRevealed((current) => (current === entry.id ? "" : entry.id))}>
                {revealed === entry.id ? "Hide" : "Reveal"}
              </Ghost>
              <Ghost
                onClick={() => {
                  if (!entry.secret) return;
                  navigator.clipboard?.writeText(entry.secret);
                  notice("Copied. Clearing the clipboard in 30s.");
                  window.setTimeout(() => navigator.clipboard?.writeText(""), 30000);
                }}
              >
                Copy
              </Ghost>
              <Ghost
                onClick={async () => {
                  await persist(entries.filter((item) => item.id !== entry.id));
                  notice("Entry removed.");
                }}
              >
                Remove
              </Ghost>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function SkillsPanel({ notice }) {
  const [skills, setSkills] = useState(readSkills);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const commit = (next) => {
    setSkills(next);
    writeSkills(next);
  };

  return (
    <div className="space-y-3">
      <Card>
        {skills.map((skill) => (
          <Row key={skill.id} label={skill.title} value={skill.body}>
            <div className="flex items-center gap-2">
              {!skill.builtIn && (
                <Ghost onClick={() => commit(skills.filter((item) => item.id !== skill.id))}>Remove</Ghost>
              )}
              <Toggle
                on={skill.enabled}
                onClick={() => commit(skills.map((item) => (item.id === skill.id ? { ...item, enabled: !item.enabled } : item)))}
              />
            </div>
          </Row>
        ))}
      </Card>
      <Section title="Add a skill">
        <Card className="space-y-3 p-4">
          <Field label="Name" value={title} onChange={setTitle} />
          <label className="block">
            <div className="mb-1.5 text-[11px] text-[var(--faint)]">What it does</div>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-[var(--stroke)] bg-[var(--input)] px-3 py-2 text-[14px] outline-none"
            />
          </label>
          <Ghost
            onClick={() => {
              if (!title.trim()) return;
              commit([...skills, { id: "skill-" + Date.now(), title: title.trim(), body: body.trim(), builtIn: false, enabled: true }]);
              setTitle("");
              setBody("");
              notice("Skill added.");
            }}
          >
            Add skill
          </Ghost>
        </Card>
      </Section>
    </div>
  );
}

function ProfilePanel({ address, notice }) {
  const [name, setName] = useState("");
  const [github, setGithub] = useState("");

  useEffect(() => {
    const profile = readProfile(address);
    setName(profile.name);
    setGithub(profile.github);
  }, [address]);

  return (
    <Card className="space-y-3 p-4">
      <Field label="Display name" value={name} onChange={setName} placeholder="you" />
      <Field label="GitHub" value={github} onChange={setGithub} placeholder="github.com/you" />
      <Ghost
        onClick={() => {
          writeProfile(address, { name, github });
          notice("Profile saved on this browser.");
        }}
      >
        Save profile
      </Ghost>
    </Card>
  );
}

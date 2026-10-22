import { useState } from "react";
import { useAppState } from "../../AppState.jsx";
import { Page, Card, Ghost, Primary, Tabs } from "../ui.jsx";

const SHOP = [
  { id: "farm", title: "PALM Farm", desc: "Cloud Android phones for Expo and React Native.", installed: true },
  { id: "ops", title: "PALM Ops", desc: "Anonymous hosting signed with the Root wallet.", installed: true },
  { id: "crawler", title: "Crawler", desc: "Record, play, OTP, and scrape in browser panes.", installed: true },
  { id: "crypto", title: "Root Crypto", desc: "Wallet, balances, and staking tools.", installed: false },
  { id: "image", title: "ImageGen", desc: "FLUX.2 Klein 4B through Comfy on this machine.", installed: false },
  { id: "video", title: "Root Video", desc: "HTML compositions rendered to MP4 in chat.", installed: false },
];

export default function PluginsView() {
  const { notice } = useAppState();
  const [tab, setTab] = useState("shop");
  const [items, setItems] = useState(SHOP);
  const installed = items.filter((item) => item.installed);

  const toggle = (id) => {
    setItems((prev) => prev.map((row) => (row.id === id ? { ...row, installed: !row.installed } : row)));
    const item = items.find((row) => row.id === id);
    notice(item.installed ? item.title + " removed." : item.title + " installed.");
  };

  return (
    <Page>
      <div className="mb-1 text-[22px]">Plugins</div>
      <p className="mb-4 text-[13px] text-[var(--muted)]">
        Work with /root across persona packs, specialized agents, and workflow extensions.
      </p>
      <Tabs
        tabs={[
          { id: "shop", label: "Shop" },
          { id: "installed", label: "Installed · " + installed.length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {(tab === "shop" ? items : installed).map((item) => (
          <Card key={item.id} className="flex flex-col justify-between p-4">
            <div>
              <div className="text-[14px]">{item.title}</div>
              <div className="mt-1 text-[12px] text-[var(--muted)]">{item.desc}</div>
            </div>
            <div className="mt-3">
              {item.installed ? (
                <Ghost onClick={() => toggle(item.id)}>Remove</Ghost>
              ) : (
                <Primary onClick={() => toggle(item.id)}>Install</Primary>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}

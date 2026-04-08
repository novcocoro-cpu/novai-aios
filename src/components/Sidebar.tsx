"use client";

import type { ScreenId } from "@/app/page";

const NAV_ITEMS: { id: ScreenId; icon: string; label: string; section?: string; badge?: string }[] = [
  { id: "room1", icon: "◈", label: "戦略・相場", section: "ROOMS" },
  { id: "room2", icon: "◉", label: "営業支援" },
  { id: "room3", icon: "◫", label: "開発・調達" },
  { id: "dashboard", icon: "▦", label: "ダッシュボード", section: "MANAGE" },
  { id: "history", icon: "◷", label: "履歴・レポート" },
  { id: "settings", icon: "◎", label: "設定・プロンプト", section: "CONFIG" },
];

export default function Sidebar({
  current,
  onNavigate,
}: {
  current: ScreenId;
  onNavigate: (id: ScreenId) => void;
}) {
  return (
    <nav className="sidebar">
      <div className="logo">
        <div className="logo-main">NOVAI / METAL-OS</div>
        <div className="logo-sub">金属メッキ経営支援 v1.0</div>
      </div>
      <div className="nav">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}>
            {item.section && <div className="nav-section">{item.section}</div>}
            <div
              className={`nav-item ${current === item.id ? "active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span> {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="company-tag">CONNECTED</div>
        <div className="company-name">田中メッキ工業 株式会社</div>
      </div>
    </nav>
  );
}

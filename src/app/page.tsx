"use client";

import { useState, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import RoomStrategy from "@/components/rooms/RoomStrategy";
import RoomSales from "@/components/rooms/RoomSales";
import RoomTech from "@/components/rooms/RoomTech";
import Dashboard from "@/components/screens/Dashboard";
import History from "@/components/screens/History";
import Settings from "@/components/screens/Settings";

export type ScreenId = "room1" | "room2" | "room3" | "dashboard" | "history" | "settings";

const SCREEN_META: Record<ScreenId, { title: string; sub: string; status: string }> = {
  room1: { title: "戦略・相場ルーム", sub: "ROOM-01 / STRATEGY", status: "Gemini 2.5 Flash · ONLINE" },
  room2: { title: "営業支援ルーム", sub: "ROOM-02 / SALES", status: "Claude Sonnet 4.6 · ONLINE" },
  room3: { title: "開発・調達ルーム", sub: "ROOM-03 / TECH", status: "Gemini 2.5 Flash · ONLINE" },
  dashboard: { title: "ダッシュボード", sub: "OVERVIEW / KPI", status: "DATA CONNECTED" },
  history: { title: "履歴・レポート", sub: "HISTORY / REPORTS", status: "SYSTEM READY" },
  settings: { title: "設定・プロンプト", sub: "CONFIG / SETTINGS", status: "SYSTEM READY" },
};

export default function Home() {
  const [screen, setScreen] = useState<ScreenId>("room1");
  const [pendingHandoff, setPendingHandoff] = useState<string | null>(null);
  const meta = SCREEN_META[screen];

  // 引き継ぎ付きナビゲーション
  const navigateWithHandoff = useCallback((target: string, message: string) => {
    setPendingHandoff(message);
    setScreen(target as ScreenId);

    // Supabaseにも保存（非同期・fire-and-forget）
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_handoff: JSON.stringify({ target, message, timestamp: new Date().toISOString() }) }),
    }).catch(() => {});
  }, []);

  // 通常のナビゲーション（引き継ぎをクリア）
  const handleNavigate = useCallback((id: ScreenId) => {
    setPendingHandoff(null);
    setScreen(id);
  }, []);

  return (
    <>
      <Sidebar current={screen} onNavigate={handleNavigate} />
      <main className="main-area">
        <Topbar title={meta.title} sub={meta.sub} status={meta.status} />
        <div className="content">
          {screen === "room1" && (
            <RoomStrategy
              onHandoff={navigateWithHandoff}
              initialMessage={pendingHandoff}
            />
          )}
          {screen === "room2" && (
            <RoomSales
              onHandoff={navigateWithHandoff}
              initialMessage={pendingHandoff}
            />
          )}
          {screen === "room3" && (
            <RoomTech
              initialMessage={pendingHandoff}
            />
          )}
          {screen === "dashboard" && <Dashboard />}
          {screen === "history" && <History />}
          {screen === "settings" && <Settings />}
        </div>
      </main>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";

interface Order {
  id: string;
  customer_name: string;
  plating_type: string;
  amount: number;
  cost: number;
  profit_loss: number;
  status: string;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {});
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + (o.amount || 0), 0);
  const totalLoss = orders.filter((o) => o.status === "loss").reduce((s, o) => s + Math.abs(o.profit_loss || 0), 0);
  const bundleCount = orders.filter((o) => o.plating_type?.includes("+") || o.plating_type?.includes("セット")).length;
  const bundleRate = orders.length > 0 ? Math.round((bundleCount / orders.length) * 100) : 0;

  const formatMan = (n: number) => `¥${Math.round(n / 10000).toLocaleString()}万`;

  return (
    <>
      <div className="dash-grid">
        <div className="big-kpi">
          <div className="big-kpi-label">TODAY REVENUE</div>
          <div className="big-kpi-value" style={{ color: "var(--green)" }}>{formatMan(totalRevenue)}</div>
          <div className="big-kpi-change up">受注 {orders.length}件</div>
        </div>
        <div className="big-kpi">
          <div className="big-kpi-label">GOLD EXPOSURE</div>
          <div className="big-kpi-value" style={{ color: "var(--red)" }}>-{formatMan(totalLoss)}</div>
          <div className="big-kpi-change down">▼ 金相場高騰による損失</div>
        </div>
        <div className="big-kpi">
          <div className="big-kpi-label">BUNDLE RATE</div>
          <div className="big-kpi-value" style={{ color: "var(--teal)" }}>{bundleRate}%</div>
          <div className="big-kpi-change up">目標：60%</div>
        </div>
      </div>

      <div className="chart-area">
        <div className="chart-title">月別受注金額 vs 金原価（万円）</div>
        <div className="bar-chart">
          {[
            { label: "10月", h1: 60, h2: 42 },
            { label: "11月", h1: 72, h2: 50 },
            { label: "12月", h1: 65, h2: 55 },
            { label: "1月", h1: 80, h2: 68 },
            { label: "2月", h1: 74, h2: 72 },
            { label: "3月", h1: 90, h2: 78 },
          ].map((m, i) => (
            <div key={m.label} className="bar-group">
              <div
                className="bar"
                style={{
                  height: `${m.h1}px`,
                  background: i === 5 ? "var(--gold)" : "var(--blue)",
                  opacity: i === 5 ? 0.9 : 0.7,
                }}
              />
              <div className="bar" style={{ height: `${m.h2}px`, background: "var(--red)", opacity: i === 5 ? 0.7 : 0.6 }} />
              <div className="bar-label">{m.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
          <span style={{ fontSize: "10px", color: "var(--blue)" }}>■ 受注金額</span>
          <span style={{ fontSize: "10px", color: "var(--red)" }}>■ 金原価</span>
        </div>
      </div>

      <div className="dash-row">
        <div className="table-area">
          <div className="table-header">最新受注（今月）</div>
          <table className="data-table">
            <thead>
              <tr><th>顧客名</th><th>工程</th><th>金額</th><th>状況</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.customer_name}</td>
                  <td>{o.plating_type}</td>
                  <td style={{ fontFamily: "var(--mono)" }}>{formatMan(o.amount)}</td>
                  <td>
                    <span className={`status-badge s-${o.status}`}>
                      {o.status === "profit" ? "黒字" : o.status === "loss" ? "赤字" : "交渉中"}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={4} style={{ color: "var(--text3)", textAlign: "center" }}>データなし</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-area">
          <div className="table-header">AIインサイト（今週）</div>
          <div className="insight-list" style={{ padding: "12px" }}>
            <div className="insight-item">
              <span className="insight-icon">⚠</span>
              <div className="insight-text"><strong>金単独受注が{orders.filter(o => o.status === "loss").length}件</strong>。抱き合わせ提案に切り替えないと今月赤字リスクあり</div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">↗</span>
              <div className="insight-text"><strong>亜鉛メッキの粗利率が最高</strong>（38%）。営業優先度を引き上げることを推奨</div>
            </div>
            <div className="insight-item">
              <span className="insight-icon">◎</span>
              <div className="insight-text"><strong>PVD検討期間</strong>：今月中に設備見積もりを取得すると来季の転換コストを最小化できます</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

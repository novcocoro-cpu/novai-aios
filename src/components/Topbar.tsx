export default function Topbar({
  title,
  sub,
  status,
}: {
  title: string;
  sub: string;
  status: string;
}) {
  return (
    <div className="topbar">
      <span className="topbar-title">{title}</span>
      <span className="topbar-sub">{sub}</span>
      <div className="topbar-right">
        <div className="status-dot" />
        <span className="status-text">{status}</span>
      </div>
    </div>
  );
}

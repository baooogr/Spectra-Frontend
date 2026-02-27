export default function Tabs({ button, children }) {
  return (
    <div className="tabs">
      <ul className="tab-buttons">{button}</ul>
      <div className="tab-panel">{children}</div>
    </div>
  );
}

export default function TabButton({ children, isSelected, ...props }) {
  return (
    <li className="tab-item">
      <button
        className={`tab-button ${isSelected ? "active" : ""}`}
        {...props}
      >
        {children}
      </button>
    </li>
  );
}

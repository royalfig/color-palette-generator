import "./button.css";

export default function Button({ handler, active, children }: { handler: () => void; active: boolean; children: React.ReactNode }) {
  const activeClass = active ? "button active" : "button";
  return (
    <div className="button-container">
      <button className={activeClass} onClick={handler}>
        {children}
      </button>
    </div>
  );
}

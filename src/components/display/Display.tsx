import "./display.css";
export function Display({ children }: { children: React.ReactNode; }) {
  return <div className="display">{children}</div>;
}

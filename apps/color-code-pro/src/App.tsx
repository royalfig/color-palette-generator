import { ThemeProvider } from "@/context/themeProvider";
import { Container } from "@/components/Container/Container";

export default function App() {
  return (
    <ThemeProvider>
      <div className="container">
        <Container />
      </div>
    </ThemeProvider>
  );
}

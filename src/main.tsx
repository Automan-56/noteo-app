import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import {
  Component,
  StrictMode,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/contexts/ThemeContext";
import App from "./App";
import "./index.css";

function formatError(error: unknown, componentStack?: string): string {
  const baseMessage =
    error instanceof Error
      ? error.stack ?? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : JSON.stringify(error, null, 2);

  if (!componentStack) {
    return baseMessage;
  }

  return `${baseMessage}\n\nReact component stack:\n${componentStack}`;
}

function escapeHtml(value: string): string {
  return value
    .split("&")
    .join("&amp;")
    .split("<")
    .join("&lt;")
    .split(">")
    .join("&gt;");
}

function renderFatalError(error: unknown, componentStack?: string): void {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    return;
  }

  const message = escapeHtml(formatError(error, componentStack));

  rootElement.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:flex-start;justify-content:flex-start;background:#000;color:#ff4d4f;padding:24px;font-family:Consolas,'Courier New',monospace;white-space:pre-wrap;">
      <pre style="margin:0;color:#ff4d4f;">${message}</pre>
    </div>
  `;
}

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  message: string | null;
};

class StartupErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { message: null };
  }

  public static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: formatError(error) };
  }

  public componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    this.setState({
      message: formatError(error, errorInfo.componentStack ?? undefined),
    });
  }

  public render(): ReactNode {
    if (this.state.message !== null) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            background: "#000000",
            color: "#ff4d4f",
            padding: "24px",
            fontFamily: "Consolas, 'Courier New', monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          <pre style={{ margin: 0, color: "#ff4d4f" }}>{this.state.message}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

window.addEventListener("error", (event) => {
  renderFatalError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  renderFatalError(event.reason);
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element "#root" introuvable.');
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <StartupErrorBoundary>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StartupErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  renderFatalError(error);
}

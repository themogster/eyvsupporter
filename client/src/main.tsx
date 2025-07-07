import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";

console.log('main.tsx is loading');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found');
} else {
  console.log('Root element found, creating React app');
  
  // Remove preview fallback when React loads
  const previewFallback = document.getElementById('preview-fallback');
  if (previewFallback) {
    previewFallback.remove();
    console.log('Removed preview fallback - React app loaded successfully');
  }
  
  createRoot(rootElement).render(
    <ThemeProvider defaultTheme="light" storageKey="eyv-admin-theme">
      <App />
    </ThemeProvider>
  );
  console.log('React app rendered');
}

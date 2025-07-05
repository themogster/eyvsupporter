import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('main.tsx is loading');

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found');
} else {
  console.log('Root element found, creating React app');
  createRoot(rootElement).render(<App />);
  console.log('React app rendered');
}

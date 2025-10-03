import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./css/index.css";
import App from "./App.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter basename="/race-racer">
      <App />
    </HashRouter>
  </StrictMode>
);

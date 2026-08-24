import React from "react";
import ReactDOM from "react-dom/client";
import { OCRScannerPage } from "./components/OCRScannerPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OCRScannerPage />
  </React.StrictMode>,
);

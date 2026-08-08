import React from "react";
import ReactDOM from "react-dom/client";
import { MediaProvider } from "media-react";
import App from "./App.js";
import "./styles.css";

const apiKey = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;

if (!apiKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "VITE_PEXELS_API_KEY is not set. Copy .env.example to .env.local and add a free key from https://www.pexels.com/api/"
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* MediaProvider is the ONLY place the API key is touched in the whole app */}
    <MediaProvider config={{ apiKey: apiKey ?? "" }}>
      <App />
    </MediaProvider>
  </React.StrictMode>
);

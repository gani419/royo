import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createAppStore, setSharedApiClient } from "@royo/store";
import { ApiClient } from "@royo/api";
import { webTokenStorage } from "./platform/webStorage";
import { App } from "./App";

// Import Global Purple Theme & Modular CSS Architecture
import "@royo/theme/assets/css/variables.css";
import "@royo/theme/assets/css/base.css";
import "@royo/theme/assets/css/shell.css";
import "@royo/theme/assets/css/assistant.css";
import "@royo/theme/assets/css/forms.css";
import "@royo/theme/assets/css/garage.css";

// Initialize centralized ApiClient with Web storage adapter
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
const apiClient = new ApiClient({
  baseUrl: apiBaseUrl,
  tokenStorage: webTokenStorage,
});

// Bind into store RTK Query
setSharedApiClient(apiClient);

// Initialize Redux Store
const store = createAppStore();

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Provider store={store}>
        <App />
      </Provider>
    </React.StrictMode>,
  );
}

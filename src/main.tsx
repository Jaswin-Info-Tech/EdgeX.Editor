import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./app/App.tsx";
import "./styles/index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./app/api/queryClient.ts";
import { store } from "./app/store/index.ts";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <App />
    </Provider>
  </QueryClientProvider>,
);

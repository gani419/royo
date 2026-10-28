import { Provider } from "react-redux";
import { createAppStore, setSharedApiClient } from "@royo/store";
import { ApiClient } from "@royo/api";
import { Platform } from "react-native";
import { nativeTokenStorage } from "./src/platform/nativeStorage";
import { MobileWorkspace } from "./src/MobileWorkspace";

const apiClient = new ApiClient({
  baseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    (Platform.OS === "android"
      ? "http://10.0.2.2:8080"
      : "http://localhost:8080"),
  tokenStorage: nativeTokenStorage,
});
setSharedApiClient(apiClient);
const store = createAppStore();

export default function App() {
  return (
    <Provider store={store}>
      <MobileWorkspace />
    </Provider>
  );
}

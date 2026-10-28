export interface NetworkState {
  isConnected: boolean;
  isInternetReachable?: boolean;
}

export interface INetworkStatus {
  getCurrentState(): Promise<NetworkState>;
  subscribe(callback: (state: NetworkState) => void): () => void;
}


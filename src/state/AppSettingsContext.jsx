import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getEvmChainByKey,
  getSolanaClusterByKey,
  resolveEvmChainRpc,
  resolveSolanaRpc,
} from "../config/chainRegistry";

const STORAGE_KEY = "bcit_app_settings_v1";

const DEFAULT_SETTINGS = {
  preferredEvmChainKey: "eth-sepolia",
  preferredChainKey: "eth-sepolia",
  preferredSolanaClusterKey: "sol-mainnet",
  rpcOverrides: {
    evm: {},
    solana: {},
  },
  etherscanApiKey: "",
};

const AppSettingsContext = createContext(null);

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeRpcOverrides(rpcOverrides) {
  if (!rpcOverrides || typeof rpcOverrides !== "object") {
    return { evm: {}, solana: {} };
  }

  const hasNamespacedModel = "evm" in rpcOverrides || "solana" in rpcOverrides;
  if (!hasNamespacedModel) {
    return { evm: { ...rpcOverrides }, solana: {} };
  }

  return {
    evm: rpcOverrides.evm && typeof rpcOverrides.evm === "object" ? { ...rpcOverrides.evm } : {},
    solana:
      rpcOverrides.solana && typeof rpcOverrides.solana === "object"
        ? { ...rpcOverrides.solana }
        : {},
  };
}

function normalizeSettings(raw) {
  const parsed = raw && typeof raw === "object" ? raw : {};
  const preferredEvmChainKey = getEvmChainByKey(
    parsed.preferredEvmChainKey || parsed.preferredChainKey
  ).key;
  const preferredSolanaClusterKey = getSolanaClusterByKey(
    parsed.preferredSolanaClusterKey
  ).key;

  return {
    ...DEFAULT_SETTINGS,
    ...parsed,
    preferredEvmChainKey,
    preferredChainKey: preferredEvmChainKey,
    preferredSolanaClusterKey,
    rpcOverrides: normalizeRpcOverrides(parsed.rpcOverrides),
    etherscanApiKey: parsed.etherscanApiKey || "",
  };
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = safeParse(raw, DEFAULT_SETTINGS);
    return normalizeSettings(parsed);
  });
  const [isHydrated] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const api = useMemo(
    () => ({
      ...settings,
      isHydrated,

      // Preferred chains
      setPreferredEvmChainKey: (chainKey) => {
        const chain = getEvmChainByKey(chainKey);
        setSettings((prev) => ({
          ...prev,
          preferredEvmChainKey: chain.key,
          preferredChainKey: chain.key,
        }));
      },
      setPreferredChainKey: (chainKey) => {
        const chain = getEvmChainByKey(chainKey);
        setSettings((prev) => ({
          ...prev,
          preferredEvmChainKey: chain.key,
          preferredChainKey: chain.key,
        }));
      },
      setPreferredSolanaClusterKey: (clusterKey) => {
        const cluster = getSolanaClusterByKey(clusterKey);
        setSettings((prev) => ({ ...prev, preferredSolanaClusterKey: cluster.key }));
      },

      // EVM RPC
      setEvmRpcOverride: (chainKey, rpc) => {
        const chain = getEvmChainByKey(chainKey);
        const value = (rpc || "").trim();
        setSettings((prev) => {
          const nextEvm = { ...prev.rpcOverrides.evm };
          if (!value) {
            delete nextEvm[chain.key];
          } else {
            nextEvm[chain.key] = value;
          }
          return {
            ...prev,
            rpcOverrides: {
              ...prev.rpcOverrides,
              evm: nextEvm,
            },
          };
        });
      },
      setRpcOverride: (chainKey, rpc) => {
        const chain = getEvmChainByKey(chainKey);
        const value = (rpc || "").trim();
        setSettings((prev) => {
          const nextEvm = { ...prev.rpcOverrides.evm };
          if (!value) {
            delete nextEvm[chain.key];
          } else {
            nextEvm[chain.key] = value;
          }
          return {
            ...prev,
            rpcOverrides: {
              ...prev.rpcOverrides,
              evm: nextEvm,
            },
          };
        });
      },
      getEvmRpcOverride: (chainKey) => {
        const chain = getEvmChainByKey(chainKey);
        return settings.rpcOverrides?.evm?.[chain.key] || "";
      },
      getRpcOverride: (chainKey) => {
        const chain = getEvmChainByKey(chainKey);
        return settings.rpcOverrides?.evm?.[chain.key] || "";
      },
      getResolvedEvmRpc: (chainKey, customRpc = "") => {
        if ((customRpc || "").trim()) return customRpc.trim();
        const chain = getEvmChainByKey(chainKey || settings.preferredEvmChainKey);
        const override = settings.rpcOverrides?.evm?.[chain.key] || "";
        return resolveEvmChainRpc(chain.key, override);
      },
      getResolvedRpc: (chainKey, customRpc = "") => {
        if ((customRpc || "").trim()) return customRpc.trim();
        const chain = getEvmChainByKey(
          chainKey || settings.preferredEvmChainKey || settings.preferredChainKey
        );
        const override = settings.rpcOverrides?.evm?.[chain.key] || "";
        return resolveEvmChainRpc(chain.key, override);
      },

      // Solana RPC
      setSolanaRpcOverride: (clusterKey, rpc) => {
        const cluster = getSolanaClusterByKey(clusterKey);
        const value = (rpc || "").trim();
        setSettings((prev) => {
          const nextSolana = { ...prev.rpcOverrides.solana };
          if (!value) {
            delete nextSolana[cluster.key];
          } else {
            nextSolana[cluster.key] = value;
          }
          return {
            ...prev,
            rpcOverrides: {
              ...prev.rpcOverrides,
              solana: nextSolana,
            },
          };
        });
      },
      getSolanaRpcOverride: (clusterKey) => {
        const cluster = getSolanaClusterByKey(clusterKey);
        return settings.rpcOverrides?.solana?.[cluster.key] || "";
      },
      getResolvedSolanaRpc: (clusterKey, customRpc = "") => {
        if ((customRpc || "").trim()) return customRpc.trim();
        const cluster = getSolanaClusterByKey(
          clusterKey || settings.preferredSolanaClusterKey
        );
        const override = settings.rpcOverrides?.solana?.[cluster.key] || "";
        return resolveSolanaRpc(cluster.key, override);
      },

      setEtherscanApiKey: (apiKey) => {
        setSettings((prev) => ({ ...prev, etherscanApiKey: apiKey || "" }));
      },
      resetSettings: () => setSettings(DEFAULT_SETTINGS),
    }),
    [isHydrated, settings]
  );

  return (
    <AppSettingsContext.Provider value={api}>{children}</AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }
  return ctx;
}

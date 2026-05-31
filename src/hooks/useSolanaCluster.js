import { useEffect, useMemo, useState } from "react";
import { getSolanaClusterOptions } from "../config/chainRegistry";
import { useAppSettings } from "../state/AppSettingsContext";

export function useSolanaCluster() {
  const settings = useAppSettings();
  const preferredClusterKey = settings.preferredSolanaClusterKey;
  const [clusterKey, setClusterKey] = useState(preferredClusterKey);
  const [rpc, setRpc] = useState(settings.getSolanaRpcOverride(preferredClusterKey));

  const clusterOptions = useMemo(() => getSolanaClusterOptions(), []);

  useEffect(() => {
    setClusterKey(preferredClusterKey);
    setRpc(settings.getSolanaRpcOverride(preferredClusterKey));
  }, [preferredClusterKey, settings]);

  useEffect(() => {
    setRpc(settings.getSolanaRpcOverride(clusterKey));
  }, [clusterKey, settings]);

  const onChangeCluster = (nextClusterKey) => {
    setClusterKey(nextClusterKey);
    settings.setPreferredSolanaClusterKey(nextClusterKey);
    setRpc(settings.getSolanaRpcOverride(nextClusterKey));
  };

  const onChangeRpc = (nextRpc) => {
    const value = nextRpc || "";
    setRpc(value);
    settings.setSolanaRpcOverride(clusterKey, value);
  };

  return {
    clusterKey,
    rpc,
    clusterOptions,
    onChangeCluster,
    onChangeRpc,
    setClusterKey: onChangeCluster,
    setRpc: onChangeRpc,
  };
}

import { useEffect, useMemo, useState } from "react";
import { getEvmChainOptions } from "../config/chainRegistry";
import { useAppSettings } from "../state/AppSettingsContext";

export function useChainRpc() {
  const settings = useAppSettings();
  const preferredChainKey = settings.preferredEvmChainKey || settings.preferredChainKey;
  const [chainKey, setChainKey] = useState(preferredChainKey);
  const [rpc, setRpc] = useState(settings.getEvmRpcOverride(preferredChainKey));

  const chainOptions = useMemo(() => getEvmChainOptions(), []);

  useEffect(() => {
    setChainKey(preferredChainKey);
    setRpc(settings.getEvmRpcOverride(preferredChainKey));
  }, [preferredChainKey, settings]);

  useEffect(() => {
    setRpc(settings.getEvmRpcOverride(chainKey));
  }, [chainKey, settings]);

  const onChangeChain = (nextChainKey) => {
    setChainKey(nextChainKey);
    settings.setPreferredEvmChainKey(nextChainKey);
    setRpc(settings.getEvmRpcOverride(nextChainKey));
  };

  const onChangeRpc = (nextRpc) => {
    const value = nextRpc || "";
    setRpc(value);
    settings.setEvmRpcOverride(chainKey, value);
  };

  return {
    chainKey,
    rpc,
    chainOptions,
    onChangeChain,
    onChangeRpc,
    setChainKey: onChangeChain,
    setRpc: onChangeRpc,
  };
}

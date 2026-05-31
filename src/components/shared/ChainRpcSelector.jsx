import React from "react";
import { Input, Select, Typography } from "antd";

const { Text } = Typography;

export default function ChainRpcSelector({
  chainKey,
  rpc,
  chainOptions = [],
  onChangeChain,
  onChangeRpc,
  disabled = false,
  chainLabel = "链",
  rpcLabel = "RPC（自动保存）",
}) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div className="space-y-2">
        <Text strong>{chainLabel}</Text>
        <Select
          style={{ width: "100%" }}
          options={chainOptions}
          value={chainKey}
          onChange={onChangeChain}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2 lg:col-span-2">
        <Text strong>{rpcLabel}</Text>
        <Input
          value={rpc}
          onChange={(event) => onChangeRpc?.(event.target.value)}
          placeholder="留空则使用默认 RPC"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

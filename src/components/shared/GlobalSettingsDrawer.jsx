import React, { useEffect, useMemo, useState } from "react";
import { Button, Divider, Drawer, Input, Select, Space, Typography, message } from "antd";
import {
  getEvmChainByKey,
  getEvmChainOptions,
  getSolanaClusterByKey,
  getSolanaClusterOptions,
} from "../../config/chainRegistry";
import { useAppSettings } from "../../state/AppSettingsContext";

const { Text } = Typography;

export default function GlobalSettingsDrawer({ open, onClose }) {
  const settings = useAppSettings();
  const evmOptions = useMemo(() => getEvmChainOptions(), []);
  const solanaOptions = useMemo(() => getSolanaClusterOptions(), []);
  const [editingEvmChain, setEditingEvmChain] = useState(
    settings.preferredEvmChainKey || settings.preferredChainKey
  );
  const [editingSolanaCluster, setEditingSolanaCluster] = useState(
    settings.preferredSolanaClusterKey
  );

  useEffect(() => {
    if (!open) return;
    setEditingEvmChain(settings.preferredEvmChainKey || settings.preferredChainKey);
    setEditingSolanaCluster(settings.preferredSolanaClusterKey);
  }, [
    open,
    settings.preferredChainKey,
    settings.preferredEvmChainKey,
    settings.preferredSolanaClusterKey,
  ]);

  const evmOverrideValue = settings.getEvmRpcOverride(editingEvmChain);
  const evmResolvedRpc = settings.getResolvedEvmRpc(
    editingEvmChain,
    evmOverrideValue
  );

  const solanaOverrideValue = settings.getSolanaRpcOverride(editingSolanaCluster);
  const solanaResolvedRpc = settings.getResolvedSolanaRpc(
    editingSolanaCluster,
    solanaOverrideValue
  );

  return (
    <Drawer
      title="全局配置中心"
      placement="right"
      width={460}
      onClose={onClose}
      open={open}
      destroyOnClose={false}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <p className="m-0 text-xs text-slate-400">
          配置会自动保存到本地存储，切换页面后自动复用。
        </p>

        <div className="space-y-2">
          <Text strong>默认 EVM 链</Text>
          <Select
            style={{ width: "100%" }}
            options={evmOptions}
            value={settings.preferredEvmChainKey || settings.preferredChainKey}
            onChange={(value) => {
              settings.setPreferredEvmChainKey(value);
              setEditingEvmChain(value);
            }}
          />
        </div>

        <div className="space-y-2">
          <Text strong>默认 Solana 网络</Text>
          <Select
            style={{ width: "100%" }}
            options={solanaOptions}
            value={settings.preferredSolanaClusterKey}
            onChange={(value) => {
              settings.setPreferredSolanaClusterKey(value);
              setEditingSolanaCluster(value);
            }}
          />
        </div>

        <Divider orientation="left" style={{ margin: "4px 0", fontSize: 13 }}>
          EVM RPC 配置
        </Divider>

        <div className="space-y-2">
          <Select
            style={{ width: "100%" }}
            options={evmOptions}
            value={editingEvmChain}
            onChange={setEditingEvmChain}
            placeholder="选择需要覆盖 RPC 的 EVM 链"
          />
          <Input
            placeholder="输入自定义 RPC（留空则使用默认）"
            value={evmOverrideValue}
            onChange={(e) => settings.setEvmRpcOverride(editingEvmChain, e.target.value)}
          />
          <Text type="secondary" className="!text-xs">
            当前生效: {evmResolvedRpc}
          </Text>
          <Button
            size="small"
            onClick={() => settings.setEvmRpcOverride(editingEvmChain, "")}
          >
            清空该链覆盖
          </Button>
        </div>

        <Divider orientation="left" style={{ margin: "4px 0", fontSize: 13 }}>
          Solana RPC 配置
        </Divider>

        <div className="space-y-2">
          <Select
            style={{ width: "100%" }}
            options={solanaOptions}
            value={editingSolanaCluster}
            onChange={setEditingSolanaCluster}
            placeholder="选择需要覆盖 RPC 的 Solana 网络"
          />
          <Input
            placeholder="输入自定义 RPC（留空则使用默认）"
            value={solanaOverrideValue}
            onChange={(e) =>
              settings.setSolanaRpcOverride(editingSolanaCluster, e.target.value)
            }
          />
          <Text type="secondary" className="!text-xs">
            当前生效: {solanaResolvedRpc}
          </Text>
          <Button
            size="small"
            onClick={() => settings.setSolanaRpcOverride(editingSolanaCluster, "")}
          >
            清空该网络覆盖
          </Button>
        </div>

        <Divider orientation="left" style={{ margin: "4px 0", fontSize: 13 }}>
          API 密钥
        </Divider>

        <div className="space-y-2">
          <Input.Password
            placeholder="Etherscan API Key"
            value={settings.etherscanApiKey}
            onChange={(e) => settings.setEtherscanApiKey(e.target.value)}
          />
        </div>

        <Divider style={{ margin: "8px 0" }} />

        <Space wrap>
          <Button
            danger
            onClick={() => {
              settings.resetSettings();
              const evmChain = getEvmChainByKey("eth-sepolia");
              const solanaCluster = getSolanaClusterByKey("sol-mainnet");
              setEditingEvmChain(evmChain.key);
              setEditingSolanaCluster(solanaCluster.key);
              message.success("全局配置已重置");
            }}
          >
            重置全部配置
          </Button>
          <Button type="primary" onClick={onClose}>
            完成
          </Button>
        </Space>
      </Space>
    </Drawer>
  );
}

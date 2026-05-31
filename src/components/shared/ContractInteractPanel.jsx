import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Input, Select, Space, Typography, message } from "antd";
import { CONTRACT_PRESETS } from "../../config/abis.js";
import { LOG_CATEGORY } from "../../config/categories.js";
import { callFunction, getReadContract, getWriteContract, parseAbi } from "../../services/evm/contractService.js";
import { createSigner } from "../../services/evm/signerFactory.js";
import { useChainRpc } from "../../hooks/useChainRpc.js";
import { useSensitiveInput } from "../../hooks/useSensitiveInput.js";
import { useTaskLog } from "../../state/TaskLogContext";
import ChainRpcSelector from "./ChainRpcSelector.jsx";
import SensitiveField from "./SensitiveField.jsx";

const { Text } = Typography;

function stringifyResult(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map((item) => stringifyResult(item)).join(", ");
  if (value && typeof value === "object") {
    return JSON.stringify(value, (_, item) => (typeof item === "bigint" ? item.toString() : item), 2);
  }
  return value === undefined ? "" : `${value}`;
}

export default function ContractInteractPanel({ presets = CONTRACT_PRESETS }) {
  const chain = useChainRpc();
  const privateKey = useSensitiveInput();
  const { addLog } = useTaskLog();
  const [presetKey, setPresetKey] = useState(presets[0]?.key || "general");
  const [contractAddress, setContractAddress] = useState("");
  const [customAbi, setCustomAbi] = useState("");
  const [selectedSignature, setSelectedSignature] = useState("");
  const [params, setParams] = useState([]);
  const [result, setResult] = useState("-");
  const [loading, setLoading] = useState(false);

  const selectedPreset = presets.find((item) => item.key === presetKey) || presets[0];
  const abiInput = selectedPreset?.abi || customAbi;

  const parsed = useMemo(() => {
    if (!abiInput) return { functions: [], events: [] };
    try {
      return parseAbi(abiInput);
    } catch {
      return { functions: [], events: [] };
    }
  }, [abiInput]);

  const selectedFunction = parsed.functions.find(
    (item) => item.signature === selectedSignature
  );

  const handleSelectFunction = (signature) => {
    const fn = parsed.functions.find((item) => item.signature === signature);
    setSelectedSignature(signature);
    setParams((fn?.inputs || []).map(() => ""));
  };

  const handleCall = async () => {
    if (!contractAddress.trim()) {
      message.error("请输入合约地址");
      return;
    }
    if (!selectedFunction) {
      message.error("请选择合约函数");
      return;
    }

    setLoading(true);
    addLog({
      level: "info",
      category: LOG_CATEGORY.CONTRACT,
      message: "开始调用合约函数",
      meta: { chainKey: chain.chainKey, fn: selectedFunction.name },
    });

    try {
      const contract = selectedFunction.isReadOnly
        ? getReadContract(chain.chainKey, contractAddress, abiInput, chain.rpc)
        : getWriteContract(
            contractAddress,
            abiInput,
            createSigner(chain.chainKey, privateKey.getOnce(), chain.rpc)
          );
      const value = await callFunction({
        contract,
        fnName: selectedFunction.signature,
        params,
      });
      const output = stringifyResult(value);
      setResult(output || "调用成功");
      addLog({
        level: "success",
        category: LOG_CATEGORY.CONTRACT,
        message: "合约函数调用成功",
        meta: { chainKey: chain.chainKey, fn: selectedFunction.name },
      });
      message.success("调用成功");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.CONTRACT,
        message: "合约函数调用失败",
        meta: { chainKey: chain.chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "调用失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="合约交互">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <ChainRpcSelector {...chain} disabled={loading} />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <Text strong>合约类型</Text>
            <Select
              style={{ width: "100%" }}
              options={presets.map((item) => ({
                label: item.name,
                value: item.key,
              }))}
              value={presetKey}
              onChange={(value) => {
                setPresetKey(value);
                setSelectedSignature("");
                setParams([]);
              }}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Text strong>合约地址</Text>
            <Input
              value={contractAddress}
              onChange={(event) => setContractAddress(event.target.value)}
              placeholder="0x..."
              disabled={loading}
            />
          </div>
        </div>

        {!selectedPreset?.abi && (
          <div className="space-y-2">
            <Text strong>ABI</Text>
            <Input.TextArea
              rows={5}
              value={customAbi}
              onChange={(event) => {
                setCustomAbi(event.target.value);
                setSelectedSignature("");
                setParams([]);
              }}
              placeholder="粘贴 ABI JSON 数组"
              disabled={loading}
            />
          </div>
        )}

        <div className="space-y-2">
          <Text strong>函数</Text>
          <Select
            style={{ width: "100%" }}
            options={parsed.functions.map((fn) => ({
              label: `${fn.isReadOnly ? "读" : "写"} · ${fn.signature}`,
              value: fn.signature,
            }))}
            value={selectedSignature || undefined}
            onChange={handleSelectFunction}
            placeholder="请选择函数"
            disabled={loading || !parsed.functions.length}
          />
        </div>

        {selectedFunction?.inputs?.map((input, index) => (
          <div className="space-y-2" key={`${input.name}-${index}`}>
            <Text strong>{input.name || `参数 ${index + 1}`} ({input.type})</Text>
            <Input
              value={params[index]}
              onChange={(event) => {
                const next = [...params];
                next[index] = event.target.value;
                setParams(next);
              }}
              disabled={loading}
            />
          </div>
        ))}

        {selectedFunction && !selectedFunction.isReadOnly && (
          <>
            <Alert type="warning" showIcon message="写合约会发起链上交易，请确认参数与私钥来源。" />
            <SensitiveField {...privateKey} label="签名私钥" showWarning={false} />
          </>
        )}

        <Space wrap>
          <Button type="primary" loading={loading} onClick={handleCall}>
            调用
          </Button>
          <Text>结果：{result}</Text>
        </Space>
      </Space>
    </Card>
  );
}

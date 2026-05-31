import React from "react";
import { Alert, Button, Input, Space, Typography, message } from "antd";

const { Text } = Typography;

function maskValue(value) {
  if (!value) return "";
  if (value.length <= 12) return "********";
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

export default function SensitiveField({
  label = "敏感信息",
  value = "",
  revealed = false,
  setValue,
  toggleReveal,
  clear,
  placeholder = "请输入敏感信息",
  multiline = false,
  readOnly = false,
  showWarning = true,
}) {
  const displayValue = revealed ? value : maskValue(value);

  const handleCopy = async () => {
    if (!value) {
      message.warning("没有可复制的内容");
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      message.success("已复制，请妥善保管");
    } catch {
      message.error("复制失败，请手动复制");
    }
  };

  const inputProps = {
    value: readOnly ? displayValue : value,
    onChange: (event) => setValue?.(event.target.value),
    placeholder,
    readOnly,
  };

  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {showWarning && (
        <Alert
          type="warning"
          showIcon
          message="敏感信息仅用于本次操作，不会写入日志、快照或本地存储。"
        />
      )}
      <div className="space-y-2">
        <Text strong>{label}</Text>
        {multiline ? (
          <Input.TextArea {...inputProps} rows={4} />
        ) : readOnly ? (
          <Input {...inputProps} />
        ) : revealed ? (
          <Input {...inputProps} />
        ) : (
          <Input.Password {...inputProps} visibilityToggle={false} />
        )}
      </div>
      <Space wrap>
        <Button size="small" onClick={toggleReveal} disabled={!value}>
          {revealed ? "隐藏" : "显形"}
        </Button>
        <Button size="small" onClick={handleCopy} disabled={!value}>
          复制
        </Button>
        <Button size="small" danger onClick={clear} disabled={!value}>
          清除
        </Button>
      </Space>
    </Space>
  );
}

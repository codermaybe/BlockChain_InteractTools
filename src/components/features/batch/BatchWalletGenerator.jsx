import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  InputNumber,
  Modal,
  Radio,
  Space,
  Switch,
  Table,
  Typography,
  message,
} from "antd";
import { DownloadOutlined, WalletOutlined } from "@ant-design/icons";
import WalletManager from "../../../services/wallet/WalletManager";
import { downloadCsv } from "../../../utils/taskRunner";
import { LOG_CATEGORY } from "../../../config/categories.js";
import { useSensitiveInput } from "../../../hooks/useSensitiveInput.js";
import { useTaskLog } from "../../../state/TaskLogContext";
import SensitiveField from "../../shared/SensitiveField.jsx";

const { Text } = Typography;

const MODE_OPTIONS = [
  { label: "随机生成", value: "random" },
  { label: "助记词批量派生", value: "mnemonic" },
  { label: "私钥列表导入", value: "private-key-list" },
];

export default function BatchWalletGenerator() {
  const { addLog } = useTaskLog();
  const [mode, setMode] = useState("random");
  const [count, setCount] = useState(20);
  const [startIndex, setStartIndex] = useState(0);
  const mnemonic = useSensitiveInput();
  const privateKeysText = useSensitiveInput();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const columns = useMemo(
    () => [
      { title: "#", dataIndex: "index", key: "index", width: 90 },
      { title: "地址", dataIndex: "address", key: "address", ellipsis: true },
      {
        title: "私钥",
        dataIndex: "privateKey",
        key: "privateKey",
        ellipsis: true,
        render: (value) => (showPrivateKey ? value : "******"),
      },
      {
        title: "来源",
        dataIndex: "source",
        key: "source",
        width: 140,
      },
      {
        title: "派生路径",
        dataIndex: "derivationPath",
        key: "derivationPath",
        ellipsis: true,
      },
    ],
    [showPrivateKey]
  );

  const handleGenerate = async () => {
    setLoading(true);
    addLog({
      level: "info",
      category: LOG_CATEGORY.BATCH_WALLET,
      message: "开始批量钱包生成",
      meta: { mode, count, startIndex },
    });
    try {
      let rows = [];
      if (mode === "random") {
        rows = WalletManager.createRandomWallets(count);
      } else if (mode === "mnemonic") {
        rows = WalletManager.createFromMnemonic(mnemonic.getOnce(), count, startIndex);
      } else {
        rows = WalletManager.createFromPrivateKeyList(privateKeysText.getOnce());
      }

      setWallets(rows);
      addLog({
        level: "success",
        category: LOG_CATEGORY.BATCH_WALLET,
        message: "批量钱包生成完成",
        meta: { mode, count: rows.length },
      });
      message.success(`已生成 ${rows.length} 条钱包记录`);
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.BATCH_WALLET,
        message: "批量钱包生成失败",
        meta: { mode, error: error?.message || "unknown" },
      });
      message.error(error?.message || "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!wallets.length) {
      message.warning("暂无可导出的数据");
      return;
    }

    const rows = [
      ["index", "address", "source", "derivationPath"],
      ...wallets.map((item) => [item.index, item.address, item.source, item.derivationPath]),
    ];
    downloadCsv("batch-wallets.csv", rows);
  };

  const handleShowPrivateKeyChange = (checked) => {
    if (!checked) {
      setShowPrivateKey(false);
      return;
    }

    Modal.confirm({
      title: "高风险操作",
      content: "即将显示所有私钥明文，请确认当前环境安全且无人旁观。",
      okText: "确认显示",
      okType: "danger",
      cancelText: "取消",
      onOk: () => setShowPrivateKey(true),
    });
  };

  return (
    <Card title="批量钱包生成（EVM）">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          type="warning"
          showIcon
          message="安全提醒"
          description="私钥与助记词属于高敏感信息。建议仅在离线环境操作，不要截图、不要上传云端。"
        />

        <Radio.Group
          options={MODE_OPTIONS}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        />

        {(mode === "random" || mode === "mnemonic") && (
          <Space wrap>
            <Text>生成数量</Text>
            <InputNumber
              min={1}
              max={1000}
              value={count}
              onChange={(value) => setCount(value || 1)}
            />
            {mode === "mnemonic" && (
              <>
                <Text>起始索引</Text>
                <InputNumber
                  min={0}
                  value={startIndex}
                  onChange={(value) => setStartIndex(value || 0)}
                />
              </>
            )}
          </Space>
        )}

        {mode === "mnemonic" && (
          <SensitiveField
            {...mnemonic}
            multiline
            showWarning={false}
            label="助记词"
            placeholder="输入助记词（12/24词）"
          />
        )}

        {mode === "private-key-list" && (
          <SensitiveField
            {...privateKeysText}
            multiline
            showWarning={false}
            label="私钥列表"
            placeholder="每行一个私钥，支持 0x 开头或纯十六进制"
          />
        )}

        <Space>
          <Button
            type="primary"
            icon={<WalletOutlined />}
            onClick={handleGenerate}
            loading={loading}
          >
            开始生成
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出 CSV
          </Button>
          <Space>
            <Text>显示私钥</Text>
            <Switch
              checked={showPrivateKey}
              onChange={handleShowPrivateKeyChange}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </Space>
        </Space>

        <Table
          rowKey={(record, idx) => `${record.address}-${idx}`}
          loading={loading}
          dataSource={wallets}
          columns={columns}
          pagination={{ pageSize: 8 }}
          scroll={{ x: "max-content" }}
        />
      </Space>
    </Card>
  );
}

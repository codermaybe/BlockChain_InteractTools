import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { DownloadOutlined, SearchOutlined, StopOutlined } from "@ant-design/icons";
import { Keypair } from "@solana/web3.js";
import { LOG_CATEGORY } from "../../../config/categories.js";
import { useTaskLog } from "../../../state/TaskLogContext";
import { downloadCsv } from "../../../utils/taskRunner";

const { Text } = Typography;

const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

function normalizePattern(value) {
  return (value || "").trim();
}

function matchesAddress(address, pattern, mode, caseSensitive) {
  const source = caseSensitive ? address : address.toLowerCase();
  const target = caseSensitive ? pattern : pattern.toLowerCase();

  if (mode === "prefix") {
    return source.startsWith(target);
  }
  if (mode === "suffix") {
    return source.endsWith(target);
  }
  return source.includes(target);
}

function secretKeyToJson(secretKey) {
  return `[${Array.from(secretKey).join(",")}]`;
}

function waitForNextFrame() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}

export default function SolanaVanityAddress() {
  const { addLog } = useTaskLog();
  const stopRef = useRef(false);

  const [mode, setMode] = useState("prefix");
  const [pattern, setPattern] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [targetCount, setTargetCount] = useState(1);
  const [maxAttempts, setMaxAttempts] = useState(200000);
  const [batchSize, setBatchSize] = useState(500);
  const [running, setRunning] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({
    attempts: 0,
    found: 0,
    startedAt: 0,
    elapsedMs: 0,
    stopped: false,
  });

  const patternValue = normalizePattern(pattern);
  const invalidPattern = !!patternValue && !BASE58_RE.test(patternValue);
  const attemptsPerSecond =
    stats.elapsedMs > 0 ? Math.round((stats.attempts / stats.elapsedMs) * 1000) : 0;

  const columns = useMemo(
    () => [
      { title: "#", dataIndex: "index", key: "index", width: 72 },
      {
        title: "地址",
        dataIndex: "address",
        key: "address",
        ellipsis: true,
        render: (value) => (
          <Text copyable ellipsis>
            {value}
          </Text>
        ),
      },
      {
        title: "Secret Key",
        dataIndex: "secretKeyJson",
        key: "secretKeyJson",
        ellipsis: true,
        render: (value) =>
          showSecretKey ? (
            <Text copyable ellipsis>
              {value}
            </Text>
          ) : (
            "******"
          ),
      },
      {
        title: "命中尝试",
        dataIndex: "attempts",
        key: "attempts",
        width: 120,
      },
      {
        title: "耗时",
        dataIndex: "elapsedMs",
        key: "elapsedMs",
        width: 120,
        render: (value) => `${(value / 1000).toFixed(2)}s`,
      },
    ],
    [showSecretKey]
  );

  const resetRunState = () => {
    setResults([]);
    setStats({
      attempts: 0,
      found: 0,
      startedAt: Date.now(),
      elapsedMs: 0,
      stopped: false,
    });
  };

  const handleShowSecretKeyChange = (checked) => {
    if (!checked) {
      setShowSecretKey(false);
      return;
    }

    Modal.confirm({
      title: "高风险操作",
      content: "即将显示本地生成的 Solana Secret Key 明文。请确认当前环境安全且不会被截图或录屏。",
      okText: "确认显示",
      okType: "danger",
      cancelText: "取消",
      onOk: () => setShowSecretKey(true),
    });
  };

  const handleStart = async () => {
    const target = normalizePattern(pattern);
    if (!target) {
      message.warning("请输入要匹配的字符");
      return;
    }
    if (!BASE58_RE.test(target)) {
      message.error("Solana 地址使用 Base58，不能包含 0、O、I、l 等字符");
      return;
    }

    stopRef.current = false;
    setRunning(true);
    resetRunState();
    addLog({
      level: "info",
      category: LOG_CATEGORY.SOLANA_VANITY,
      message: "开始计算 Solana 虚荣地址",
      meta: { mode, pattern: target, targetCount, maxAttempts, caseSensitive },
    });

    const startedAt = performance.now();
    let attempts = 0;
    const foundRows = [];

    try {
      while (!stopRef.current && attempts < maxAttempts && foundRows.length < targetCount) {
        const currentBatch = Math.min(batchSize, maxAttempts - attempts);
        for (let i = 0; i < currentBatch; i += 1) {
          attempts += 1;
          const keypair = Keypair.generate();
          const address = keypair.publicKey.toBase58();

          if (matchesAddress(address, target, mode, caseSensitive)) {
            foundRows.push({
              index: foundRows.length + 1,
              address,
              secretKeyJson: secretKeyToJson(keypair.secretKey),
              attempts,
              elapsedMs: Math.round(performance.now() - startedAt),
            });
            if (foundRows.length >= targetCount) {
              break;
            }
          }
        }

        const elapsedMs = Math.round(performance.now() - startedAt);
        setResults([...foundRows]);
        setStats({
          attempts,
          found: foundRows.length,
          startedAt: Date.now() - elapsedMs,
          elapsedMs,
          stopped: stopRef.current,
        });

        if (!stopRef.current && attempts < maxAttempts && foundRows.length < targetCount) {
          await waitForNextFrame();
        }
      }

      const stopped = stopRef.current;
      const elapsedMs = Math.round(performance.now() - startedAt);
      setStats({
        attempts,
        found: foundRows.length,
        startedAt: Date.now() - elapsedMs,
        elapsedMs,
        stopped,
      });
      setResults(foundRows);

      addLog({
        level: foundRows.length ? "success" : "warning",
        category: LOG_CATEGORY.SOLANA_VANITY,
        message: stopped ? "Solana 虚荣地址计算已停止" : "Solana 虚荣地址计算完成",
        meta: { attempts, found: foundRows.length, elapsedMs },
      });

      if (foundRows.length) {
        message.success(`已找到 ${foundRows.length} 个匹配地址`);
      } else if (stopped) {
        message.info("已停止计算");
      } else {
        message.warning("达到最大尝试次数，未找到匹配地址");
      }
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.SOLANA_VANITY,
        message: "Solana 虚荣地址计算失败",
        meta: { error: error?.message || "unknown" },
      });
      message.error(error?.message || "计算失败");
    } finally {
      setRunning(false);
      stopRef.current = false;
    }
  };

  const handleStop = () => {
    stopRef.current = true;
  };

  const handleExport = () => {
    if (!results.length) {
      message.warning("暂无可导出的结果");
      return;
    }
    if (!showSecretKey) {
      message.warning("导出前需要先确认显示 Secret Key");
      return;
    }

    downloadCsv("solana-vanity-addresses.csv", [
      ["index", "address", "secretKeyJson", "attempts", "elapsedMs"],
      ...results.map((item) => [
        item.index,
        item.address,
        item.secretKeyJson,
        item.attempts,
        item.elapsedMs,
      ]),
    ]);
  };

  return (
    <Card title="Solana 虚荣地址计算">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          type="warning"
          showIcon
          message="本工具仅在本地浏览器生成 Keypair"
          description="匹配长度越长，计算量越大。Secret Key 是钱包控制权，导出后请离线保存，不要上传或截图。"
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="space-y-2">
            <Text strong>匹配位置</Text>
            <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} optionType="button">
              <Radio.Button value="prefix">前缀</Radio.Button>
              <Radio.Button value="suffix">后缀</Radio.Button>
              <Radio.Button value="contains">包含</Radio.Button>
            </Radio.Group>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <Text strong>匹配字符</Text>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              status={invalidPattern ? "error" : undefined}
              placeholder="例如: SOL 或 abc"
              disabled={running}
            />
          </div>

          <div className="space-y-2">
            <Text strong>区分大小写</Text>
            <div>
              <Switch
                checked={caseSensitive}
                onChange={setCaseSensitive}
                checkedChildren="开"
                unCheckedChildren="关"
                disabled={running}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Text strong>目标数量</Text>
            <InputNumber
              className="!w-full"
              min={1}
              max={20}
              value={targetCount}
              onChange={(value) => setTargetCount(value || 1)}
              disabled={running}
            />
          </div>
          <div className="space-y-2">
            <Text strong>最大尝试次数</Text>
            <InputNumber
              className="!w-full"
              min={100}
              max={50000000}
              step={10000}
              value={maxAttempts}
              onChange={(value) => setMaxAttempts(value || 100)}
              disabled={running}
            />
          </div>
          <div className="space-y-2">
            <Text strong>每批尝试</Text>
            <InputNumber
              className="!w-full"
              min={50}
              max={5000}
              step={50}
              value={batchSize}
              onChange={(value) => setBatchSize(value || 50)}
              disabled={running}
            />
          </div>
        </div>

        <Space wrap>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleStart}
            loading={running}
          >
            开始计算
          </Button>
          <Button icon={<StopOutlined />} onClick={handleStop} disabled={!running}>
            停止
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!results.length}>
            导出 CSV
          </Button>
          <Space>
            <Text>显示 Secret Key</Text>
            <Switch
              checked={showSecretKey}
              onChange={handleShowSecretKeyChange}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </Space>
        </Space>

        <Space size="large" wrap>
          <Statistic title="尝试次数" value={stats.attempts} />
          <Statistic title="命中数量" value={stats.found} />
          <Statistic title="速度" value={attemptsPerSecond} suffix="次/秒" />
          <Statistic title="耗时" value={(stats.elapsedMs / 1000).toFixed(1)} suffix="秒" />
          {stats.stopped && <Tag color="orange">已停止</Tag>}
        </Space>

        <Table
          rowKey={(record) => `${record.address}-${record.index}`}
          loading={running}
          dataSource={results}
          columns={columns}
          pagination={{ pageSize: 8 }}
          scroll={{ x: "max-content" }}
        />
      </Space>
    </Card>
  );
}

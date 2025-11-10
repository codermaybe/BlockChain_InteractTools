import { useState, useCallback } from "react";
import { Input, Typography, Space, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { parseUnits, formatUnits } from "ethers";

const { Title, Paragraph, Text } = Typography;

export default function UnitConverter() {
  const [wei, setWei] = useState("");
  const [gwei, setGwei] = useState("");
  const [ether, setEther] = useState("");
  const [editing, setEditing] = useState(null); // 'wei' | 'gwei' | 'ether' | null

  const copy = useCallback(async (val) => {
    try {
      await navigator.clipboard.writeText(val || "");
      message.success("已复制");
    } catch (e) {
      message.error("复制失败");
    }
  }, []);

  const updateFromWei = useCallback(
    (v) => {
      if (v === "") {
        setWei("");
        setGwei("");
        setEther("");
        return;
      }
      try {
        // v must be integer string
        const g = formatUnits(v, "gwei");
        const e = formatUnits(v, "ether");
        setWei(v);
        setGwei(g);
        setEther(e);
      } catch (_) {
        // ignore invalid
      }
    },
    []
  );

  const updateFromGwei = useCallback(
    (v) => {
      if (v === "") {
        setWei("");
        setGwei("");
        setEther("");
        return;
      }
      try {
        const w = parseUnits(v, "gwei").toString();
        const e = formatUnits(w, "ether");
        setWei(w);
        setGwei(v);
        setEther(e);
      } catch (_) {}
    },
    []
  );

  const updateFromEther = useCallback(
    (v) => {
      if (v === "") {
        setWei("");
        setGwei("");
        setEther("");
        return;
      }
      try {
        const w = parseUnits(v, "ether").toString();
        const g = formatUnits(w, "gwei");
        setWei(w);
        setGwei(g);
        setEther(v);
      } catch (_) {}
    },
    []
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <Title level={4}>单位换算器（Wei / Gwei / Ether）</Title>
      <Paragraph type="secondary">
        输入任意一项，其余自动换算。支持小数（Gwei、Ether）。
      </Paragraph>

      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        <div>
          <Text strong style={{ display: "block", marginBottom: 4 }}>
            Wei（整数）
          </Text>
          <Input
            placeholder="例如：1000000000000000000"
            value={wei}
            onChange={(e) => {
              setEditing("wei");
              const v = e.target.value.trim();
              // Only allow digits for wei
              if (/^\d*$/.test(v)) {
                updateFromWei(v);
              }
              setEditing(null);
            }}
            addonAfter={<CopyOutlined onClick={() => copy(wei)} />}
          />
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 4 }}>Gwei</Text>
          <Input
            placeholder="例如：1000000000"
            value={gwei}
            onChange={(e) => {
              setEditing("gwei");
              const v = e.target.value.trim();
              // allow decimal
              if (/^\d*(?:\.\d*)?$/.test(v)) {
                updateFromGwei(v);
              }
              setEditing(null);
            }}
            addonAfter={<CopyOutlined onClick={() => copy(gwei)} />}
          />
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 4 }}>Ether</Text>
          <Input
            placeholder="例如：1"
            value={ether}
            onChange={(e) => {
              setEditing("ether");
              const v = e.target.value.trim();
              if (/^\d*(?:\.\d*)?$/.test(v)) {
                updateFromEther(v);
              }
              setEditing(null);
            }}
            addonAfter={<CopyOutlined onClick={() => copy(ether)} />}
          />
        </div>
      </Space>
    </div>
  );
}


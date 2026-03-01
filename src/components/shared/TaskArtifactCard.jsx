import React from "react";
import { Button, Card, Space, Tag, Typography } from "antd";

const { Text } = Typography;

function formatTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function TaskArtifactCard({ artifact }) {
  if (!artifact) return null;

  return (
    <Card size="small" className="border-slate-200">
      <Space direction="vertical" size={6} style={{ width: "100%" }}>
        <Space wrap className="justify-between">
          <Space wrap>
            <Text strong>{artifact.title}</Text>
            <Tag color={artifact.color || "blue"}>{artifact.type || "记录"}</Tag>
          </Space>
          <Text type="secondary">{formatTime(artifact.createdAt)}</Text>
        </Space>

        {artifact.summary && <Text>{artifact.summary}</Text>}

        {artifact.stats && (
          <Space wrap>
            {Object.entries(artifact.stats).map(([key, value]) => (
              <Tag key={key}>{`${key}: ${value}`}</Tag>
            ))}
          </Space>
        )}

        {artifact.actions?.length > 0 && (
          <Space wrap>
            {artifact.actions.map((action) => (
              <Button
                key={action.key || action.label}
                size="small"
                type={action.type || "default"}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        )}
      </Space>
    </Card>
  );
}

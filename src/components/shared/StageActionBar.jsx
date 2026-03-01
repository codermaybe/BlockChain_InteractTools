import React from "react";
import { Button, Space, Tag } from "antd";

const STAGE_MAP = {
  draft: { color: "default", text: "草稿" },
  previewed: { color: "blue", text: "已预览" },
  checked: { color: "gold", text: "待执行" },
  applied: { color: "green", text: "已完成" },
};

export default function StageActionBar({
  stage = "draft",
  onPreview,
  onRun,
  onApply,
  loadingStage = "",
  previewDisabled = false,
  runDisabled = false,
  applyDisabled = false,
  applyDanger = false,
  applyText = "执行",
  runText = "运行检查",
  previewText = "预览",
}) {
  const stageMeta = STAGE_MAP[stage] || STAGE_MAP.draft;

  return (
    <Space wrap className="w-full justify-between">
      <Space wrap>
        <Button onClick={onPreview} loading={loadingStage === "preview"} disabled={previewDisabled}>
          {previewText}
        </Button>
        <Button onClick={onRun} loading={loadingStage === "run"} disabled={runDisabled}>
          {runText}
        </Button>
        <Button
          type="primary"
          danger={applyDanger}
          onClick={onApply}
          loading={loadingStage === "apply"}
          disabled={applyDisabled}
        >
          {applyText}
        </Button>
      </Space>
      <Tag color={stageMeta.color}>{stageMeta.text}</Tag>
    </Space>
  );
}

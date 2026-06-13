import React, { useState } from "react";
import { Button, Card, Progress, Select, Space, Statistic, Typography } from "antd";
import StageActionBar from "./StageActionBar.jsx";
import TaskArtifactCard from "./TaskArtifactCard.jsx";
import TaskResultTable from "./TaskResultTable.jsx";

const { Text } = Typography;

export default function BatchTaskWorkbench({
  task,
  configSlot,
  title = "批量任务工作台",
  previewText = "预览",
  runText = "运行检查",
  applyText = "执行",
  applyDanger = false,
  onPreview,
  onRun,
  onApply,
  onRestore,
  onExport,
  extraColumns = [],
  pageSize = 8,
}) {
  const [selectedVersion, setSelectedVersion] = useState("");
  const total = task?.progress?.total || 0;
  const completed = task?.progress?.completed || 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  const versionOptions = (task?.versions || []).map((version) => ({
    label: version.meta?.label || version.label || version.createdAt,
    value: version.id,
  }));

  return (
    <Card title={title}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {configSlot}

        <StageActionBar
          stage={task?.stage}
          loadingStage={task?.loadingStage}
          onPreview={onPreview ?? task?.preview}
          onRun={onRun ?? task?.runCheck}
          onApply={onApply ?? task?.apply}
          previewText={previewText}
          runText={runText}
          applyText={applyText}
          applyDanger={applyDanger}
          runDisabled={task?.stage === "draft"}
          applyDisabled={task?.stage !== "checked"}
        />

        <Progress percent={percent} status={task?.loadingStage === "apply" ? "active" : "normal"} />

        <Space wrap>
          <Statistic title="总数" value={task?.summary?.total || 0} />
          <Statistic title="成功" value={task?.summary?.success || 0} />
          <Statistic title="失败" value={task?.summary?.failed || 0} />
        </Space>

        {!!versionOptions.length && (
          <Space wrap>
            <Select
              style={{ minWidth: 220 }}
              placeholder="选择历史版本"
              options={versionOptions}
              value={selectedVersion || undefined}
              onChange={setSelectedVersion}
            />
            <Button
              onClick={() => {
                const snapshot = task?.restoreVersion?.(selectedVersion);
                if (onRestore) onRestore(snapshot);
              }}
              disabled={!selectedVersion}
            >
              恢复版本
            </Button>
          </Space>
        )}

        {!!task?.artifacts?.length && (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Text strong>任务产物</Text>
            {task.artifacts.map((artifact) => (
              <TaskArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </Space>
        )}

        <TaskResultTable
          rows={task?.rows || []}
          loading={task?.loadingStage === "apply"}
          extraColumns={extraColumns}
          pageSize={pageSize}
        />

        {onExport && (
          <Button onClick={onExport} disabled={!task?.rows?.length}>
            导出结果
          </Button>
        )}
      </Space>
    </Card>
  );
}

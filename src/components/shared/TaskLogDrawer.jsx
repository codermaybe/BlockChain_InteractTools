import React from "react";
import { Button, Drawer, Space, Table, Tag, Typography } from "antd";
import { useTaskLog } from "../../state/TaskLogContext";

const { Text } = Typography;

const LEVEL_COLOR = {
  info: "blue",
  success: "green",
  warning: "orange",
  error: "red",
};

function formatTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export default function TaskLogDrawer({ open, onClose }) {
  const { logs, clearLogs } = useTaskLog();

  return (
    <Drawer
      title="任务日志"
      placement="right"
      width={620}
      open={open}
      onClose={onClose}
      destroyOnClose={false}
      extra={
        <Space>
          <Button onClick={clearLogs}>清空日志</Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <Text type="secondary">
          共 {logs.length} 条日志，默认保留最近 300 条（含成功/错误信息）。
        </Text>
        <Table
          rowKey="id"
          dataSource={logs}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
          columns={[
            {
              title: "时间",
              dataIndex: "createdAt",
              key: "createdAt",
              width: 180,
              render: (value) => formatTime(value),
            },
            {
              title: "级别",
              dataIndex: "level",
              key: "level",
              width: 90,
              render: (value) => <Tag color={LEVEL_COLOR[value] || "default"}>{value}</Tag>,
            },
            {
              title: "分类",
              dataIndex: "category",
              key: "category",
              width: 140,
            },
            {
              title: "消息",
              dataIndex: "message",
              key: "message",
              ellipsis: true,
            },
          ]}
          expandable={{
            expandedRowRender: (record) => (
              <pre className="m-0 whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs">
                {JSON.stringify(record.meta || {}, null, 2)}
              </pre>
            ),
            rowExpandable: (record) =>
              record.meta && Object.keys(record.meta).length > 0,
          }}
        />
      </Space>
    </Drawer>
  );
}

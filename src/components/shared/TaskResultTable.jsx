import React from "react";
import { Table, Tag } from "antd";

const DEFAULT_COLUMNS = [
  {
    title: "#",
    dataIndex: "index",
    key: "index",
    width: 70,
  },
  {
    title: "任务",
    dataIndex: "task",
    key: "task",
    ellipsis: true,
    width: 240,
  },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 110,
    render: (status) =>
      status === "success" ? (
        <Tag color="success">成功</Tag>
      ) : (
        <Tag color="error">失败</Tag>
      ),
  },
  {
    title: "结果",
    dataIndex: "output",
    key: "output",
    ellipsis: true,
  },
  {
    title: "错误",
    dataIndex: "error",
    key: "error",
    ellipsis: true,
  },
];

export default function TaskResultTable({
  rows,
  loading,
  extraColumns = [],
  pageSize = 8,
}) {
  return (
    <Table
      rowKey={(record) => record.id || `${record.task || "task"}-${record.index || "row"}`}
      dataSource={rows}
      loading={loading}
      columns={[...DEFAULT_COLUMNS, ...extraColumns]}
      pagination={{ pageSize }}
      size="small"
      scroll={{ x: "max-content" }}
      locale={{ emptyText: "暂无任务结果" }}
    />
  );
}

import React, { useMemo } from "react";
import { Tabs } from "antd";

export default function ToolTabs({
  description,
  items,
  defaultActiveKey,
  centered = false,
}) {
  const wrappedItems = useMemo(
    () => items || [],
    [items]
  );

  return (
    <div className="space-y-2">
      {description && (
        <p className="m-0 px-1 text-sm text-slate-500">{description}</p>
      )}
      <Tabs
        defaultActiveKey={defaultActiveKey}
        items={wrappedItems}
        centered={centered}
        className="tool-tabs-shell [&_.ant-tabs-tab]:px-3 [&_.ant-tabs-tab]:py-2"
      />
    </div>
  );
}

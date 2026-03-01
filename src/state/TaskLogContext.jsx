import React, { createContext, useContext, useMemo, useState } from "react";

const MAX_LOGS = 300;
const TaskLogContext = createContext(null);

export function TaskLogProvider({ children }) {
  const [logs, setLogs] = useState([]);

  const api = useMemo(
    () => ({
      logs,
      addLog: ({ level = "info", category = "general", message, meta = {} }) => {
        const next = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          level,
          category,
          message: message || "",
          meta,
          createdAt: new Date().toISOString(),
        };
        setLogs((prev) => [next, ...prev].slice(0, MAX_LOGS));
      },
      clearLogs: () => setLogs([]),
      errorCount: logs.filter((item) => item.level === "error").length,
    }),
    [logs]
  );

  return <TaskLogContext.Provider value={api}>{children}</TaskLogContext.Provider>;
}

export function useTaskLog() {
  const ctx = useContext(TaskLogContext);
  if (!ctx) {
    throw new Error("useTaskLog must be used inside TaskLogProvider");
  }
  return ctx;
}

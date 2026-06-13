import { useEffect, useRef, useState } from "react";
import { MAX_TASK_ARTIFACTS, MAX_TASK_VERSIONS, createTaskId, runTaskQueue } from "../utils/taskRunner";

const INITIAL_PROGRESS = { completed: 0, total: 0 };
const INITIAL_SUMMARY = { total: 0, success: 0, failed: 0 };

function trimList(items, limit) {
  return items.slice(Math.max(items.length - limit, 0));
}

function stripSensitiveFields(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveFields(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const next = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "privateKey" || key === "mnemonic" || key === "seedPhrase") {
      continue;
    }
    next[key] = stripSensitiveFields(item);
  }
  return next;
}

function toRows(items, results) {
  return results.map((result, index) => {
    const source = Array.isArray(items) ? items[index] : undefined;
    const task =
      (source && typeof source === "object" && (source.task || source.label || source.name || source.input)) ||
      (typeof source === "string" ? source : undefined) ||
      `Task ${index + 1}`;

    // worker 可返回原始值（直接作为结果列），或 { text, data } 结构：
    // text 作为结果列展示，data 内字段平铺到行上，供 extraColumns 取用（如 txHash / extra）。
    const raw = result.output;
    const structured = raw && typeof raw === "object" && !Array.isArray(raw);
    const extra = structured && raw.data && typeof raw.data === "object" ? raw.data : null;

    return {
      id: source && typeof source === "object" && source.id ? source.id : createTaskId(),
      index: index + 1,
      task,
      status: result.status,
      output: structured ? raw.text ?? "" : raw,
      error: result.error,
      durationMs: result.durationMs,
      ...(extra || {}),
    };
  });
}

export function useStagedTask(cfg = {}) {
  const mountedRef = useRef(true);
  const [stage, setStage] = useState("draft");
  const [loadingStage, setLoadingStage] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [runCheckData, setRunCheckData] = useState(null);
  const [rows, setRows] = useState([]);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [artifacts, setArtifacts] = useState([]);
  const [versions, setVersions] = useState([]);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    []
  );

  const preview = async (input) => {
    if (typeof cfg.parsePreview !== "function") {
      throw new Error("useStagedTask requires cfg.parsePreview");
    }

    setLoadingStage("preview");
    try {
      const data = await cfg.parsePreview(input);
      if (!mountedRef.current) return data;
      setPreviewData(data);
      setStage("previewed");
      return data;
    } finally {
      if (mountedRef.current) {
        setLoadingStage("");
      }
    }
  };

  const runCheck = async (ctx = {}) => {
    if (typeof cfg.runCheck !== "function") {
      throw new Error("useStagedTask requires cfg.runCheck");
    }

    setLoadingStage("run");
    try {
      const data = await cfg.runCheck(ctx);
      if (!mountedRef.current) return data;
      setRunCheckData(data);
      setStage("checked");
      return data;
    } finally {
      if (mountedRef.current) {
        setLoadingStage("");
      }
    }
  };

  const apply = async (ctx = {}, concurrency = cfg.defaultConcurrency ?? 5) => {
    if (typeof cfg.buildWorker !== "function") {
      throw new Error("useStagedTask requires cfg.buildWorker");
    }

    const items = Array.isArray(ctx.items)
      ? ctx.items
      : Array.isArray(ctx.valid)
        ? ctx.valid
        : [];
    const worker = cfg.buildWorker(ctx);

    setLoadingStage("apply");
    try {
      const queueResult = await runTaskQueue({
        items,
        worker,
        concurrency,
        onProgress: ({ completed, total }) => {
          if (mountedRef.current) {
            setProgress({ completed, total });
          }
        },
      });

      if (!mountedRef.current) return queueResult;

      const nextRows = toRows(items, queueResult.results);
      setRows(nextRows);
      setSummary({
        total: queueResult.total,
        success: queueResult.success,
        failed: queueResult.failed,
      });
      setProgress({ completed: queueResult.total, total: queueResult.total });
      setStage("applied");
      return { ...queueResult, rows: nextRows };
    } finally {
      if (mountedRef.current) {
        setLoadingStage("");
      }
    }
  };

  const saveVersion = (snapshot, meta = {}) => {
    const nextVersion = {
      id: createTaskId(),
      createdAt: new Date().toISOString(),
      snapshot: stripSensitiveFields(snapshot),
      meta: stripSensitiveFields(meta),
    };

    setVersions((prev) => trimList([...prev, nextVersion], MAX_TASK_VERSIONS));
    return nextVersion;
  };

  const restoreVersion = (versionId) => {
    const version = versions.find((item) => item.id === versionId) || null;
    if (!version) {
      return null;
    }
    return version.snapshot;
  };

  const pushArtifact = (artifact) => {
    const nextArtifact = {
      id: createTaskId(),
      createdAt: new Date().toISOString(),
      ...artifact,
    };

    setArtifacts((prev) => trimList([...prev, nextArtifact], MAX_TASK_ARTIFACTS));
    return nextArtifact;
  };

  const reset = () => {
    setStage("draft");
    setLoadingStage("");
    setPreviewData(null);
    setRunCheckData(null);
    setRows([]);
    setProgress(INITIAL_PROGRESS);
    setSummary(INITIAL_SUMMARY);
    setArtifacts([]);
    setVersions([]);
  };

  return {
    stage,
    loadingStage,
    previewData,
    runCheckData,
    rows,
    progress,
    summary,
    artifacts,
    versions,
    preview,
    runCheck,
    apply,
    saveVersion,
    restoreVersion,
    pushArtifact,
    reset,
  };
}

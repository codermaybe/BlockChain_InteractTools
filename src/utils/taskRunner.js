function normalizeConcurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return 1;
  }
  return Math.min(Math.floor(n), 30);
}

export async function runTaskQueue({
  items,
  worker,
  concurrency = 5,
  onProgress,
}) {
  const taskItems = Array.isArray(items) ? items : [];
  const finalConcurrency = normalizeConcurrency(concurrency);
  const total = taskItems.length;
  const results = new Array(total);

  let completed = 0;
  let cursor = 0;

  async function consumeNext() {
    while (cursor < total) {
      const current = cursor;
      cursor += 1;

      const startedAt = Date.now();
      try {
        const output = await worker(taskItems[current], current);
        results[current] = {
          status: "success",
          output,
          error: "",
          durationMs: Date.now() - startedAt,
        };
      } catch (error) {
        results[current] = {
          status: "failed",
          output: null,
          error: error?.message || "未知错误",
          durationMs: Date.now() - startedAt,
        };
      } finally {
        completed += 1;
        if (onProgress) {
          onProgress({ completed, total, current });
        }
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(finalConcurrency, total); i += 1) {
    workers.push(consumeNext());
  }

  await Promise.all(workers);

  return {
    results,
    total,
    success: results.filter((item) => item.status === "success").length,
    failed: results.filter((item) => item.status === "failed").length,
  };
}

export function parseLineItems(text) {
  return (text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((field) => {
          const value = field === null || field === undefined ? "" : `${field}`;
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

import { getEvmChainByKey } from "../../config/chainRegistry.js";

async function fetchExplorerJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }

  const data = await response.json();
  if (data.status === "0" && data.message !== "No transactions found") {
    throw new Error(data.result || data.message || "浏览器 API 查询失败");
  }
  return data;
}

function getExplorerApiBase(chainKey) {
  const chain = getEvmChainByKey(chainKey);
  if (!chain.explorerApiBase) {
    throw new Error(`${chain.name} 暂不支持浏览器 API`);
  }
  return { chain, apiBase: chain.explorerApiBase };
}

export async function fetchTxList({ chainKey, address, apiKey, page = 1, offset = 50 }) {
  const { chain, apiBase } = getExplorerApiBase(chainKey);
  const params = new URLSearchParams({
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: `${page}`,
    offset: `${offset}`,
    sort: "desc",
    apikey: apiKey || "",
  });
  const data = await fetchExplorerJson(`${apiBase}?${params.toString()}`);
  return {
    chain,
    result: Array.isArray(data.result) ? data.result : [],
    raw: data,
  };
}

export async function fetchNativeBalance({ chainKey, address, apiKey }) {
  const { chain, apiBase } = getExplorerApiBase(chainKey);
  const params = new URLSearchParams({
    module: "account",
    action: "balance",
    address,
    tag: "latest",
    apikey: apiKey || "",
  });
  const data = await fetchExplorerJson(`${apiBase}?${params.toString()}`);
  return {
    chain,
    result: data.result,
    raw: data,
  };
}

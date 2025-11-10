# BlockChain_InteractTools

面向以太坊等链的交互工具（React + JS + Ethers + solc-js），已整合 Tauri v2，可直接开发与打包桌面应用。

**当前状态**
- 仅保留主分支 `main`，历史快照以 tag 方式保留：`pre-merge-master`、`pre-merge-tauri-version`、发布点 `v0.2.7`。
- 已迁移到 Vite（保留 CRA 以便回退），Tauri 联动端口为 `9754`。

**功能概览（持续完善）**
- 钱包基础：创建、助记词恢复、转账、基础数据
  - 参考：`src/components/ethers/wallet_basic_functions/`
- 钱包增强：事件监听、交易历史、聚合器
  - 参考：`src/components/ethers/wallet_upgrate_functions/`
- 余额/代币：ETH 余额、ERC20/721/1155 查询、通用合约交互
  - 参考：`src/components/ethers/GetBalance/`, `src/components/ethers/GetTokenBalance/`
- 合约部署与验证：本地编译部署，Etherscan 验证
  - 参考：`src/components/ethers/DeployAndVerify/`
- Solana：余额查询（基础）
  - 参考：提交记录“完成 solana 余额查询部分”

**目录结构（节选）**
- `src-tauri/`：Tauri 配置与 Rust 端
- `src/`：React 前端代码（CRA）
- `public/`：静态资源（CRA）
- `package.json`：脚本与依赖（含 `@tauri-apps/cli`）
- `.env`：本地环境变量（含 `PORT=9754`）

## 环境要求
- Node.js ≥ 20.18（推荐 20.18.0）与 npm（或 pnpm/yarn 自行替代）
- Rust 稳定版工具链：`rustup`, `cargo`
- Windows（开发/打包）：需安装 Visual Studio C++ 构建工具（Desktop development with C++）

## 快速开始
- 安装依赖：
  - `npm install`
- 开发（Vite 浏览器预览，推荐）：
  - `npm run dev:vite` → `http://localhost:9754`
- 开发（Tauri 桌面版调试，走 Vite）：
  - `npm run tauri:dev`
- 构建（Web 静态站点 via Vite）：
  - `npm run build:vite` → 输出到 `dist/`
- 构建（Tauri 桌面应用）：
  - `npm run tauri:build` → 输出到 `src-tauri/target/release/bundle/`
- 兼容保留（可选）：
  - CRA 开发：`npm start`（端口仍取 `.env` 中 `PORT=9754`）
  - CRA 构建：`npm run build` → `build/`

## 版本管理（自动同步）
- 版本统一以 `package.json:1` 为准，执行 `npm version` 自动同步到：
  - `src-tauri/tauri.conf.json:1` 的 `version`
  - `src-tauri/Cargo.toml:1` 的 `[package] version`
- 命令示例：
  - 补丁升级：`npm version patch`（如 0.2.7 → 0.2.8）
  - 次版本：`npm version minor`
  - 主版本：`npm version major`
- 同步逻辑位于：`scripts/sync-version.js:1`，通过 `package.json` 的 `scripts.version` 钩子自动执行。

## 发版流程（Tag 驱动）
- 本地执行：`npm version patch|minor|major`
  - 自动：同步 Tauri 与 Cargo 版本，并创建 commit + tag（含同步的文件）
  - 自动：执行 `postversion` 推送到远端（含 tag）
- GitHub Actions（见 `.github/workflows/tauri-release.yml:1`）会在 `v*` tag 触发，三平台打包并发布 Release。
- 如需夜构产物（不发 Release），参见 `.github/workflows/tauri-nightly.yml:1`。

## 关键配置
- 端口（开发）：
  - `.env:1` 设置 `PORT=9754`
  - `src-tauri/tauri.conf.json:6` → `build.devUrl = "http://localhost:9754"`
- 构建路径（生产）：
  - Vite 输出 `dist/`（`src-tauri/tauri.conf.json:6` → `build.frontendDist = "../dist"`）
  - CRA 输出 `build/`（兼容保留）
- 常用脚本（`package.json:33` 起）：
  - Vite：`dev:vite`、`build:vite`、`preview:vite`
  - CRA：`start`、`build`
  - Tauri：`tauri:dev`、`tauri:build`

## 环境变量与外部服务
- `.env:1` 示例：
  - `PORT=9754`（开发端口）
  - 已兼容两种风格：
    - CRA：`REACT_APP_ganacheAddress`、`REACT_APP_ganacheRpc`、`REACT_APP_BASE_URL`
    - Vite：`VITE_ganacheAddress`、`VITE_ganacheRpc`、`VITE_BASE_URL`
  - 代码中已提供兼容读取（见 `src/env.js:1`），可逐步迁移为 `VITE_*`。
- 如使用 Etherscan API（合约验证/查询），请自行配置 API Key（可放入 `.env` 以 `REACT_APP_...` 形式）。
- 访问主网/测试网请配置可靠的 RPC（Infura/Alchemy/自建节点等）。

## 注意事项与排错
- 端口占用：如 9754 被占用，修改 `.env` 的 `PORT`，同时更新 `src-tauri/tauri.conf.json` 的 `devUrl`。
- Tauri 打包失败：确认 Rust 工具链与平台构建依赖安装完整；Windows 需 MSVC。
- 依赖安装失败：切换国内源或使用 pnpm/yarn；Node 版本需满足 18+。

## 历史与分支
- 仅保留 `main` 分支，旧分支已清理：`master`、`tauri-version`（合并并入）。
- 历史快照与发布点：`pre-merge-master`、`pre-merge-tauri-version`、`v0.2.7`。

---

欢迎提交问题与建议，后续会继续补充功能与文档（尤其是合约验证流程、事件监听与交易历史的使用说明）。

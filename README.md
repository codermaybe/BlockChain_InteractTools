# BlockChain Interact Tools

Blockchain Interact Tools 是一个面向 EVM 与 Solana 的桌面交互工具箱，前端使用 React + Vite，桌面壳使用 Tauri v2。

当前主线聚焦三件事：链上交互工具、批量任务工作台、桌面端发布流程。

## 功能概览

- EVM 余额与基础查询：原生余额、合约查询、Explorer API、单位换算
- EVM 钱包工具：创建钱包、恢复钱包、转账、基础链数据
- EVM 进阶工具：交易历史、合约事件监听、ERC20 归集
- 合约交互：基于 ABI 的通用读写面板
- 批量任务：批量钱包生成、批量余额检查、批量转账、多链 Gas 面板
- Solana：余额查询与批量查询能力
- 全局能力：RPC 配置、Explorer API Key、任务日志、敏感输入脱敏

## 技术栈

- React 18
- Vite 5
- Tauri 2
- ethers v6
- @solana/web3.js
- Ant Design
- Vitest
- ESLint

## 目录结构

```text
src/
  components/
    batch/                 # 批量任务工具
    features/evm/          # EVM 功能组件
      advanced/            # 进阶钱包/合约工具
      balance/             # 余额与 Explorer 查询
      tools/               # EVM 小工具
      wallet/              # 钱包基础工具
    shared/                # 共享 UI 组件
    solana/                # Solana 工具
  config/                  # 链配置、ABI、日志分类
  container/               # 页面容器与导航承载
  hooks/                   # 复用状态与任务 hooks
  services/                # 链交互服务层
  state/                   # 全局设置与任务日志
  utils/                   # 通用工具
src-tauri/                 # Tauri 配置与 Rust 壳
docs/                      # 架构与任务文档
```

## 环境要求

- Node.js >= 20.19.0
- npm >= 9
- Rust stable toolchain
- Tauri 对应平台依赖

Linux 打包需要 GTK/WebKit 依赖。GitHub Actions 中的 Tauri workflow 已包含 Ubuntu 依赖安装步骤。

## 本地开发

安装依赖：

```bash
npm install
```

启动 Vite：

```bash
npm run dev:vite
```

启动 Tauri 桌面开发模式：

```bash
npm run tauri:dev
```

Vite 开发端口固定为 `9754`，与 `src-tauri/tauri.conf.json` 的 `devUrl` 保持一致。

## 验证命令

```bash
npm run lint
npm test
npm run build:vite
```

Tauri 打包：

```bash
npm run tauri:build
```

## CI/CD

项目包含三个 GitHub Actions workflow：

- `.github/workflows/ci.yml`：PR 与 main/master push 的轻量校验，执行 lint、test、Vite build
- `.github/workflows/tauri-nightly.yml`：main 分支 nightly 桌面产物构建
- `.github/workflows/tauri-release.yml`：`v*` tag 触发正式 Tauri Release

常规开发建议先确保本地通过：

```bash
npm run lint
npm test
npm run build:vite
```

## 版本与发版

版本号以 `package.json` 为准，并通过 `npm version` 自动同步到：

- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

发补丁版本：

```bash
npm version patch
```

发次版本：

```bash
npm version minor
```

`npm version` 会自动：

- 更新 `package.json` 与 `package-lock.json`
- 运行 `scripts/sync-version.js`
- 同步 Tauri/Cargo 版本
- 创建版本 commit
- 创建 `v*` tag
- 执行 `git push` 与 `git push --tags`

推送 tag 后会触发 `Tauri Release` workflow。

## 安全约束

- 私钥与助记词不得写入 localStorage、日志、URL、版本快照或默认 CSV 导出
- 私钥展示必须默认脱敏，高风险显形需要用户确认
- EVM signer 创建集中在 `services/evm/signerFactory.js`
- 组件层通过 services/hooks/shared 组合业务，避免直接散落 provider/signer/ABI 逻辑

## 当前状态

- 主线已经切换到 Vite + Tauri v2
- EVM 功能目录已统一到 `src/components/features/evm/`
- 已接入 Vitest 单元测试、ESLint 与 GitHub CI
- 发布由 `npm version` + `v*` tag 驱动

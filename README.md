# BlockChain_InteractTools

区块链交互工具（React + JS + Ethers + solc-js），同时提供 Tauri 桌面版。

## 分支与结构
- `master`: 完整 React Web 应用（CRA）。
- `tauri-version`: 原始 Tauri v2 模板与配置（`src-tauri/`）。
- `tauri-merge`: 将两者合并后的可直接开发与打包的 Tauri 版本（当前分支）。

## 运行与构建

前置要求（Tauri 官方要求）：
- Node.js 18+ 与 npm
- Rust 工具链（`rustup`, `cargo`）
- Windows/MSVC 构建依赖（Visual Studio Build Tools 或 Desktop development with C++）

安装依赖：
```
npm install
```

开发（Web，仅浏览器预览）：
```
npm start
```
> CRA 通过 `.env` 中的 `PORT=9754` 在 `http://localhost:9754` 启动。

开发（Tauri 桌面调试）：
```
npm run tauri:dev
```
> Tauri 配置了 `beforeDevCommand: "npm start"` 与 `devUrl: "http://localhost:9754"`，会自动启动并指向 CRA。

构建（Web 静态站点）：
```
npm run build
```
> 产物位于根目录 `build/`。

构建（Tauri 桌面应用）：
```
npm run tauri:build
```
> Tauri 使用 `build/` 作为前端资源（`src-tauri/tauri.conf.json` 中 `frontendDist: "../build"`）。
> 构建产物位于 `src-tauri/target/release/bundle/`（按平台生成安装包/可执行文件）。

## 其他说明
- 已将 `src-tauri/` 从 `tauri-version` 并入，并按 CRA 的输出目录调整为 `build/`。
- `.env` 中新增 `PORT=9754`，Tauri `devUrl` 也指向该端口，避免端口不一致。
- `package.json` 添加了 Tauri 脚本：`tauri`、`tauri:dev`、`tauri:build`，并在 `devDependencies` 中加入 `@tauri-apps/cli`。

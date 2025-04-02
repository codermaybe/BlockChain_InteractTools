# 用以纪录每次更新的*功能变化* 以及 _计划_

## 更新计划表

- 计划引入 1inch/uniswap 的闪兑功能
-

## 更新记录 4

- 尝试更新合约监听功能时遇阻  
  `@TODO Error: could not coalesce error (error={ "code": -32000, "message": "filter not found" }, payload={ "id": 8, "jsonrpc": "2.0", "method": "eth_getFilterChanges", "params": [ "0x43ab9106f753ccd6432590094471b40" ] }, code=UNKNOWN_ERROR, version=6.13.4)
  at makeError (errors.js:128:1)
  at JsonRpcProvider.getRpcError (provider-jsonrpc.js:811:1)
  at provider-jsonrpc.js:314:1`
  原因:httpurl 过滤器周期过短

- 重新尝试，更换 rpc 接口为 infura，获取成功。后续更新更健全的版本

### 部署与验证问题

- DeployContract 功能受阻
  WebAssembly.Compile is disallowed on the main thread, if the buffer size is larger than 8MB. Use WebAssembly.compile, compile on a worker thread, or use the flag `--enable-features=WebAssemblyUnlimitedSyncCompilation`.
  通过 fetch 加载 soljson-v0.8.20+commit.a1b79de6.js，然后用 URL.createObjectURL 创建临时脚本。
  这样避免了 Web Worker 的网络问题，但 solc/wrapper 内部仍然在主线程上执行 WebAssembly.compile。使用 worker 尝试仍旧失败。

      先调用remix部署工具，后续研究

- VerifyContract 功能受阻 1.尝试  
  2.[etherscan 合约验证](https://etherscan.io/verifyContract) ethercan 的合约验证功能无法通过 iframe 框架嵌入进工具，原因是 Etherscan 的 https://etherscan.io/verifyContract 页面设置了 X-Frame-Options: SAMEORIGIN 。
  ![alt text](./src/ExtraContent/ErrorsRecord/尝试嵌入etherscanVerify.png)

  后续考虑引入 hardhat 工具实现验证和部署功能

## 更新记录 3

- 引入 bip39 标准（助记词生成）

---

## 更新记录 2

- 钱包找回功能更新，初步版本
- 优化代码结构

---

## 更新记录 1

- 更新随机钱包生成
- 计划上线转账等功能的具体实现
- 计划上线区块链地址监听功能

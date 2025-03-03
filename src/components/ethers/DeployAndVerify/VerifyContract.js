import React, { useState } from "react";

export default function VerifyContract() {
  const [contractAddress, setContractAddress] = useState("");
  const [solidityCode, setSolidityCode] = useState("");

  const handleVerifyOnEtherscan = () => {
    if (!contractAddress.trim()) {
      alert("请输入合约地址");
      return;
    }
    if (!solidityCode.trim()) {
      alert("请输入 Solidity 源代码");
      return;
    }

    // 跳转到 Etherscan 的验证页面
    window.open("https://etherscan.io/verifyContract", "_blank");
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("已复制到剪贴板！");
    });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>验证智能合约</h2>
      <p>
        输入你的合约地址和源代码后，点击下方按钮，将在新标签页中打开 Etherscan
        的合约验证页面。 请按照页面提示完成验证。
      </p>
      <div style={{ marginBottom: "20px" }}>
        <label>合约地址</label>
        <div
          style={{ display: "flex", alignItems: "center", marginTop: "5px" }}
        >
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="请输入合约地址 (0x...)"
            style={{ width: "100%", padding: "8px" }}
          />
          <button
            onClick={() => handleCopy(contractAddress)}
            style={{ marginLeft: "10px" }}
          >
            复制地址
          </button>
        </div>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <label>源代码</label>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            marginTop: "5px",
          }}
        >
          <textarea
            rows={10}
            cols={50}
            value={solidityCode}
            onChange={(e) => setSolidityCode(e.target.value)}
            placeholder="请输入 Solidity 源代码"
            style={{ width: "100%", fontFamily: "monospace" }}
          />
          <button
            onClick={() => handleCopy(solidityCode)}
            style={{ marginLeft: "10px" }}
          >
            复制代码
          </button>
        </div>
      </div>
      <button onClick={handleVerifyOnEtherscan} style={{ marginTop: "10px" }}>
        前往 Etherscan 验证
      </button>
      <iframe src="https://etherscan.io/verifyContract"></iframe>
    </div>
  );
}

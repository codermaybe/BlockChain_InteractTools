import React, { useState, useEffect } from "react";

// 动态加载 solc
const loadSolc = async () => {
  const wrapper = await import("solc/wrapper");
  return new Promise((resolve, reject) => {
    // 加载 solc 的 WebAssembly 版本
    const script = document.createElement("script");
    script.src =
      "https://binaries.soliditylang.org/bin/soljson-v0.8.20+commit.a1b79de6.js";
    script.onload = () => {
      const solc = wrapper(window.Module);
      resolve(solc);
    };
    script.onerror = () => reject(new Error("无法加载 Solidity 编译器"));
    document.head.appendChild(script);
  });
};

export default function DeployContract() {
  const [solidityCode, setSolidityCode] = useState("");
  const [bytecode, setBytecode] = useState("");
  const [abi, setAbi] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [solcInstance, setSolcInstance] = useState(null);

  // 加载 solc 编译器
  useEffect(() => {
    loadSolc()
      .then((solc) => {
        setSolcInstance(solc);
        console.log("Solidity 编译器加载成功");
      })
      .catch((err) => {
        setError(`加载编译器失败: ${err.message}`);
      });
  }, []);

  const handleCompile = async () => {
    if (!solcInstance) {
      setError("Solidity 编译器未加载，请稍后重试");
      return;
    }

    try {
      // 清空之前的状态
      setError("");
      setSuccessMessage("");
      setBytecode("");
      setAbi([]);

      // 确保输入不为空
      if (!solidityCode.trim()) {
        setError("请输入 Solidity 代码");
        return;
      }

      // 配置编译输入
      const input = {
        language: "Solidity",
        sources: {
          "input.sol": {
            content: solidityCode,
          },
        },
        settings: {
          outputSelection: {
            "*": {
              "*": ["abi", "evm.bytecode"],
            },
          },
        },
      };

      // 编译合约
      const output = JSON.parse(solcInstance.compile(JSON.stringify(input)));

      // 检查是否有编译错误
      if (output.errors) {
        const errorMessages = output.errors
          .filter((error) => error.severity === "error")
          .map((error) => error.formattedMessage)
          .join("\n");
        if (errorMessages) {
          setError(`编译失败:\n${errorMessages}`);
          return;
        }
      }

      // 提取第一个合约的字节码和 ABI
      const contractEntries = Object.entries(
        output.contracts?.["input.sol"] || {}
      );
      if (contractEntries.length > 0) {
        const [contractName, contractData] = contractEntries[0];
        const contractBytecode = contractData.evm.bytecode.object;
        const contractAbi = contractData.abi;
        setBytecode(contractBytecode);
        setAbi(contractAbi);
        setSuccessMessage(`编译成功！合约名称: ${contractName}`);
      } else {
        setError("未找到有效的合约，请确保代码中定义了至少一个 contract");
      }
    } catch (err) {
      setError(`编译时发生错误: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>输入 Solidity 代码</h2>
      <textarea
        rows={10}
        cols={50}
        value={solidityCode}
        onChange={(e) => setSolidityCode(e.target.value)}
        placeholder="请输入 Solidity 代码，例如:\n\n// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract SimpleStorage {\n  uint256 public value;\n\n  function set(uint256 _value) public {\n    value = _value;\n  }\n\n  function get() public view returns (uint256) {\n    return value;\n  }\n}"
        style={{ width: "100%", fontFamily: "monospace" }}
      />
      <button
        onClick={handleCompile}
        style={{ marginTop: "10px" }}
        disabled={!solcInstance}
      >
        编译合约
      </button>
      {error && (
        <pre
          style={{ color: "red", marginTop: "10px", whiteSpace: "pre-wrap" }}
        >
          {error}
        </pre>
      )}
      {successMessage && (
        <p style={{ color: "green", marginTop: "10px" }}>{successMessage}</p>
      )}
      {bytecode && (
        <div style={{ marginTop: "20px" }}>
          <h2>字节码</h2>
          <pre
            style={{
              background: "#f0f0f0",
              padding: "10px",
              borderRadius: "4px",
              overflowX: "auto",
            }}
          >
            {bytecode}
          </pre>
        </div>
      )}
      {abi.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2>ABI</h2>
          <pre
            style={{
              background: "#f0f0f0",
              padding: "10px",
              borderRadius: "4px",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(abi, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

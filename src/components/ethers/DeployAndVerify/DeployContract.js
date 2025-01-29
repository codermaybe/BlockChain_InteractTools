import React, { useState } from "react";
import solc from "solc-js";
import { ethers } from "ethers";

export default function DeployContract() {
  const [solidityCode, setSolidityCode] = useState("");
  const [bytecode, setBytecode] = useState("");
  const [abi, setAbi] = useState([]);
  const [error, setError] = useState("");

  const handleCompile = () => {
    try {
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
      const output = JSON.parse(solc.compile(JSON.stringify(input)));

      // 检查是否有编译错误
      if (output.errors) {
        const errorMessages = output.errors
          .map((error) => error.formattedMessage)
          .join("\n");
        setError(errorMessages);
        setBytecode("");
        setAbi([]);
        return;
      }

      // 获取第一个合约的字节码和 ABI
      const contractEntries = Object.entries(output.contracts["input.sol"]);
      if (contractEntries.length > 0) {
        const [contractName, contractData] = contractEntries[0];
        const contractBytecode = contractData.evm.bytecode.object;
        const contractAbi = contractData.abi;
        setBytecode(contractBytecode);
        setAbi(contractAbi);
        setError("");
      } else {
        setError("未找到有效的合约");
        setBytecode("");
        setAbi([]);
      }
    } catch (err) {
      setError(`编译时发生错误: ${err.message}`);
      setBytecode("");
      setAbi([]);
    }
  };

  return (
    <div>
      <h2>输入 Solidity 代码</h2>
      <textarea
        rows={10}
        cols={50}
        value={solidityCode}
        onChange={(e) => setSolidityCode(e.target.value)}
      />
      <button onClick={handleCompile}>编译合约</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {bytecode && (
        <div>
          <h2>字节码</h2>
          <pre>{bytecode}</pre>
        </div>
      )}
      {abi.length > 0 && (
        <div>
          <h2>ABI</h2>
          <pre>{JSON.stringify(abi, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

import { PublicKey } from "@solana/web3.js";

export function toPublicKey(address) {
  try {
    return new PublicKey((address || "").trim());
  } catch {
    return null;
  }
}

export function formatSolanaAmount(rawValue, decimals) {
  const raw = BigInt(rawValue || 0);
  const precision = Math.max(0, Number(decimals) || 0);
  if (precision === 0) {
    return raw.toString();
  }

  const base = 10n ** BigInt(precision);
  const integer = raw / base;
  const fraction = raw % base;
  const padded = fraction.toString().padStart(precision, "0").replace(/0+$/, "");
  return padded ? `${integer.toString()}.${padded}` : integer.toString();
}

export async function resolveMintMeta(connection, mintPublicKey) {
  const accountInfo = await connection.getParsedAccountInfo(
    mintPublicKey,
    "confirmed"
  );
  const data = accountInfo?.value?.data;
  const parsed = data && typeof data === "object" ? data.parsed : null;
  if (!parsed || parsed.type !== "mint") {
    throw new Error("Mint 信息读取失败，请确认地址是否正确");
  }

  const ownerProgram = accountInfo.value.owner?.toBase58?.() || "";
  const programType =
    ownerProgram === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
      ? "TOKEN_2022"
      : "TOKEN";

  return {
    decimals: Number(parsed.info?.decimals || 0),
    programType,
  };
}

export async function resolveSolBalance(connection, ownerPublicKey) {
  const lamports = await connection.getBalance(ownerPublicKey, "confirmed");
  return {
    lamports,
    formatted: formatSolanaAmount(BigInt(lamports), 9),
  };
}

export async function resolveSplBalance(connection, ownerPublicKey, mintPublicKey, decimals) {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    ownerPublicKey,
    { mint: mintPublicKey },
    "confirmed"
  );
  const accounts = tokenAccounts?.value || [];

  let rawTotal = 0n;
  for (const account of accounts) {
    const raw = account?.account?.data?.parsed?.info?.tokenAmount?.amount || "0";
    rawTotal += BigInt(raw);
  }

  return {
    accountCount: accounts.length,
    rawTotal,
    formatted: formatSolanaAmount(rawTotal, decimals),
  };
}

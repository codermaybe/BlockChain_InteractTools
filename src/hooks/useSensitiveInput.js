import { useEffect, useRef, useState } from "react";

export function useSensitiveInput(initialValue = "") {
  const [value, setValue] = useState(initialValue);
  const [revealed, setRevealed] = useState(false);
  const valueRef = useRef(initialValue);

  valueRef.current = value;

  useEffect(
    () => () => {
      setValue("");
      valueRef.current = "";
    },
    []
  );

  const clear = () => {
    setValue("");
    valueRef.current = "";
    setRevealed(false);
  };

  const getOnce = () => {
    const current = valueRef.current;
    clear();
    return current;
  };

  return {
    value,
    revealed,
    setValue,
    setRevealed,
    toggleReveal: () => setRevealed((next) => !next),
    clear,
    getOnce,
  };
}

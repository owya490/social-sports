import { breakpoints, isScreenBelow } from "@/services/src/screenSizeUtils";
import { useEffect, useState } from "react";

export default function useIsScreenBelow(bp: keyof typeof breakpoints) {
  const [result, setResult] = useState(() => isScreenBelow(bp));

  useEffect(() => {
    function onResize() {
      setResult(isScreenBelow(bp));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);

  return result;
}

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/github";

export interface AsyncState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
  reload: () => void;
}

/**
 * Runs `fn` whenever `key` changes (pass null to skip). Cancels the in-flight request on change
 * or unmount, so stale responses never overwrite newer ones.
 */
export function useAsync<T>(key: string | null, fn: (signal: AbortSignal) => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<{ data: T | undefined; error: unknown; loading: boolean }>({
    data: undefined,
    error: undefined,
    loading: key !== null,
  });
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (key === null) {
      setState({ data: undefined, error: undefined, loading: false });
      return;
    }
    const controller = new AbortController();
    setState({ data: undefined, error: undefined, loading: true });
    fnRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, error: undefined, loading: false });
      },
      (error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.kind === "aborted") return;
        setState({ data: undefined, error, loading: false });
      },
    );
    return () => controller.abort();
  }, [key, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}

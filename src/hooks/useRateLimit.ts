import { useEffect, useState } from "react";
import { getRateLimit, subscribeRateLimit } from "@/lib/github";
import type { RateLimitInfo } from "@/types/github";

export function useRateLimit(): RateLimitInfo | null {
  const [info, setInfo] = useState<RateLimitInfo | null>(getRateLimit());
  useEffect(() => subscribeRateLimit(setInfo), []);
  return info;
}

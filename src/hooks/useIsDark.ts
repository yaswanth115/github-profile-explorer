import { useEffect, useState } from "react";

/** Tracks the `dark` class on <html> so charts can pick mode-specific colours. */
export function useIsDark(): boolean {
  const read = () => document.documentElement.classList.contains("dark");
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

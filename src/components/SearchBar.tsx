import { useEffect, useRef, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidUsername } from "@/lib/github";

interface Props {
  value: string | null;
  onSearch: (username: string) => void;
}

export function SearchBar({ value, onSearch }: Props) {
  const [text, setText] = useState(value ?? "");
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setText(value ?? ""), [value]);

  // "/" focuses the search box, like GitHub itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const name = text.trim().replace(/^@/, "");
    if (!name) return;
    if (!isValidUsername(name)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onSearch(name);
  };

  return (
    <form onSubmit={submit} role="search" className="flex w-full max-w-xl items-start gap-2">
      <div className="relative flex-1">
        <label htmlFor="user-search" className="sr-only">
          Search GitHub username
        </label>
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          id="user-search"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (invalid) setInvalid(false);
          }}
          placeholder="Search a GitHub username (press / to focus)"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-invalid={invalid}
          aria-describedby={invalid ? "user-search-error" : undefined}
          className="pl-9"
        />
        {invalid && (
          <p id="user-search-error" role="alert" className="mt-1 text-xs text-destructive">
            Usernames use letters, numbers and single hyphens only (max 39 characters).
          </p>
        )}
      </div>
      <Button type="submit">Search</Button>
    </form>
  );
}

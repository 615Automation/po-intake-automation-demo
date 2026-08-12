"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  DEFAULT_LOOKBOOK_MODE,
  LOOKBOOK_MODES,
  LOOKBOOK_STYLE_LOOK,
  type LookbookMode,
  isLookbookMode,
  resolveLookFromPath,
} from "@/lib/lookbook";

const STORAGE_KEY = "615automation:gallery-lookbook-mode";

interface LookbookShellContextValue {
  look: LookbookMode;
  setLook: (next: LookbookMode) => void;
}

const LookbookShellContext = createContext<LookbookShellContextValue | null>(null);

export function useLookbookMode() {
  const value = useContext(LookbookShellContext);
  if (!value) {
    throw new Error("useLookbookMode must be used within LookbookShell");
  }
  return value;
}

export function LookbookShell({
  children,
  defaultLook = DEFAULT_LOOKBOOK_MODE,
  withToolbar = false,
}: {
  children: ReactNode;
  defaultLook?: LookbookMode;
  withToolbar?: boolean;
}) {
  const pathname = usePathname();
  const [look, setLookState] = useState<LookbookMode>(defaultLook);

  const setLookAttribute = useCallback((next: LookbookMode) => {
    const dataLook = LOOKBOOK_STYLE_LOOK[next];
    document.documentElement.setAttribute("data-look", dataLook);
    document.body.setAttribute("data-look", dataLook);
  }, []);

  useEffect(() => {
    setLookAttribute(look);
    const activeMode = LOOKBOOK_MODES.find((mode) => mode.id === look);
    document.title = `${activeMode?.label ?? "Solution Gallery"} · 615 Automation Solution Gallery`;
    try {
      window.localStorage.setItem(STORAGE_KEY, look);
    } catch {
      // localStorage is optional in restricted browser contexts.
    }
  }, [look, setLookAttribute]);

  const setLook = useCallback((next: LookbookMode) => {
    setLookState(next);
    try {
      if (typeof window !== "undefined") {
        const nextParams = new URLSearchParams(window.location.search);
        nextParams.set("look", next);
        const query = nextParams.toString();
        const nextHref = `${pathname ?? "/"}${query ? `?${query}` : ""}`;
        window.history.replaceState({}, "", nextHref);
      }
    } catch {
      // Browser-only history update is optional for functionality.
    }
  }, [pathname]);

  useEffect(() => {
    const normalizedPath = pathname ?? "/";
    const queryLook = typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("look");

    if (queryLook && isLookbookMode(queryLook)) {
      setLookState(queryLook);
      return;
    }

    const routeLook = resolveLookFromPath(normalizedPath);
    if (routeLook) {
      setLookState(routeLook);
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isLookbookMode(stored)) {
        setLookState(stored);
        return;
      }
    } catch {
      // localStorage is optional in restricted browser contexts.
    }

    setLookState(defaultLook);
  }, [pathname, defaultLook]);

  return (
    <LookbookShellContext.Provider value={{ look, setLook }}>
      <div className={`lookbook-shell lookbook-${look}`} data-lookbook={look}>
        {withToolbar ? (
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <div className="lookbook-toolbar mb-4">
              <p className="text-[10px] font-bold tracking-[0.14em] text-ink-faint uppercase">
                Gallery lookbook
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Flip the live UI shell for different buyer-facing interaction
                style.
              </p>
              <div
                className="mt-2.5 flex flex-wrap gap-2"
                role="tablist"
                aria-label="Choose interaction skin"
              >
                {LOOKBOOK_MODES.map((mode) => {
                  const active = look === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      title={mode.description}
                      onClick={() => setLook(mode.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "border-ink/30 bg-ink text-paper"
                          : "border-line bg-panel text-ink-soft hover:border-ink/25 hover:text-ink"
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
        {children}
      </div>
    </LookbookShellContext.Provider>
  );
}

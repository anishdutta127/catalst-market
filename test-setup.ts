import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { afterEach } from "bun:test";

GlobalRegistrator.register();

// Provide a noop matchMedia so components calling it during render
// don't crash. Individual tests can override with spyOn(window, "matchMedia").
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// jest-dom matchers (toBeInTheDocument etc) — opt-in but useful.
import "@testing-library/jest-dom";

// React Testing Library cleanup between tests (avoids DOM bleed).
import { cleanup } from "@testing-library/react";
afterEach(() => cleanup());

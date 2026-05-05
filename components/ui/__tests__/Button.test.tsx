import { describe, expect, mock, spyOn, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { X } from "lucide-react";
import { Button } from "../Button";

describe("Button — variant rendering", () => {
  test("renders all 4 variants", () => {
    const variants = ["primary", "secondary", "ghost", "icon"] as const;
    for (const v of variants) {
      const { container, unmount } = render(
        v === "icon" ? (
          <Button variant={v} Icon={X} aria-label="close" />
        ) : (
          <Button variant={v}>Hello</Button>
        ),
      );
      const btn = container.querySelector("button");
      expect(btn).not.toBeNull();
      expect(btn!.dataset.variant).toBe(v);
      unmount();
    }
  });

  test("primary variant carries the bg-cta class (Tailwind → var(--color-cta))", () => {
    const { container } = render(<Button variant="primary">Build</Button>);
    const btn = container.querySelector("button")!;
    expect(btn.className).toContain("bg-cta");
  });

  test("primary defaults to width=full; icon defaults to width=auto", () => {
    const { container: c1 } = render(<Button variant="primary">A</Button>);
    expect(c1.querySelector("button")!.className).toContain("w-full");

    const { container: c2 } = render(
      <Button variant="icon" Icon={X} aria-label="close" />,
    );
    expect(c2.querySelector("button")!.className).not.toContain("w-full");
  });
});

describe("Button — disabled state", () => {
  test("disabled sets aria-disabled and blocks onClick", () => {
    const onClick = mock(() => {});
    const { container } = render(
      <Button variant="primary" disabled onClick={onClick}>
        X
      </Button>,
    );
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Button — loading state", () => {
  test("loading renders spinner and blocks onClick", () => {
    const onClick = mock(() => {});
    const { container } = render(
      <Button variant="primary" loading onClick={onClick}>
        Build
      </Button>,
    );
    const btn = container.querySelector("button")!;
    expect(btn.querySelector("[data-spinner]")).not.toBeNull();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("loading sets aria-busy and aria-disabled", () => {
    const { container } = render(
      <Button variant="primary" loading>
        Build
      </Button>,
    );
    const btn = container.querySelector("button")!;
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("Button — icon variant", () => {
  test("icon variant warns when aria-label is omitted", () => {
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
    // @ts-expect-error — intentionally missing aria-label
    render(<Button variant="icon" Icon={X} />);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test("icon variant renders the supplied Lucide icon as svg", () => {
    const { container } = render(
      <Button variant="icon" Icon={X} aria-label="close" />,
    );
    expect(container.querySelector("svg")).not.toBeNull();
  });
});

describe("Button — focus and motion", () => {
  test("focus-visible utility class is wired", () => {
    const { container } = render(<Button variant="primary">Build</Button>);
    const btn = container.querySelector("button")!;
    // Tailwind focus-visible:outline rules show up in the className.
    expect(btn.className).toMatch(/focus-visible:/);
  });

  test("rendering does not crash when matchMedia returns reduced-motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    const { container } = render(<Button variant="primary">Build</Button>);
    expect(container.querySelector("button")).not.toBeNull();

    window.matchMedia = original;
  });
});

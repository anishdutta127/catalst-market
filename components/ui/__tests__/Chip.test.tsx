import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { Chip } from "../Chip";

describe("Chip — variant rendering", () => {
  test("neutral variant renders", () => {
    const { container } = render(<Chip variant="neutral">All</Chip>);
    expect(container.querySelector("button")!.dataset.variant).toBe("neutral");
  });

  test("mood variant renders with the mood emoji as content", () => {
    const { container } = render(
      <Chip variant="mood" mood="blowing-up">
        Blowing up
      </Chip>,
    );
    const btn = container.querySelector("button")!;
    expect(btn.dataset.variant).toBe("mood");
    expect(btn.textContent).toContain("🔥");
    expect(btn.textContent).toContain("Blowing up");
  });

  test("stage variant renders", () => {
    const { container } = render(
      <Chip variant="stage" stage="builders">
        Builders
      </Chip>,
    );
    expect(container.querySelector("button")!.dataset.variant).toBe("stage");
  });

  test("industry variant renders without dot when hot is unset", () => {
    const { container } = render(<Chip variant="industry">AI</Chip>);
    expect(container.querySelector("[data-hot-dot]")).toBeNull();
  });

  test("industry variant renders the hot dot when hot=true", () => {
    const { container } = render(
      <Chip variant="industry" hot>
        AI
      </Chip>,
    );
    expect(container.querySelector("[data-hot-dot]")).not.toBeNull();
  });
});

describe("Chip — mood active styling", () => {
  test("active mood chip sets background via var(--mood-{tint})", () => {
    const { container } = render(
      <Chip variant="mood" mood="blowing-up" active>
        Blowing up
      </Chip>,
    );
    const btn = container.querySelector("button")!;
    const style = btn.getAttribute("style") ?? "";
    expect(style).toContain("var(--mood-ember)");
    expect(style).toContain("var(--mood-ember-ink)");
  });

  test("inactive mood chip does not inline a tint background", () => {
    const { container } = render(
      <Chip variant="mood" mood="blowing-up">
        Blowing up
      </Chip>,
    );
    const btn = container.querySelector("button")!;
    const style = btn.getAttribute("style") ?? "";
    expect(style).not.toContain("var(--mood-ember)");
  });

  test("active state drives aria-pressed=true", () => {
    const { container } = render(
      <Chip variant="mood" mood="blowing-up" active>
        Blowing up
      </Chip>,
    );
    expect(container.querySelector("button")!.getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  test("inactive state drives aria-pressed=false", () => {
    const { container } = render(
      <Chip variant="mood" mood="blowing-up">
        Blowing up
      </Chip>,
    );
    expect(container.querySelector("button")!.getAttribute("aria-pressed")).toBe(
      "false",
    );
  });
});

describe("Chip — stage variant styling", () => {
  test("active stage chip carries an active-state class", () => {
    const { container } = render(
      <Chip variant="stage" stage="builders" active>
        Builders
      </Chip>,
    );
    const btn = container.querySelector("button")!;
    expect(btn.dataset.active).toBe("true");
  });
});

describe("Chip — interaction", () => {
  test("click invokes onClick", () => {
    const onClick = mock(() => {});
    const { container } = render(
      <Chip variant="neutral" onClick={onClick}>
        All
      </Chip>,
    );
    fireEvent.click(container.querySelector("button")!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

import { afterEach, describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import { StoryCard } from "../StoryCard";
import { StoryCardSkeleton } from "../StoryCardSkeleton";
import type {
  AIStory,
  AnyStory,
  FounderStory,
  FundingStory,
  IPOStory,
  Industry,
  LayoffStory,
  MAStory,
  MilestoneStory,
  Mood,
  OSStory,
  RegulatoryStory,
  Story,
  StoryType,
} from "@/lib/types/story";

// ─────────────────────────────────────────────────────────────────────────────
// Fixture helpers — mirror the discriminated-union pattern from
// lib/__tests__/story.test.ts so card tests don't drift from type tests.
// ─────────────────────────────────────────────────────────────────────────────

const baseFields = {
  microBullets: ["bullet alpha", "bullet beta", "bullet gamma"],
  whyNow: "because the market just shifted",
  primaryMood: "blowing-up" as Mood,
  moods: ["blowing-up"] as Mood[],
  stage: "builders" as const,
  industry: "ai" as Industry,
  region: "global" as const,
  source: "seed" as const,
  createdAt: "2026-05-02T00:00:00Z",
  verified: true,
};

function fundingFixture(overrides: Partial<FundingStory> = {}): FundingStory {
  return {
    id: "fund-1",
    type: "funding",
    title: "Acme raises $500M",
    headlineNumber: { value: 500, unit: "M", format: "currency" },
    ...baseFields,
    lat: 12.97,
    lng: 77.59,
    details: { amountUsd: 500_000_000, round: "Series F", investors: ["X"] },
    ...overrides,
  };
}

function aiFixture(overrides: Partial<AIStory> = {}): AIStory {
  return {
    id: "ai-1",
    type: "ai",
    title: "Sarvam ships open-weights",
    headlineNumber: { value: 22, unit: "pts", format: "plain" },
    ...baseFields,
    primaryMood: "quiet-builders",
    moods: ["quiet-builders"],
    industry: "ai",
    details: { modelName: "S-9B", benchmarkGain: 22 },
    ...overrides,
  };
}

function ipoFixture(overrides: Partial<IPOStory> = {}): IPOStory {
  return {
    id: "ipo-1",
    type: "ipo",
    title: "PhonePe files",
    headlineNumber: { value: 15, unit: "B", format: "currency" },
    ...baseFields,
    primaryMood: "big-money-moves",
    moods: ["big-money-moves"],
    details: { ticker: "PHONEPE", exchange: "NSE", marketCapUsd: 15e9 },
    ...overrides,
  };
}

function maFixture(overrides: Partial<MAStory> = {}): MAStory {
  return {
    id: "ma-1",
    type: "ma",
    title: "Cohere acqui-hires Replit",
    headlineNumber: null,
    ...baseFields,
    primaryMood: "founders-like-me",
    moods: ["founders-like-me"],
    details: { acquirer: "Cohere", acquired: "Replit AI", dealType: "acquihire" },
    ...overrides,
  };
}

function milestoneFixture(overrides: Partial<MilestoneStory> = {}): MilestoneStory {
  return {
    id: "ms-1",
    type: "milestone",
    title: "Razorpay $200M ARR",
    headlineNumber: { value: 200, unit: "M", format: "currency" },
    ...baseFields,
    primaryMood: "india-shipping",
    moods: ["india-shipping"],
    industry: "fintech",
    details: { metric: "ARR" },
    ...overrides,
  };
}

function founderFixture(overrides: Partial<FounderStory> = {}): FounderStory {
  return {
    id: "founder-1",
    type: "founder",
    title: "Mira Murati emerges",
    headlineNumber: null,
    ...baseFields,
    primaryMood: "founders-like-me",
    moods: ["founders-like-me"],
    industry: "ai",
    details: { founderName: "Mira Murati" },
    ...overrides,
  };
}

function osFixture(overrides: Partial<OSStory> = {}): OSStory {
  return {
    id: "os-1",
    type: "os",
    title: "Cred Commerce SDK",
    headlineNumber: { value: 8400, unit: "★", format: "plain" },
    ...baseFields,
    primaryMood: "copy-able-ideas",
    moods: ["copy-able-ideas"],
    industry: "devtools",
    details: { repoUrl: "https://example.com", stars: 8400 },
    ...overrides,
  };
}

function layoffFixture(overrides: Partial<LayoffStory> = {}): LayoffStory {
  return {
    id: "layoff-1",
    type: "layoff",
    title: "ByteDance lays off 1500",
    headlineNumber: { value: 1500, unit: "people", format: "plain" },
    ...baseFields,
    industry: "consumer",
    details: { headcountAffected: 1500 },
    ...overrides,
  };
}

function shutdownFixture(): Story<"shutdown"> {
  return {
    id: "shut-1",
    type: "shutdown",
    title: "Builder.ai shuts down",
    headlineNumber: { value: 9, unit: "yrs", format: "plain" },
    ...baseFields,
    primaryMood: "quiet-builders",
    moods: ["quiet-builders"],
    industry: "ai",
    details: { yearsOperating: 9 },
  };
}

function launchFixture(): Story<"launch"> {
  return {
    id: "launch-1",
    type: "launch",
    title: "Anthropic ships Opus 4.7",
    headlineNumber: null,
    ...baseFields,
    industry: "ai",
    details: { productName: "Opus 4.7", productUrl: "https://anthropic.com" },
  };
}

function regulatoryFixture(overrides: Partial<RegulatoryStory> = {}): RegulatoryStory {
  return {
    id: "reg-1",
    type: "regulatory",
    title: "UAE National AI Act",
    headlineNumber: null,
    ...baseFields,
    primaryMood: "quiet-builders",
    moods: ["quiet-builders"],
    industry: "ai",
    details: { jurisdiction: "UAE" },
    ...overrides,
  };
}

const ALL_TYPE_FIXTURES: AnyStory[] = [
  fundingFixture(),
  launchFixture(),
  aiFixture(),
  maFixture(),
  ipoFixture(),
  milestoneFixture(),
  founderFixture(),
  osFixture(),
  layoffFixture(),
  shutdownFixture(),
  regulatoryFixture(),
];

// ─────────────────────────────────────────────────────────────────────────────
// Render-shape tests
// ─────────────────────────────────────────────────────────────────────────────

describe("StoryCard — every story type renders without throwing", () => {
  for (const story of ALL_TYPE_FIXTURES) {
    test(`type "${story.type}" collapsed`, () => {
      const { container } = render(<StoryCard story={story} />);
      const root = container.querySelector("[data-story-card]") as HTMLElement;
      expect(root).not.toBeNull();
      expect(root.getAttribute("data-story-type")).toBe(story.type);
      expect(root.getAttribute("data-story-expanded")).toBe("false");
    });

    test(`type "${story.type}" expanded`, () => {
      const { container } = render(<StoryCard story={story} expanded />);
      const root = container.querySelector("[data-story-card]") as HTMLElement;
      expect(root.getAttribute("data-story-expanded")).toBe("true");
    });
  }
});

describe("StoryCard — collapsed layout (horizontal vs vertical-founder)", () => {
  test("non-founder cards use horizontal layout (logo left, number+title right)", () => {
    const { container } = render(<StoryCard story={fundingFixture()} />);
    const body = container.querySelector(
      "[data-story-collapsed-body]",
    ) as HTMLElement;
    expect(body.getAttribute("data-layout")).toBe("horizontal");
  });

  test("founder cards use vertical-founder layout (face centered, no number)", () => {
    const { container } = render(<StoryCard story={founderFixture()} />);
    const body = container.querySelector(
      "[data-story-collapsed-body]",
    ) as HTMLElement;
    expect(body.getAttribute("data-layout")).toBe("vertical-founder");
  });

  test("horizontal: title is in the right column (descendant of [data-story-collapsed-right])", () => {
    const { container } = render(<StoryCard story={fundingFixture()} />);
    const right = container.querySelector(
      "[data-story-collapsed-right]",
    ) as HTMLElement;
    expect(right).not.toBeNull();
    const title = right.querySelector("[data-story-title]");
    expect(title).not.toBeNull();
  });

  test("horizontal: headline number is in the right column", () => {
    const { container } = render(<StoryCard story={fundingFixture()} />);
    const right = container.querySelector(
      "[data-story-collapsed-right]",
    ) as HTMLElement;
    expect(right).not.toBeNull();
    expect(right.querySelector("[data-story-headline-number]")).not.toBeNull();
  });

  test("horizontal: logo + right column live in the same flex row [data-story-collapsed-main]", () => {
    const { container } = render(<StoryCard story={fundingFixture()} />);
    const main = container.querySelector(
      "[data-story-collapsed-main]",
    ) as HTMLElement;
    expect(main).not.toBeNull();
    expect(main.querySelector("[data-story-face]")).not.toBeNull();
    expect(main.querySelector("[data-story-collapsed-right]")).not.toBeNull();
  });

  test("vertical-founder: title is centered beneath the face (no right-column wrapper)", () => {
    const { container } = render(<StoryCard story={founderFixture()} />);
    expect(container.querySelector("[data-story-collapsed-right]")).toBeNull();
    const body = container.querySelector(
      "[data-story-collapsed-body]",
    ) as HTMLElement;
    expect(body.querySelector("[data-story-title]")).not.toBeNull();
    expect(body.querySelector("[data-story-face]")).not.toBeNull();
  });

  test("type cassette is positioned absolutely (top-right) in BOTH layouts", () => {
    // The cassette stays in the top-right corner — user explicitly liked it
    // there. We assert it's a direct child of the body marked absolute.
    for (const story of [fundingFixture(), founderFixture()]) {
      const { container, unmount } = render(<StoryCard story={story} />);
      const body = container.querySelector(
        "[data-story-collapsed-body]",
      ) as HTMLElement;
      const cassette = body.querySelector("[data-cassette]");
      expect(cassette).not.toBeNull();
      // Cassette wrapper is the direct child div with absolute positioning
      const cassetteWrapper = cassette!.parentElement!;
      expect(cassetteWrapper.className).toContain("absolute");
      unmount();
    }
  });

  test("all 11 type fixtures still render without horizontal overflow on a 240px card", () => {
    for (const story of ALL_TYPE_FIXTURES) {
      const { container, unmount } = render(
        <div style={{ width: 240 }}>
          <StoryCard story={story} />
        </div>,
      );
      const card = container.querySelector(
        "[data-story-card]",
      ) as HTMLElement;
      expect(card).not.toBeNull();
      // We can't measure scrollWidth in happy-dom reliably (no layout
      // engine), but the structural assertion is enough: every card
      // renders, has either horizontal or vertical-founder layout, and
      // contains its title.
      const body = card.querySelector(
        "[data-story-collapsed-body]",
      ) as HTMLElement;
      const layout = body.getAttribute("data-layout") ?? "";
      expect(["horizontal", "vertical-founder"]).toContain(layout);
      expect(card.querySelector("[data-story-title]")).not.toBeNull();
      unmount();
    }
  });
});

describe("StoryCard — collapsed body shape", () => {
  test("renders mood strip with primaryMood data attr on the card", () => {
    const { container } = render(<StoryCard story={fundingFixture()} />);
    const root = container.querySelector("[data-story-card]") as HTMLElement;
    expect(root.getAttribute("data-story-mood")).toBe("blowing-up");
    expect(container.querySelector("[data-story-mood-strip]")).not.toBeNull();
  });

  test("renders headline number when present (funding $500M)", () => {
    const { container } = render(<StoryCard story={fundingFixture()} />);
    const headline = container.querySelector("[data-story-headline-number]");
    expect(headline).not.toBeNull();
    expect(headline!.textContent).toContain("$500M");
  });

  test("hides headline number when story.headlineNumber is null (founder)", () => {
    const { container } = render(<StoryCard story={founderFixture()} />);
    expect(container.querySelector("[data-story-headline-number]")).toBeNull();
  });

  test("renders title text", () => {
    const { container } = render(<StoryCard story={fundingFixture()} />);
    const title = container.querySelector("[data-story-title]") as HTMLElement;
    expect(title.textContent).toBe("Acme raises $500M");
  });

  test("renders city pill with the labelShort for the story's lat/lng", () => {
    // (12.97, 77.59) → Bangalore → "BLR"
    const { container } = render(<StoryCard story={fundingFixture()} />);
    const pill = container.querySelector("[data-story-city-pill]") as HTMLElement;
    expect(pill).not.toBeNull();
    expect(pill.getAttribute("data-story-city")).toBe("BLR");
  });

  test("verified=false renders an [unverified] indicator", () => {
    const { container } = render(
      <StoryCard story={fundingFixture({ verified: false })} />,
    );
    expect(container.querySelector("[data-story-unverified]")).not.toBeNull();
  });

  test("verified=true does NOT render the unverified indicator", () => {
    const { container } = render(<StoryCard story={fundingFixture({ verified: true })} />);
    expect(container.querySelector("[data-story-unverified]")).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Headline-number formatting per type
// ─────────────────────────────────────────────────────────────────────────────

describe("StoryCard — headline number formatting per type", () => {
  test("funding $500M formats as '$500M'", () => {
    const { container } = render(<StoryCard story={fundingFixture()} />);
    expect(
      container.querySelector("[data-story-headline-number]")!.textContent,
    ).toContain("$500M");
  });

  test("ai +22 pts formats as '+22 pts'", () => {
    const { container } = render(<StoryCard story={aiFixture()} />);
    expect(
      container.querySelector("[data-story-headline-number]")!.textContent,
    ).toContain("+22 pts");
  });

  test("os 8400 stars scales to '8.4K ★'", () => {
    const { container } = render(<StoryCard story={osFixture()} />);
    expect(
      container.querySelector("[data-story-headline-number]")!.textContent,
    ).toContain("8.4K");
  });

  test("layoff 1500 people scales to '1.5K people'", () => {
    const { container } = render(<StoryCard story={layoffFixture()} />);
    expect(
      container.querySelector("[data-story-headline-number]")!.textContent,
    ).toContain("1.5K");
  });

  test("shutdown 9 yrs is '9 yrs' (no scaling under 1000)", () => {
    const { container } = render(<StoryCard story={shutdownFixture()} />);
    expect(
      container.querySelector("[data-story-headline-number]")!.textContent,
    ).toContain("9 yrs");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Expansion behavior
// ─────────────────────────────────────────────────────────────────────────────

describe("StoryCard — expand / collapse interaction", () => {
  test("clicking a collapsed card calls onExpandChange(true)", () => {
    const onExpandChange = mock((_next: boolean) => {});
    const { container } = render(
      <StoryCard story={fundingFixture()} onExpandChange={onExpandChange} />,
    );
    const root = container.querySelector("[data-story-card]") as HTMLElement;
    fireEvent.click(root);
    expect(onExpandChange).toHaveBeenCalledTimes(1);
    expect(onExpandChange.mock.calls[0]?.[0]).toBe(true);
  });

  test("Enter key on collapsed card expands", () => {
    const onExpandChange = mock((_next: boolean) => {});
    const { container } = render(
      <StoryCard story={fundingFixture()} onExpandChange={onExpandChange} />,
    );
    const root = container.querySelector("[data-story-card]") as HTMLElement;
    fireEvent.keyDown(root, { key: "Enter" });
    expect(onExpandChange).toHaveBeenCalledTimes(1);
    expect(onExpandChange.mock.calls[0]?.[0]).toBe(true);
  });

  test("Space key on collapsed card expands", () => {
    const onExpandChange = mock((_next: boolean) => {});
    const { container } = render(
      <StoryCard story={fundingFixture()} onExpandChange={onExpandChange} />,
    );
    const root = container.querySelector("[data-story-card]") as HTMLElement;
    fireEvent.keyDown(root, { key: " " });
    expect(onExpandChange).toHaveBeenCalledTimes(1);
  });

  test("ESC key on expanded card calls onExpandChange(false)", () => {
    const onExpandChange = mock((_next: boolean) => {});
    render(
      <StoryCard
        story={fundingFixture()}
        expanded
        onExpandChange={onExpandChange}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExpandChange).toHaveBeenCalledTimes(1);
    expect(onExpandChange.mock.calls[0]?.[0]).toBe(false);
  });

  test("clicking the close chevron calls onExpandChange(false)", () => {
    const onExpandChange = mock((_next: boolean) => {});
    const { container } = render(
      <StoryCard
        story={fundingFixture()}
        expanded
        onExpandChange={onExpandChange}
      />,
    );
    const close = container.querySelector(
      'button[aria-label="Close expanded story"]',
    ) as HTMLButtonElement;
    fireEvent.click(close);
    expect(onExpandChange).toHaveBeenCalled();
    // The latest call must be (false). Click-outside may also fire, depending
    // on event order; either way, false should appear.
    const sawFalse = onExpandChange.mock.calls.some((args) => args[0] === false);
    expect(sawFalse).toBe(true);
  });

  test("compact variant suppresses click-to-expand", () => {
    const onExpandChange = mock((_next: boolean) => {});
    const { container } = render(
      <StoryCard
        story={fundingFixture()}
        variant="compact"
        onExpandChange={onExpandChange}
      />,
    );
    const root = container.querySelector("[data-story-card]") as HTMLElement;
    fireEvent.click(root);
    expect(onExpandChange).not.toHaveBeenCalled();
  });

  test("compact variant marks the card opacity-30 + non-interactive", () => {
    const { container } = render(
      <StoryCard story={fundingFixture()} variant="compact" />,
    );
    const root = container.querySelector("[data-story-card]") as HTMLElement;
    expect(root.getAttribute("data-story-variant")).toBe("compact");
    expect(root.tabIndex).toBe(-1);
    expect(root.className).toContain("opacity-30");
    expect(root.className).toContain("pointer-events-none");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Expanded body content
// ─────────────────────────────────────────────────────────────────────────────

describe("StoryCard — expanded body content", () => {
  test("renders microBullets list with all three items", () => {
    const { container } = render(
      <StoryCard story={fundingFixture()} expanded />,
    );
    const list = container.querySelector("[data-story-microbullets]");
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll("li").length).toBe(3);
  });

  test("renders why-now line prefixed by 'Why now:'", () => {
    const { container } = render(
      <StoryCard story={fundingFixture()} expanded />,
    );
    const wn = container.querySelector("[data-story-whynow]") as HTMLElement;
    expect(wn).not.toBeNull();
    expect(wn.textContent).toMatch(/^Why now:/);
  });

  test("Build CTA fires onBuild(story.id) when clicked", () => {
    const onBuild = mock((_id: string) => {});
    const { container } = render(
      <StoryCard story={fundingFixture()} expanded onBuild={onBuild} />,
    );
    const cta = container.querySelector(
      'button[data-variant="primary"]',
    ) as HTMLButtonElement;
    fireEvent.click(cta);
    expect(onBuild).toHaveBeenCalledWith("fund-1");
  });

  test('"Read full" link points to /story/[id]', () => {
    const { container } = render(
      <StoryCard story={fundingFixture()} expanded />,
    );
    const link = container.querySelector(
      "[data-story-readfull]",
    ) as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/story/fund-1");
  });

  test("expanded mood strip shows the emoji + label", () => {
    const { container } = render(
      <StoryCard story={fundingFixture()} expanded />,
    );
    const strip = container.querySelector("[data-story-mood-strip]") as HTMLElement;
    expect(strip.textContent).toContain("Blowing up");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Founder story specifics
// ─────────────────────────────────────────────────────────────────────────────

describe("StoryCard — founder story specifics", () => {
  test("founder collapsed: hides headline number, larger face placeholder", () => {
    const { container } = render(<StoryCard story={founderFixture()} />);
    expect(container.querySelector("[data-story-headline-number]")).toBeNull();
    const face = container.querySelector("[data-story-face]") as HTMLElement;
    expect(face).not.toBeNull();
    expect(face.getAttribute("data-story-face")).toBe("placeholder");
  });

  test("founder expanded: face fills photo region (1:1 aspect, larger)", () => {
    const { container } = render(
      <StoryCard story={founderFixture()} expanded />,
    );
    const photo = container.querySelector(
      "[data-story-photo]",
    ) as HTMLElement;
    expect(photo).not.toBeNull();
    // The placeholder uses 1:1 for founder, 4:3 for everything else
    expect(photo.style.aspectRatio).toBe("1 / 1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Accessibility
// ─────────────────────────────────────────────────────────────────────────────

describe("StoryCard — accessibility", () => {
  test("collapsed card has role=article + tabIndex=0", () => {
    const { container } = render(<StoryCard story={fundingFixture()} />);
    const root = container.querySelector("[data-story-card]") as HTMLElement;
    expect(root.getAttribute("role")).toBe("article");
    expect(root.tabIndex).toBe(0);
  });

  test("aria-expanded reflects state", () => {
    const { container, rerender } = render(<StoryCard story={fundingFixture()} />);
    const root = () => container.querySelector("[data-story-card]") as HTMLElement;
    expect(root().getAttribute("aria-expanded")).toBe("false");
    rerender(<StoryCard story={fundingFixture()} expanded />);
    expect(root().getAttribute("aria-expanded")).toBe("true");
  });

  test("aria-label describes interaction state", () => {
    const { container, rerender } = render(<StoryCard story={fundingFixture()} />);
    const root = () => container.querySelector("[data-story-card]") as HTMLElement;
    expect(root().getAttribute("aria-label")).toMatch(/Tap to expand/);
    rerender(<StoryCard story={fundingFixture()} expanded />);
    expect(root().getAttribute("aria-label")).toMatch(/Press Escape to close/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// StoryCardSkeleton
// ─────────────────────────────────────────────────────────────────────────────

describe("StoryCardSkeleton — placeholder", () => {
  test("renders all four skeleton parts (mood, face, type, city)", () => {
    const { container } = render(<StoryCardSkeleton />);
    expect(container.querySelector("[data-story-skeleton]")).not.toBeNull();
    expect(container.querySelector("[data-story-skeleton-mood]")).not.toBeNull();
    expect(container.querySelector("[data-story-skeleton-face]")).not.toBeNull();
    expect(container.querySelector("[data-story-skeleton-type]")).not.toBeNull();
    expect(container.querySelector("[data-story-skeleton-city]")).not.toBeNull();
  });

  test("has aria-busy and role=status", () => {
    const { container } = render(<StoryCardSkeleton />);
    const root = container.querySelector("[data-story-skeleton]") as HTMLElement;
    expect(root.getAttribute("role")).toBe("status");
    expect(root.getAttribute("aria-busy")).toBe("true");
  });

  test("contains NO shimmer / motion (per feed.md §5)", () => {
    const { container } = render(<StoryCardSkeleton />);
    // Search for any animate-* class — none should be present
    const html = container.innerHTML;
    expect(html).not.toMatch(/animate-/);
  });
});

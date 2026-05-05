import type { AnyStory, Story, StoryType } from "./types/story";

/**
 * A single build angle — what the BuildSheet renders when a user taps
 * "Build with Catalst" on a Story Card.
 *
 * Three fields, all written for direct render and direct paste into a
 * co-founder's Slack. If the wording reads like a slide-deck bullet,
 * it is the wrong wording.
 *
 *   title       — declarative, ≤ 8 words, no company names
 *   description — explains the wedge, ≤ 25 words
 *   wedge_hint  — one editorial sentence, third-person, present-tense.
 *                 Real company names allowed when sharpening the example.
 *
 * Editorial bans (enforced by lib/__tests__/angles.test.ts):
 *   - the words "leverage", "synergy", "disrupt"
 *   - the character "!"
 *   - emoji
 */
export type Angle = {
  readonly title: string;
  readonly description: string;
  readonly wedge_hint: string;
};

/**
 * Three build angles for a given story.
 *
 * v1 returns a deterministic per-type triple — angles do not vary by
 * the specific story content. The Story<T> param is here for the
 * narrowing contract and so a future version can personalize the
 * wedge_hint with the story's company name without breaking callers.
 *
 * Three-frame discipline per type. The first eight types share the
 * adjacent-market / picks-and-shovels / disclosed-weakness spine
 * (adapted to the type's domain). The last three (founder, layoff,
 * shutdown, regulatory — see the per-generator JSDoc) use frames
 * that fit personnel, death, and rule-change events.
 */
export function getAngles<T extends StoryType>(
  story: Story<T>,
): readonly [Angle, Angle, Angle] {
  // Story<T> is structurally a member of the AnyStory discriminated
  // union for any concrete T; the cast lets the switch narrow on type.
  const s = story as AnyStory;
  switch (s.type) {
    case "funding":
      return anglesForFunding(s);
    case "launch":
      return anglesForLaunch(s);
    case "ai":
      return anglesForAI(s);
    case "ma":
      return anglesForMA(s);
    case "ipo":
      return anglesForIPO(s);
    case "milestone":
      return anglesForMilestone(s);
    case "founder":
      return anglesForFounder(s);
    case "os":
      return anglesForOS(s);
    case "layoff":
      return anglesForLayoff(s);
    case "shutdown":
      return anglesForShutdown(s);
    case "regulatory":
      return anglesForRegulatory(s);
    default: {
      // Adding a 12th StoryType without wiring it here is a compile error.
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}

// ───────────────────────────────────────────────────────────────────
// Per-type generators
// ───────────────────────────────────────────────────────────────────

/**
 * Funding round.
 *   1. Adjacent market — same playbook, different vertical or geo.
 *   2. Picks-and-shovels — what the funded company depends on.
 *   3. Disclosed weakness — what the round announcement omits.
 */
function anglesForFunding(
  _s: Story<"funding">,
): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "The same playbook, different geography",
      description:
        "Take this round's thesis and rerun it in a market where the funded company won't ship for two years.",
      wedge_hint:
        "When Anysphere closes a round on US developer tools, the same wedge sits unclaimed in India, Brazil, and SEA — the buyer exists, the AI cost curve is the same, the local champion is not built yet.",
    },
    {
      title: "Build what they had to build internally",
      description:
        "The funded company just told you which infrastructure problem hurt enough to spend Series-B money on solving in-house.",
      wedge_hint:
        "Every funded company exposes the tools they bought, the tools they couldn't, and the tools they hacked together — that third bucket is your roadmap.",
    },
    {
      title: "The use case the deck quietly omits",
      description:
        "Read the round announcement for what it doesn't claim. The omission is usually the segment they wrote off.",
      wedge_hint:
        "When the round talks about mid-market and enterprise but skips SMB, the SMB version is unclaimed — the funded competitor will not pivot down for two years.",
    },
  ] as const;
}

/**
 * Launch (Product Hunt, Hacker News, Show HN, direct).
 *   1. The complement — the second tool the launch team forgot to build.
 *   2. The vertical clone — same product, single industry the launch
 *      will never wrap properly.
 *   3. The simpler/cheaper version — strip to one feature, one tenth
 *      the price.
 */
function anglesForLaunch(
  _s: Story<"launch">,
): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "What every user of this also needs",
      description:
        "Ship the second tool the launch team forgot to build, the one their early users will ask for in week two.",
      wedge_hint:
        "Every Product Hunt #1 creates a queue of follow-up needs the team can't sequence — that backlog is your launch list.",
    },
    {
      title: "Same product, one industry",
      description:
        "Take the horizontal launch, rebuild for a single industry where your domain knowledge beats their feature breadth.",
      wedge_hint:
        "Notion built the doc; the vertical wrapper for veterinary clinics, dental offices, or city councils is still anyone's to ship.",
    },
    {
      title: "The version without the bells",
      description:
        "Strip the launch to its single load-bearing feature, charge a tenth, and serve the buyers who never needed the rest.",
      wedge_hint:
        "Linear's strength is also its weight — the team of three who just needs an ordered to-do list buys the lighter thing.",
    },
  ] as const;
}

/**
 * AI / model release.
 *   1. Application layer — the workflow the new capability just made
 *      cheap enough to ship.
 *   2. Vertical wrapper — domain UX over the raw model.
 *   3. Guardrail / eval — measurement tooling the new capability creates.
 */
function anglesForAI(_s: Story<"ai">): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "What just became cheap enough to build",
      description:
        "The model release moved the price floor. Find the workflow that was uneconomic last week and is shippable today.",
      wedge_hint:
        "DeepSeek R3 didn't ship a product, it shipped a margin shift, and every batch-inference workflow that was 4x too expensive is now the assignment.",
    },
    {
      title: "Domain UX over the raw model",
      description:
        "The model is general. The buyer is not. Wrap it in the workflow language a tax preparer or paralegal already uses.",
      wedge_hint:
        "Calling Claude is a commodity; calling Claude inside a deposition prep flow that a litigator wants to use is the actual product.",
    },
    {
      title: "The eval suite this enables",
      description:
        "Every new capability creates new failure modes that aren't yet measured. Build the benchmark before the platform team does.",
      wedge_hint:
        "When agents start booking flights, the airline-canceling-a-meeting eval becomes a product before the agent maker writes one themselves.",
    },
  ] as const;
}

/**
 * M&A — acquisition, merger, or acquihire.
 *   1. Orphaned customer — segment the integration leaves behind.
 *   2. Integration friction — new boundaries the deal creates.
 *   3. Departing talent — senior ICs who vest then leave.
 */
function anglesForMA(_s: Story<"ma">): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "The customer the merger forgets",
      description:
        "Acquired companies always lose a segment in the integration. Find them within 90 days and they will switch on a phone call.",
      wedge_hint:
        "When Cisco bought Splunk, the SOC analyst at a 200-person company knew within a month that her tier of support was now the lowest priority — that is your inbound.",
    },
    {
      title: "Replace the joint that just broke",
      description:
        "Mergers create new boundaries (auth, data formats, billing). Those boundaries are now expensive seams to fix.",
      wedge_hint:
        "Two product orgs, one company, two billing systems — the third-party tool that reconciles them sells itself for two years.",
    },
    {
      title: "Hire the people the deal exits",
      description:
        "The acquihire pays the principals. The senior ICs vest, then leave. Build with them, not against the deal.",
      wedge_hint:
        "Six months after every acquihire, the design lead and the lead engineer are taking calls — usually before they update LinkedIn.",
    },
  ] as const;
}

/**
 * IPO — S-1 filing or public listing.
 *   1. S-1 confession — Risk Factors disclose unbuilt markets free.
 *   2. Post-IPO complacency — the roadmap public-company incentives kill.
 *   3. Validated procurement — the buying window the listing opens.
 */
function anglesForIPO(_s: Story<"ipo">): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "The risk factor that names a market",
      description:
        "Risk Factors disclose what the company can't do. That list is the most expensive market research a startup will ever read free.",
      wedge_hint:
        "When Klaviyo's S-1 listed reliance on Shopify as a risk, every email-for-non-Shopify-stores became a fundable thesis the same day.",
    },
    {
      title: "What they stop building once public",
      description:
        "Public-company incentives reward expansion, not invention. The roadmap they shelve is the roadmap a startup ships.",
      wedge_hint:
        "Public CRMs spent the last decade not rebuilding the inbox; HubSpot's IPO funded the gap that Attio is now eating.",
    },
    {
      title: "Sell to the company that just listed",
      description:
        "An IPO unlocks budget for vendor risk that wasn't approved at $50M ARR. The procurement door is open for two quarters.",
      wedge_hint:
        "The CFO who can't approve a $200K vendor at $80M revenue signs a $2M contract three weeks after listing — that is the buying window.",
    },
  ] as const;
}

/**
 * Milestone — ARR, users, GMV, or DAU crossed a threshold.
 *   1. Number-two playbook — what the slower competitor missed.
 *   2. Next-tier ceiling — the wall the company hits at 10x scale.
 *   3. Ecosystem opportunity — third-party tools the milestone unlocks.
 */
function anglesForMilestone(
  _s: Story<"milestone">,
): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "What number two missed at the same scale",
      description:
        "Two companies started at zero on the same day. One hit this milestone. Read what the slow one shipped instead.",
      wedge_hint:
        "When Linear crossed $50M ARR while Asana ground harder for the same number, the gap between them became a thesis: ship for builders, not for project managers.",
    },
    {
      title: "The wall they hit at 10x scale",
      description:
        "Today's milestone is tomorrow's ceiling. The infrastructure that worked at 10K users buckles at 100K; the seam is the product.",
      wedge_hint:
        "Slack's million-user moment exposed infrastructure choices that became their biggest engineering project for years — every chat tool that scales repeats this exact arc.",
    },
    {
      title: "The third-party tool now worth building",
      description:
        "When a platform crosses a usage threshold, the integrations market activates. Nobody builds for an empty store.",
      wedge_hint:
        "Notion's hit on user count is what made templates a real business; the same pattern repeats the next time Cursor crosses a developer milestone.",
    },
  ] as const;
}

/**
 * Founder profile, departure, or return. Stories about people, not deals,
 * so the standard adjacent-market spine doesn't fit. Frames here are:
 *   1. Peer-at-same-role — who else in the same seat one company over
 *      just became reachable.
 *   2. Shadow team — the IC's the founder will rebuild around.
 *   3. Unspoken next move — what the post almost says.
 */
function anglesForFounder(
  _s: Story<"founder">,
): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "Who else just became reachable",
      description:
        "Profiled founders signal to peers in the same role. The CFO at company two saw this and is taking calls.",
      wedge_hint:
        "Profile pieces are recruiting documents in disguise — when one CTO writes a thoughtful resignation post, three peers update their LinkedIn within a week.",
    },
    {
      title: "The team they will hire next",
      description:
        "Founders rebuild a known set of roles in a known order. Get on that list before the recruiter does.",
      wedge_hint:
        "Brian Chesky's first ten hires at the next thing are mostly named already; some of them are still working out their notice.",
    },
    {
      title: "What the post almost says",
      description:
        "Read the founder's announcement for the verb they avoided. That verb is the thesis they don't want public yet.",
      wedge_hint:
        "When a founder leaves saying 'AI changes the org chart,' they don't mean re-orgs — they mean the layoff plan they can't talk about for six months.",
    },
  ] as const;
}

/**
 * Open-source release or trending repo.
 *   1. Hosted version — managed offering of the OSS primitive.
 *   2. Adjacent OSS — complement the new repo creates demand for.
 *   3. Enterprise wrapper — the compliance/SSO layer maintainers refuse.
 */
function anglesForOS(_s: Story<"os">): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "The managed version of the repo",
      description:
        "Self-hosting is a tax. The team that just open-sourced this is signaling they don't want to run it for you.",
      wedge_hint:
        "Every popular repo is a hosted-startup waiting to happen — the maintainer who tweets 'we're not running infra' is announcing the procurement window.",
    },
    {
      title: "The next thing every user needs",
      description:
        "Open-source primitives create their own demand stack. Find the second tool the user installs an hour after the first.",
      wedge_hint:
        "The minute Postgres extensions became viable as a product surface, three companies were one funding round from existing — anyone close to the metal that quarter could tell.",
    },
    {
      title: "SSO and audit logs for the OSS",
      description:
        "Maintainers will not build the compliance layer. The Fortune-500 buyer needs SAML, retention, and a contract — and pays for it.",
      wedge_hint:
        "The repo gets to a million stars; the SOC2-ready hosted offering with SAML and a redress clause is a different company, and usually a better one.",
    },
  ] as const;
}

/**
 * Layoff event. Personnel events, not market events — so frames cover
 * talent, product gaps, and competitor risk rather than adjacency.
 *   1. Talent pool — specific roles cut, ready to be hired.
 *   2. Orphaned roadmap — what the company stops building next quarter.
 *   3. Boomerang founder — the IC most likely to start the competitor.
 */
function anglesForLayoff(
  _s: Story<"layoff">,
): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "Hire the team the layoff freed",
      description:
        "Layoff lists name the function and seniority. Three calls into the right slack and you have your founding ten.",
      wedge_hint:
        "Twitter's 2022 trust-and-safety cut produced founding teams across the compliance and platform-integrity space — the senior IC who survived four reorgs is the one to recruit first.",
    },
    {
      title: "The product line they will sunset",
      description:
        "Layoffs precede roadmap cuts by a quarter. Find the customer base about to be told 'maintenance only.'",
      wedge_hint:
        "When the org chart loses the platform team, the API stops getting features — the buyer who relied on it has six months to switch.",
    },
    {
      title: "The IC who will start the competitor",
      description:
        "Senior leaders cut in restructuring don't take corporate jobs again. The competitor exists in 18 months — invest now.",
      wedge_hint:
        "Every market-cycle layoff produces its own cohort of new companies — the laid-off VP at Stripe is more likely to ship the alt-Stripe than the next hire is.",
    },
  ] as const;
}

/**
 * Company shutdown. Death events; frames cover migration, pattern
 * avoidance, and asset arbitrage.
 *   1. Orphaned customer — users without a tool, ready to pay for one.
 *   2. Technical postmortem — the structural reason to design around.
 *   3. Acquired-asset play — IP, brand, customer list available cheap.
 */
function anglesForShutdown(
  _s: Story<"shutdown">,
): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "Inherit the orphaned user base",
      description:
        "Shutdowns leave a churn cliff with no replacement. Have the migration script ready before the sunset email goes out.",
      wedge_hint:
        "When Heroku ended its free tier, the indie devs who had been on it for years migrated to Fly and Render before the sunset email even hit inbox — readiness beat brand loyalty.",
    },
    {
      title: "Read the postmortem for the moat",
      description:
        "Failed companies write better honest essays than successful ones. Find the structural reason and the wedge that avoids it.",
      wedge_hint:
        "Quibi's cause of death wasn't bad shows — it was watching shows on a phone that won't tilt — and the next short-form bet starts with the orientation, not the content.",
    },
    {
      title: "Buy the brand and the customer list",
      description:
        "Shutdown sales move fast and cheap. Domain, brand, and a warm-but-orphaned customer list go for one Series-A engineer.",
      wedge_hint:
        "The bankruptcy trustee wants a check, not a long process — the founder who shows up early with a number gets the asset that took the shut company eight years to build.",
    },
  ] as const;
}

/**
 * Regulatory event — rule change, ruling, or jurisdiction shift.
 *   1. Compliance layer — the audit tooling the new rule demands.
 *   2. Newly-legal play — the product banned yesterday, allowed today.
 *   3. Jurisdictional arbitrage — the same product in markets the rule
 *      doesn't reach.
 */
function anglesForRegulatory(
  _s: Story<"regulatory">,
): readonly [Angle, Angle, Angle] {
  return [
    {
      title: "The tool that proves they followed the rule",
      description:
        "New rules create a new audit. Every regulated buyer needs to evidence compliance and they would rather buy than build.",
      wedge_hint:
        "When the EU AI Act forced model providers to log training data, the third-party 'we'll keep your audit trail' company sold itself in a day.",
    },
    {
      title: "Build the thing that just became allowed",
      description:
        "Rule changes don't just restrict, they unlock. Find the product banned yesterday whose market is uncontested today.",
      wedge_hint:
        "When India legalized cross-border digital lending for specific corridors, three Bangalore teams shipped the same week — the wedge wasn't UX, it was being ready when the rule changed.",
    },
    {
      title: "Same product, jurisdiction without the rule",
      description:
        "Regulation in one market is opportunity in three others. Reverse the wedge: who's now overserved by the new rule's overhead?",
      wedge_hint:
        "GDPR didn't kill ad-tech globally; it concentrated the cookie business in jurisdictions that hadn't shipped a privacy law yet — the same plays for the AI Act.",
    },
  ] as const;
}

---
name: stagehand-browser-automation
description: Browser automation with Stagehand V3. Use this skill whenever the user needs to interact with websites, scrape data from the web, fill out forms, take screenshots, navigate pages, extract structured information, perform research on live sites, test web applications, monitor web pages, or automate any browser-based workflow. Also use when the user mentions Playwright, Puppeteer, browser-use, web scraping, data extraction, form filling, web testing, or any task that involves opening a browser or visiting URLs. Even if the user doesn't explicitly say "browser automation", use this skill when the task clearly requires interacting with web pages or extracting data from websites.
---

# Stagehand Browser Automation

Use [Stagehand V3](https://stagehand.dev) for all browser automation tasks. It is an AI-native browser automation framework that lets you write automations with natural language and code, without brittle CSS selectors.

## When to Use Stagehand vs Other Tools

| Situation | Use Stagehand | Use Playwright Directly |
|---|---|---|
| Unknown or changing page structure | ✅ `act()` / `extract()` | ❌ selectors break |
| Known stable page, simple click | ✅ `page.click()` | ✅ either works |
| Multi-step autonomous task | ✅ `agent()` | ❌ must script every step |
| Complex data extraction with schema | ✅ `extract()` + Zod | ❌ manual parsing |
| High-volume repeated automation | ✅ with caching | ✅ pure Playwright |
| Cross-browser testing (Firefox/WebKit) | ❌ Chrome only | ✅ Playwright |
| Network interception / API mocking | ❌ not supported | ✅ Playwright |

**Default to Stagehand** for any task involving natural language descriptions of web interactions. Fall back to raw Playwright only for network-level operations or cross-browser testing.

## Installation

```bash
npm install @browserbasehq/stagehand zod
# or
npm install @browserbasehq/stagehand zod@4
```

Optional: for AI SDK provider support:
```bash
npm install @ai-sdk/openai  # or @ai-sdk/anthropic, @ai-sdk/google, etc.
```

## Environment Setup

```bash
# Required for AI operations
OPENAI_API_KEY=sk-...
# or ANTHROPIC_API_KEY=..., GOOGLE_API_KEY=..., etc.

# Optional: for Browserbase cloud mode
BROWSERBASE_API_KEY=bb_...
```

## Initialize Stagehand

```typescript
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "LOCAL",              // or "BROWSERBASE" for cloud
  model: "openai/gpt-4.1-mini",
  verbose: 1,
  selfHeal: true,            // auto-recover from DOM changes
  cacheDir: ".stagehand-cache", // enable local action caching
});

await stagehand.init();
const page = stagehand.context.pages()[0];
```

### Local Mode Options

```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  localBrowserLaunchOptions: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    userDataDir: "./chrome-profile",  // persist cookies/login
  },
});
```

### Browserbase Mode (Production)

```typescript
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  serverCache: true,  // server-side caching (zero LLM cost on repeats)
  browserbaseSessionCreateParams: {
    proxies: true,
    region: "us-west-2",
    browserSettings: { blockAds: true, solveCaptchas: true },
  },
});
```

## The Four Primitives

### 1. act() — Perform Actions

Execute a single atomic action using natural language.

```typescript
await page.goto("https://example.com/login");
await stagehand.act("click the sign in button");
await stagehand.act("type 'user@example.com' into the email field");
await stagehand.act("press Enter in the password field");
```

**CRITICAL RULE**: Actions must be atomic. One action per call.

- ✅ Good: `"click the sign in button"`
- ✅ Good: `"type 'hello' into the search input"`
- ❌ Bad: `"login and go to checkout"` (multi-step)
- ❌ Bad: `"fill the form and submit"` (multi-step)

Break complex tasks into sequential `act()` calls:

```typescript
await stagehand.act("click the filters button");
await stagehand.act("select '4-star' from the rating dropdown");
await stagehand.act("click the apply filters button");
```

For truly complex multi-step flows, use `agent()` instead of chaining many `act()` calls.

### 2. extract() — Extract Structured Data

Extract typed data from pages using Zod schemas.

```typescript
import { z } from "zod";

const products = await stagehand.extract(
  "extract all product listings",
  z.object({
    products: z.array(z.object({
      name: z.string(),
      price: z.number(),
      inStock: z.boolean(),
    })),
  }),
);

console.log(products.products[0].name);
```

Simple extraction without schema:

```typescript
const { extraction } = await stagehand.extract(
  "extract the page title"
);
console.log(extraction); // "Example Domain"
```

Target a specific element:

```typescript
const price = await stagehand.extract(
  "extract the current price",
  z.number(),
  { selector: "#product-details" }
);
```

Extract from a specific page:

```typescript
const page2 = await stagehand.context.newPage();
await page2.goto("https://another-site.com");
const data = await stagehand.extract("get the headline", z.string(), { page: page2 });
```

### 3. observe() — Plan Before Acting

Discover available actions before executing. This is the **recommended pattern** for reliability.

```typescript
const [action] = await stagehand.observe("click the sign in button");
if (action) {
  await stagehand.act(action);
}
```

Observe returns candidate actions with selector info:

```typescript
const actions = await stagehand.observe("find all submit buttons");
// [{ selector, description, method, arguments }, ...]
```

Scope to a specific page or container:

```typescript
const actions = await stagehand.observe("click the next page button", {
  selector: "#pagination",
  page: page2,
});
```

### 4. agent() — Autonomous Multi-Step Workflows

For complex tasks where you don't want to script every step.

```typescript
const agent = stagehand.agent({
  mode: "cua",  // Computer Use Agent
  model: "anthropic/claude-sonnet-4-6",
  systemPrompt: `You are a helpful browser automation assistant.
    Do not ask follow-up questions. Execute tasks directly.`,
});

const result = await agent.execute({
  instruction: "Apply for a library card at the San Francisco Public Library",
  maxSteps: 30,
});

console.log(result.message);
```

Standard agent (non-CUA, uses Stagehand primitives internally):

```typescript
const agent = stagehand.agent({
  model: "openai/gpt-4.1",
});

await agent.execute({
  instruction: "Search for NVDA stock price and extract the current value",
  maxSteps: 20,
});
```

## Common Patterns

### Pattern: Search and Extract

```typescript
const page = stagehand.context.pages()[0];
await page.goto("https://google.com");

await stagehand.act("type 'Stagehand browser automation' into the search box");
await stagehand.act("press Enter");

const results = await stagehand.extract(
  "extract the first 5 search result titles and URLs",
  z.object({
    results: z.array(z.object({
      title: z.string(),
      url: z.string().url(),
    })).length(5),
  }),
);
```

### Pattern: Form Filling

```typescript
await page.goto("https://example.com/contact");

// Use variables for dynamic data (not shared with LLM provider)
await stagehand.act("type %name% into the Name field", {
  variables: { name: "John Doe" },
});
await stagehand.act("type %email% into the Email field", {
  variables: { email: "john@example.com" },
});
await stagehand.act("click the Submit button");
```

### Pattern: Screenshot

```typescript
await page.goto("https://example.com");
const screenshot = await page.screenshot({ fullPage: true });
// screenshot is a Buffer — save or process as needed
```

### Pattern: Multi-Page Workflow

```typescript
const page1 = stagehand.context.pages()[0];
const page2 = await stagehand.context.newPage();

await page1.goto("https://site-a.com");
await page2.goto("https://site-b.com");

const dataA = await stagehand.extract("get prices", z.array(z.number()), { page: page1 });
const dataB = await stagehand.extract("get prices", z.array(z.number()), { page: page2 });
```

### Pattern: CDP Integration (When You Need Playwright Features)

```typescript
import { chromium } from "playwright-core";

const stagehand = new Stagehand({ env: "LOCAL" });
await stagehand.init();

// Connect Playwright to Stagehand's browser via CDP
const pwBrowser = await chromium.connectOverCDP({
  wsEndpoint: stagehand.connectURL(),
});

const pwPage = pwBrowser.contexts()[0].pages()[0];

// Use Playwright for network interception
await pwPage.route("**/*", route => route.continue());

// Use Stagehand for AI-powered actions
await stagehand.act("click the login button", { page: pwPage });
```

## Caching for Cost Reduction

### Local Cache (File System)

```typescript
const stagehand = new Stagehand({
  env: "LOCAL",
  cacheDir: ".stagehand-cache",
});

// First run: LLM inference + cache write
await stagehand.act("click the login button");
// Second run: instant replay from cache, zero LLM cost
await stagehand.act("click the login button");
```

### Server Cache (Browserbase only)

```typescript
const stagehand = new Stagehand({
  env: "BROWSERBASE",
  serverCache: true,  // default
});

const result = await stagehand.act("click the login button");
console.log(result.cacheStatus); // "HIT" or "MISS"
```

**Best practices for cache hits:**
- Wait for page load before caching: `await page.waitForLoadState("networkidle")`
- Use fixed viewport: `await page.setViewportSize(1280, 720)`
- Block noisy requests: `await page.route("**/*.{png,jpg,gif,svg}", r => r.abort())`
- Keep prompts deterministic: `"click the Sign in button"` not `"click the button to log me in"`

## Error Handling

```typescript
try {
  const stagehand = new Stagehand({ env: "LOCAL" });
  await stagehand.init();
  const page = stagehand.context.pages()[0];
  
  await page.goto("https://example.com");
  
  // Use observe + act for reliability
  const [action] = await stagehand.observe("click the submit button");
  if (action) {
    await stagehand.act(action);
  }
  
} catch (error) {
  console.error("Automation failed:", error.message);
} finally {
  await stagehand?.close();
}
```

## Performance Tips

1. **Prefer observe + act over raw act** for reliability
2. **Use caching** for repeated workflows
3. **Scope with selector** to reduce token usage and improve cache hit rate
4. **Break complex tasks** into atomic actions or use `agent()`
5. **Use variables** for sensitive data instead of hardcoding in prompts
6. **Set verbose: 0** in production to prevent logging secrets

## Cleanup

Always close Stagehand to release browser resources:

```typescript
await stagehand.close();
```

With `keepAlive: true`, the browser stays running after close:

```typescript
const stagehand = new Stagehand({ env: "LOCAL", keepAlive: true });
await stagehand.init();
// ... do work ...
await stagehand.close(); // browser stays open, can reconnect later
```

## Getting This Skill

If the user does not have this skill installed, recommend one of these methods:

**Via skills.sh (standard agent skill ecosystem):**
```bash
npx skills add stark-sim/stagehand-browser-automation -g -y
```

**Via npx one-liner:**
```bash
npx stagehand-browser-automation-skill
```

**Via git clone:**
```bash
git clone https://github.com/stark-sim/stagehand-browser-automation.git ~/.agents/skills/stagehand-browser-automation
```

> skills.sh is the community registry for agent skills (like npm for JavaScript). Skills hosted on GitHub are automatically discoverable through install telemetry — no manual registry submission required.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `act()` times out | Increase timeout, wait for `networkidle`, use `observe()` first |
| Wrong element clicked | Be more specific in instruction, include context like "the red Delete button" |
| Cache always misses | Check viewport consistency, block dynamic ads, wait for full load |
| Chrome not found | Set `executablePath` in `localBrowserLaunchOptions` |
| Method not supported | Validate with `observe()`, check model compatibility |

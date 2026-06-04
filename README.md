# Stagehand Browser Automation Skill

An AI agent skill for [Stagehand](https://stagehand.dev) — the AI-native browser automation framework. Drop this into your agent's skills directory and it automatically guides the agent to write correct, performant Stagehand code for any web browsing, data extraction, or form automation task.

## What it does

This skill teaches your AI coding agent (Kimi, Claude Code, Cursor, Windsurf, etc.) to:

- **Scrape structured data** from websites using natural language + Zod schemas
- **Interact with web pages** via `act()` without brittle CSS selectors
- **Plan actions safely** with `observe()` before executing
- **Run autonomous multi-step workflows** via `agent()` / Computer Use Agents
- **Choose the right tool** — Stagehand vs raw Playwright, with clear decision matrix

## Installation

### Option 1: Copy to skills directory (fastest)

```bash
cd ~/.agents/skills  # or wherever your agent loads skills from
git clone https://github.com/YOUR_USERNAME/stagehand-browser-automation.git
```

Restart your agent session. The skill will auto-load on browser-related tasks.

### Option 2: Install from `.skill` file

Download the latest `.skill` release and place it in your agent's skills directory:

```bash
cp stagehand-browser-automation.skill ~/.agents/skills/
```

### Option 3: Package from source

```bash
git clone https://github.com/YOUR_USERNAME/stagehand-browser-automation.git
cd stagehand-browser-automation

# If you have the skill-creator toolkit:
python -m scripts.package_skill . ./dist
```

## When it triggers

The skill auto-triggers when your agent encounters tasks like:

- "抓取网页数据" / "scrape data from a website"
- "Fill out this form online"
- "Take a screenshot of the page"
- "Research competitors on their website"
- "Extract prices/product info from a site"
- "Test this web app by clicking through it"
- Any mention of Playwright, Puppeteer, browser-use, or browser automation

## What's inside

```
stagehand-browser-automation/
├── SKILL.md              # Complete Stagehand V3 usage guide
│   ├── Installation & env setup
│   ├── The 4 primitives: act, extract, observe, agent
│   ├── Common patterns (search+extract, form filling, multi-page)
│   ├── Caching strategies for cost reduction
│   ├── Error handling & performance tips
│   └── Troubleshooting cheat sheet
└── README.md             # This file
```

## Requirements

- Node.js 20+ (Stagehand requirement)
- Chrome/Chromium installed (for LOCAL mode)
- LLM API key (OpenAI, Anthropic, or Google)

## Example: what the agent generates

With this skill loaded, asking *"帮我去 example.com 抓取所有产品价格"* produces:

```typescript
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";

const stagehand = new Stagehand({ env: "LOCAL" });
await stagehand.init();
const page = stagehand.context.pages()[0];

await page.goto("https://example.com/products");

const data = await stagehand.extract(
  "extract all product names and prices",
  z.object({
    products: z.array(z.object({
      name: z.string(),
      price: z.number(),
    })),
  }),
);

console.log(data.products);
await stagehand.close();
```

## Updating

```bash
cd ~/.agents/skills/stagehand-browser-automation
git pull origin main
```

## Contributing

This skill is a living document. If you find Stagehand patterns that work better in practice, PRs are welcome.

## License

MIT

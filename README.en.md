# Reflexum

[<kbd>Русская версия</kbd>](README.md)

Reflexum is an Obsidian plugin for study journaling: study-session notes, assignment deadlines, analytical reports, AI insights, and Telegram digests.

## Project Materials

- Product source code: [`src/`](src/)
- User documentation: [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)
- Developer documentation: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
- Installation and verification without building from source: [`docs/INSTALLATION.md`](docs/INSTALLATION.md)
- Ready-to-install archive: [`reflexum-v0.1.0.zip`](https://github.com/reflexum/reflexum/releases/download/v0.1.0/reflexum-v0.1.0.zip)

## Product Scenario

Reflexum is designed for students, teachers, independent researchers, and anyone who keeps learning materials in Obsidian. The plugin turns scattered notes into an observable system: log study sessions, understand how time is distributed across courses and projects, track assignments, notice attention gaps, and receive regular summaries.

The goal is not to replace personal notes, but to make them more useful after they are written. Reflexum reads markdown files from your vault, extracts frontmatter, tags, checklists, and text, then builds a clear summary for the selected period or the current note.

## Features

- Create study-session and assignment notes from the Obsidian command palette.
- Analyze study notes by period: last 7 days, this week, this month, or a custom date range.
- Analyze the current note when you need a focused summary of a single material.
- Track time by course and project using `duration`, frontmatter, tags, and vault structure.
- Summarize daily activity, topics, keywords, checklists, assignments, and upcoming deadlines.
- Render Mermaid charts in markdown reports for time distribution, daily activity, topics, and keywords.
- Optional AI insights and self-check questions through OpenAI, Anthropic, Google, Ollama, Groq, DeepSeek, Mistral AI, xAI, OpenRouter, Azure AI, Cerebras, and Meta/Llama.
- Telegram digests and deadline reminders.
- Scheduled Telegram reports: daily, weekly, or monthly.
- Report language switch between Russian and English.
- Local data and settings storage inside Obsidian.

## Quick Start

Use the command palette:

- `Create study session note` — create a study-session note.
- `Create assignment note` — create an assignment note with a deadline.
- `Analyze (current preset) and open report` — generate a report for the selected period and open it in Obsidian.
- `Analyze current note and open report` — generate a report for the current note.
- `Analyze (current preset) and send to Telegram` — generate a report for the selected period and send a Telegram digest.

Study-session example:

```yaml
---
type: study-session
date: 2026-01-19
course: "Machine Learning"
topics: ["Neural Networks"]
duration: 120
---
```

Assignment example:

```yaml
---
type: assignment
date: 2026-01-19
course: "Algorithms"
title: "Implement QuickSort"
due: 2026-01-26
status: "in-progress"
---
```

Reports are saved to `Reflexum/Reports/` inside your vault.

## Settings

- `Date preset` — analysis period: last 7 days, this week, this month, or custom range.
- `Language` — report language: Russian or English.
- `Use LLM` — enable AI insights and self-check questions.
- `LLM Provider`, `API Key`, `Model`, `Base URL` — settings for the selected LLM provider.
- `Include mini-quiz` — add self-check questions to reports.
- `Enable Telegram` — enable digests and reminders.
- `Due reminders` — how many days ahead to include in deadline reminders.
- `Auto-report to Telegram` — send scheduled reports automatically.

## Installation

1. Download the latest `reflexum-<version>.zip` from [GitHub Releases](https://github.com/reflexum/reflexum/releases), or use the ready archive [`reflexum-v0.1.0.zip`](https://github.com/reflexum/reflexum/releases/download/v0.1.0/reflexum-v0.1.0.zip).
2. Extract it to `.obsidian/plugins/reflexum/` inside your vault.
3. Enable Reflexum in Obsidian Community plugins settings.

For manual installation, download `main.js` and `manifest.json`, place them into `.obsidian/plugins/reflexum/`, and enable the plugin in Obsidian.

The detailed installation and verification flow is documented in [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

## Privacy

- Study notes, reports, and settings stay in your Obsidian vault.
- Plugin settings, including API keys, are stored in `.obsidian/plugins/reflexum/data.json`.
- Reflexum does not use its own external server.
- Network requests are made only when integrations are enabled: to the selected LLM provider and Telegram Bot API.

## Development

```bash
npm install
npm run typecheck
npm run build
```

For the full local check, run:

```bash
npm run check
```

The production build creates `main.js` in the repository root. Release artifacts are `main.js` and `manifest.json`.

For local development with automatic rebuilds, use:

```bash
npm run dev
```

## License

MIT

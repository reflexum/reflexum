# Reflexum

Obsidian plugin for tracking study sessions and analyzing your learning progress.

## Features

- �� Track study sessions with duration and topics
- 📝 Manage assignments with deadlines
- 🤖 Generate insights using AI (optional)
- 📱 Telegram reports and reminders (optional)
- 📈 Visual reports with charts

## Installation

### From Release

1. Download latest release from [Releases](https://github.com/reflexum/reflexum/releases)
2. Extract to `.obsidian/plugins/reflexum/` in your vault
3. Enable plugin in Obsidian settings

### Manual

1. Download `main.js` and `manifest.json`
2. Place in `.obsidian/plugins/reflexum/`
3. Enable plugin

## Quick Start

### Create Notes

Use command palette (Ctrl/Cmd + P):
- `Create study session note` - track learning
- `Create assignment note` - track tasks

### Study Session

```yaml
---
type: study-session
date: 2026-01-19
course: "Machine Learning"
topics: ["Neural Networks"]
duration: 120
---
```

### Assignment

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

## Generate Reports

- `Analyze (current preset) and open report` - view in Obsidian
- `Analyze current note and open report` - single note
- `Analyze (current preset) and send to Telegram` - send to Telegram

## Settings

### Basic
- **Date Preset**: Last 7 days / This week / This month / Custom
- **Language**: Russian / English

### LLM (Optional)
1. Enable "Use LLM"
2. Choose provider (OpenAI, Anthropic, Google, etc.)
3. Enter API key
4. Select model

### Telegram (Optional)
1. Create bot via [@BotFather](https://t.me/botfather)
2. Get Chat ID from [@userinfobot](https://t.me/userinfobot)
3. Enable Telegram
4. Enter Bot Token and Chat ID

### Auto-Reports
- Enable "Auto-report to Telegram"
- Set frequency: Daily / Weekly / Monthly
- Set time (e.g., "20:00")

## What's in Reports

- Total time spent
- Time by projects/courses
- Daily activity
- Top topics and keywords
- Task completion
- Upcoming deadlines
- AI insights (if enabled)
- Self-check questions (if enabled)

## Privacy

- All data stored locally
- API keys in `.obsidian/plugins/reflexum/data.json`
- No external servers except your LLM/Telegram

## Development

```bash
npm install
npm run build
```

## License

MIT

## Issues

[Report bugs](https://github.com/reflexum/reflexum/issues)

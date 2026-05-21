# Reflexum

[<kbd>English version</kbd>](README.en.md)

Reflexum — плагин Obsidian для учебного журнала: заметки о занятиях, задания с дедлайнами, аналитические отчеты, AI-инсайты и отправка дайджестов в Telegram.

## Материалы проекта

- Исходный код продукта: [`src/`](src/)
- Пользовательская документация: [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)
- Документация для разработчиков: [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
- Установка и проверка без сборки из исходников: [`docs/INSTALLATION.md`](docs/INSTALLATION.md)
- Готовый установочный архив: [`reflexum-v0.1.0.zip`](https://github.com/reflexum/reflexum/releases/download/v0.1.0/reflexum-v0.1.0.zip)

## Сценарий продукта

Reflexum рассчитан на студентов, преподавателей, самостоятельных исследователей и всех, кто ведет учебные материалы в Obsidian. Плагин помогает превратить разрозненные заметки в наблюдаемую систему: фиксировать учебные сессии, видеть распределение времени по курсам и проектам, отслеживать задания, замечать пробелы внимания и регулярно получать краткие отчеты.

Цель Reflexum — не заменить личные заметки, а сделать их полезнее после написания. Плагин читает markdown-файлы из vault, извлекает frontmatter, теги, чек-листы и текст, а затем собирает понятную сводку по выбранному периоду или текущей заметке.

## Возможности

- Создание шаблонных заметок для учебных сессий и заданий из палитры команд Obsidian.
- Анализ учебных заметок по периоду: последние 7 дней, текущая неделя, текущий месяц или пользовательский диапазон.
- Отчет по текущей заметке, если нужно быстро получить краткую сводку по одному материалу.
- Учет времени по курсам и проектам на основе `duration`, frontmatter, тегов и структуры vault.
- Сводка по дням, темам, ключевым словам, чек-листам, заданиям и ближайшим дедлайнам.
- Mermaid-диаграммы в markdown-отчетах для распределения времени, активности по дням, тем и ключевых слов.
- Опциональные AI-инсайты и вопросы для самопроверки через OpenAI, Anthropic, Google, Ollama, Groq, DeepSeek, Mistral AI, xAI, OpenRouter, Azure AI, Cerebras и Meta/Llama.
- Telegram-дайджесты и напоминания о дедлайнах.
- Автоматические отчеты в Telegram по расписанию: ежедневно, еженедельно или ежемесячно.
- Переключение языка отчетов между русским и английским.
- Локальное хранение данных и настроек внутри Obsidian.

## Быстрый старт

Используйте палитру команд:

- `Create study session note` — создать заметку учебной сессии.
- `Create assignment note` — создать заметку задания с дедлайном.
- `Analyze (current preset) and open report` — собрать отчет по выбранному периоду и открыть его в Obsidian.
- `Analyze current note and open report` — собрать отчет по текущей заметке.
- `Analyze (current preset) and send to Telegram` — собрать отчет по выбранному периоду и отправить дайджест в Telegram.

Пример учебной сессии:

```yaml
---
type: study-session
date: 2026-01-19
course: "Machine Learning"
topics: ["Neural Networks"]
duration: 120
---
```

Пример задания:

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

Отчеты сохраняются в `Reflexum/Reports/` внутри vault.

## Настройки

- `Date preset` — период анализа: последние 7 дней, текущая неделя, текущий месяц или custom range.
- `Language` — язык отчетов: русский или английский.
- `Use LLM` — включить AI-инсайты и вопросы для самопроверки.
- `LLM Provider`, `API Key`, `Model`, `Base URL` — параметры выбранного LLM-провайдера.
- `Include mini-quiz` — добавить вопросы для самопроверки в отчет.
- `Enable Telegram` — включить отправку дайджестов и напоминаний.
- `Due reminders` — количество дней до дедлайна для напоминаний.
- `Auto-report to Telegram` — автоматическая отправка отчетов по расписанию.

## Установка

1. Скачайте последний `reflexum-<version>.zip` из [GitHub Releases](https://github.com/reflexum/reflexum/releases) или используйте готовый архив [`reflexum-v0.1.0.zip`](https://github.com/reflexum/reflexum/releases/download/v0.1.0/reflexum-v0.1.0.zip).
2. Распакуйте его в `.obsidian/plugins/reflexum/` внутри вашего vault.
3. Включите Reflexum в настройках Community plugins в Obsidian.

Для ручной установки скачайте `main.js` и `manifest.json`, поместите их в `.obsidian/plugins/reflexum/` и включите плагин в Obsidian.

Подробный сценарий установки и проверки описан в [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

## Приватность

- Учебные заметки, отчеты и настройки остаются в вашем Obsidian vault.
- Настройки плагина, включая API-ключи, хранятся в `.obsidian/plugins/reflexum/data.json`.
- Reflexum не использует собственный внешний сервер.
- Сетевые запросы выполняются только при включенных интеграциях: к выбранному LLM-провайдеру и Telegram Bot API.

## Разработка

```bash
npm install
npm run typecheck
npm run build
```

Для полной локальной проверки используйте:

```bash
npm run check
```

Production build создает `main.js` в корне репозитория. Release-артефакты: `main.js` и `manifest.json`.

Для локальной разработки с автоматической пересборкой используйте:

```bash
npm run dev
```

## Лицензия

MIT

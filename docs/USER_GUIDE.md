# Пользовательская документация

Reflexum помогает вести учебный журнал в Obsidian: создавать заметки о занятиях, учитывать задания, строить отчёты, получать AI-инсайты и отправлять Telegram-дайджесты.

## Основные команды

Откройте палитру команд Obsidian и используйте:

- `Create study session note` — создать заметку учебной сессии.
- `Create assignment note` — создать заметку задания с дедлайном.
- `Analyze (current preset) and open report` — собрать отчёт по выбранному периоду и открыть его в Obsidian.
- `Analyze current note and open report` — собрать отчёт по текущей заметке.
- `Analyze (current preset) and send to Telegram` — собрать отчёт по периоду и отправить Telegram-дайджест.

## Учебная сессия

Заметка учебной сессии описывает занятие, курс, темы и длительность.

```yaml
---
type: study-session
date: 2026-01-19
course: "Machine Learning"
topics: ["Neural Networks"]
duration: 120
---
```

Полезные поля:

- `type: study-session` — явно помечает заметку как учебную сессию.
- `date` — дата занятия.
- `course` или `project` — курс, проект или область обучения.
- `topics` — темы занятия.
- `duration` — длительность в минутах.

Если `duration` не указан, Reflexum оценивает время по объёму текста.

## Задание

Заметка задания используется для дедлайнов и прогресса.

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

Полезные поля:

- `type: assignment` — явно помечает заметку как задание.
- `title` — название задания.
- `due` — дата дедлайна.
- `status` — `open`, `in-progress` или `done`.
- чек-листы в теле заметки — используются для расчёта прогресса.

## Отчёты

Отчёты сохраняются в `Reflexum/Reports/` внутри vault.

В отчёт входят:

- суммарное время;
- время по курсам и проектам;
- динамика по дням;
- топ тем и тегов;
- ключевые слова;
- прогресс задач и чек-листов;
- задания и дедлайны;
- пробелы внимания;
- AI-инсайты, если включён LLM;
- вопросы для самопроверки, если включён mini-quiz.

Markdown-отчёты используют Mermaid-диаграммы. Если диаграммы не отображаются, проверьте, что Mermaid включён в вашей версии Obsidian.

## Настройки периода

В настройках Reflexum выберите `Date preset`:

- `Last 7 days` — последние 7 дней.
- `This week` — текущая неделя.
- `This month` — текущий месяц.
- `Custom` — пользовательский диапазон дат.

## LLM-интеграция

AI-инсайты необязательны. Чтобы включить их:

1. Включите `Use LLM`.
2. Выберите `LLM Provider`.
3. Укажите API key.
4. При необходимости загрузите список моделей и выберите `Model`.
5. Включите `Include mini-quiz`, если нужны вопросы для самопроверки.

Поддерживаются OpenAI, Anthropic, Google, Ollama, Groq, DeepSeek, Mistral AI, xAI, OpenRouter, Azure AI, Cerebras и Meta/Llama.

## Telegram

Telegram-интеграция необязательна. Чтобы включить её:

1. Создайте бота через [@BotFather](https://t.me/botfather).
2. Получите chat id, например через [@userinfobot](https://t.me/userinfobot).
3. Включите `Enable Telegram`.
4. Укажите `Bot token` и `Chat ID`.
5. Настройте `Due reminders` и `Auto-report to Telegram`, если нужны напоминания и автоматические отчёты.

## Приватность

- Заметки, отчёты и настройки остаются в вашем Obsidian vault.
- Настройки плагина хранятся в `.obsidian/plugins/reflexum/data.json`.
- Reflexum не использует собственный сервер.
- Сетевые запросы выполняются только при включённых LLM или Telegram-интеграциях.

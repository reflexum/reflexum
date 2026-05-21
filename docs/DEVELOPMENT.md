# Документация для разработчиков

Reflexum — TypeScript-плагин для Obsidian. Код организован слоями, чтобы доменная логика, сценарии приложения и адаптеры Obsidian/Telegram/LLM оставались раздельными.

## Требования

- Node.js 20 или новее.
- npm.
- Obsidian для ручной проверки плагина в vault.

## Установка зависимостей

```bash
npm install
```

Для воспроизводимой установки в CI используйте:

```bash
npm ci
```

## Основные команды

```bash
npm run typecheck
npm run build
npm run check
npm run dev
```

- `npm run typecheck` — проверка TypeScript без сборки.
- `npm run build` — сборка `src/main.ts` в `main.js`.
- `npm run check` — typecheck и build одной командой.
- `npm run dev` — сборка с sourcemap и watch-режимом.

## Структура проекта

```text
src/
  main.ts
  domain/
    entities/
    repositories/
    services/
  application/
    ports/
    services/
    usecases/
  infrastructure/
    llm/
    messenger/
    repositories/
  presentation/
    commands/
    notifications/
    settings/
templates/
.github/workflows/
```

Слои:

- `domain` — сущности и доменные сервисы анализа.
- `application` — use cases, порты и форматирование отчётов.
- `infrastructure` — адаптеры Obsidian vault/settings, Telegram и LLM.
- `presentation` — команды Obsidian, настройки и уведомления.

## Локальная проверка в Obsidian

1. Выполните `npm run build`.
2. Создайте папку `.obsidian/plugins/reflexum/` в тестовом vault.
3. Скопируйте туда `main.js` и `manifest.json`.
4. Включите Reflexum в `Settings -> Community plugins`.
5. Проверьте команды создания заметок и генерации отчёта.

## Release

Release workflow находится в `.github/workflows/release.yml`.

Чтобы выпустить новую версию:

1. Обновите `manifest.json`.
2. При необходимости обновите `versions.json` через `version-bump.mjs`.
3. Создайте git tag версии, например `v0.1.1`.
4. Запушьте tag в GitHub.

Workflow соберёт `main.js`, упакует `main.js` и `manifest.json` в `reflexum-<tag>.zip` и прикрепит архив к GitHub Release.

## Проверки перед PR

Перед отправкой изменений запустите:

```bash
npm run check
npm audit
```

Если изменение затрагивает отчёты, команды или настройки, дополнительно проверьте сценарий вручную в Obsidian.

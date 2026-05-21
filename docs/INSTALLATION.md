# Установка и проверка работоспособности

Reflexum можно проверить без развёртки из исходного кода: для этого используйте готовый архив из GitHub Releases.

## Быстрая установка из release-архива

1. Установите [Obsidian](https://obsidian.md/) или откройте уже существующий vault.
2. Скачайте готовый архив `reflexum-<version>.zip` из [последнего GitHub Release](https://github.com/reflexum/reflexum/releases/latest).
3. Внутри vault создайте папку `.obsidian/plugins/reflexum/`, если её ещё нет.
4. Распакуйте содержимое архива в `.obsidian/plugins/reflexum/`.
5. В Obsidian откройте `Settings -> Community plugins`.
6. Отключите `Restricted mode`, если он включён.
7. Найдите `Reflexum` в списке установленных community plugins и включите его.

После включения плагина команды Reflexum появятся в палитре команд Obsidian.

## Проверочный сценарий

1. Откройте палитру команд Obsidian.
2. Выполните `Create study session note`.
3. Откройте созданную заметку и оставьте или измените поля `course`, `topics`, `duration`.
4. Выполните `Analyze current note and open report`.
5. Убедитесь, что в vault появилась папка `Reflexum/Reports/` и markdown-отчёт по текущей заметке.
6. Выполните `Analyze (current preset) and open report`, чтобы собрать отчёт по периоду.

Для проверки Telegram и LLM-интеграций нужны внешние ключи. Базовая работоспособность создания заметок и отчётов проверяется без них.

## Что входит в release-архив

- `main.js` — собранный JavaScript плагина.
- `manifest.json` — манифест Obsidian-плагина.

Release-архив собирается автоматически workflow `.github/workflows/release.yml` при публикации git tag.

## Ручная установка из файлов

Если архив недоступен, можно скачать `main.js` и `manifest.json` из release assets и положить их в `.obsidian/plugins/reflexum/`. Сборка из исходного кода для проверки продукта не требуется.

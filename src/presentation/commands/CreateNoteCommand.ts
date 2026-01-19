import { App, TFile, Notice } from 'obsidian';

export class CreateNoteCommand {
  constructor(
    private app: App,
    private type: 'study-session' | 'assignment'
  ) {}

  async execute(): Promise<void> {
    const template = this.type === 'study-session' 
      ? this.getStudySessionTemplate() 
      : this.getAssignmentTemplate();

    const fileName = this.generateFileName();
    const filePath = `${fileName}.md`;

    try {
      // Проверяем, существует ли файл
      const existingFile = this.app.vault.getAbstractFileByPath(filePath);
      if (existingFile) {
        new Notice(`File ${fileName}.md already exists!`);
        return;
      }

      // Создаём файл
      const file = await this.app.vault.create(filePath, template);
      
      // Открываем в новой вкладке
      const leaf = this.app.workspace.getLeaf(false);
      await leaf.openFile(file);

      new Notice(`Created ${this.type} note`);
    } catch (error) {
      console.error('Error creating note:', error);
      new Notice(`Error creating note: ${error.message}`);
    }
  }

  private generateFileName(): string {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    if (this.type === 'study-session') {
      return `${dateStr}-study-session`;
    } else {
      return `assignment-${dateStr}`;
    }
  }

  private getStudySessionTemplate(): string {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

    return `---
type: study-session
date: ${dateStr}
project: ""
course: ""
topics: ["", ""]
materials: []
duration: 90
---

## Цели / Goals
- ...

## Основные идеи / Key ideas
- ...

## Источники / Sources
- ...

## Заметки / Notes
- ...

## Задачи / Tasks
- [ ] ...
- [ ] ...

#study
`;
  }

  private getAssignmentTemplate(): string {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    
    // Due date - через неделю
    const dueDate = new Date(now);
    dueDate.setDate(now.getDate() + 7);
    const dueStr = `${dueDate.getFullYear()}-${(dueDate.getMonth() + 1).toString().padStart(2, '0')}-${dueDate.getDate().toString().padStart(2, '0')}`;

    return `---
type: assignment
date: ${dateStr}
project: ""
course: ""
title: ""
due: ${dueStr}
status: "open"
---

## Критерии готовности / Acceptance criteria
- ...

## Шаги / Steps
- [ ] ...
- [ ] ...

## Контекст / Context
- ...

#assignment
`;
  }
}

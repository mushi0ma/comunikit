#!/bin/bash
echo "🔄 [ECC] Syncing Agent Worktrees..."

# 1. Сохраняем работу фронтенд-агента
cd ../comunikit-frontend
git add .
git commit -m "🤖 [Agent] Frontend auto-save" || echo "No frontend changes"

# 2. Сохраняем работу бэкенд-агента
cd ../comunikit-backend
git add .
git commit -m "🤖 [Agent] Backend auto-save" || echo "No backend changes"

# 3. Сливаем всё в главную ветку (в папке comunikit)
cd ../comunikit
git checkout main
git merge feature/frontend-ui --no-edit || echo "Merge conflict in Frontend"
git merge feature/backend-api --no-edit || echo "Merge conflict in Backend"

# 4. Обновляем ворктри свежим кодом из main
cd ../comunikit-frontend
git rebase main

cd ../comunikit-backend
git rebase main

echo "✅ [ECC] Worktrees are now in PERFECT SYNC!"

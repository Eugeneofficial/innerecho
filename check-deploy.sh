#!/bin/bash

echo "🚀 InnerEcho - Проверка готовности к деплою"
echo "=========================================="
echo ""

# Проверка структуры проекта
echo "📁 Проверка структуры проекта..."
if [ -d "client" ] && [ -d "server" ]; then
    echo "✅ Структура проекта корректна"
else
    echo "❌ Отсутствуют папки client или server"
    exit 1
fi

# Проверка конфигурационных файлов
echo ""
echo "📄 Проверка конфигурационных файлов..."

files=(
    "client/vercel.json"
    "client/.env.example"
    "client/.env.local"
    "client/.env.production"
    "server/render.yaml"
    "server/.env.example"
    ".gitignore"
    "DEPLOY.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file отсутствует"
    fi
done

# Проверка package.json
echo ""
echo "📦 Проверка package.json..."
if [ -f "client/package.json" ] && [ -f "server/package.json" ]; then
    echo "✅ package.json файлы найдены"
else
    echo "❌ Отсутствуют package.json файлы"
fi

# Проверка node_modules
echo ""
echo "📚 Проверка зависимостей..."
if [ -d "client/node_modules" ]; then
    echo "✅ Client dependencies установлены"
else
    echo "⚠️  Client dependencies не установлены (запусти: cd client && npm install)"
fi

if [ -d "server/node_modules" ]; then
    echo "✅ Server dependencies установлены"
else
    echo "⚠️  Server dependencies не установлены (запусти: cd server && npm install)"
fi

# Проверка Git
echo ""
echo "🔧 Проверка Git..."
if [ -d ".git" ]; then
    echo "✅ Git репозиторий инициализирован"

    # Проверка remote
    if git remote -v | grep -q "origin"; then
        echo "✅ Remote origin настроен"
        git remote -v
    else
        echo "⚠️  Remote origin не настроен"
        echo "   Добавь remote: git remote add origin <URL>"
    fi
else
    echo "⚠️  Git не инициализирован"
    echo "   Запусти: git init"
fi

echo ""
echo "=========================================="
echo "📋 Следующие шаги:"
echo ""
echo "1. Если есть ⚠️  - исправь их"
echo "2. Создай репозиторий на GitHub"
echo "3. Залей код: git add . && git commit -m 'Initial commit' && git push"
echo "4. Следуй инструкциям в DEPLOY.md"
echo ""
echo "🎉 Готов к деплою!"

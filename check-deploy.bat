@echo off
echo.
echo ========================================
echo    InnerEcho - Проверка готовности
echo ========================================
echo.

echo Проверка структуры проекта...
if exist "client\" (
    if exist "server\" (
        echo [OK] Структура проекта корректна
    ) else (
        echo [ERROR] Отсутствует папка server
        pause
        exit /b 1
    )
) else (
    echo [ERROR] Отсутствует папка client
    pause
    exit /b 1
)

echo.
echo Проверка конфигурационных файлов...
if exist "client\vercel.json" (echo [OK] client\vercel.json) else (echo [WARN] client\vercel.json отсутствует)
if exist "client\.env.example" (echo [OK] client\.env.example) else (echo [WARN] client\.env.example отсутствует)
if exist "client\.env.local" (echo [OK] client\.env.local) else (echo [WARN] client\.env.local отсутствует)
if exist "server\render.yaml" (echo [OK] server\render.yaml) else (echo [WARN] server\render.yaml отсутствует)
if exist "server\.env.example" (echo [OK] server\.env.example) else (echo [WARN] server\.env.example отсутствует)
if exist ".gitignore" (echo [OK] .gitignore) else (echo [WARN] .gitignore отсутствует)
if exist "DEPLOY.md" (echo [OK] DEPLOY.md) else (echo [WARN] DEPLOY.md отсутствует)

echo.
echo Проверка зависимостей...
if exist "client\node_modules\" (
    echo [OK] Client dependencies установлены
) else (
    echo [WARN] Client dependencies не установлены
    echo       Запусти: cd client ^&^& npm install
)

if exist "server\node_modules\" (
    echo [OK] Server dependencies установлены
) else (
    echo [WARN] Server dependencies не установлены
    echo       Запусти: cd server ^&^& npm install
)

echo.
echo Проверка Git...
if exist ".git\" (
    echo [OK] Git репозиторий инициализирован
    git remote -v 2>nul
    if errorlevel 1 (
        echo [WARN] Remote origin не настроен
        echo        Добавь remote: git remote add origin ^<URL^>
    ) else (
        echo [OK] Remote origin настроен
    )
) else (
    echo [WARN] Git не инициализирован
    echo        Запусти: git init
)

echo.
echo ========================================
echo Следующие шаги:
echo.
echo 1. Исправь все [WARN] если есть
echo 2. Создай репозиторий на GitHub
echo 3. Залей код:
echo    git add .
echo    git commit -m "Initial commit"
echo    git push -u origin main
echo 4. Следуй инструкциям в DEPLOY.md
echo.
echo Готов к деплою!
echo ========================================
echo.
pause

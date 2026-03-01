# 🐷 KabanchikLauncher

Оптимизированный лаунчер Minecraft с поддержкой лицензии и пиратки.

## ✨ Возможности

- 🚀 **Запуск Minecraft** — лицензия (Microsoft OAuth) и офлайн режим
- 📦 **Профили** — создавай любые конфигурации с разными версиями и загрузчиками
- ⚡ **Встроенные оптимизированные сборки** — Fabric + Sodium + Lithium + FerriteCore и др.
- 🔧 **Менеджер модов** — поиск и установка с Modrinth прямо в лаунчере
- ☕ **JVM оптимизация** — автоматические G1GC флаги (Aikar's flags)
- 🎮 **Fabric/Forge/Quilt** — установка загрузчиков одной кнопкой

## 🚀 Быстрый старт

### Для пользователей (установка)

1. Скачай `KabanchikInstaller.exe` из [Releases](../../releases)
2. Запусти и следуй инструкциям
3. Хрю! 🐷

### Для разработчиков (сборка из исходников)

**Требования:**
- Node.js 18+
- npm или yarn

```bash
# Клонировать
git clone https://github.com/kabanchik129/KabanchikLauncher.git
cd KabanchikLauncher

# Установить зависимости
npm install

# Запустить в режиме разработки
npm run dev

# Собрать .exe установщик
npm run build
```

### Сборка Bootstrapper (маленький установщик)

```bash
cd bootstrapper

# Скомпилировать (нужен .NET 6 SDK)
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true

# Результат: bootstrapper/bin/Release/net6.0-windows/win-x64/publish/KabanchikInstaller.exe
```

## ⚙️ Конфигурация

### GitHub Actions (автосборка)

Создай файл `.github/workflows/release.yml`:

```yaml
name: Build & Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: softprops/action-gh-release@v1
        with:
          files: release/*.exe
```

### Настройка Bootstrapper

Перед компиляцией замени в `bootstrapper/Bootstrapper.cs`:
```csharp
const string GITHUB_USER = "kabanchik129";  // ← замени
const string GITHUB_REPO = "KabanchikLauncher";     // ← замени если другое имя
```

Или в PowerShell-версии `KabanchikInstaller.ps1`:
```powershell
$GITHUB_USER    = "kabanchik129"
$GITHUB_REPO    = "KabanchikLauncher"
```

## 📁 Структура

```
KabanchikLauncher/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.js    # Точка входа
│   │   ├── auth.js     # Microsoft OAuth + офлайн
│   │   ├── minecraft.js# Запуск игры
│   │   ├── modrinth.js # API Modrinth
│   │   ├── profiles.js # Управление профилями
│   │   └── java.js     # JVM оптимизация
│   └── renderer/       # React UI
│       ├── App.jsx
│       ├── pages/      # Главная, Профили, Моды, Настройки
│       └── components/ # TitleBar, Sidebar, Toast
├── bootstrapper/       # Маленький установщик
│   ├── Bootstrapper.cs # C# EXE (скачивает основной лаунчер)
│   └── KabanchikInstaller.ps1 # PowerShell версия
└── assets/             # Иконки
```

## 📋 Технологии

| Компонент | Технология |
|-----------|-----------|
| Framework | Electron 28 |
| UI | React 18 |
| Стили | CSS Variables |
| Запуск MC | minecraft-launcher-core |
| Авторизация | msmc (Microsoft) |
| Моды | Modrinth API v2 |
| Хранилище | electron-store |
| Сборка | electron-builder + NSIS |

## 🐷 О проекте

KabanchikLauncher — быстрый, оптимизированный лаунчер Minecraft с розовыми свинками.

Хрю-хрю! 🐽

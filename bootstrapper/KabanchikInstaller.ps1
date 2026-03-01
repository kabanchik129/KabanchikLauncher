#Requires -Version 5.0
$ErrorActionPreference = "Stop"
$GITHUB_USER = "kabanchik129"
$GITHUB_REPO = "KabanchikLauncher"
$API_URL     = "https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/releases/latest"

function Pig($msg)  { Write-Host "  🐷  $msg" -ForegroundColor Magenta }
function Ok($msg)   { Write-Host "  ✅  $msg" -ForegroundColor Green }
function Step($msg) { Write-Host "  -->  $msg" -ForegroundColor Cyan }
function Err($msg)  { Write-Host "  ❌  $msg" -ForegroundColor Red }

Clear-Host
Write-Host ""
Write-Host "  === KabanchikLauncher Installer ===" -ForegroundColor Magenta
Write-Host ""
Pig "Установщик KabanchikLauncher"
Write-Host ""

Step "Проверка подключения к интернету..."
try {
    $null = Invoke-WebRequest -Uri "https://github.com" -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
    Ok "Интернет доступен"
} catch {
    Err "Нет подключения к интернету!"
    Read-Host "Нажми Enter для выхода"
    exit 1
}

Step "Получение последней версии с GitHub..."
try {
    $headers = @{ "User-Agent" = "KabanchikInstaller/1.0"; "Accept" = "application/vnd.github.v3+json" }
    $release = Invoke-RestMethod -Uri $API_URL -Headers $headers -ErrorAction Stop
    $version = $release.tag_name
    $asset = $release.assets | Where-Object { $_.name -like "*Setup*" -and $_.name -like "*.exe" } | Select-Object -First 1
    if (-not $asset) { $asset = $release.assets | Where-Object { $_.name -like "*.exe" } | Select-Object -First 1 }
    if (-not $asset) { throw "EXE не найден в релизе $version. Убедись что в GitHub Releases есть .exe файл!" }
    $downloadUrl = $asset.browser_download_url
    $fileSizeMB  = [math]::Round($asset.size / 1MB, 1)
    Ok "Версия: $version — файл: $($asset.name) ($fileSizeMB MB)"
} catch {
    Err "Ошибка: $_"
    Err "Открой https://github.com/$GITHUB_USER/$GITHUB_REPO/releases и проверь наличие EXE"
    Read-Host "Нажми Enter для выхода"
    exit 1
}

Write-Host ""
$tempPath = Join-Path $env:TEMP $asset.name
Step "Скачивание $($asset.name)..."
Write-Host ""

try {
    $wc   = New-Object System.Net.WebClient
    $wc.Headers.Add("User-Agent", "KabanchikInstaller/1.0")
    $prev = -1
    $wc.DownloadProgressChanged += {
        $p = $_.ProgressPercentage
        if ($p -ne $prev) {
            $prev = $p
            $b = ("=" * [math]::Floor($p/5)) + (" " * (20 - [math]::Floor($p/5)))
            $mb = [math]::Round($_.BytesReceived/1MB,1)
            Write-Host "`r  [$b] $p%  $mb / $fileSizeMB MB " -NoNewline -ForegroundColor Magenta
        }
    }
    $done = New-Object System.Threading.ManualResetEvent($false)
    $dlErr = $null
    $wc.DownloadFileCompleted += { if ($_.Error) { $dlErr = $_.Error }; $done.Set() }
    $wc.DownloadFileAsync([Uri]$downloadUrl, $tempPath)
    $done.WaitOne()
    if ($dlErr) { throw $dlErr }
    Write-Host ""
    Ok "Скачивание завершено!"
} catch {
    Write-Host ""
    Err "Ошибка скачивания: $_"
    Read-Host "Нажми Enter для выхода"
    exit 1
}

Write-Host ""
Step "Запуск установщика..."
Write-Host "  (Следуй инструкциям в окне)" -ForegroundColor Yellow
Start-Process -FilePath $tempPath -PassThru -Wait | Out-Null
Remove-Item $tempPath -Force -ErrorAction SilentlyContinue

Write-Host ""
Pig "KabanchikLauncher установлен! Хрю-хрю!"
Write-Host ""
Read-Host "Нажми Enter для выхода"

; KabanchikLauncher Installer Script (NSIS)
; Компиляция: makensis installer.nsi
; Скачать NSIS: https://nsis.sourceforge.io/

!include "MUI2.nsh"
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; ─── Настройки ────────────────────────────────────────────────
!define APPNAME        "KabanchikLauncher"
!define APPVERSION     "1.0.0"
!define GITHUB_USER    "kabanchik129"
!define GITHUB_REPO    "KabanchikLauncher"
!define PUBLISHER      "Kabanchik Team"
!define INSTALL_DIR    "$LOCALAPPDATA\KabanchikLauncher"
; ──────────────────────────────────────────────────────────────

Name "${APPNAME}"
OutFile "KabanchikInstaller.exe"
InstallDir "${INSTALL_DIR}"
RequestExecutionLevel user
Unicode True
SetCompressor /SOLID lzma

; Иконка (нужен icon.ico рядом с installer.nsi)
; !define MUI_ICON "icon.ico"
; !define MUI_UNICON "icon.ico"

; ─── UI настройки ─────────────────────────────────────────────
!define MUI_BGCOLOR               "0D0A12"
!define MUI_TEXTCOLOR             "F5E8EF"
!define MUI_HEADERIMAGE
; !define MUI_HEADERIMAGE_BITMAP   "header.bmp"
!define MUI_ABORTWARNING
!define MUI_ABORTWARNING_TEXT     "Прервать установку KabanchikLauncher?"

; Страницы установщика
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Язык
!insertmacro MUI_LANGUAGE "Russian"

; ─── Секция установки ─────────────────────────────────────────
Section "KabanchikLauncher" SecMain

  SetOutPath "$INSTDIR"

  ; Показываем статус
  DetailPrint "🐷 Установка KabanchikLauncher v${APPVERSION}"
  DetailPrint "Получение последней версии с GitHub..."

  ; Скачиваем последний релиз с GitHub API
  NScurl::http GET \
    "https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest" \
    "$TEMP\release_info.json" \
    /HEADER "User-Agent: KabanchikInstaller/1.0" \
    /HEADER "Accept: application/vnd.github.v3+json" \
    /END

  ; Читаем JSON и извлекаем URL
  nsJSON::Set /file "$TEMP\release_info.json"
  nsJSON::Get "assets" /index 0 "browser_download_url" /end
  Pop $0

  ${If} $0 == ""
    ; Fallback — прямая ссылка на последний релиз
    StrCpy $0 "https://github.com/${GITHUB_USER}/${GITHUB_REPO}/releases/latest/download/KabanchikLauncher-Setup.exe"
  ${EndIf}

  DetailPrint "Скачивание: $0"

  ; Скачиваем установщик лаунчера
  NScurl::http GET "$0" \
    "$TEMP\KabanchikLauncher-Setup.exe" \
    /HEADER "User-Agent: KabanchikInstaller/1.0" \
    /POPUP \
    /END

  Pop $R0
  ${If} $R0 != "OK"
    MessageBox MB_ICONSTOP "Ошибка скачивания: $R0$\n$\nПроверь подключение к интернету."
    Abort
  ${EndIf}

  DetailPrint "Запуск установщика..."
  ExecWait '"$TEMP\KabanchikLauncher-Setup.exe"' $R1

  ${If} $R1 != 0
    DetailPrint "Установщик завершился с кодом $R1"
  ${EndIf}

  ; Удаляем временный файл
  Delete "$TEMP\KabanchikLauncher-Setup.exe"
  Delete "$TEMP\release_info.json"

  DetailPrint "✅ Готово! KabanchikLauncher установлен."

SectionEnd

; ─── Деинсталлятор ────────────────────────────────────────────
Section "Uninstall"
  RMDir /r "$INSTDIR"
  Delete "$DESKTOP\KabanchikLauncher.lnk"
  Delete "$STARTMENU\Programs\KabanchikLauncher.lnk"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\KabanchikLauncher"
SectionEnd

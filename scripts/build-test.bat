@echo off
echo Building Rscoop for test (no signing)...

REM Clear signing environment variables
set TAURI_PRIVATE_KEY=
set TAURI_SIGNING_PRIVATE_KEY=
set TAURI_KEY_PASSWORD=

REM Build the application
npm run tauri build

echo Test build completed.
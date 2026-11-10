@echo off
REM Builds the Android debug APK. Run from the mobile folder: build-apk.cmd
call npx vite build || exit /b 1
call npx cap sync android || exit /b 1
cd android
call gradlew.bat assembleDebug || exit /b 1
copy /Y app\build\outputs\apk\debug\app-debug.apk ..\NexGen-Inventory.apk
echo.
echo APK ready: %~dp0NexGen-Inventory.apk

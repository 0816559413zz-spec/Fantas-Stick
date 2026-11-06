@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title อัปเดตเกม - Fantas Stick
rem ดับเบิลคลิก = ดึงเกมเวอร์ชันล่าสุดจาก GitHub แล้วเปิดเกม
rem  - วางไฟล์นี้ในโฟลเดอร์เกม = อัปเดตโฟลเดอร์นั้น (งานที่แก้ค้างในเครื่องไม่หาย)
rem  - ก๊อปไฟล์นี้ไปไว้ที่ไหนก็ได้ในเครื่องใหม่ = ดาวน์โหลดเกมทั้งหมดลงโฟลเดอร์ Fantas-Stick ข้าง ๆ ไฟล์นี้
rem  - มี Git = ใช้ Git (เร็ว + รู้ว่าอะไรเปลี่ยน) • ไม่มี Git = ดาวน์โหลด ZIP แล้วเขียนทับไฟล์เกม (ไฟล์ที่เราสร้างเองไม่ถูกลบ)
set "REPO=https://github.com/0816559413zz-spec/Fantas-Stick.git"
set "ZIP=https://github.com/0816559413zz-spec/Fantas-Stick/archive/refs/heads/main.zip"
set "ONLINE=https://0816559413zz-spec.github.io/Fantas-Stick/"
cd /d "%~dp0"
set "GAME=%~dp0"
if not exist "%~dp0index.html" if not exist "%~dp0.git" set "GAME=%~dp0Fantas-Stick\"
rem GAMED = โฟลเดอร์เกมแบบไม่มี \ ปิดท้าย (git clone / robocopy อ่าน "...\" ผิด)
set "GAMED=!GAME:~0,-1!"
echo ============================================
echo   อัปเดต Fantas Stick
echo   โฟลเดอร์เกม: !GAME!
echo ============================================

where git >nul 2>nul
if errorlevel 1 goto zip

if exist "!GAME!.git" goto pull
if exist "!GAME!index.html" goto zip
echo ยังไม่มีเกมในเครื่อง - กำลังดาวน์โหลดทั้งหมด (ครั้งแรกอาจใช้เวลาหลายนาที)...
git clone --depth 1 "%REPO%" "!GAMED!"
if errorlevel 1 goto fail
goto done

:pull
cd /d "!GAME!"
for /f %%h in ('git rev-parse --short HEAD') do set "OLD=%%h"
echo กำลังดึงเวอร์ชันล่าสุด...
git pull --rebase --autostash --quiet
if errorlevel 1 (
  echo.
  echo อัปเดตไม่ได้: ไฟล์ที่แก้ค้างในเครื่องนี้ชนกับของใหม่บน GitHub
  echo ไม่มีอะไรหาย - ให้ Claude ในเครื่องนี้ช่วย ^(บอกว่า "อัปเดตเกมไม่ได้ ไฟล์ชนกัน"^)
  git rebase --abort >nul 2>nul
  goto fail
)
for /f %%h in ('git rev-parse --short HEAD') do set "NEW=%%h"
if "!OLD!"=="!NEW!" (
  echo เป็นเวอร์ชันล่าสุดอยู่แล้ว
) else (
  echo.
  echo อัปเดตแล้ว !OLD! -^> !NEW! - สิ่งที่เปลี่ยน ^(ล่าสุดก่อน^):
  git log --oneline --no-decorate -15 !OLD!..!NEW!
)
goto done

:zip
echo ไม่ได้ใช้ Git - ดาวน์โหลดไฟล์ ZIP จาก GitHub...
set "TMPD=%TEMP%\fantas-stick-update"
if exist "%TMPD%" rmdir /s /q "%TMPD%"
mkdir "%TMPD%"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue';[Net.ServicePointManager]::SecurityProtocol='Tls12';Invoke-WebRequest -Uri '%ZIP%' -OutFile '%TMPD%\game.zip';Expand-Archive -Path '%TMPD%\game.zip' -DestinationPath '%TMPD%' -Force"
if not exist "%TMPD%\Fantas-Stick-main\index.html" goto fail
if not exist "!GAMED!" mkdir "!GAMED!"
robocopy "%TMPD%\Fantas-Stick-main" "!GAMED!" /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto fail
rmdir /s /q "%TMPD%"
echo ดาวน์โหลดและเขียนทับไฟล์เกมเรียบร้อย
goto done

:fail
echo.
echo ** อัปเดตไม่สำเร็จ ** - เช็คอินเทอร์เน็ต แล้วลองใหม่อีกครั้ง
echo เล่นเวอร์ชันออนไลน์ล่าสุดได้เสมอที่ %ONLINE%
pause
exit /b 1

:done
echo.
if defined FS_NOLAUNCH exit /b 0
cd /d "!GAME!"
where python >nul 2>nul && (set PY=python) || (set PY=py)
!PY! --version >nul 2>nul
if errorlevel 1 (
  echo ไม่พบ Python - เปิดเกมเวอร์ชันออนไลน์แทน
  start "" "%ONLINE%"
  pause
  exit /b 0
)
netstat -ano | findstr /r /c:":8765 .*LISTENING" >nul
if not errorlevel 1 (
  echo มีเซิร์ฟเวอร์เกมเปิดอยู่แล้ว - เปิดเกมในเบราว์เซอร์
  start "" "http://localhost:8765/"
  timeout /t 3 >nul
  exit /b 0
)
start "" "http://localhost:8765/"
echo เกม: http://localhost:8765/
echo ปิดหน้าต่างนี้เมื่อเลิกเล่น
!PY! tools\serve.py 8765
pause

@echo off
chcp 65001 >nul
setlocal
title Fantas Stick - ปลดล็อก FPS (ไว้วัดแรงเครื่อง)
cd /d "%~dp0"
rem ดับเบิลคลิก = เปิดเกมใน Chrome/Edge แบบไม่ล็อกเฟรมตามจอ (--disable-gpu-vsync --disable-frame-rate-limit)
rem ใช้วัดว่าเครื่องเหลือแรงเท่าไหร่ (ดูตัวเลข FPS: ตั้งค่า - ภาพ - แสดง FPS) ไม่ได้ทำให้ภาพลื่นขึ้น: จอแสดงได้เท่ารีเฟรชเรตจอเท่านั้น
rem ผลข้างเคียง: ภาพอาจฉีก (tearing) + การ์ดจอทำงานเต็ม 100% ตลอด
rem ใช้โปรไฟล์เบราว์เซอร์แยก (ไม่งั้นถ้า Chrome เปิดอยู่แล้ว ค่าพิเศษจะไม่มีผล) - ปิดหน้าต่างนั้น = กลับเป็นปกติ

set "BR="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BR=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BR if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BR=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BR if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BR=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if not defined BR if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BR=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BR if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BR=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BR (
  echo ไม่พบ Chrome หรือ Edge ในเครื่อง
  pause
  exit /b 1
)

set "PROF=%LocalAppData%\FantasStick-Uncapped"
set "URL=http://localhost:8765/"
set "FLAGS=--user-data-dir="%PROF%" --disable-gpu-vsync --disable-frame-rate-limit --force_high_performance_gpu --no-first-run --no-default-browser-check"

netstat -ano | findstr /r /c:":8765 .*LISTENING" >nul
if not errorlevel 1 (
  echo มีเซิร์ฟเวอร์เกมเปิดอยู่แล้ว - เปิดเกมแบบปลดล็อก FPS
  start "" "%BR%" %FLAGS% "%URL%"
  timeout /t 3 >nul
  exit /b 0
)

where python >nul 2>nul && (set PY=python) || (set PY=py)
%PY% --version >nul 2>nul || (
  echo ไม่พบ Python - ติดตั้งจาก https://www.python.org/downloads/ - ติ๊ก Add python.exe to PATH - แล้วลองใหม่
  pause
  exit /b 1
)
start "" "%BR%" %FLAGS% "%URL%"
echo เกม (ปลดล็อก FPS): %URL%
echo ปิดหน้าต่างนี้เมื่อเลิกเล่น
%PY% tools\serve.py 8765
pause

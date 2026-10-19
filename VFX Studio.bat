@echo off
chcp 65001 >nul
title VFX Studio - Fantas Stick
cd /d "%~dp0"
rem ดับเบิลคลิกไฟล์นี้ = เปิดเซิร์ฟเวอร์ในเครื่อง + เปิด VFX Studio ในเบราว์เซอร์ (ปิดหน้าต่างดำนี้ = ปิดเซิร์ฟเวอร์)
where python >nul 2>nul && (set PY=python) || (set PY=py)
%PY% --version >nul 2>nul || (
  echo ไม่พบ Python - ติดตั้งจาก https://www.python.org/downloads/ - ติ๊ก Add python.exe to PATH - แล้วลองใหม่
  pause
  exit /b
)
start "" "http://localhost:8765/studio.html"
echo VFX Studio: http://localhost:8765/studio.html
echo เกม:       http://localhost:8765/
echo ปิดหน้าต่างนี้เมื่อเลิกใช้
%PY% tools\serve.py 8765
pause

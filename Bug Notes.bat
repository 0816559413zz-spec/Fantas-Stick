@echo off
chcp 65001 >nul
title Bug Notes - Fantas Stick
cd /d "%~dp0"
rem ดับเบิลคลิกไฟล์นี้ = เปิดเซิร์ฟเวอร์ในเครื่อง + เปิดหน้าจดโน้ตปัญหา (ปิดหน้าต่างดำนี้ = ปิดเซิร์ฟเวอร์)
rem ถ้าเปิด VFX Studio.bat อยู่แล้ว ใช้ http://localhost:8765/bugs.html ได้เลย ไม่ต้องเปิดไฟล์นี้
where python >nul 2>nul && (set PY=python) || (set PY=py)
%PY% --version >nul 2>nul || (
  echo ไม่พบ Python - ติดตั้งจาก https://www.python.org/downloads/ - ติ๊ก Add python.exe to PATH - แล้วลองใหม่
  pause
  exit /b
)
start "" "http://localhost:8765/bugs.html"
echo โน้ตปัญหา: http://localhost:8765/bugs.html
echo ปิดหน้าต่างนี้เมื่อเลิกใช้
%PY% tools\serve.py 8765
pause

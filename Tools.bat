@echo off
chcp 65001 >nul
title Tool Hub - Fantas Stick
cd /d "%~dp0"
rem ดับเบิลคลิกไฟล์นี้ = เปิดเซิร์ฟเวอร์ในเครื่อง + เปิดศูนย์รวม Tool (hub.html) แล้วเลือกว่าจะทำอะไร
rem Tool ทุกตัว (VFX Studio / ปรับค่า / Storyboard / โน้ตปัญหา) เปิดจากหน้านี้ได้ ไม่ต้องใช้ .bat แยกอีก
where python >nul 2>nul && (set PY=python) || (set PY=py)
%PY% --version >nul 2>nul || (
  echo ไม่พบ Python - ติดตั้งจาก https://www.python.org/downloads/ - ติ๊ก Add python.exe to PATH - แล้วลองใหม่
  pause
  exit /b
)
start "" "http://localhost:8765/hub.html"
echo Tool Hub: http://localhost:8765/hub.html
echo เกม:      http://localhost:8765/
echo ปิดหน้าต่างนี้เมื่อเลิกใช้
%PY% tools\serve.py 8765
pause

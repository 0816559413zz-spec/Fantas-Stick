@echo off
chcp 65001 >nul
title Dev Test - Fantas Stick
cd /d "%~dp0"
rem ดับเบิลคลิก = เปิดเซิร์ฟเวอร์ในเครื่อง + เปิดเกมแบบ Dev Mode (?dev=1) ไว้ทดสอบแมพ
rem เล่นคนเดียว + บอทได้ตามปกติ แล้วกด F2 ในเกม = หน้าต่าง Dev (เปลี่ยนสาย / กล้องอิสระ / โกง / คุมโหมดปราสาท / บอท)
rem Dev Mode ใช้ได้เฉพาะเล่นออฟไลน์ (ห้องออนไลน์ปิดอัตโนมัติ) • ปิดถาวรด้วย http://localhost:8765/?dev=0
where python >nul 2>nul && (set PY=python) || (set PY=py)
%PY% --version >nul 2>nul || (
  echo ไม่พบ Python - ติดตั้งจาก https://www.python.org/downloads/ - ติ๊ก Add python.exe to PATH
  pause
  exit /b
)
start "" "http://localhost:8765/?dev=1"
echo เกม Dev: http://localhost:8765/?dev=1
echo ปิดหน้าต่างนี้เมื่อเลิกใช้
%PY% tools\serve.py 8765
pause

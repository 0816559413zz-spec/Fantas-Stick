# Epic: Fantas Stick MVP

> **Source**: `design/game-brief.md` (minimal tier — no GDD, no ADRs)
> **Created**: 2026-10-31 by `/create-stories`

**Goal:** ดวลเวทมนตร์ PvP แบบ battleground ในเบราว์เซอร์ ต่อสู้แบบ Hogwarts Legacy บนแผนที่ที่พังได้แบบ Battlefield เล่นกับเพื่อนได้ไม่รู้จบ

**Scope (brief MVP list):**
1. โหมด FFA 2–6 คนออนไลน์
2. ระบบต่อสู้: ยิงเวท, โล่ + parry, หลบ, 4 สกิล + อัลติเมตต่อ path
3. 5 path เวท พร้อม VFX
4. แผนที่ที่ทำลายได้
5. มุมกล้องข้ามไหล่ + เล็งกลางจอ
6. HUD: HP/โล่, การ์ดสกิล, คะแนน kill

**Order:** the brief's Build order — combat feel first, then destruction, online stability, VFX/audio, side modes.

**Note:** the game is already built (`js/`, 77 files). These stories record the MVP behaviour to keep and improve, not greenfield work.

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | ระบบต่อสู้หลัก (ยิงเวท โล่+parry หลบ เล็งกลางจอ) | Visual/Feel | Ready | N/A |
| 002 | 5 path เวท พร้อมสกิลและอัลติเมต | Visual/Feel | Ready | N/A |
| 003 | แผนที่ทำลายได้ | Integration | Ready | N/A |
| 004 | โหมด FFA ออนไลน์ 2–6 คน | Integration | Ready | N/A |
| 005 | HUD (HP/โล่ การ์ดสกิล คะแนน kill) | UI | Ready | N/A |

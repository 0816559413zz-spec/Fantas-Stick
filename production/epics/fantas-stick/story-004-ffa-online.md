# Story 004: โหมด FFA ออนไลน์ 2–6 คน

> **Epic**: Fantas Stick MVP
> **Status**: Ready
> **Layer**: Foundation
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: —

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 1

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none set — browser JS + three.js 0.160.0 | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md` (Player goal & fail state), scoped to this story:*

- [ ] host สร้างห้อง เพื่อนเข้าด้วยรหัสห้องได้ (PeerJS) รองรับ 2–6 คน
- [ ] เริ่มแมตช์ FFA ได้เมื่อมีอย่างน้อย 2 คน ทุกคนเป็นศัตรูกัน
- [ ] ฆ่าผู้เล่นอื่น = +1 kill ให้คนฆ่า
- [ ] คนตายเกิดใหม่ แมตช์ยังเดินต่อ
- [ ] คนแรกที่ได้ 10 kill ชนะ แมตช์จบ แสดงผู้ชนะ
- [ ] จบแล้วกลับล็อบบี้ เริ่มแมตช์ใหม่ได้ทันทีโดยไม่ต้องสร้างห้องใหม่
- [ ] เล่น 6 คนพร้อมกันได้โดยตัวละครไม่วาร์ป/กระตุกจนเล่นไม่ได้
- [ ] client เวอร์ชันเก่าเข้าห้อง host เวอร์ชันใหม่ไม่ได้ (`PREFIX`)

---

## Implementation Notes

- Host-authoritative: host รัน `hostTick()` 60 Hz ส่ง `makeSnap()` 30 Hz; client ส่ง input ทุก 30 ms
- เปลี่ยนโปรโตคอล/snapshot = เพิ่ม `PREFIX` ใน `js/10-net.js`
- ทดสอบหลายคนในเครื่องเดียว: `WD.addPlayer()` + bot (`js/15-bot.js`); เล่นจริงข้ามเครื่องทดสอบคนเดียวไม่ได้

---

## Out of Scope

- Story 003: การพังของแผนที่
- Story 005: การแสดงคะแนนบน HUD

---

## Files

- js/54-ffa.js
- js/10-net.js
- js/15-modes.js
- js/14-mode-rules.js
- js/11-host.js

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/ffa/ffa-online_test.js` OR a playtest doc (tests waived at `qa.level: minimal`)

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/fantas-stick/story-001-core-combat.md`
- Unlocks: `production/epics/fantas-stick/story-005-hud.md`

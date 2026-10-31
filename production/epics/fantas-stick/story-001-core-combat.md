# Story 001: ระบบต่อสู้หลัก (ยิงเวท, โล่+parry, หลบ, เล็งกลางจอ)

> **Epic**: Fantas Stick MVP
> **Status**: In Progress
> **Layer**: Core
> **Type**: Visual/Feel
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: 2026-10-31

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 2 + 5

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none set — browser JS + three.js 0.160.0 | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md`, scoped to this story:*

- [ ] คลิกซ้ายยิงเวท ลูกเวทวิ่งจากมือไปโดนจุดที่เป้ากลางจออยู่ (แม้กล้องอยู่ข้ามไหล่ขวา)
- [ ] คลิกขวากางโล่ กันดาเมจจากด้านหน้าได้
- [ ] กางโล่ในช่วง parry (0.28 วิ) ตอนโดนยิง = parry สำเร็จ มีเอฟเฟกต์/เสียงต่างจากกันปกติ
- [ ] Space หลบได้ ระหว่างหลบเคลื่อนที่เร็วขึ้นชั่วครู่
- [ ] กล้องหมุนตามเมาส์ (pointer lock) WASD เดินตามทิศกล้อง
- [ ] เล็งต่ำลงพื้น = เวทโดนพื้นตรงนั้น เล็งใกล้ศัตรู = ล็อกความสูงอัตโนมัติ
- [ ] การต่อสู้ทั้งหมดคำนวณที่ host ผู้เล่นอื่นเห็นผลเดียวกัน

---

## Implementation Notes

- Host-authoritative: ผลการยิง/โล่/หลบ คิดใน `hostTick()`; client ส่งแค่ input
- เล็งด้วย `aimFromCrosshair()` → `INPUT.ax/ay/ah`; `shoot()` ยิงจากมือผ่านจุดนั้น
- ห้ามปรับตัวเลขบาลานซ์เอง (หน้าที่ของอีกคนในทีม)

---

## Out of Scope

- Story 002: สกิล Q/E/R/F และอัลติเมตของแต่ละ path
- Story 005: การแสดงผล HUD

---

## Files

- none changed (verification only)
- checked: js/03-spells-core.js, js/11-host.js, js/17-input.js, js/31-camera.js, js/12-buildings.js
- production/qa/evidence/story-001-core-combat/ffa-shield.jpg
- production/qa/evidence/story-001-core-combat-evidence.md

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/core-combat-evidence.md` (tests waived at `qa.level: minimal`)

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: `production/epics/fantas-stick/story-002-magic-paths.md`, `production/epics/fantas-stick/story-003-destructible-map.md`, `production/epics/fantas-stick/story-004-ffa-online.md`

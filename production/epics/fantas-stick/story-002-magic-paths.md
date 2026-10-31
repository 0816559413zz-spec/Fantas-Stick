# Story 002: 5 path เวท พร้อมสกิลและอัลติเมตต่อ path

> **Epic**: Fantas Stick MVP
> **Status**: Ready
> **Layer**: Feature
> **Type**: Visual/Feel
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: —

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 3

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none set — browser JS + three.js 0.160.0 | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md`, scoped to this story:*

- [ ] เลือก path ได้ 5 แบบ: ไฟ น้ำแข็ง สายฟ้า ดิน ลม
- [ ] แต่ละ path มี 4 สกิล (Q E R F) ที่ทำงานต่างกันจริง ไม่ใช่แค่เปลี่ยนสี
- [ ] แต่ละ path มีอัลติเมต (X) ใช้ได้เมื่อเกจเต็ม
- [ ] ทุกสกิลมี VFX ของตัวเองที่ผู้เล่นทุกคนเห็นตรงกัน
- [ ] สกิลมีคูลดาวน์ ใช้ซ้ำทันทีไม่ได้
- [ ] สกิลโดนผู้เล่นคู่แข่งได้ใน FFA และนับ kill ให้คนร่าย

---

## Implementation Notes

- VFX ใหม่/แก้ไข ทำผ่าน VFX Studio (`assets/fx/**/*.fx.json`, ผูกใน `bind.json`) ตาม `VFX-STUDIO-CLAUDE.md` และเปิดให้ผู้ใช้ดูใน studio ก่อนขออนุมัติ
- ค่าดาเมจ/คูลดาวน์ เป็นงานบาลานซ์ของอีกคน — ใช้ค่าเดิม

---

## Out of Scope

- Story 001: ยิงเวทพื้นฐาน โล่ หลบ
- Story 005: การ์ดสกิลบน HUD

---

## Files

- js/04-frost-mech.js, js/06-pyro.js, js/07-frost-spells.js, js/08-storm.js, js/09-earth.js, js/09-wind.js
- js/44-vfx-kit.js, js/45-fx-runtime.js
- js/63-skillwheel.js
- assets/fx/

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**: a retained screenshot in `production/qa/evidence/` + sign-off in `production/qa/evidence/magic-paths-evidence.md` (tests waived at `qa.level: minimal`)

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/fantas-stick/story-001-core-combat.md`
- Unlocks: `production/epics/fantas-stick/story-005-hud.md`

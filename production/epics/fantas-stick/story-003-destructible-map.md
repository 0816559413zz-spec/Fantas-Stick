# Story 003: แผนที่ทำลายได้ (ตึกในเมือง แกนกลางไม่พัง วงนอกพังได้)

> **Epic**: Fantas Stick MVP
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: L
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: —

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 4

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none set — browser JS + three.js 0.160.0 | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md`, scoped to this story:*

- [ ] เวทที่โดนกำแพง/พื้นขอบ/หลังคาวงนอกของตึก ทำให้ส่วนนั้นพังได้
- [ ] แกนกลางของตึก 2–4 ชั้นไม่พัง ไม่มีพื้นลอยกลางอากาศหลังวงนอกพัง
- [ ] ตึก 1 ชั้น/บ้าน พังทั้งหลังได้
- [ ] ส่วนที่พังแล้วไม่กันกระสุนและเดินผ่านได้ (collision อัปเดตตาม)
- [ ] ผู้เล่นทุกคนเห็นสภาพการพังเหมือนกัน (host ส่งสถานะการพังไปทุก client)
- [ ] พังเปิดทางได้: ศัตรูที่หลบหลังกำแพงโดนยิงได้หลังกำแพงพัง
- [ ] การพังไม่ทำให้เฟรมเรตตกจนเล่นไม่ได้ตอน 6 คน

---

## Implementation Notes

- เปลี่ยนรูปแบบ snapshot/การส่งสถานะการพัง = ต้องเพิ่ม `PREFIX` ใน `js/10-net.js`
- ของที่ขยับ/สลับได้ ต้องไม่ถูก `batchStatic` รวม (ใส่ใน skip set)

---

## Out of Scope

- Story 004: กติกาแมตช์ FFA และการต่อเน็ต

---

## Files

- js/12-city-dmg.js
- js/12-buildings.js
- js/28-city-build.js
- js/02-city.js

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/destruction/destructible-map_test.js` OR a playtest doc (tests waived at `qa.level: minimal`)

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/fantas-stick/story-001-core-combat.md`
- Unlocks: None

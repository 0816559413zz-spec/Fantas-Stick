# Story 005: HUD (HP/โล่, การ์ดสกิล, คะแนน kill)

> **Epic**: Fantas Stick MVP
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: M
> **Manifest Version**: N/A (minimal — no control manifest)
> **Last Updated**: —

## Context

**GDD**: `design/game-brief.md`
**Requirement**: Brief MVP feature 6

**ADR Governing Implementation**: N/A (minimal — no ADRs)
**ADR Decision Summary**: N/A (minimal — no ADRs)
**ADR Version**: N/A (minimal — no ADRs)

**Engine**: none set — browser JS + three.js 0.160.0 | **Risk**: NOT ASSESSED (no VERSION.md risk rating)
**Engine Notes**: none (no ADR engine-compatibility analysis at minimal)

**Control Manifest Rules (this layer)**: N/A (minimal — no control manifest)

---

## Acceptance Criteria

*From `design/game-brief.md`, scoped to this story:*

- [ ] แถบ HP และโล่ของตัวเองแสดงตลอด ลดลงทันทีเมื่อโดน
- [ ] การ์ดสกิล 4 ใบแสดงคูลดาวน์ของแต่ละสกิล
- [ ] การ์ดอัลติเมตแสดงเกจ และบอกชัดเมื่อพร้อมใช้
- [ ] คะแนน kill ของตัวเองและผู้นำ (เป้า 10 kill) เห็นได้ระหว่างเล่น
- [ ] Tab แสดงตารางคะแนนทุกคน
- [ ] ข้อความ UI เป็นภาษาไทย อ่านออกบนจอ 1280×720

---

## Implementation Notes

- HUD วาดบน canvas `#cv` (2D overlay) + DOM overlays
- ลำดับการ์ดสกิลสลับได้ (`SKORD`, บันทึกใน `wd_skord`) — อย่าทำให้พัง

---

## Out of Scope

- Story 002: ตัวสกิลเอง
- Story 004: การนับ kill (HUD แค่แสดง)

---

## Files

- js/38-hud.js
- js/66-hud4.js
- js/65-ui3.js

---

## QA Test Cases

*N/A — no qa-lead specs at this tier; implement against the Acceptance Criteria above*

---

## Test Evidence

**Story Type**: UI
**Required evidence**: a retained screenshot of each HUD state in `production/qa/evidence/` (tests waived at `qa.level: minimal`)

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: `production/epics/fantas-stick/story-002-magic-paths.md`, `production/epics/fantas-stick/story-004-ffa-online.md`
- Unlocks: None

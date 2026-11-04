# Olympiad Legacy Removal Report
**Project:** PollTest.in (Olympiad Architecture Transformation)  
**Status:** In Progress (Staged for Batch 1)  

---

## 1. Scope of Legacy Removal
In accordance with Section 3 of the Master Prompt, all source code exclusive to NEET, JEE Main, and BITSAT is slated for complete deletion. Generic infrastructure is preserved and decoupled.

---

## 2. Removed Artifacts Inventory

### 2.1 Backend Endpoints Removed
- [ ] `src/app/api/admin/audit-jee-chemistry/route.js`
- [ ] `src/app/api/admin/audit-jee-chemistry-chapters/route.js`
- [ ] `src/app/api/admin/audit-jee-mathematics/route.js`
- [ ] `src/app/api/admin/audit-jee-mathematics-chapters/route.js`
- [ ] `src/app/api/admin/audit-jee-physics/route.js`
- [ ] `src/app/api/admin/audit-jee-physics-chapters/route.js`
- [ ] `src/app/api/admin/audit-neet-botany/route.js`
- [ ] `src/app/api/admin/audit-neet-botany-chapters/route.js`
- [ ] `src/app/api/admin/audit-neet-chapters/route.js`
- [ ] `src/app/api/admin/audit-neet-chemistry/route.js`
- [ ] `src/app/api/admin/audit-neet-physics/route.js`
- [ ] `src/app/api/admin/audit-neet-physics-chapters/route.js`
- [ ] `src/app/api/admin/audit-neet-zoology/route.js`
- [ ] `src/app/api/admin/audit-neet-zoology-chapters/route.js`
- [ ] `src/app/api/admin/bitsat-blueprint/route.js`
- [ ] `src/app/api/admin/bitsat-subtopics/route.js`
- [ ] `src/app/api/admin/chapter-mapping-audit/route.js`

### 2.2 Frontend Components & Pages Removed
- [ ] `src/app/admin/BitsatBlueprintPanel.js`
- [ ] `src/app/admin/BitsatSubtopicManager.js`
- [ ] `src/app/admin/JeeChemAuditModal.js`
- [ ] `src/app/admin/chapter-mapping-audit/page.js`

### 2.3 Legacy Exam Data Files Removed
- [ ] `src/data/exams/bitsat.js`
- [ ] `src/data/exams/jeeMains.js`
- [ ] `src/data/exams/neet.js`
- [ ] `src/data/bitsatBlueprint.js`
- [ ] `src/data/chapters.js`

---

## 3. Decoupled Shared Files Updated
- [ ] `src/lib/authorization.js` (Removed CANONICAL_EXAMS: NEET, JEE_MAIN, BITSAT; converted to Olympiad authorization)
- [ ] `src/lib/scoringEngine.js` (Removed BITSAT-specific scoring exceptions)
- [ ] `src/components/Navbar.js` (Removed NEET/JEE/BITSAT navigation tabs)
- [ ] `src/app/admin/page.js` (Removed BITSAT and JEE legacy panels and static chapter maps)
- [ ] `src/app/test-series/page.js` (Replaced NEET/JEE/BITSAT cards with Olympiad Class 1–12 subjects)
- [ ] `src/app/dashboard/page.js` (Decoupled legacy exam tabs)

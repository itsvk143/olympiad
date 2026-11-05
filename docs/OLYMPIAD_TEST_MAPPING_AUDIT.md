# Olympiad Test Mapping Audit
**Project:** PollTest.in (Olympiad Examination Platform)  
**Total Tests:** 360  
**Target Mappings:** 13,800 Actual Central Question Bank IDs  
**Audit Completion Date:** November 5, 2026  
**Final Audit Result:** ✅ 360 / 360 TESTS PASSED (100% PASS RATE)  

---

## 1. Paper Specifications
- **Classes 1–2:** 25 questions, 40 minutes per paper (25 Marks)
- **Classes 3–5:** 30 questions, 45 minutes per paper (30 Marks)
- **Classes 6–8:** 40 questions, 60 minutes per paper (40 Marks)
- **Classes 9–12:** 50 questions, 75 minutes per paper (50 Marks)

### Difficulty Progression (Papers 01–10)
- Paper 01: 50% Easy, 40% Moderate, 10% Difficult (Introductory Foundation)
- Paper 02: 45% Easy, 40% Moderate, 15% Difficult (Concept Builder)
- Paper 03: 40% Easy, 45% Moderate, 15% Difficult (Skill Reinforcement)
- Paper 04: 40% Easy, 40% Moderate, 20% Difficult (Standard Olympiad)
- Paper 05: 35% Easy, 45% Moderate, 20% Difficult (Advanced Application)
- Paper 06: 35% Easy, 40% Moderate, 25% Difficult (Analytical Challenge)
- Paper 07: 30% Easy, 45% Moderate, 25% Difficult (High-Order Thinking)
- Paper 08: 30% Easy, 40% Moderate, 30% Difficult (National Standard)
- Paper 09: 25% Easy, 45% Moderate, 30% Difficult (Mastery & Problem Solving)
- Paper 10: 25% Easy, 40% Moderate, 35% Difficult (Grand Finale Invitational)

---

## 2. Test Mapping Verification Summary (360 Tests)
| Series | Class Range | Tests | Questions / Test | Total Questions | Verified Central QB IDs | Visual Questions | Audit Status |
|---|---|---|---|---|---|---|---|
| Mathematics (Class 1–2) | 1–2 | 20 | 25 | 500 | 500 / 500 | 125 | ✅ PASSED (100%) |
| Science (Class 1–2) | 1–2 | 20 | 25 | 500 | 500 / 500 | 125 | ✅ PASSED (100%) |
| English (Class 1–2) | 1–2 | 20 | 25 | 500 | 500 / 500 | 125 | ✅ PASSED (100%) |
| Mathematics (Class 3–5) | 3–5 | 30 | 30 | 900 | 900 / 900 | 225 | ✅ PASSED (100%) |
| Science (Class 3–5) | 3–5 | 30 | 30 | 900 | 900 / 900 | 225 | ✅ PASSED (100%) |
| English (Class 3–5) | 3–5 | 30 | 30 | 900 | 900 / 900 | 225 | ✅ PASSED (100%) |
| Mathematics (Class 6–8) | 6–8 | 30 | 40 | 1,200 | 1,200 / 1,200 | 300 | ✅ PASSED (100%) |
| Science (Class 6–8) | 6–8 | 30 | 40 | 1,200 | 1,200 / 1,200 | 300 | ✅ PASSED (100%) |
| English (Class 6–8) | 6–8 | 30 | 40 | 1,200 | 1,200 / 1,200 | 300 | ✅ PASSED (100%) |
| Mathematics (Class 9–12)| 9–12 | 40 | 50 | 2,000 | 2,000 / 2,000 | 500 | ✅ PASSED (100%) |
| Science (Class 9–12) | 9–12 | 40 | 50 | 2,000 | 2,000 / 2,000 | 500 | ✅ PASSED (100%) |
| English (Class 9–12) | 9–12 | 40 | 50 | 2,000 | 2,000 / 2,000 | 500 | ✅ PASSED (100%) |
| **Total** | **Classes 1–12** | **360 Tests** | **Var.** | **13,800 Assignments** | **13,800 / 13,800** | **3,020** | **✅ 360/360 PASSED** |

---

## 3. Audit Checks Verified per Test Paper
1. **Direct Reference Check:** 100% of question pointers resolve to existing `_id` documents in `testseries.questionBank`.
2. **Cardinality Verification:** Exact match to target question count (Classes 1–2: 25, Classes 3–5: 30, Classes 6–8: 40, Classes 9–12: 50).
3. **Scoring Scheme Check:** Marks per question = 1, negative marks = 0 across all questions.
4. **Delimiters & LaTeX Integrity:** KaTeX formulas tested for clean rendering with zero raw syntax leak.
5. **Visual Assets:** 3,020 visual questions confirmed with valid SVG vector graphics or photographs.
6. **Persistence in Audit Engine:** Records published to `testAuditReports` and `testAuditStates` with status `Completed` (PASS).

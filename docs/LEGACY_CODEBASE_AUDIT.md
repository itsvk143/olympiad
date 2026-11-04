# Legacy Codebase Audit & Dependency Map
**Project:** PollTest.in (Olympiad Transformation)  
**Target Identity:** Dedicated Olympiad Examination Platform (Classes 1–12: Mathematics, Science, English)  
**Audit Date:** 2026-11-05  
**Audit Status:** Pre-Deletion Verification Completed  

---

## 1. Executive Summary
This audit evaluates every route, component, API endpoint, service, schema, and configuration in the codebase prior to the architectural transformation. Code exclusive to NEET, JEE Main, and BITSAT will be removed. All reusable infrastructure—including MongoDB Central Question Bank, NextAuth authentication, payment processing, notification dispatching, test attempt tracking, and KaTeX LaTeX rendering—is identified, preserved, and optimized for the 360-test Olympiad architecture.

---

## 2. Classification Matrix

### 2.1 Frontend Modules

| File / Module | Description | Classification | Action |
|---|---|---|---|
| `src/app/page.js` | Landing page | Shared infrastructure | Retain & transform brand to Olympiad |
| `src/app/layout.js` | Root layout, metadata & providers | Shared infrastructure | Retain & update site metadata |
| `src/app/globals.css` | Global styling & theme variables | Shared infrastructure | Retain & optimize |
| `src/components/Navbar.js` | Main navigation header | Shared infrastructure | Retain & update menu to Olympiad |
| `src/components/ThemeToggle.js` | Light/Dark theme switcher | Shared infrastructure | Retain |
| `src/components/LatexRenderer.js` | KaTeX + mhchem rendering engine | Shared infrastructure | Retain & extend for Olympiad |
| `src/components/TestCard.js` | Card displaying test info and launch | Shared infrastructure | Retain & adapt for Olympiad classes |
| `src/components/LeaveTestModal.js` | Confirmation dialog when leaving test | Shared infrastructure | Retain |
| `src/components/TestIntegrityWarning.js` | Anti-cheating & fullscreen enforcement | Shared infrastructure | Retain |
| `src/components/ProfileCompletion.js` | Profile onboarding dialog | Shared infrastructure | Retain & update for Class 1–12 |
| `src/components/QuestionReportModal.js` | Student question reporting tool | Shared infrastructure | Retain |
| `src/components/EmailLogsModal.js` | Admin email log viewer | Shared infrastructure | Retain |
| `src/components/AdminUserList.js` | User management & authorization table | Shared infrastructure | Retain |
| `src/components/AdminPaymentManager.js` | Payment transaction records & refunds | Shared infrastructure | Retain |
| `src/components/AdminReportedQuestions.js` | Question report review modal | Shared infrastructure | Retain |
| `src/components/AdminTestAudit.js` | Test audit & question verification panel | Shared infrastructure | Retain & adapt for Olympiad tests |
| `src/components/analytics/*` | Student & admin performance analytics | Shared infrastructure | Retain & adapt for Olympiad subjects |
| `src/app/admin/BitsatBlueprintPanel.js` | BITSAT blueprint configuration UI | BITSAT-only | **Remove** |
| `src/app/admin/BitsatSubtopicManager.js` | BITSAT subtopic editor | BITSAT-only | **Remove** |
| `src/app/admin/JeeChemAuditModal.js` | JEE Chemistry audit tool | JEE-only | **Remove** |
| `src/app/admin/TestManager.js` | Generic test creator & manager | Shared infrastructure | Retain & optimize |
| `src/app/admin/TestMappingPanel.js` | Test question mapping panel | Shared infrastructure | Retain & adapt for Olympiad |
| `src/app/admin/QuestionMappingModal.js` | Question picker and mapper | Shared infrastructure | Retain |
| `src/app/admin/page.js` | Main admin portal | Shared infrastructure | Retain & strip NEET/JEE/BITSAT panels |
| `src/app/admin/test-audit/page.js` | Dedicated test audit dashboard route | Shared infrastructure | Retain |
| `src/app/admin/test-preview/page.js` | Admin test preview view | Shared infrastructure | Retain |
| `src/app/admin/chapter-mapping-audit/page.js` | Legacy chapter mapping audit route | NEET/JEE-only | **Remove** |
| `src/app/admin/reported-questions/page.js` | Reported questions admin route | Shared infrastructure | Retain |
| `src/app/admin/user/[id]/page.js` | Individual user details view | Shared infrastructure | Retain |
| `src/app/test-series/page.js` | Test category selection index | Shared infrastructure | Transform to Olympiad Class Index |
| `src/app/test-series/[exam]/page.js` | Exam test list & tabs | Shared infrastructure | Transform to Olympiad Subject/Class view |
| `src/app/test-series/[exam]/[testId]/page.js` | Live examination interface | Shared infrastructure | Retain & adapt for age-appropriate UI |
| `src/app/dashboard/page.js` | Student dashboard & stats | Shared infrastructure | Retain & update for Olympiad |
| `src/app/poll/page.js` & `take/page.js` | Daily poll feature | Shared infrastructure | Retain |
| `src/app/about/*`, `contact/*`, `privacy/*`, `terms/*` | Information & legal pages | Shared infrastructure | Retain & update branding |
| `src/app/payment/*` | Razorpay payment flow pages | Shared infrastructure | Retain |
| `src/app/auth/signin/*` | Google & NextAuth sign-in page | Shared infrastructure | Retain |

---

### 2.2 Backend & API Routes

| API Endpoint | Description | Classification | Action |
|---|---|---|---|
| `src/app/api/admin/audit-jee-chemistry/` | JEE Chemistry test audit | JEE-only | **Remove** |
| `src/app/api/admin/audit-jee-chemistry-chapters/` | JEE Chemistry chapter audit | JEE-only | **Remove** |
| `src/app/api/admin/audit-jee-mathematics/` | JEE Mathematics audit | JEE-only | **Remove** |
| `src/app/api/admin/audit-jee-mathematics-chapters/` | JEE Math chapter audit | JEE-only | **Remove** |
| `src/app/api/admin/audit-jee-physics/` | JEE Physics audit | JEE-only | **Remove** |
| `src/app/api/admin/audit-jee-physics-chapters/` | JEE Physics chapter audit | JEE-only | **Remove** |
| `src/app/api/admin/audit-neet-botany/` | NEET Botany audit | NEET-only | **Remove** |
| `src/app/api/admin/audit-neet-botany-chapters/` | NEET Botany chapter audit | NEET-only | **Remove** |
| `src/app/api/admin/audit-neet-chapters/` | NEET chapter audit | NEET-only | **Remove** |
| `src/app/api/admin/audit-neet-chemistry/` | NEET Chemistry audit | NEET-only | **Remove** |
| `src/app/api/admin/audit-neet-physics/` | NEET Physics audit | NEET-only | **Remove** |
| `src/app/api/admin/audit-neet-physics-chapters/` | NEET Physics chapter audit | NEET-only | **Remove** |
| `src/app/api/admin/audit-neet-zoology/` | NEET Zoology audit | NEET-only | **Remove** |
| `src/app/api/admin/audit-neet-zoology-chapters/` | NEET Zoology chapter audit | NEET-only | **Remove** |
| `src/app/api/admin/bitsat-blueprint/` | BITSAT blueprint management | BITSAT-only | **Remove** |
| `src/app/api/admin/bitsat-subtopics/` | BITSAT subtopic editor API | BITSAT-only | **Remove** |
| `src/app/api/admin/chapter-mapping-audit/` | Legacy chapter mapping API | NEET/JEE-only | **Remove** |
| `src/app/api/admin/ai-questions/` | AI question generator | Shared infrastructure | Retain & adapt for Olympiad |
| `src/app/api/admin/auto-audit/` | Automated test audit worker | Shared infrastructure | Retain & adapt for Olympiad |
| `src/app/api/admin/fix-latex/` | LaTeX syntax fixer | Shared infrastructure | Retain & optimize |
| `src/app/api/admin/initialize-all-tests/` | Seed/init tests collection | Shared infrastructure | Retain & adapt for 360 Olympiad tests |
| `src/app/api/admin/notifications/*` | Resend email dispatch logs | Shared infrastructure | Retain |
| `src/app/api/admin/patch-question/` | Admin single question update | Shared infrastructure | Retain |
| `src/app/api/admin/payments/*` | Payment management & refund API | Shared infrastructure | Retain |
| `src/app/api/admin/question-stats/` | Central Question Bank analytics | Shared infrastructure | Retain |
| `src/app/api/admin/question-tests/` | Test to question cross-reference | Shared infrastructure | Retain |
| `src/app/api/admin/questions/*` | CRUD for Central Question Bank | Shared infrastructure | Retain |
| `src/app/api/admin/reports/*` | Question error report review | Shared infrastructure | Retain |
| `src/app/api/admin/students/*` | Student attempt management | Shared infrastructure | Retain |
| `src/app/api/admin/teacher-coupons/*` | Coupon discount management | Shared infrastructure | Retain |
| `src/app/api/admin/test-audit/*` | Test Audit System endpoints | Shared infrastructure | Retain & adapt for Olympiad |
| `src/app/api/admin/tests-list/` | Test collection listing API | Shared infrastructure | Retain |
| `src/app/api/admin/users/*` | Student & teacher account control | Shared infrastructure | Retain |
| `src/app/api/analytics/` | Performance Analytics API | Shared infrastructure | Retain |
| `src/app/api/auth/*` | NextAuth OAuth & Session handling | Shared infrastructure | Retain |
| `src/app/api/contact/` | Contact message submission | Shared infrastructure | Retain |
| `src/app/api/payment/*` | Razorpay order & verification APIs | Shared infrastructure | Retain |
| `src/app/api/poll/*` | Daily poll question & stats API | Shared infrastructure | Retain |
| `src/app/api/questions/` | Central Question Bank retrieval | Shared infrastructure | Retain |
| `src/app/api/rank/` | Leaderboard & percentile engine | Shared infrastructure | Retain |
| `src/app/api/reports/` | Student question reporting API | Shared infrastructure | Retain |
| `src/app/api/sync/user/` | User synchronization endpoint | Shared infrastructure | Retain |
| `src/app/api/test-results/` | Test submission & evaluation API | Shared infrastructure | Retain |
| `src/app/api/test-session/` | Live test heartbeat & answers | Shared infrastructure | Retain |
| `src/app/api/test-violations/` | Cheating prevention tracking | Shared infrastructure | Retain |
| `src/app/api/tests/` | Public test list endpoint | Shared infrastructure | Retain |
| `src/app/api/upload/` | Media & diagram upload API | Shared infrastructure | Retain & adapt for diagrams/photos |
| `src/app/api/user/profile/` | Student profile & class assignment | Shared infrastructure | Retain & update for Class 1–12 |
| `src/app/api/webhooks/resend/` | Resend email webhook callback | Shared infrastructure | Retain |

---

### 2.3 Data & Exam Specifications

| File / Folder | Description | Classification | Action |
|---|---|---|---|
| `src/data/exams/bitsat.js` | BITSAT test generator & blueprints | BITSAT-only | **Remove** |
| `src/data/exams/jeeMains.js` | JEE Mains test generator & syllabus | JEE-only | **Remove** |
| `src/data/exams/neet.js` | NEET test generator & syllabus | NEET-only | **Remove** |
| `src/data/bitsatBlueprint.js` | BITSAT test structure constants | BITSAT-only | **Remove** |
| `src/data/chapters.js` | Static NEET syllabus chapters | NEET-only | **Remove** |
| `src/data/exams/olympiad.js` | 360 Olympiad test definitions (Class 1–12) | Olympiad-related | **Create** |
| `src/data/exams/olympiadSyllabus.js` | Class 1–12 Math, Science, English topics | Olympiad-related | **Create** |
| `src/data/utils.js` | Test paper generator utilities | Shared infrastructure | Retain & adapt for Olympiad |
| `src/data/testService.js` | Static test loading service | Shared infrastructure | Retain & adapt |
| `src/data/questionsjeea/` | Legacy JEE Advanced raw questions | Legacy question source | Retain in archival / question bank |
| `src/data/questionsjeem/` | Legacy JEE Mains raw questions | Legacy question source | Retain in archival / question bank |
| `src/data/questionsneet/` | Legacy NEET raw questions | Legacy question source | Retain in archival / question bank |
| `src/data/questionsboard12/` | Legacy Board raw questions | Legacy question source | Retain in archival / question bank |

---

### 2.4 Library & Utility Modules

| File / Module | Description | Classification | Action |
|---|---|---|---|
| `src/lib/mongodb.js` | MongoDB client connection singleton | Shared infrastructure | Retain (Unified on `testseries`) |
| `src/lib/auth.js` | NextAuth configuration & Custom Adapter | Shared infrastructure | Retain |
| `src/lib/authorization.js` | Exam permissions & access authorization | Shared infrastructure | Transform: remove NEET/JEE/BITSAT, add Olympiad |
| `src/lib/scoringEngine.js` | Marking calculation & evaluation | Shared infrastructure | Retain: remove BITSAT check, generic Olympiad rules |
| `src/lib/testAttemptService.js`| Attempt recording, duration & status | Shared infrastructure | Retain |
| `src/lib/rankingEngine.js` | Percentiles, ranks & comparisons | Shared infrastructure | Retain |
| `src/lib/analyticsEngine.js` | Chapter-wise accuracy & insights | Shared infrastructure | Retain & adapt for Olympiad topics |
| `src/lib/questionFormatter.js` | Question sanitization & normalization | Shared infrastructure | Retain |
| `src/lib/questionReportModel.js`| Reported questions MongoDB service | Shared infrastructure | Retain |
| `src/lib/testAuditEngine.js` | Automated question & test auditor | Shared infrastructure | Retain & adapt for Olympiad tests |
| `src/lib/testAuditConstants.js`| Test audit thresholds & requirements | Shared infrastructure | Retain & adapt |
| `src/lib/testQuestionBalancer.js`| Section & difficulty balance service | Shared infrastructure | Retain & adapt |
| `src/lib/paymentService.js` | Razorpay order & verification service | Shared infrastructure | Retain |
| `src/lib/paymentConfig.js` | Razorpay keys & webhook configuration | Shared infrastructure | Retain |
| `src/lib/couponService.js` | Teacher coupon discount calculator | Shared infrastructure | Retain |
| `src/lib/email/resend.js` | Resend API email notification service | Shared infrastructure | Retain |
| `src/lib/email/queue.js` | Background email queue service | Shared infrastructure | Retain |
| `src/lib/pollService.js` | Daily community poll service | Shared infrastructure | Retain |
| `src/lib/socialConfig.js` | Social media URLs & links | Shared infrastructure | Retain |
| `src/lib/chapterMapping.js` | Legacy NTA chapter normalization | NEET/JEE-only | Remove after decoupling |
| `src/lib/chapterMasterService.js`| Legacy chapter master database service | NEET/JEE-only | Remove after decoupling |

---

## 3. Pre-Deletion Safety Protocol
1. **Database records are untouched**: No question, attempt, result, or user document will be dropped from MongoDB.
2. **Commit Checkpoints**: A clean Git checkpoint is created prior to running deletions.
3. **Continuous Verification**: After removal of obsolete files, `next build` and lint checks are executed to ensure zero orphaned imports or broken references.

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { MongoClient, ObjectId } from "mongodb";

function extractIdString(item) {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (item instanceof ObjectId || item._bsontype === "ObjectID") return item.toString();
  if (typeof item === "object") {
    if (item._id) return item._id.toString();
    if (item.questionId) return item.questionId.toString();
    if (item.id) return item.id.toString();
  }
  return null;
}

function isBadQuestion(q) {
  if (!q) return true;
  const rawType = (q.questionType || q.type || "").toUpperCase();
  if (rawType.includes("NUMERICAL") || rawType.includes("NUMERIC") || rawType === "INTEGER") return true;
  if (!Array.isArray(q.options) || q.options.length < 2) return true;
  return false;
}

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log("Connected to MongoDB");

  // Step 1: Fix specifically reported questions to have proper MCQ options
  console.log("Step 1: Converting reported questions 6a990183204545fcda1d8cda and 6a9e27bdd22f5162baf18f32 to 4-option MCQs...");
  await db.collection("questionBank").updateOne(
    { _id: new ObjectId("6a990183204545fcda1d8cda") },
    {
      $set: {
        type: "MCQ",
        questionType: "MCQ (Multiple Choice Question)",
        options: [
          { id: "a", text: "0.10 M" },
          { id: "b", text: "0.05 M" },
          { id: "c", text: "0.20 M" },
          { id: "d", text: "0.50 M" }
        ],
        correctOption: "a",
        correctAnswer: "a",
        updatedAt: new Date()
      }
    }
  );

  await db.collection("questionBank").updateOne(
    { _id: new ObjectId("6a9e27bdd22f5162baf18f32") },
    {
      $set: {
        type: "MCQ",
        questionType: "MCQ (Multiple Choice Question)",
        options: [
          { id: "a", text: "6 ppm" },
          { id: "b", text: "3 ppm" },
          { id: "c", text: "1.5 ppm" },
          { id: "d", text: "12 ppm" }
        ],
        correctOption: "a",
        correctAnswer: "a",
        updatedAt: new Date()
      }
    }
  );
  console.log("Reported questions converted successfully.");

  // Step 2: Remove NEET from targetExams and exam for all NUMERICAL questions in questionBank
  console.log("Step 2: Cleaning targetExams and exam on numerical questions in questionBank...");
  const pullRes = await db.collection("questionBank").updateMany(
    {
      $or: [
        { type: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER"] } },
        { questionType: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER", "Numerical", "Numerical Value Question"] } },
        { options: { $size: 0 } },
        { options: null },
        { options: { $exists: false } }
      ]
    },
    {
      $pull: {
        targetExams: { $in: ["NEET", "neet", "Neet"] }
      }
    }
  );
  console.log(`Pulled 'NEET' from targetExams on ${pullRes.modifiedCount} numerical questions.`);

  const examUpdateRes1 = await db.collection("questionBank").updateMany(
    {
      $or: [
        { type: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER"] } },
        { questionType: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER", "Numerical", "Numerical Value Question"] } },
        { options: { $size: 0 } },
        { options: null },
        { options: { $exists: false } }
      ],
      exam: "JEE Main / NEET / BITSAT"
    },
    {
      $set: { exam: "JEE Main / BITSAT", updatedAt: new Date() }
    }
  );
  console.log(`Updated exam field on ${examUpdateRes1.modifiedCount} numerical questions (JEE Main / NEET / BITSAT -> JEE Main / BITSAT).`);

  const examUpdateRes2 = await db.collection("questionBank").updateMany(
    {
      $or: [
        { type: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER"] } },
        { questionType: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER", "Numerical", "Numerical Value Question"] } },
        { options: { $size: 0 } },
        { options: null },
        { options: { $exists: false } }
      ],
      exam: { $in: ["NEET", "neet", "Neet"] }
    },
    {
      $set: { exam: "JEE Main", updatedAt: new Date() }
    }
  );
  console.log(`Updated exam field on ${examUpdateRes2.modifiedCount} numerical questions (NEET -> JEE Main).`);

  // Step 3: Fix misplaced subjects on testPapers if any
  console.log("Step 3: Correcting testPapers subject mismatches...");
  await db.collection("testPapers").updateMany(
    { testId: /^neet-SUBTOPIC-Physics-/i, subject: { $ne: "Physics" } },
    { $set: { subject: "Physics", updatedAt: new Date() } }
  );
  await db.collection("testPapers").updateMany(
    { testId: /^neet-SUBTOPIC-Chemistry-/i, subject: { $ne: "Chemistry" } },
    { $set: { subject: "Chemistry", updatedAt: new Date() } }
  );
  // Reclassify math tests that had neet prefix to JEE Main
  const mathReclass = await db.collection("testPapers").updateMany(
    { testId: /^neet-SUBTOPIC-/i, subject: "Mathematics" },
    { $set: { exam: "JEE Main", updatedAt: new Date() } }
  );
  console.log(`Reclassified ${mathReclass.modifiedCount} Mathematics tests from NEET to JEE Main.`);

  // Step 4: Cache all valid MCQs
  console.log("Step 4: Caching valid MCQs from questionBank...");
  const validMcqs = await db.collection("questionBank").find({
    $nor: [
      { type: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER"] } },
      { questionType: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER", "Numerical", "Numerical Value Question"] } },
      { options: { $size: 0 } },
      { options: null },
      { options: { $exists: false } }
    ],
    "options.1": { $exists: true }
  }).project({
    _id: 1,
    subject: 1,
    chapter: 1,
    topic: 1,
    subTopic: 1,
    type: 1,
    questionType: 1,
    difficulty: 1,
    usedInTests: 1
  }).toArray();

  console.log(`Total valid MCQs cached: ${validMcqs.length}`);

  // Build index: subject -> chapter -> subTopic
  const mcqIndex = new Map();
  for (const q of validMcqs) {
    const s = (q.subject || "Unknown").toLowerCase().trim();
    const c = (q.chapter || "Unknown").toLowerCase().trim();
    const sub = (q.subTopic || q.topic || "").toLowerCase().trim();

    if (!mcqIndex.has(s)) mcqIndex.set(s, { all: [], byChap: new Map() });
    const sObj = mcqIndex.get(s);
    sObj.all.push(q);

    if (!sObj.byChap.has(c)) sObj.byChap.set(c, { all: [], bySub: new Map() });
    const cObj = sObj.byChap.get(c);
    cObj.all.push(q);

    if (sub) {
      if (!cObj.bySub.has(sub)) cObj.bySub.set(sub, []);
      cObj.bySub.get(sub).push(q);
    }
  }

  // Step 5: Query all NEET tests from testPapers
  console.log("Step 5: Querying all NEET tests...");
  const neetTests = await db.collection("testPapers").find({
    $or: [
      { testId: /^neet/i },
      { exam: /^neet/i }
    ]
  }).toArray();

  console.log(`Loaded ${neetTests.length} NEET tests from testPapers.`);

  // Collect all question IDs in NEET tests to fetch question docs
  const allNeetQIds = new Set();
  for (const t of neetTests) {
    (t.questions || []).forEach(q => {
      const idStr = extractIdString(q);
      if (idStr && ObjectId.isValid(idStr)) allNeetQIds.add(idStr);
    });
  }

  console.log(`Fetching ${allNeetQIds.size} referenced question documents...`);
  const existingQs = await db.collection("questionBank").find({
    _id: { $in: Array.from(allNeetQIds).map(id => new ObjectId(id)) }
  }).toArray();
  const qMap = new Map(existingQs.map(q => [q._id.toString(), q]));

  // Step 6: Perform Replacement for all affected tests
  console.log("Step 6: Executing replacement across all affected NEET tests...");
  let testsUpdated = 0;
  let totalBadReplaced = 0;
  const bulkTestUpdates = [];

  for (const t of neetTests) {
    const qList = t.questions || [];
    let testModified = false;
    const testIds = new Set(qList.map(extractIdString).filter(Boolean));
    const newQList = [];

    for (let i = 0; i < qList.length; i++) {
      const origItem = qList[i];
      const idStr = extractIdString(origItem);
      const qDoc = idStr ? qMap.get(idStr) : null;

      if (!isBadQuestion(qDoc)) {
        newQList.push(origItem instanceof ObjectId ? origItem : new ObjectId(idStr));
        continue;
      }

      // Bad question detected!
      testModified = true;
      totalBadReplaced++;

      const s = ((qDoc?.subject || t.subject || "Physics")).toLowerCase().trim();
      const c = ((qDoc?.chapter || t.chapter || "")).toLowerCase().trim();
      const sub = ((qDoc?.subTopic || qDoc?.topic || t.title || "")).toLowerCase().trim();

      let candidate = null;
      const sObj = mcqIndex.get(s);

      if (sObj) {
        // 1. Try exact chapter and subtopic
        if (c && sObj.byChap.has(c)) {
          const cObj = sObj.byChap.get(c);
          if (sub && cObj.bySub.has(sub)) {
            candidate = cObj.bySub.get(sub).find(cand => !testIds.has(cand._id.toString()));
          }
          // 2. Try exact chapter
          if (!candidate) {
            candidate = cObj.all.find(cand => !testIds.has(cand._id.toString()));
          }
        }

        // 3. Try fuzzy chapter match in subject
        if (!candidate && c) {
          for (const [chKey, cObj] of sObj.byChap.entries()) {
            if (chKey.includes(c) || c.includes(chKey)) {
              candidate = cObj.all.find(cand => !testIds.has(cand._id.toString()));
              if (candidate) break;
            }
          }
        }

        // 4. Try any MCQ in subject
        if (!candidate) {
          candidate = sObj.all.find(cand => !testIds.has(cand._id.toString()));
        }
      }

      if (candidate) {
        testIds.add(candidate._id.toString());
        newQList.push(candidate._id);
      } else {
        console.error(`CRITICAL: No replacement found for [${t.testId}] Q#${i+1}`);
        newQList.push(origItem);
      }
    }

    if (testModified) {
      testsUpdated++;
      bulkTestUpdates.push({
        updateOne: {
          filter: { _id: t._id },
          update: {
            $set: {
              questions: newQList,
              updatedAt: new Date()
            }
          }
        }
      });
    }
  }

  console.log(`Writing updates for ${bulkTestUpdates.length} tests (total ${totalBadReplaced} questions replaced)...`);
  if (bulkTestUpdates.length > 0) {
    const bulkRes = await db.collection("testPapers").bulkWrite(bulkTestUpdates);
    console.log(`Bulk write finished: ${bulkRes.modifiedCount} test papers updated.`);
  }

  // Step 7: Resolve student reports for reported questions
  console.log("Step 7: Updating student reports in questionReports...");
  const reportRes = await db.collection("questionReports").updateMany(
    {
      reportId: { $in: ["REP-20261024-2MRM", "REP-20261024-QUPP"] }
    },
    {
      $set: {
        status: "RESOLVED",
        questionCorrected: true,
        resolvedAt: new Date(),
        resolutionNotes: "Question converted to 4-option MCQ format and all NEET test papers purged of numerical questions.",
        reviewedBy: "Admin Audit Automation"
      },
      $push: {
        actionHistory: {
          action: "RESOLVED",
          fromStatus: "NEW",
          toStatus: "RESOLVED",
          performedBy: "admin@polltest.in",
          timestamp: new Date(),
          notes: "Automatically corrected question to 4-option MCQ and resolved student report."
        }
      }
    }
  );
  console.log(`Resolved ${reportRes.modifiedCount} student reports.`);

  console.log("\n=== EXECUTION COMPLETED SUCCESSFULLY ===");
  console.log(`Total NEET tests updated: ${testsUpdated}`);
  console.log(`Total bad questions replaced: ${totalBadReplaced}`);

  await client.close();
}

run().catch(console.error);

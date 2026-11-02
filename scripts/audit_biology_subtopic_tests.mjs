import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { MongoClient, ObjectId } from "mongodb";
import { NEET_BOTANY_17, NEET_ZOOLOGY_15, NEET_EXCLUDED_5 } from "../src/lib/chapterMasterService.cjs";

function extractIdString(item) {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (item instanceof ObjectId || item._bsontype === 'ObjectID') return item.toString();
  if (typeof item === 'object') {
    if (item._id) return item._id.toString();
    if (item.questionId) return item.questionId.toString();
    if (item.id) return item.id.toString();
  }
  return null;
}

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log("Connected to MongoDB");

  // Fetch all Botany & Zoology subtopic tests
  const subtopicTests = await db.collection("testPapers").find({
    $and: [
      { testId: /neet.*(subtopic|topic)/i },
      {
        $or: [
          { subject: { $in: ["Botany", "Zoology"] } },
          { chapter: { $in: [...NEET_BOTANY_17, ...NEET_ZOOLOGY_15] } }
        ]
      }
    ]
  }).sort({ subject: 1, chapter: 1, testId: 1 }).toArray();

  console.log(`Found ${subtopicTests.length} Botany/Zoology subtopic tests.`);

  // Collect all question IDs
  const allQIds = new Set();
  for (const t of subtopicTests) {
    (t.questions || []).forEach(q => {
      const idStr = extractIdString(q);
      if (idStr && ObjectId.isValid(idStr)) allQIds.add(idStr);
    });
  }

  const existingQs = await db.collection("questionBank").find({
    _id: { $in: Array.from(allQIds).map(id => new ObjectId(id)) }
  }).toArray();
  const qMap = new Map(existingQs.map(q => [q._id.toString(), q]));

  console.log(`Fetched ${existingQs.length} referenced questions from questionBank.`);

  const auditResults = [];

  for (const t of subtopicTests) {
    const qList = t.questions || [];
    const assignedCount = qList.length;
    const resolvedQs = [];
    const invalidIds = [];
    const duplicates = [];
    const seenInTest = new Set();

    for (const qItem of qList) {
      const idStr = extractIdString(qItem);
      if (!idStr || !qMap.has(idStr)) {
        invalidIds.push(idStr || "UNKNOWN");
        continue;
      }
      if (seenInTest.has(idStr)) {
        duplicates.push(idStr);
      } else {
        seenInTest.add(idStr);
        resolvedQs.push(qMap.get(idStr));
      }
    }

    // Check classification mismatches
    const wrongChapterQs = [];
    const wrongSubjectQs = [];
    const testSubj = (t.subject || "").toLowerCase();
    const testChap = (t.chapter || "").toLowerCase();

    for (const q of resolvedQs) {
      const qSubj = (q.subject || "").toLowerCase();
      const qChap = (q.chapter || "").toLowerCase();

      if (testSubj && qSubj && testSubj !== qSubj) {
        wrongSubjectQs.push({ id: q._id.toString(), qSubj, testSubj });
      }
      if (testChap && qChap && testChap !== qChap && !testChap.includes(qChap) && !qChap.includes(testChap)) {
        wrongChapterQs.push({ id: q._id.toString(), qChap, testChap });
      }
    }

    // Check available source questions in questionBank
    const query = { subject: t.subject };
    if (t.chapter) {
      query.chapter = t.chapter;
    }
    // Subtopic or title match
    const subName = (t.title || t.subTopic || "").replace(/[-_]/g, " ").trim();
    if (subName) {
      query.$or = [
        { subTopic: new RegExp(subName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { topic: new RegExp(subName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }
      ];
    }
    // NEET only wants MCQs with options
    query.$nor = [
      { type: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER"] } },
      { questionType: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER", "Numerical", "Numerical Value Question"] } },
      { options: { $size: 0 } },
      { options: null },
      { options: { $exists: false } }
    ];
    query["options.1"] = { $exists: true };

    const availableInQB = await db.collection("questionBank").countDocuments(query);

    // Also check chapter-level available
    const chapQuery = {
      subject: t.subject,
      chapter: t.chapter,
      $nor: query.$nor,
      "options.1": { $exists: true }
    };
    const availableInChapter = t.chapter ? await db.collection("questionBank").countDocuments(chapQuery) : 0;

    let status = "MAPPED";
    if (assignedCount === 0) {
      status = availableInQB > 0 ? "NOT MAPPED" : "NO SOURCE QUESTIONS";
    } else if (invalidIds.length > 0) {
      status = "INVALID MAPPING";
    } else if (wrongSubjectQs.length > 0 || wrongChapterQs.length > 0) {
      status = "WRONG CLASSIFICATION";
    } else if (assignedCount < 15 && availableInQB > assignedCount) {
      status = "PARTIALLY MAPPED";
    } else if (assignedCount < 15 && availableInQB <= assignedCount) {
      status = "INSUFFICIENT QUESTIONS";
    }

    auditResults.push({
      testId: t.testId,
      title: t.title,
      subject: t.subject,
      chapter: t.chapter,
      assignedCount,
      resolvedCount: resolvedQs.length,
      invalidCount: invalidIds.length,
      duplicateCount: duplicates.length,
      wrongSubjectCount: wrongSubjectQs.length,
      wrongChapterCount: wrongChapterQs.length,
      availableInQB,
      availableInChapter,
      status
    });
  }

  // Print summary by status
  const statusCounts = {};
  for (const r of auditResults) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }
  console.log("\n=== SUBTOPIC TESTS AUDIT SUMMARY ===");
  console.log("Status Breakdown:", statusCounts);

  console.log("\nTests with issues:");
  for (const r of auditResults) {
    if (r.status !== "MAPPED") {
      console.log(`- [${r.status}] ${r.testId} ("${r.title}" | ${r.subject} - ${r.chapter}): assigned=${r.assignedCount}, resolved=${r.resolvedCount}, invalid=${r.invalidCount}, dupes=${r.duplicateCount}, wrongSubj=${r.wrongSubjectCount}, wrongChap=${r.wrongChapterCount}, QB_sub=${r.availableInQB}, QB_chap=${r.availableInChapter}`);
    }
  }

  await client.close();
}

run().catch(console.error);


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

  // Fetch all NEET tests
  const neetTests = await db.collection("testPapers").find({
    $or: [
      { testId: /^neet/i },
      { exam: /^neet/i }
    ]
  }).toArray();

  console.log(`Loaded ${neetTests.length} NEET tests from testPapers`);

  // Collect all question IDs in NEET tests
  const allNeetQIds = new Set();
  for (const t of neetTests) {
    (t.questions || []).forEach(q => {
      const idStr = extractIdString(q);
      if (idStr && ObjectId.isValid(idStr)) allNeetQIds.add(idStr);
    });
  }

  // Fetch existing questions
  const existingQs = await db.collection("questionBank").find({
    _id: { $in: Array.from(allNeetQIds).map(id => new ObjectId(id)) }
  }).toArray();
  const qMap = new Map(existingQs.map(q => [q._id.toString(), q]));

  // Cache valid MCQs by Subject and Chapter
  console.log("Caching valid MCQs from questionBank...");
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

  console.log(`Total valid MCQs in questionBank: ${validMcqs.length}`);

  // Index by subject -> chapter -> subTopic
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

  // Run dry run replacement
  let testsNeedingFix = 0;
  let totalBadQuestions = 0;
  let totalReplaced = 0;
  let totalFailed = 0;

  const fixLog = [];

  for (const t of neetTests) {
    const qList = t.questions || [];
    let hasBad = false;
    const testIds = new Set(qList.map(extractIdString).filter(Boolean));

    const newQList = [];
    let badInThisTest = 0;

    for (let i = 0; i < qList.length; i++) {
      const origItem = qList[i];
      const idStr = extractIdString(origItem);
      const qDoc = idStr ? qMap.get(idStr) : null;

      if (!isBadQuestion(qDoc)) {
        newQList.push(origItem);
        continue;
      }

      // Bad question detected!
      hasBad = true;
      badInThisTest++;
      totalBadQuestions++;

      // Determine subject, chapter, subtopic
      const s = ((qDoc?.subject || t.subject || "Physics")).toLowerCase().trim();
      const c = ((qDoc?.chapter || t.chapter || "")).toLowerCase().trim();
      const sub = ((qDoc?.subTopic || qDoc?.topic || t.title || "")).toLowerCase().trim();

      // Find replacement candidate
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
        totalReplaced++;
      } else {
        totalFailed++;
        console.error(`FAILED to find replacement for test [${t.testId}] Q#${i+1} [${idStr}]`);
      }
    }

    if (hasBad) {
      testsNeedingFix++;
      fixLog.push({
        testId: t.testId,
        title: t.title,
        subject: t.subject,
        chapter: t.chapter,
        badCount: badInThisTest,
        totalCount: qList.length
      });
    }
  }

  console.log("\n=== DRY RUN SUMMARY ===");
  console.log(`Total NEET tests scanned: ${neetTests.length}`);
  console.log(`Tests needing fix: ${testsNeedingFix}`);
  console.log(`Total bad (numerical / no-options) questions: ${totalBadQuestions}`);
  console.log(`Successfully replaced: ${totalReplaced} (${((totalReplaced/totalBadQuestions)*100).toFixed(1)}%)`);
  console.log(`Failed to replace: ${totalFailed}`);

  console.log("\nTop 15 fixed tests sample:");
  for (const item of fixLog.slice(0, 15)) {
    console.log(`- [${item.testId}] "${item.title}": ${item.badCount} / ${item.totalCount} replaced`);
  }

  await client.close();
}

run().catch(console.error);

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { MongoClient, ObjectId } from "mongodb";
import crypto from "crypto";

import { NEET_BOTANY_17, NEET_ZOOLOGY_15, NEET_EXCLUDED_5 } from "../src/lib/chapterMasterService.cjs";
import { MANDATORY_CHECK_KEYS, MANDATORY_CHECK_LABELS } from "../src/lib/testAuditConstants.js";

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

function computeQuestionContentHash(q) {
  if (!q || typeof q !== 'object') return '';
  const text = String(q.question || q.text || '').trim();
  const options = Array.isArray(q.options)
    ? q.options.map(o => (typeof o === 'string' ? o : o.text || o.value || '')).join('|')
    : '';
  const answer = String(q.correctOption ?? q.correctAnswer ?? q.answer ?? '').trim();
  const explanation = String(q.explanation || q.solution || '').trim();
  const difficulty = String(q.difficulty || '').trim();
  const raw = `${text}###${options}###${answer}###${explanation}###${difficulty}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
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

  // Step 1: Verify Canonical Hierarchy
  const botanyChapters = NEET_BOTANY_17.map(c => c.name);
  const zoologyChapters = NEET_ZOOLOGY_15.map(c => c.name);
  const excludedChapters = NEET_EXCLUDED_5.map(c => c.name);

  console.log(`Botany Chapters: ${botanyChapters.length} active`);
  console.log(`Zoology Chapters: ${zoologyChapters.length} active`);
  console.log(`Excluded Chapters: ${excludedChapters.length} excluded`);

  // Step 2: Cache all valid MCQs for Botany and Zoology
  console.log("Caching valid MCQs from questionBank...");
  const validMcqs = await db.collection("questionBank").find({
    subject: { $in: ["Botany", "Zoology"] },
    $nor: [
      { type: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER"] } },
      { questionType: { $in: ["numerical", "NUMERICAL", "numeric", "NUMERIC", "integer", "INTEGER", "Numerical", "Numerical Value Question"] } },
      { options: { $size: 0 } },
      { options: null },
      { options: { $exists: false } }
    ],
    "options.1": { $exists: true }
  }).toArray();

  console.log(`Loaded ${validMcqs.length} valid Biology MCQs from questionBank.`);

  // Index MCQs: Subject -> Chapter -> Subtopic
  const mcqIndex = {
    Botany: { all: [], byChapter: new Map() },
    Zoology: { all: [], byChapter: new Map() }
  };

  for (const q of validMcqs) {
    const s = q.subject;
    if (!mcqIndex[s]) continue;
    mcqIndex[s].all.push(q);

    const c = q.chapter || "Unassigned";
    if (!mcqIndex[s].byChapter.has(c)) {
      mcqIndex[s].byChapter.set(c, { all: [], bySub: new Map() });
    }
    const cObj = mcqIndex[s].byChapter.get(c);
    cObj.all.push(q);

    const sub = (q.subTopic || q.topic || "").toLowerCase().trim();
    if (sub) {
      if (!cObj.bySub.has(sub)) cObj.bySub.set(sub, []);
      cObj.bySub.get(sub).push(q);
    }
  }

  // Print counts per chapter in index
  console.log("\nIndexed Botany MCQs by chapter:");
  for (const [ch, obj] of mcqIndex.Botany.byChapter.entries()) {
    console.log(`  - ${ch}: ${obj.all.length} Qs across ${obj.bySub.size} subtopics`);
  }

  console.log("\nIndexed Zoology MCQs by chapter:");
  for (const [ch, obj] of mcqIndex.Zoology.byChapter.entries()) {
    console.log(`  - ${ch}: ${obj.all.length} Qs across ${obj.bySub.size} subtopics`);
  }

  await client.close();
}

run().catch(console.error);


import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { MongoClient } from "mongodb";
import neetPkg from "../src/data/exams/neet.js";
const { generateNeetTests, neetTests } = neetPkg;

const staticTests = typeof generateNeetTests === 'function' ? generateNeetTests() : neetTests;
const staticBioSub = staticTests.filter(t => t.type === "SUBTOPIC" && (t.subject === "Botany" || t.subject === "Zoology"));

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  const dbTests = await db.collection("testPapers").find({
    testId: /neet-SUBTOPIC/i,
    $or: [{ subject: "Botany" }, { subject: "Zoology" }]
  }).toArray();

  const staticMap = new Map(staticBioSub.map(t => [t.id, t]));
  const dbMap = new Map(dbTests.map(t => [t.testId, t]));

  console.log(`Static Biology Subtopics: ${staticBioSub.length}`);
  console.log(`MongoDB Biology Subtopics: ${dbTests.length}`);

  // How many static tests exist in MongoDB?
  let exactMatchCount = 0;
  const missingInDb = [];
  for (const st of staticBioSub) {
    if (dbMap.has(st.id)) {
      exactMatchCount++;
    } else {
      missingInDb.push(st);
    }
  }
  console.log(`Exact testId matches between static and MongoDB: ${exactMatchCount}`);
  console.log(`Static subtopics missing in MongoDB: ${missingInDb.length}`);

  // What DB tests don't match static test IDs?
  const extraInDb = [];
  for (const dt of dbTests) {
    if (!staticMap.has(dt.testId)) {
      extraInDb.push(dt);
    }
  }
  console.log(`MongoDB subtopics with non-static testIds: ${extraInDb.length}`);
  console.log("Sample non-static testIds in MongoDB:", extraInDb.slice(0, 10).map(t => ({
    testId: t.testId,
    title: t.title,
    subject: t.subject,
    chapter: t.chapter,
    qCount: t.questions?.length
  })));

  await client.close();
}
run();

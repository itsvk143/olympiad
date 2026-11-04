const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI in .env.local");
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('testseries');
    const questions = db.collection('questions');
    
    const total = await questions.countDocuments();
    const missingExp = await questions.countDocuments({
      $or: [
        { explanation: { $exists: false } },
        { explanation: "" },
        { explanation: null },
        { explanation: { $regex: /^.{0,10}$/ } } // very short explanation
      ]
    });
    
    console.log(`Total questions: ${total}`);
    console.log(`Questions missing meaningful explanations: ${missingExp}`);
    
    // Sample a few to check structure
    const sample = await questions.find({}).limit(1).toArray();
    if (sample.length > 0) {
      console.log("Sample question keys:", Object.keys(sample[0]));
      console.log("Sample question:", sample[0]);
    } else {
      console.log("No questions found in collection.");
    }

  } finally {
    await client.close();
  }
}
run();

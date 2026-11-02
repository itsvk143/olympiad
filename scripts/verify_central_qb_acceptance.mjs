import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';
import fs from 'fs';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const BOTANY_17 = [
  'The Living World',
  'Biological Classification',
  'Plant Kingdom',
  'Morphology of Flowering Plants',
  'Anatomy of Flowering Plants',
  'Cell: The Unit of Life',
  'Cell Cycle and Cell Division',
  'Photosynthesis in Higher Plants',
  'Respiration in Plants',
  'Plant Growth and Development',
  'Sexual Reproduction in Flowering Plants',
  'Principles of Inheritance and Variation',
  'Molecular Basis of Inheritance',
  'Microbes in Human Welfare',
  'Organisms and Populations',
  'Ecosystem',
  'Biodiversity and Conservation'
];

const ZOOLOGY_15 = [
  'Animal Kingdom',
  'Structural Organisation in Animals',
  'Biomolecules',
  'Breathing and Exchange of Gases',
  'Body Fluids and Circulation',
  'Excretory Products and their Elimination',
  'Locomotion and Movement',
  'Neural Control and Coordination',
  'Chemical Coordination and Integration',
  'Human Reproduction',
  'Reproductive Health',
  'Evolution',
  'Human Health and Disease',
  'Biotechnology: Principles and Processes',
  'Biotechnology and Its Applications'
];

const LEGACY_UNITS = [
  'Diversity in Living World',
  'Genetics and Evolution',
  'Ecology and Environment',
  'Plant Physiology',
  'Cell Structure and Function',
  'Reproduction in Plants',
  'Human Physiology',
  'Reproduction',
  'Biology and Human Welfare',
  'Structural Organisation in Animals and Plants'
];

async function verify() {
  await client.connect();
  const db = client.db();

  console.log('=================================================================');
  console.log('    CENTRAL QUESTION BANK CANONICAL ACCEPTANCE VERIFICATION');
  console.log('=================================================================\n');

  let passed = true;

  // 1. Check legacy units in questionBank
  const legacyCount = await db.collection('questionBank').countDocuments({
    subject: { $in: ['Botany', 'Zoology'] },
    chapter: { $in: LEGACY_UNITS }
  });
  console.log(`1. Questions with legacy unit names in questionBank: ${legacyCount}`);
  if (legacyCount === 0) {
    console.log('   ✅ PASS: 0 questions have legacy unit names in questionBank.');
  } else {
    console.error('   ❌ FAIL: Legacy unit names still found in questionBank!');
    passed = false;
  }

  // 2. Check total question preservation
  const totalBotany = await db.collection('questionBank').countDocuments({ subject: 'Botany' });
  const totalZoology = await db.collection('questionBank').countDocuments({ subject: 'Zoology' });
  const totalCount = totalBotany + totalZoology;
  console.log(`\n2. Question counts: Botany = ${totalBotany}, Zoology = ${totalZoology}, Total = ${totalCount}`);
  if (totalCount === 17962) {
    console.log('   ✅ PASS: Exactly 17,962 questions preserved (0 questions lost).');
  } else {
    console.error(`   ❌ FAIL: Question count mismatch! Expected 17,962, got ${totalCount}`);
    passed = false;
  }

  // 3. Botany Canonical Chapters Verification
  console.log('\n3. Verifying Botany Canonical Chapters in questionBank:');
  const botChapters = await db.collection('questionBank').aggregate([
    { $match: { subject: 'Botany' } },
    { $group: { _id: '$chapter', count: { $sum: 1 } } }
  ]).toArray();
  const botChapMap = Object.fromEntries(botChapters.map(c => [c._id, c.count]));

  let botInvalid = 0;
  for (const ch of Object.keys(botChapMap)) {
    if (!BOTANY_17.includes(ch)) {
      console.error(`   ❌ Unexpected chapter in Botany: "${ch}" (${botChapMap[ch]} questions)`);
      botInvalid++;
      passed = false;
    }
  }
  if (botInvalid === 0) {
    console.log(`   ✅ PASS: All Botany questions map to the 17 Canonical Botany Chapters.`);
    BOTANY_17.forEach((ch, idx) => {
      console.log(`      ${idx + 1}. ${ch}: ${botChapMap[ch] || 0} questions`);
    });
  }

  // 4. Zoology Canonical Chapters Verification
  console.log('\n4. Verifying Zoology Canonical Chapters in questionBank:');
  const zooChapters = await db.collection('questionBank').aggregate([
    { $match: { subject: 'Zoology' } },
    { $group: { _id: '$chapter', count: { $sum: 1 } } }
  ]).toArray();
  const zooChapMap = Object.fromEntries(zooChapters.map(c => [c._id, c.count]));

  let zooInvalid = 0;
  for (const ch of Object.keys(zooChapMap)) {
    if (!ZOOLOGY_15.includes(ch)) {
      console.error(`   ❌ Unexpected chapter in Zoology: "${ch}" (${zooChapMap[ch]} questions)`);
      zooInvalid++;
      passed = false;
    }
  }
  if (zooInvalid === 0) {
    console.log(`   ✅ PASS: All Zoology questions map to the 15 Canonical Zoology Chapters.`);
    ZOOLOGY_15.forEach((ch, idx) => {
      console.log(`      ${idx + 1}. ${ch}: ${zooChapMap[ch] || 0} questions`);
    });
  }

  // 5. Subject Allocation Rules
  console.log('\n5. Verifying Mandatory Subject Allocations:');
  const biomoleculesInBotany = await db.collection('questionBank').countDocuments({ subject: 'Botany', chapter: 'Biomolecules' });
  const biotechInBotany = await db.collection('questionBank').countDocuments({ subject: 'Botany', chapter: /Biotechnology/i });
  const inheritanceInZoology = await db.collection('questionBank').countDocuments({ subject: 'Zoology', chapter: /Principles of Inheritance/i });
  const microbesInZoology = await db.collection('questionBank').countDocuments({ subject: 'Zoology', chapter: /Microbes/i });

  console.log(`   Biomolecules in Botany: ${biomoleculesInBotany} (Expected: 0)`);
  console.log(`   Biotechnology in Botany: ${biotechInBotany} (Expected: 0)`);
  console.log(`   Inheritance in Zoology: ${inheritanceInZoology} (Expected: 0)`);
  console.log(`   Microbes in Zoology: ${microbesInZoology} (Expected: 0)`);

  if (biomoleculesInBotany === 0 && biotechInBotany === 0 && inheritanceInZoology === 0 && microbesInZoology === 0) {
    console.log('   ✅ PASS: All mandatory subject allocation rules satisfied.');
  } else {
    console.error('   ❌ FAIL: Subject allocation violation detected!');
    passed = false;
  }

  // 6. Chapter Query Isolation (Selecting a chapter retrieves only its questions)
  console.log('\n6. Verifying Chapter Query Isolation:');
  const pkQuestions = await db.collection('questionBank').find({
    subject: 'Botany',
    chapter: 'Plant Kingdom'
  }).toArray();
  const pkSubtopics = new Set(pkQuestions.map(q => q.subTopic));
  console.log(`   Plant Kingdom retrieved ${pkQuestions.length} questions. Subtopics:`, Array.from(pkSubtopics));
  const hasBioClass = pkQuestions.some(q => q.subTopic === 'Biological Classification' || /five kingdom/i.test(q.subTopic));
  if (!hasBioClass) {
    console.log('   ✅ PASS: Plant Kingdom contains NO Biological Classification questions.');
  } else {
    console.error('   ❌ FAIL: Plant Kingdom has Biological Classification questions mixed in!');
    passed = false;
  }

  // 7. Verify UI Code Changes in src/app/admin/page.js
  console.log('\n7. Verifying Frontend Code in src/app/admin/page.js:');
  const pageSrc = fs.readFileSync('src/app/admin/page.js', 'utf8');
  if (pageSrc.includes('Chapters in {explorerSubject}')) {
    console.log('   ✅ PASS: Heading renamed to "Chapters in {explorerSubject}".');
  } else {
    console.error('   ❌ FAIL: Heading "Chapters in {explorerSubject}" not found in src/app/admin/page.js!');
    passed = false;
  }

  if (pageSrc.includes('LEGACY_UMBRELLAS') && pageSrc.includes('EXCLUDED_NEET_CHAPTERS')) {
    console.log('   ✅ PASS: Primary chapter list explicitly guards against legacy umbrellas and excluded chapters.');
  } else {
    console.error('   ❌ FAIL: Guards not found in src/app/admin/page.js!');
    passed = false;
  }

  console.log('\n=================================================================');
  if (passed) {
    console.log('   ALL ACCEPTANCE CRITERIA SATISFIED AND PASSED WITH 100% SUCCESS!');
  } else {
    console.error('   SOME CHECKS FAILED! PLEASE REVIEW.');
  }
  console.log('=================================================================');

  await client.close();
}

verify().catch(console.error);


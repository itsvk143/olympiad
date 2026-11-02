import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);

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

function resolveCanonical(subject, chapter, subTopic) {
  const normSub = (subTopic || '').trim().toLowerCase();
  const normCh = (chapter || '').trim().toLowerCase();

  // 1. Structural Organisation in Animals and Plants (in Zoology or Botany)
  if (normCh.includes('structural organisation in animals and plants')) {
    if (normSub.includes('anatomy of flowering plants')) {
      return { subject: 'Botany', chapter: 'Anatomy of Flowering Plants' };
    }
    if (normSub.includes('morphology of flowering plants')) {
      return { subject: 'Botany', chapter: 'Morphology of Flowering Plants' };
    }
    return { subject: 'Zoology', chapter: 'Structural Organisation in Animals' };
  }

  // 2. Diversity in Living World
  if (normCh.includes('diversity in living world')) {
    if (normSub === 'biological classification' || normSub.includes('five kingdom') || normSub.includes('viruses, viroids')) {
      return { subject: 'Botany', chapter: 'Biological Classification' };
    }
    if (normSub === 'plant kingdom' || normSub === 'algae' || normSub === 'bryophytes' || normSub === 'pteridophytes' || normSub === 'gymnosperms' || normSub === 'angiosperms') {
      return { subject: 'Botany', chapter: 'Plant Kingdom' };
    }
  }

  // 3. Cell Structure and Function
  if (normCh.includes('cell structure and function')) {
    if (normSub.includes('mitosis') || normSub.includes('meiosis') || normSub.includes('cell life & division') || normSub.includes('cell cycle')) {
      return { subject: 'Botany', chapter: 'Cell Cycle and Cell Division' };
    }
    if (normSub.includes('membrane') || normSub.includes('ultrastructure') || normSub.includes('organelles') || normSub.includes('prokaryotic and eukaryotic')) {
      return { subject: 'Botany', chapter: 'Cell: The Unit of Life' };
    }
  }

  // 4. Plant Physiology
  if (normCh.includes('plant physiology')) {
    if (normSub.includes('photosynthesis') || normSub.includes('calvin cycle') || normSub.includes('light reaction')) {
      return { subject: 'Botany', chapter: 'Photosynthesis in Higher Plants' };
    }
    if (normSub.includes('respiration') || normSub.includes('glycolysis') || normSub.includes('krebs cycle')) {
      return { subject: 'Botany', chapter: 'Respiration in Plants' };
    }
    if (normSub.includes('growth') || normSub.includes('hormones') || normSub.includes('photoperiodism') || normSub.includes('seed dormancy')) {
      return { subject: 'Botany', chapter: 'Plant Growth and Development' };
    }
  }

  // 5. Reproduction in Plants
  if (normCh.includes('reproduction in plants')) {
    return { subject: 'Botany', chapter: 'Sexual Reproduction in Flowering Plants' };
  }

  // 6. Genetics and Evolution (in Botany)
  if (normCh.includes('genetics and evolution')) {
    if (normSub.includes('principles of inheritance') || normSub.includes('linkage') || normSub.includes('mendelian') || normSub.includes('mutations')) {
      return { subject: 'Botany', chapter: 'Principles of Inheritance and Variation' };
    }
    if (normSub.includes('molecular basis') || normSub.includes('dna replication') || normSub.includes('transcription') || normSub.includes('gene expression')) {
      return { subject: 'Botany', chapter: 'Molecular Basis of Inheritance' };
    }
  }

  // 7. Ecology and Environment
  if (normCh.includes('ecology and environment')) {
    if (normSub.includes('ecosystem') || normSub.includes('pyramids') || normSub.includes('ecological succession')) {
      return { subject: 'Botany', chapter: 'Ecosystem' };
    }
    if (normSub.includes('biodiversity') || normSub.includes('conservation')) {
      return { subject: 'Botany', chapter: 'Biodiversity and Conservation' };
    }
    if (normSub.includes('organisms and populations') || normSub.includes('population interactions')) {
      return { subject: 'Botany', chapter: 'Organisms and Populations' };
    }
  }

  // 8. Human Physiology (in Zoology)
  if (normCh.includes('human physiology')) {
    if (normSub.includes('breathing') || normSub.includes('gas transport')) {
      return { subject: 'Zoology', chapter: 'Breathing and Exchange of Gases' };
    }
    if (normSub.includes('body fluids') || normSub.includes('circulation') || normSub.includes('cardiac cycle') || normSub.includes('ecg') || normSub.includes('blood grouping')) {
      return { subject: 'Zoology', chapter: 'Body Fluids and Circulation' };
    }
    if (normSub.includes('excretory') || normSub.includes('nephron') || normSub.includes('counter-current')) {
      return { subject: 'Zoology', chapter: 'Excretory Products and their Elimination' };
    }
    if (normSub.includes('locomotion')) {
      return { subject: 'Zoology', chapter: 'Locomotion and Movement' };
    }
    if (normSub.includes('neural') || normSub.includes('nerve impulse')) {
      return { subject: 'Zoology', chapter: 'Neural Control and Coordination' };
    }
    if (normSub.includes('chemical coordination') || normSub.includes('endocrine') || normSub.includes('hormones action')) {
      return { subject: 'Zoology', chapter: 'Chemical Coordination and Integration' };
    }
  }

  // 9. Reproduction (in Zoology)
  if (normCh === 'reproduction') {
    if (normSub.includes('reproductive health') || normSub.includes('contraception') || normSub.includes('art:') || normSub.includes('ivf')) {
      return { subject: 'Zoology', chapter: 'Reproductive Health' };
    }
    return { subject: 'Zoology', chapter: 'Human Reproduction' };
  }

  // 10. Biotechnology and Its Applications
  if (normCh.includes('biotechnology and its applications') || normCh.includes('biotechnology: principles and processes')) {
    if (normSub.includes('principles & processes') || normSub.includes('restriction endonucleases') || normSub.includes('pcr') || normSub.includes('polymerase chain reaction') || normSub.includes('recombinant dna')) {
      return { subject: 'Zoology', chapter: 'Biotechnology: Principles and Processes' };
    }
    if (normSub.includes('medicine') || normSub.includes('agriculture') || normSub.includes('transgenic') || normSub.includes('gene therapy')) {
      return { subject: 'Zoology', chapter: 'Biotechnology and Its Applications' };
    }
  }

  // 11. Biology and Human Welfare (in Zoology)
  if (normCh.includes('biology and human welfare')) {
    if (normSub.includes('microbes')) {
      return { subject: 'Botany', chapter: 'Microbes in Human Welfare' };
    }
    return { subject: 'Zoology', chapter: 'Human Health and Disease' };
  }

  // 12. Already Canonical Chapters
  for (const botCh of BOTANY_17) {
    if (normCh === botCh.toLowerCase()) return { subject: 'Botany', chapter: botCh };
  }
  for (const zooCh of ZOOLOGY_15) {
    if (normCh === zooCh.toLowerCase()) return { subject: 'Zoology', chapter: zooCh };
  }

  return null;
}

async function dryRun() {
  await client.connect();
  const db = client.db();

  console.log('--- STARTING DRY RUN AUDIT ---');
  const questions = await db.collection('questionBank').find({
    subject: { $in: ['Botany', 'Zoology'] }
  }).toArray();

  console.log(`Total questions in Botany and Zoology: ${questions.length}`);

  let mappedCount = 0;
  let unmappedCount = 0;
  const unmappedSamples = [];
  const botanyCounts = {};
  const zoologyCounts = {};

  BOTANY_17.forEach(c => botanyCounts[c] = 0);
  ZOOLOGY_15.forEach(c => zoologyCounts[c] = 0);

  for (const q of questions) {
    const res = resolveCanonical(q.subject, q.chapter, q.subTopic);
    if (!res) {
      unmappedCount++;
      if (unmappedSamples.length < 10) {
        unmappedSamples.push({ id: q._id, subject: q.subject, chapter: q.chapter, subTopic: q.subTopic, q: q.question?.slice(0, 70) });
      }
    } else {
      mappedCount++;
      if (res.subject === 'Botany') {
        botanyCounts[res.chapter] = (botanyCounts[res.chapter] || 0) + 1;
      } else if (res.subject === 'Zoology') {
        zoologyCounts[res.chapter] = (zoologyCounts[res.chapter] || 0) + 1;
      }
    }
  }

  console.log(`\nRESULTS:`);
  console.log(`Successfully mapped: ${mappedCount}`);
  console.log(`Unmapped / ambiguous: ${unmappedCount}`);

  if (unmappedSamples.length > 0) {
    console.log('\nUnmapped samples:');
    console.table(unmappedSamples);
  }

  console.log('\nBOTANY CHAPTER COUNTS (17):');
  console.table(Object.entries(botanyCounts).map(([chapter, count]) => ({ chapter, count })));
  const totalBotany = Object.values(botanyCounts).reduce((a, b) => a + b, 0);
  console.log(`Total Botany = ${totalBotany}`);

  console.log('\nZOOLOGY CHAPTER COUNTS (15):');
  console.table(Object.entries(zoologyCounts).map(([chapter, count]) => ({ chapter, count })));
  const totalZoology = Object.values(zoologyCounts).reduce((a, b) => a + b, 0);
  console.log(`Total Zoology = ${totalZoology}`);

  await client.close();
}

dryRun().catch(console.error);


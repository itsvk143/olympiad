import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MongoClient } from 'mongodb';

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

function resolveTestCanonical(subject, chapter, title, testId) {
  const normTitle = (title || '').trim().toLowerCase();
  const normId = (testId || '').trim().toLowerCase();
  const normCh = (chapter || '').trim().toLowerCase();
  const combined = `${normTitle} ${normId} ${normCh}`;

  // Check specific subtopics/titles
  if (combined.includes('anatomy of flowering plants')) return { subject: 'Botany', chapter: 'Anatomy of Flowering Plants' };
  if (combined.includes('morphology of flowering plants')) return { subject: 'Botany', chapter: 'Morphology of Flowering Plants' };
  if (combined.includes('microbes in human welfare') || combined.includes('microbes in sewage') || combined.includes('biogas')) return { subject: 'Botany', chapter: 'Microbes in Human Welfare' };
  if (combined.includes('principles of inheritance') || combined.includes('mendelian') || combined.includes('linkage') || combined.includes('mutation')) return { subject: 'Botany', chapter: 'Principles of Inheritance and Variation' };
  if (combined.includes('molecular basis of inheritance') || combined.includes('dna replication') || combined.includes('transcription') || combined.includes('gene expression')) return { subject: 'Botany', chapter: 'Molecular Basis of Inheritance' };
  if (combined.includes('photosynthesis') || combined.includes('calvin cycle') || combined.includes('light reaction')) return { subject: 'Botany', chapter: 'Photosynthesis in Higher Plants' };
  if (combined.includes('respiration') || combined.includes('glycolysis') || combined.includes('krebs')) return { subject: 'Botany', chapter: 'Respiration in Plants' };
  if (combined.includes('growth') || combined.includes('development') || combined.includes('hormone') || combined.includes('photoperiodism') || combined.includes('vernalization')) return { subject: 'Botany', chapter: 'Plant Growth and Development' };
  if (combined.includes('sexual reproduction in flowering plants') || combined.includes('pollination') || combined.includes('apomixis') || combined.includes('endosperm') || combined.includes('reproduction in plants')) return { subject: 'Botany', chapter: 'Sexual Reproduction in Flowering Plants' };
  if (combined.includes('ecosystem')) return { subject: 'Botany', chapter: 'Ecosystem' };
  if (combined.includes('biodiversity') || combined.includes('conservation')) return { subject: 'Botany', chapter: 'Biodiversity and Conservation' };
  if (combined.includes('organisms and populations') || combined.includes('population interactions')) return { subject: 'Botany', chapter: 'Organisms and Populations' };
  if (combined.includes('cell: the unit of life') || combined.includes('cell membrane') || combined.includes('organelle') || combined.includes('ultrastructure')) return { subject: 'Botany', chapter: 'Cell: The Unit of Life' };
  if (combined.includes('cell cycle') || combined.includes('mitosis') || combined.includes('meiosis') || combined.includes('cell life & division')) return { subject: 'Botany', chapter: 'Cell Cycle and Cell Division' };
  if (combined.includes('plant kingdom') || combined.includes('algae') || combined.includes('bryophyte') || combined.includes('pteridophyte') || combined.includes('gymnosperm') || combined.includes('angiosperm')) return { subject: 'Botany', chapter: 'Plant Kingdom' };
  if (combined.includes('biological classification') || combined.includes('five kingdom') || combined.includes('virus') || combined.includes('viroid') || combined.includes('prion') || combined.includes('lichen')) return { subject: 'Botany', chapter: 'Biological Classification' };
  if (combined.includes('the living world')) return { subject: 'Botany', chapter: 'The Living World' };

  // Zoology
  if (combined.includes('animal kingdom')) return { subject: 'Zoology', chapter: 'Animal Kingdom' };
  if (combined.includes('structural organisation in animals') || combined.includes('animal tissues') || combined.includes('cockroach') || combined.includes('frog')) return { subject: 'Zoology', chapter: 'Structural Organisation in Animals' };
  if (combined.includes('biomolecules') || combined.includes('carbohydrates, proteins')) return { subject: 'Zoology', chapter: 'Biomolecules' };
  if (combined.includes('breathing') || combined.includes('exchange of gases')) return { subject: 'Zoology', chapter: 'Breathing and Exchange of Gases' };
  if (combined.includes('body fluids') || combined.includes('circulation') || combined.includes('cardiac cycle') || combined.includes('ecg')) return { subject: 'Zoology', chapter: 'Body Fluids and Circulation' };
  if (combined.includes('excretory') || combined.includes('elimination') || combined.includes('nephron')) return { subject: 'Zoology', chapter: 'Excretory Products and their Elimination' };
  if (combined.includes('locomotion') || combined.includes('movement')) return { subject: 'Zoology', chapter: 'Locomotion and Movement' };
  if (combined.includes('neural control') || combined.includes('nerve impulse')) return { subject: 'Zoology', chapter: 'Neural Control and Coordination' };
  if (combined.includes('chemical coordination') || combined.includes('endocrine') || combined.includes('hormone')) return { subject: 'Zoology', chapter: 'Chemical Coordination and Integration' };
  if (combined.includes('reproductive health') || combined.includes('contraception') || combined.includes('art:') || combined.includes('ivf')) return { subject: 'Zoology', chapter: 'Reproductive Health' };
  if (combined.includes('human reproduction') || combined.includes('spermatogenesis') || combined.includes('oogenesis') || combined.includes('menstrual') || combined.includes('parturition')) return { subject: 'Zoology', chapter: 'Human Reproduction' };
  if (combined.includes('evolution')) return { subject: 'Zoology', chapter: 'Evolution' };
  if (combined.includes('human health and disease') || combined.includes('common diseases') || combined.includes('immunity') || combined.includes('cancer') || combined.includes('drug abuse')) return { subject: 'Zoology', chapter: 'Human Health and Disease' };
  if (combined.includes('principles & processes') || combined.includes('principles and processes') || combined.includes('restriction endonucleases') || combined.includes('pcr') || combined.includes('recombinant dna')) return { subject: 'Zoology', chapter: 'Biotechnology: Principles and Processes' };
  if (combined.includes('biotechnology and its applications') || combined.includes('transgenic') || combined.includes('gene therapy')) return { subject: 'Zoology', chapter: 'Biotechnology and Its Applications' };

  return null;
}

async function migrateTestPapers() {
  await client.connect();
  const db = client.db();

  console.log('Migrating testPapers legacy chapters...');
  const tests = await db.collection('testPapers').find({
    $or: [
      { subject: { $in: ['Botany', 'Zoology'] } },
      { testId: /^neet-/ }
    ]
  }).toArray();

  let updated = 0;
  for (const t of tests) {
    const res = resolveTestCanonical(t.subject, t.chapter, t.title, t.testId);
    if (res && (t.chapter !== res.chapter || t.subject !== res.subject)) {
      await db.collection('testPapers').updateOne(
        { _id: t._id },
        {
          $set: {
            chapter: res.chapter,
            subject: res.subject,
            updatedAt: new Date()
          }
        }
      );
      updated++;
    }
  }

  console.log(`Updated ${updated} tests in testPapers.`);

  // For umbrella chapter tests (e.g. neet-CHAPTER-Botany-Diversity-in-Living-World-11), mark as inactive legacy
  const umbrellaTests = [
    'neet-CHAPTER-Botany-Diversity-in-Living-World-11',
    'neet-CHAPTER-Botany-Plant-Physiology-11',
    'neet-CHAPTER-Botany-Cell-Structure-and-Function-11',
    'neet-CHAPTER-Botany-Genetics-and-Evolution-12',
    'neet-CHAPTER-Botany-Ecology-and-Environment-12',
    'neet-CHAPTER-Botany-Reproduction-in-Plants-12',
    'neet-CHAPTER-Zoology-Structural-Organisation-in-Animals-and-Plants-11',
    'neet-CHAPTER-Zoology-Human-Physiology-11',
    'neet-CHAPTER-Zoology-Reproduction-12',
    'neet-CHAPTER-Zoology-Biology-and-Human-Welfare-12'
  ];

  await db.collection('testPapers').updateMany(
    { testId: { $in: umbrellaTests } },
    { $set: { isActive: false, syllabusStatus: 'LEGACY_UMBRELLA' } }
  );

  console.log(`Deactivated ${umbrellaTests.length} legacy umbrella tests.`);

  await client.close();
}

migrateTestPapers().catch(console.error);


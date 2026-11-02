import { generateTests, generateSundayTests, generateChapterTests, generatePartTests } from '../utils.js';
import { neetSyllabus } from '../chapters.js';

export const neetChapters = neetSyllabus;

const allChapters = {
    Physics: [...neetChapters.Physics['11'], ...neetChapters.Physics['12']],
    Chemistry: [...neetChapters.Chemistry['11'], ...neetChapters.Chemistry['12']],
    Botany: [...neetChapters.Botany['11'], ...neetChapters.Botany['12']],
    Zoology: [...neetChapters.Zoology['11'], ...neetChapters.Zoology['12']]
};

const chunkArray = (array, numChunks) => {
    const result = [];
    const baseSize = Math.floor(array.length / numChunks);
    let remainder = array.length % numChunks;
    let offset = 0;
    
    for (let i = 0; i < numChunks; i++) {
        const size = baseSize + (remainder > 0 ? 1 : 0);
        result.push(array.slice(offset, offset + size));
        offset += size;
        remainder--;
    }
    return result;
};

const generate24Tests = (category, subjectName, syllabus) => {
    const tests = [];
    const class11 = syllabus[subjectName]['11'];
    const class12 = syllabus[subjectName]['12'];

    // Tests 1-5: Class 11 Partial Revision
    const class11Chunks = chunkArray(class11, 5);
    class11Chunks.forEach((chunk, i) => {
        tests.push({
            id: `${category}-SUBJECT-${subjectName}-11-REV-${i + 1}`,
            title: `${subjectName} Test ${i + 1}`,
            type: 'SUBJECT',
            subject: subjectName,
            classGrade: '11',
            chapters: chunk,
            category,
            duration: 60,
            totalMarks: category === 'neet' ? 180 : 100,
            questionsCount: category === 'neet' ? 45 : 25,
            difficulty: 'Mixed',
            description: `Class 11\nRevision Test ${i + 1}`,
            syllabus: { [subjectName]: chunk }
        });
    });

    // Test 6: Class 11 Full Revision
    tests.push({
        id: `${category}-SUBJECT-${subjectName}-11-REV-FULL`,
        title: `${subjectName} Test 6`,
        type: 'SUBJECT',
        subject: subjectName,
        classGrade: '11',
        chapters: class11,
        category,
        duration: 60,
        totalMarks: category === 'neet' ? 180 : 100,
        questionsCount: category === 'neet' ? 45 : 25,
        difficulty: 'Mixed',
        description: `Class 11\nComplete Syllabus Revision`,
        syllabus: { [subjectName]: ['All Included Class 11 Chapters'] }
    });

    // Tests 7-12: Class 11 Full Mocks
    for (let i = 1; i <= 6; i++) {
        tests.push({
            id: `${category}-SUBJECT-${subjectName}-11-MOCK-${i}`,
            title: `${subjectName} Test ${6 + i}`,
            type: 'SUBJECT',
            subject: subjectName,
            classGrade: '11',
            chapters: class11,
            category,
            duration: 60,
            totalMarks: category === 'neet' ? 180 : 100,
            questionsCount: category === 'neet' ? 45 : 25,
            difficulty: 'Mixed',
            description: `Class 11\nFull Syllabus Mock Test ${i}`,
            syllabus: { [subjectName]: ['All Included Class 11 Chapters'] }
        });
    }

    // Tests 13-17: Class 12 Partial Revision
    const class12Chunks = chunkArray(class12, 5);
    class12Chunks.forEach((chunk, i) => {
        tests.push({
            id: `${category}-SUBJECT-${subjectName}-12-REV-${i + 1}`,
            title: `${subjectName} Test ${12 + i + 1}`,
            type: 'SUBJECT',
            subject: subjectName,
            classGrade: '12',
            chapters: chunk,
            category,
            duration: 60,
            totalMarks: category === 'neet' ? 180 : 100,
            questionsCount: category === 'neet' ? 45 : 25,
            difficulty: 'Mixed',
            description: `Class 12\nRevision Test ${i + 1}`,
            syllabus: { [subjectName]: chunk }
        });
    });

    // Test 18: Class 12 Full Revision
    tests.push({
        id: `${category}-SUBJECT-${subjectName}-12-REV-FULL`,
        title: `${subjectName} Test 18`,
        type: 'SUBJECT',
        subject: subjectName,
        classGrade: '12',
        chapters: class12,
        category,
        duration: 60,
        totalMarks: category === 'neet' ? 180 : 100,
        questionsCount: category === 'neet' ? 45 : 25,
        difficulty: 'Mixed',
        description: `Class 12\nComplete Syllabus Revision`,
        syllabus: { [subjectName]: ['All Included Class 12 Chapters'] }
    });

    // Tests 19-24: Class 12 Full Mocks
    for (let i = 1; i <= 6; i++) {
        tests.push({
            id: `${category}-SUBJECT-${subjectName}-12-MOCK-${i}`,
            title: `${subjectName} Test ${18 + i}`,
            type: 'SUBJECT',
            subject: subjectName,
            classGrade: '12',
            chapters: class12,
            category,
            duration: 60,
            totalMarks: category === 'neet' ? 180 : 100,
            questionsCount: category === 'neet' ? 45 : 25,
            difficulty: 'Mixed',
            description: `Class 12\nFull Syllabus Mock Test ${i}`,
            syllabus: { [subjectName]: ['All Included Class 12 Chapters'] }
        });
    }

    return tests;
};

const buildAllSubjectTests = () => {
    return [
        ...generate24Tests('neet', 'Physics', neetChapters),
        ...generate24Tests('neet', 'Chemistry', neetChapters),
        ...generate24Tests('neet', 'Botany', neetChapters),
        ...generate24Tests('neet', 'Zoology', neetChapters)
    ];
};

export const generateNeetTests = (year = 2027) => {
    const partTests = generatePartTests('neet', neetChapters, 10, year).map(t => {
        if (t.id === 'neet-PART-6') {
            return {
                ...t,
                syllabus: {
                    Physics: [
                        "Electric Charges & Fields",
                        "Electrostatic Potential & Capacitance",
                        "Current Electricity"
                    ],
                    Chemistry: [
                        "Electrochemistry",
                        "Thermodynamics",
                        "Chemical Bonding and Molecular Structure"
                    ],
                    Botany: [
                        "Anatomy of Flowering Plants"
                    ],
                    Zoology: [
                        "Neural Control and Coordination"
                    ]
                }
            };
        }
        return t;
    });

    partTests.push({
        id: 'neet-PART-11',
        title: 'NEET Part Test 11',
        type: 'PART',
        subject: 'Mixed',
        classGrade: 'All Test',
        year: 2027,
        category: 'neet',
        duration: 180,
        totalMarks: 720,
        questionsCount: 180,
        difficulty: 'Easy',
        description: 'Part Syllabus Test covering targeted chapters across all subjects.',
        syllabus: {
            Physics: [
                "Work, Power and Energy",
                "Laws of Motion (Newton's Laws of Motion), Projectile, and Relative Motion"
            ],
            Chemistry: [
                "Solutions and Colligative Properties",
                "Structure of Atom",
                "Classification of Elements and Periodicity in Properties (Periodic Table)"
            ],
            Botany: [
                "Plant Kingdom (up to Pteridophytes)"
            ],
            Zoology: [
                "Neural Control and Coordination"
            ]
        }
    });

    return [
        // Mock Tests
        ...generateTests('neet', 10, 'MOCK', null, 'All Test'),
        ...generateTests('neet', 5, 'MOCK', null, '11'),
        ...generateTests('neet', 5, 'MOCK', null, '12'),

        // Part Tests
        ...partTests,

        // PYQs
        ...generateTests('neet', 10, 'PYQ'),

    // Subject Tests (24 per subject exactly as per NMC Guidelines)
    ...buildAllSubjectTests(),

    // Chapter Tests (Test 1, Test 2, Test 3)
    ...generateChapterTests('neet', neetChapters.Physics['11'], 'Physics', '11'),
    ...generateChapterTests('neet', neetChapters.Physics['12'], 'Physics', '12'),
    ...generateChapterTests('neet', neetChapters.Chemistry['11'], 'Chemistry', '11'),
    ...generateChapterTests('neet', neetChapters.Chemistry['12'], 'Chemistry', '12'),
    ...generateChapterTests('neet', neetChapters.Botany['11'], 'Botany', '11'),
    ...generateChapterTests('neet', neetChapters.Botany['12'], 'Botany', '12'),
    ...generateChapterTests('neet', neetChapters.Zoology['11'], 'Zoology', '11'),
    ...generateChapterTests('neet', neetChapters.Zoology['12'], 'Zoology', '12'),

    // 52 Weekly Sunday Live Tests (automatically scheduled on Sundays for the current year)
    ...generateSundayTests('neet', year, neetChapters),

    // Subtopic Tests (Physics)
    ...generateTests('neet', ["Units and dimensions", "Error analysis", "Significant figures", "Dimensional analysis and applications", "Least count and precision"], 'SUBTOPIC', 'Physics', 'All Test', 'Units & Measurements'),
    ...generateTests('neet', ["Graphical analysis of motion (x-t, v-t graphs)", "Motion in a straight line/plane", "Projectile motion", "Relative velocity", "Uniform circular motion", "Uniformly accelerated motion and equations"], 'SUBTOPIC', 'Physics', 'All Test', 'Motion in a Straight Line'),
    ...generateTests('neet', ["Newton's laws", "Impulse", "Conservation of momentum", "Friction", "Banking of roads", "Connected motion and pulley problems", "Equilibrium of concurrent forces"], 'SUBTOPIC', 'Physics', 'All Test', 'Laws of Motion'),
    ...generateTests('neet', ["Work-energy theorem", "Kinetic/potential energy", "Conservative forces and potential energy", "Conservation of mechanical energy", "Vertical circular motion", "Power and variable force", "Elastic and inelastic collisions"], 'SUBTOPIC', 'Physics', 'All Test', 'Work, Energy & Power'),
    ...generateTests('neet', ["Center of mass", "Torque", "Moment of inertia", "Theorems of parallel and perpendicular axes", "Angular momentum conservation", "Rolling motion"], 'SUBTOPIC', 'Physics', 'All Test', 'System of Particles & Rotational Motion'),
    ...generateTests('neet', ["Kepler's laws", "Newton's law of gravitation", "Gravitational potential energy", "Escape velocity", "Acceleration due to gravity (variation with height, depth, latitude)", "Orbital velocity and satellite motion"], 'SUBTOPIC', 'Physics', 'All Test', 'Gravitation'),
    ...generateTests('neet', ["Elasticity (Hooke's law, Young's modulus)", "Fluid mechanics (Pascal's law, Bernoulli's principle, viscosity)", "Surface tension, surface energy, and capillarity", "Thermal expansion and calorimetry", "Stefan's law of radiation"], 'SUBTOPIC', 'Physics', 'All Test', 'Mechanical Properties of Solids'),
    ...generateTests('neet', ["Thermal equilibrium", "Laws of thermodynamics (zeroth, first, second)", "Isothermal and adiabatic processes", "Work done in thermodynamic processes"], 'SUBTOPIC', 'Physics', 'All Test', 'Thermodynamics'),
    ...generateTests('neet', ["Equation of state", "Kinetic interpretation of temperature", "Degrees of freedom", "Law of equipartition of energy", "Mean free path and molecular speeds (rms, average, most probable)"], 'SUBTOPIC', 'Physics', 'All Test', 'Kinetic Theory'),
    ...generateTests('neet', ["Simple Harmonic Motion (SHM)", "Wave motion", "Superposition of waves", "Standing waves in strings and organ pipes", "Beats"], 'SUBTOPIC', 'Physics', 'All Test', 'Oscillations'),
    ...generateTests('neet', ["Coulomb's law", "Electric field/flux", "Gauss's law", "Potential energy", "Equipotential surfaces", "Electric dipole and dipole moment", "Capacitors", "Combination of capacitors and energy stored", "Dielectrics"], 'SUBTOPIC', 'Physics', 'All Test', 'Electric Charges & Fields'),
    ...generateTests('neet', ["Drift velocity and mobility", "Ohm's law", "Resistivity", "Electrical energy and power", "Internal resistance of a cell and EMF", "Kirchhoff's laws", "Wheatstone bridge", "Meter bridge"], 'SUBTOPIC', 'Physics', 'All Test', 'Current Electricity'),
    ...generateTests('neet', ["Biot-Savart law and applications", "Ampere's law", "Magnetic field calculation", "Lorentz force", "Force between two parallel currents", "Moving coil galvanometer and conversion to ammeter/voltmeter", "Magnetic properties (dia, para, ferromagnetism)"], 'SUBTOPIC', 'Physics', 'All Test', 'Moving Charges & Magnetism'),
    ...generateTests('neet', ["Faraday's law", "Lenz's law", "Self and mutual inductance", "Transformers and AC generator", "RMS values", "AC circuits", "LC oscillations"], 'SUBTOPIC', 'Physics', 'All Test', 'Electromagnetic Induction'),
    ...generateTests('neet', ["Displacement current", "EM spectrum", "Transverse nature of EM waves", "Energy density and Poynting vector"], 'SUBTOPIC', 'Physics', 'All Test', 'Electromagnetic Waves'),
    ...generateTests('neet', ["Photoelectric effect", "de Broglie wavelength", "Bohr's model", "Wave-particle duality", "Einstein's photoelectric equation and work function"], 'SUBTOPIC', 'Physics', 'All Test', 'Dual Nature of Radiation & Matter'),
    ...generateTests('neet', ["Atomic models", "Rutherford's scattering and Bohr's quantization", "Hydrogen spectrum and Rydberg formula", "Mass defect and nuclear force", "Binding energy", "Nuclear reactions", "Nuclear fission and fusion"], 'SUBTOPIC', 'Physics', 'All Test', 'Atoms'),
    ...generateTests('neet', ["Energy bands", "intrinsic/extrinsic semiconductors", "diodes", "logic gates"], 'SUBTOPIC', 'Physics', 'All Test', 'Semiconductor Electronics'),

    // Subtopic Tests (Chemistry)
    ...generateTests('neet', ["Mole concept", "molar mass", "empirical/molecular formula", "stoichiometry"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Some Basic Concepts of Chemistry'),
    ...generateTests('neet', ["Bohr’s model", "quantum mechanical model", "electronic configuration"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Structure of Atom'),
    ...generateTests('neet', ["First law", "enthalpy (ΔH)", "entropy (ΔS)", "Gibbs free energy (ΔG)", "spontaneity"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Thermodynamics'),
    ...generateTests('neet', ["Chemical equilibrium", "Le Chatelier's principle", "ionic equilibrium", "pH", "buffer solutions"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Equilibrium'),
    ...generateTests('neet', ["Oxidation number", "balancing", "oxidation/reduction reactions"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Redox Reactions'),
    ...generateTests('neet', ["Trends in periodic properties (ionization enthalpy, electronegativity)"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Classification of Elements and Periodicity'),
    ...generateTests('neet', ["VSEPR theory", "hybridization", "molecular orbital theory"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Chemical Bonding and Molecular Structure'),
    ...generateTests('neet', ["Properties", "compounds", "uses"], 'SUBTOPIC', 'Chemistry', 'All Test', 'The p-Block Elements'),
    ...generateTests('neet', ["Purification", "classification", "nomenclature", "isomerism", "electronic effect", "acidic strength", "basic strength", "reaction mechanisms"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Organic Chemistry – Some Basic Principles and Techniques'),
    ...generateTests('neet', ["Alkanes", "alkenes", "alkynes", "aromatic hydrocarbons"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Hydrocarbons'),
    ...generateTests('neet', ["Concentration terms", "Raoult’s law", "ideal/non-ideal solutions", "colligative properties"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Solutions'),
    ...generateTests('neet', ["Redox reactions", "Nernst equation", "conductivity", "galvanic cells", "electrolytic cells"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Electrochemistry'),
    ...generateTests('neet', ["Rate of reaction", "rate law", "Arrhenius equation", "catalysis"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Chemical Kinetics'),
    ...generateTests('neet', ["Transition elements", "lanthanides", "actinoids", "alloys"], 'SUBTOPIC', 'Chemistry', 'All Test', 'd- and f-Block Elements'),
    ...generateTests('neet', ["Werner’s theory", "IUPAC nomenclature", "bonding", "isomerism"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Coordination Compounds'),
    ...generateTests('neet', ["Nomenclature", "nature of C–X bond", "mechanism of substitution"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Haloalkanes and Haloarenes'),
    ...generateTests('neet', ["Preparation", "properties", "reactions"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Alcohols, Phenols and Ethers'),
    ...generateTests('neet', ["Synthesis", "mechanisms", "uses"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Aldehydes, Ketones and Carboxylic Acids'),
    ...generateTests('neet', ["Classification", "structure", "basicity", "Diazonium salts"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Amines'),
    ...generateTests('neet', ["Carbohydrates", "proteins", "nucleic acids", "vitamins"], 'SUBTOPIC', 'Chemistry', 'All Test', 'Biomolecules'),
    
    // Subtopic Tests (Botany - 17 Active Chapters)
    ...generateTests('neet', ["What is Living & Taxonomy", "Taxonomic Categories & Hierarchy", "Taxonomical Aids"], 'SUBTOPIC', 'Botany', 'All Test', 'The Living World'),
    ...generateTests('neet', ["Five Kingdom Classification", "Kingdom Monera", "Kingdom Protista", "Kingdom Fungi", "Viruses, Viroids, Prions and Lichens"], 'SUBTOPIC', 'Botany', 'All Test', 'Biological Classification'),
    ...generateTests('neet', ["Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Plant Life Cycles & Alternation of Generations"], 'SUBTOPIC', 'Botany', 'All Test', 'Plant Kingdom'),
    ...generateTests('neet', ["Root, Stem and Leaf Modifications", "Inflorescence and Flower Structure", "Placentation, Fruit and Seed", "Plant Families"], 'SUBTOPIC', 'Botany', 'All Test', 'Morphology of Flowering Plants'),
    ...generateTests('neet', ["Meristematic and Permanent Tissues", "Tissue Systems", "Internal Structure of Root and Stem", "Anatomy of Leaf & Secondary Growth"], 'SUBTOPIC', 'Botany', 'All Test', 'Anatomy of Flowering Plants'),
    ...generateTests('neet', ["Prokaryotic Cell Structure", "Plasma Membrane & Cell Wall", "Endomembrane System", "Mitochondria, Plastids and Ribosomes", "Nucleus and Chromosomes"], 'SUBTOPIC', 'Botany', 'All Test', 'Cell: The Unit of Life'),
    ...generateTests('neet', ["Cell Cycle Stages (G1, S, G2)", "Mitosis and Cytokinesis", "Meiosis I Stages", "Meiosis II & Significance"], 'SUBTOPIC', 'Botany', 'All Test', 'Cell Cycle and Cell Division'),
    ...generateTests('neet', ["Photosynthetic Pigments", "Light Reaction & Photophosphorylation", "Calvin Cycle (C3 Pathway)", "Hatch-Slack Pathway (C4 Pathway)", "Photorespiration & Factors"], 'SUBTOPIC', 'Botany', 'All Test', 'Photosynthesis in Higher Plants'),
    ...generateTests('neet', ["Glycolysis (EMP Pathway)", "Fermentation", "TCA Cycle (Krebs Cycle)", "ETS and Oxidative Phosphorylation", "Respiratory Quotient (RQ)"], 'SUBTOPIC', 'Botany', 'All Test', 'Respiration in Plants'),
    ...generateTests('neet', ["Phases of Growth", "Plant Growth Regulators (Auxin, GA, CK)", "Plant Growth Inhibitors (Ethylene, ABA)", "Photoperiodism & Vernalization"], 'SUBTOPIC', 'Botany', 'All Test', 'Plant Growth and Development'),
    ...generateTests('neet', ["Microsporogenesis & Pollen", "Megasporogenesis & Embryo Sac", "Pollination & Outbreeding Devices", "Double Fertilization & Triple Fusion", "Endosperm, Embryo & Seed Development", "Apomixis and Polyembryony"], 'SUBTOPIC', 'Botany', 'All Test', 'Sexual Reproduction in Flowering Plants'),
    ...generateTests('neet', ["Mendel's Laws of Inheritance", "Incomplete Dominance & Codominance", "Chromosomal Theory of Inheritance", "Linkage and Genetic Recombination", "Sex Determination & Mutations", "Genetic Disorders"], 'SUBTOPIC', 'Botany', 'All Test', 'Principles of Inheritance and Variation'),
    ...generateTests('neet', ["DNA Structure and Packaging", "DNA Replication", "Transcription & RNA Processing", "Genetic Code & Translation", "Regulation of Gene Expression (Lac Operon)", "Human Genome Project & DNA Fingerprinting"], 'SUBTOPIC', 'Botany', 'All Test', 'Molecular Basis of Inheritance'),
    ...generateTests('neet', ["Microbes in Household & Industrial Products", "Microbes in Sewage Treatment & Biogas", "Microbes as Biocontrol Agents & Biofertilizers"], 'SUBTOPIC', 'Botany', 'All Test', 'Microbes in Human Welfare'),
    ...generateTests('neet', ["Organism and Abiotic Factors / Adaptations", "Population Growth & Attributes", "Population Interactions"], 'SUBTOPIC', 'Botany', 'All Test', 'Organisms and Populations'),
    ...generateTests('neet', ["Ecosystem Structure & Productivity", "Energy Flow & Decomposition", "Ecological Pyramids", "Ecological Succession & Nutrient Cycling"], 'SUBTOPIC', 'Botany', 'All Test', 'Ecosystem'),
    ...generateTests('neet', ["Patterns and Levels of Biodiversity", "Loss of Biodiversity & Causes", "In-situ and Ex-situ Conservation Strategies"], 'SUBTOPIC', 'Botany', 'All Test', 'Biodiversity and Conservation'),

    // Subtopic Tests (Zoology - 15 Active Chapters)
    ...generateTests('neet', ["Basis of Animal Classification", "Non-chordates Characteristics", "Chordata Characteristics", "Tetrapoda (Amphibia, Reptilia, Aves, Mammalia)"], 'SUBTOPIC', 'Zoology', 'All Test', 'Animal Kingdom'),
    ...generateTests('neet', ["Epithelial Tissue & Junctions", "Connective Tissue (Bone, Cartilage, Blood)", "Muscular and Nervous Tissues", "Cockroach & Frog Anatomy"], 'SUBTOPIC', 'Zoology', 'All Test', 'Structural Organisation in Animals'),
    ...generateTests('neet', ["Primary and Secondary Metabolites", "Carbohydrates & Lipids", "Proteins Structure & Nucleic Acids", "Enzymes Properties, Mechanism & Inhibition"], 'SUBTOPIC', 'Zoology', 'All Test', 'Biomolecules'),
    ...generateTests('neet', ["Respiratory System Anatomy", "Mechanism of Breathing & Respiratory Volumes", "Gas Exchange and Transport (O2 & CO2)", "Regulation of Respiration & Disorders"], 'SUBTOPIC', 'Zoology', 'All Test', 'Breathing and Exchange of Gases'),
    ...generateTests('neet', ["Blood Composition, Groups (ABO, Rh)", "Human Heart Anatomy & Cardiac Cycle", "ECG & Double Circulation", "Circulatory System Disorders"], 'SUBTOPIC', 'Zoology', 'All Test', 'Body Fluids and Circulation'),
    ...generateTests('neet', ["Human Excretory System Anatomy", "Nephron Structure & Urine Formation", "Counter-Current Mechanism", "Regulation of Kidney Function (RAAS, ADH)", "Excretory Disorders & Dialysis"], 'SUBTOPIC', 'Zoology', 'All Test', 'Excretory Products and their Elimination'),
    ...generateTests('neet', ["Types of Movement & Muscle Structure", "Mechanism of Muscle Contraction (Sliding Filament)", "Human Skeletal System (Axial & Appendicular)", "Joints Types & Locomotory Disorders"], 'SUBTOPIC', 'Zoology', 'All Test', 'Locomotion and Movement'),
    ...generateTests('neet', ["Neuron Structure & Nerve Impulse Conduction", "Synaptic Transmission", "Central Nervous System (Brain & Spinal Cord)", "Reflex Action & Sense Organs"], 'SUBTOPIC', 'Zoology', 'All Test', 'Neural Control and Coordination'),
    ...generateTests('neet', ["Endocrine Glands & Hormone Mechanism", "Hypothalamus and Pituitary Hormones", "Thyroid, Parathyroid, Adrenal, Pancreas", "Gonadal Hormones & Endocrine Disorders"], 'SUBTOPIC', 'Zoology', 'All Test', 'Chemical Coordination and Integration'),
    ...generateTests('neet', ["Male Reproductive System", "Female Reproductive System", "Gametogenesis (Spermatogenesis & Oogenesis)", "Menstrual Cycle & Hormones", "Fertilization, Implantation & Embryonic Development", "Parturition and Lactation"], 'SUBTOPIC', 'Zoology', 'All Test', 'Human Reproduction'),
    ...generateTests('neet', ["Reproductive Health & Population Control", "Contraceptive Methods", "Medical Termination of Pregnancy (MTP) & STIs", "Infertility and Assisted Reproductive Technologies (ART)"], 'SUBTOPIC', 'Zoology', 'All Test', 'Reproductive Health'),
    ...generateTests('neet', ["Origin of Life Theories", "Evidences of Evolution (Homology, Analogy)", "Theories of Evolution (Darwinism, Mutation)", "Hardy-Weinberg Principle & Speciation", "Human Evolution"], 'SUBTOPIC', 'Zoology', 'All Test', 'Evolution'),
    ...generateTests('neet', ["Common Infectious Diseases in Humans", "Innate and Acquired Immunity & Antibodies", "AIDS and HIV Pathogenesis", "Cancer Types, Causes and Treatment", "Drugs and Alcohol Abuse"], 'SUBTOPIC', 'Zoology', 'All Test', 'Human Health and Disease'),
    ...generateTests('neet', ["Genetic Engineering & Recombinant DNA", "Tools of r-DNA (Restriction Enzymes, Vectors)", "Processes of r-DNA (PCR Amplification, Ligation)", "Bioreactors and Downstream Processing"], 'SUBTOPIC', 'Zoology', 'All Test', 'Biotechnology: Principles and Processes'),
    ...generateTests('neet', ["Biotechnology in Agriculture (Bt Crops, RNAi)", "Biotechnology in Medicine (Insulin, Gene Therapy)", "Molecular Diagnostics (PCR, ELISA)", "Transgenic Animals & Ethical Issues"], 'SUBTOPIC', 'Zoology', 'All Test', 'Biotechnology and Its Applications')
    ];
};

export const neetTests = generateNeetTests();

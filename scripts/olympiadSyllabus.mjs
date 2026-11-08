/**
 * Olympiad Syllabus Specification for Classes 1 to 12
 * Covers Mathematics (IMO/iOM/UIMO), Science (NSO/iOS/NSTSE), and English (IEO/iOEL).
 */

export const OLYMPIAD_CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const OLYMPIAD_SUBJECTS = ['Mathematics', 'Science', 'English'];

export const OLYMPIAD_SYLLABUS = {
    // ──────────── MATHEMATICS ────────────
    Mathematics: {
        1: [
            'Number Sense (1 to 100) & Place Values',
            'Addition & Subtraction of Single & Two-Digit Numbers',
            'Basic Shapes (Circle, Square, Triangle, Rectangle)',
            'Spatial Understanding & Patterns',
            'Measurement (Length, Weight, Capacity comparisons)',
            'Time, Days of the Week & Months',
            'Money & Currency (Coins and Notes)',
            'Logical Reasoning & Pictographs'
        ],
        2: [
            'Numbers & Number Names up to 1000',
            'Addition & Subtraction with Regrouping',
            'Introduction to Multiplication as Repeated Addition',
            'Basic Division as Equal Sharing',
            '2D and 3D Shapes & Solid Objects',
            'Measurement of Length, Weight & Capacity in Standard Units',
            'Reading Clocks, Calendars & Intervals',
            'Patterns, Sequences & Picture Puzzles'
        ],
        3: [
            '4-Digit Numbers, Place Value & Roman Numerals',
            'Addition & Subtraction Problem Solving',
            'Multiplication Tables up to 15 & Word Problems',
            'Division with Remainder & Grouping',
            'Fractions (Halves, Thirds, Fourths, Equivalent Basics)',
            'Measurement (Conversions: m to cm, kg to g, L to mL)',
            'Geometry (Points, Lines, Ray, Angles, Perimeter Basics)',
            'Data Handling, Bar Graphs & Quantitative Reasoning'
        ],
        4: [
            'Large Numbers up to 6 Digits & Estimation',
            'Factors, Multiples, Prime & Composite Numbers',
            'Operations on Fractions (Addition, Subtraction, Like/Unlike)',
            'Introduction to Decimals & Place Value',
            'Geometry (Types of Angles, Circles: Radius & Diameter)',
            'Perimeter and Area of Rectangles and Squares',
            'Time Intervals, 24-Hour Clock & Speed Basics',
            'Symmetry, Reflections & Logical Deductions'
        ],
        5: [
            '7-Digit Numbers, International Number System & Rounding',
            'HCF and LCM (Prime Factorization & Division Methods)',
            'Operations on Fractions & Decimals (Multiplication/Division)',
            'Percentages & Unitary Method Applications',
            'Geometry (Angles: Complementary/Supplementary, Triangles & Quadrilaterals)',
            'Area, Perimeter & Volume of Cubes and Cuboids',
            'Temperature, Distance, Speed & Time',
            'Data Interpretation, Pie Charts & Pattern Logic'
        ],
        6: [
            'Knowing Our Numbers & Whole Numbers',
            'Playing with Numbers (Divisibility Rules, Prime Factorization)',
            'Basic Geometrical Ideas & Understanding Elementary Shapes',
            'Integers (Number Line Operations, Absolute Value)',
            'Fractions & Decimals in Problem Contexts',
            'Data Handling (Frequency Tables, Bar Graphs)',
            'Introduction to Algebra (Variables, Expressions, Simple Equations)',
            'Ratio and Proportion & Unitary Method',
            'Symmetry & Practical Geometry'
        ],
        7: [
            'Integers & Properties of Operations',
            'Fractions and Decimals (Complex Operations)',
            'Data Handling (Mean, Median, Mode, Probability Basics)',
            'Simple Linear Equations in One Variable',
            'Lines and Angles (Transversal, Alternate, Corresponding)',
            'The Triangle and its Properties & Congruence of Triangles',
            'Comparing Quantities (Percentage, Profit & Loss, Simple Interest)',
            'Rational Numbers & Exponents and Powers',
            'Perimeter, Area & Algebraic Expressions'
        ],
        8: [
            'Rational Numbers & Linear Equations in One Variable',
            'Understanding Quadrilaterals & Practical Geometry',
            'Data Handling (Histograms, Pie Charts, Probability)',
            'Squares and Square Roots, Cubes and Cube Roots',
            'Comparing Quantities (Compound Interest, Discounts, Tax)',
            'Algebraic Expressions and Identities (Factorization)',
            'Visualising Solid Shapes & Mensuration (Surface Area, Volume)',
            'Exponents and Powers & Direct and Inverse Proportions',
            'Introduction to Graphs & Playing with Numbers'
        ],
        9: [
            'Number Systems (Irrational Numbers, Real Numbers & Laws of Exponents)',
            'Polynomials (Factor Theorem, Remainder Theorem, Algebraic Identities)',
            'Coordinate Geometry (Cartesian Plane, Coordinates of Points)',
            'Linear Equations in Two Variables (Graphs & Solutions)',
            'Lines and Angles & Triangles (Criteria for Congruence, Inequalities)',
            'Quadrilaterals & Areas of Parallelograms and Triangles',
            'Circles (Chords, Cyclic Quadrilaterals, Angle Subtended)',
            'Heron’s Formula, Surface Areas and Volumes',
            'Statistics and Probability'
        ],
        10: [
            'Real Numbers (Fundamental Theorem of Arithmetic, Irrationality)',
            'Polynomials (Zeroes, Relationship between Zeroes & Coefficients)',
            'Pair of Linear Equations in Two Variables',
            'Quadratic Equations (Factorization, Quadratic Formula, Nature of Roots)',
            'Arithmetic Progressions (nth Term, Sum of First n Terms)',
            'Triangles (Similarity Criteria, Basic Proportionality Theorem, Pythagoras)',
            'Coordinate Geometry (Distance Formula, Section Formula)',
            'Introduction to Trigonometry & Trigonometric Identities',
            'Heights and Distances & Circles (Tangent Properties)',
            'Areas Related to Circles & Surface Areas and Volumes',
            'Statistics & Probability'
        ],
        11: [
            'IOQM/RMO: Number Theory (Modular Arithmetic, Diophantine Equations, Primes & Divisibility)',
            'IOQM/RMO: Combinatorics (Pigeonhole Principle, Inclusion-Exclusion, Invariants & Double Counting)',
            'IOQM/RMO: Geometry (Cyclic Quadrilaterals, Power of a Point, Radical Axis & Ptolemy\'s Theorem)',
            'IOQM/RMO: Triangle Geometry (Ceva\'s & Menelaus\'s Theorems, Incenter-Excenter Lemma & Euler Line)',
            'IOQM/RMO: Algebra & Polynomials (Vieta\'s Relations, Newton\'s Sums & Integer Roots)',
            'IOQM/RMO: Functional Equations & Sequences (Recurrence Relations, Telescoping Sums & Involutions)',
            'IOQM/RMO: Classical Inequalities (AM-GM, Cauchy-Schwarz, Chebyshev & Rearrangement)',
            'IOQM/RMO: Complex Numbers & Trigonometry in Olympiad Geometry',
            'INMO/IMO: Advanced Combinatorics & Graph Theory (Extremal Principle & Bipartite Graphs)',
            'INMO/IMO: Advanced Olympiad Problem Solving & Proof Strategies'
        ],
        12: [
            'Relations and Functions & Inverse Trigonometric Functions',
            'Matrices (Types, Operations, Inverses) & Determinants',
            'Continuity, Differentiability & Mean Value Theorems',
            'Applications of Derivatives (Rate of Change, Tangents, Maxima/Minima)',
            'Indefinite and Definite Integrals & Properties',
            'Applications of Integrals (Area Under Simple Curves)',
            'Differential Equations (Formation, Variable Separable, Linear First Order)',
            'Vector Algebra & Three Dimensional Geometry (Lines and Planes)',
            'Linear Programming (Graphical Method)',
            'Probability (Conditional, Bayes Theorem, Random Variables, Distributions)'
        ]
    },

    // ──────────── SCIENCE ────────────
    Science: {
        1: [
            'Living and Non-Living Things in Our Surroundings',
            'Plants (Trees, Shrubs, Herbs, Parts of a Plant)',
            'Animals (Wild, Domestic, Pet, Birds & Insects)',
            'Human Body (External Organs, Sense Organs & Cleanliness)',
            'Food and Good Health Habits',
            'Air, Water & Weather Observations',
            'Sun, Moon, Stars and Day & Night',
            'Safety Rules at Home and School'
        ],
        2: [
            'Plants: Food Makers, Leaves, Flowers & Seeds',
            'Animals: Habitats, Eating Habits & Babies',
            'Human Body: Bones, Muscles & Posture',
            'Food for Health: Balanced Diet Basics',
            'Water: Sources, Conservation & Uses',
            'Houses and Clothing Across Seasons',
            'Air: Properties, Wind & Breeze',
            'Rocks, Soil & Earth Surface Basics'
        ],
        3: [
            'Plant Life: Root and Shoot Systems, Photosynthesis Basics',
            'Animal Life: Herbivores, Carnivores, Omnivores & Food Chains',
            'Birds: Beaks, Claws, Feathers & Nesting Habits',
            'Human Body: Organ Systems (Digestive, Respiratory, Circulatory)',
            'States of Matter: Solids, Liquids and Gases',
            'Force, Work and Energy in Daily Life',
            'Our Environment: Cleanliness, Garbage Disposal & Pollution',
            'Solar System: Planets and Moon Phases'
        ],
        4: [
            'Adaptations in Plants (Terrestrial, Aquatic, Desert, Insectivorous)',
            'Adaptations in Animals (Habitat, Camouflage, Hibernation)',
            'Reproduction in Animals (Egg-Laying vs Mammals, Life Cycles)',
            'Food and Digestion: Nutrients, Teeth, Digestion Process',
            'Clothes and Fibers: Natural and Synthetic Materials',
            'Solids, Liquids, Gases & Solutions (Solute, Solvent, Evaporation)',
            'Force, Work, Simple Machines & Renewable Energy',
            'Air, Water, Weather (Water Cycle, Condensation, Filtration)',
            'Our Earth, Space and Natural Calamities'
        ],
        5: [
            'Plant Reproduction (Seeds, Spores, Vegetative Propagation)',
            'Animal Life: Respiratory, Circulatory & Nervous Systems',
            'Bones, Muscles and Joints (Ball-and-Socket, Hinge, Pivot)',
            'Food, Health and Communicable Diseases (Prevention & Immunity)',
            'Air and Water Purification Techniques',
            'Earth, Sun, Moon & Eclipses (Solar and Lunar)',
            'Natural Calamities (Earthquakes, Volcanoes, Floods, Drought)',
            'Matter, Elements, Compounds and Simple Chemical Changes',
            'Conservation of Energy, Forests and Wildlife'
        ],
        6: [
            'Components of Food & Balanced Diet (Vitamins, Minerals, Deficiency Diseases)',
            'Sorting Materials into Groups & Separation of Substances',
            'Getting to Know Plants (Herbs, Shrubs, Trees, Leaf Venation, Flower Parts)',
            'Body Movements (Human Skeletal System, Joints, Animal Locomotion)',
            'Living Organisms: Characteristics and Habitats',
            'Motion and Measurement of Distances (Standard Units, Types of Motion)',
            'Light, Shadows and Reflections (Transparent, Translucent, Opaque, Mirrors)',
            'Electricity and Circuits (Conductors, Insulators, Switches, Cells)',
            'Fun with Magnets (Poles, Attraction, Repulsion, Magnetic Field Basics)',
            'Air Around Us & Water Conservation'
        ],
        7: [
            'Nutrition in Plants (Autotrophic, Heterotrophic, Photosynthesis Equation)',
            'Nutrition in Animals (Human Digestive System, Ruminants, Amoeba)',
            'Heat (Temperature, Clinical/Lab Thermometers, Conduction, Convection, Radiation)',
            'Acids, Bases and Salts (Natural Indicators, Neutralization)',
            'Physical and Chemical Changes (Rusting, Crystallization)',
            'Respiration in Organisms (Aerobic, Anaerobic, Breathing Rate)',
            'Transportation in Animals and Plants (Circulation, Heart, Xylem, Phloem)',
            'Reproduction in Plants (Asexual, Sexual, Pollination, Seed Dispersal)',
            'Motion and Time (Speed Formula, Distance-Time Graphs)',
            'Electric Current and its Effects (Heating Effect, Magnetic Effect, Electromagnets)',
            'Light (Reflection, Spherical Mirrors, Lenses, Dispersion of White Light)',
            'Forests: Our Lifeline & Wastewater Management'
        ],
        8: [
            'Crop Production and Management (Agricultural Practices, Irrigation)',
            'Microorganisms: Friend and Foe (Classification, Food Preservation, Nitrogen Cycle)',
            'Coal and Petroleum (Fossil Fuels, Fractional Distillation, Conservation)',
            'Combustion and Flame (Types of Combustion, Calorific Value, Flame Structure)',
            'Conservation of Plants and Animals (Deforestation, Biosphere Reserves, Red Data Book)',
            'Reproduction in Animals (Asexual, Sexual, Fertilization, Metamorphosis)',
            'Reaching the Age of Adolescence (Endocrine Glands, Hormones, Secondary Sexual Characters)',
            'Force and Pressure (Contact/Non-contact Forces, Atmospheric Pressure)',
            'Friction (Types: Static, Sliding, Rolling, Friction Reduction)',
            'Sound (Vibrations, Audible Range, Frequency, Amplitude, Noise Pollution)',
            'Chemical Effects of Electric Current (Electroplating, Electrolysis)',
            'Some Natural Phenomena (Lightning, Earthquakes, Electroscope)',
            'Light (Laws of Reflection, Human Eye Anatomy, Defects of Vision)'
        ],
        9: [
            'Matter in Our Surroundings (States of Matter, Evaporation, Latent Heat)',
            'Is Matter Around Us Pure (Mixtures, Solutions, Colloids, Suspensions, Separation)',
            'Atoms and Molecules (Laws of Chemical Combination, Chemical Formulae, Mole Concept)',
            'Structure of the Atom (Thomson, Rutherford, Bohr Models, Isotopes, Isobars)',
            'The Fundamental Unit of Life (Cell Organelles, Plasma Membrane, Mitosis, Meiosis)',
            'Tissues (Plant: Meristematic, Permanent; Animal: Epithelial, Connective, Muscular, Nervous)',
            'Motion (Distance, Displacement, Velocity, Acceleration, Equations of Motion)',
            'Force and Laws of Motion (Newton’s Laws, Momentum, Conservation of Momentum)',
            'Gravitation (Universal Law, Free Fall, Mass, Weight, Thrust, Pressure, Archimedes Principle)',
            'Work and Energy (Work Done, Kinetic and Potential Energy, Law of Conservation of Energy)',
            'Sound (Production, Propagation, Speed, Reflection, Ultrasound, Human Ear)',
            'Improvement in Food Resources (Crop Varieties, Animal Husbandry)'
        ],
        10: [
            'Chemical Reactions and Equations (Types: Combination, Decomposition, Displacement, Redox)',
            'Acids, Bases and Salts (Properties, pH Scale, Important Compounds: Bleaching Powder, Plaster of Paris)',
            'Metals and Non-metals (Physical/Chemical Properties, Reactivity Series, Metallurgy, Corrosion)',
            'Carbon and its Compounds (Covalent Bonding, Homologous Series, Functional Groups, Soaps)',
            'Life Processes (Nutrition, Respiration, Transportation, Excretion in Plants & Animals)',
            'Control and Coordination (Tropic Movements, Plant Hormones, Human Nervous System, Endocrine)',
            'How do Organisms Reproduce (Asexual/Sexual Modes, Male/Female Reproductive Systems)',
            'Heredity and Evolution (Mendel’s Laws, Monohybrid/Dihybrid Cross, Sex Determination)',
            'Light: Reflection and Refraction (Mirrors, Lenses, Lens Formula, Magnification, Refractive Index)',
            'The Human Eye and the Colourful World (Defects of Vision, Dispersion, Atmospheric Refraction)',
            'Electricity (Ohm’s Law, Resistance in Series/Parallel, Joule’s Heating, Electric Power)',
            'Magnetic Effects of Electric Current (Field Lines, Solenoid, Fleming’s Left-Hand Rule, Motor)',
            'Our Environment (Trophic Levels, Ozone Depletion, Waste Management)'
        ],
        11: [
            'NSEP/INPhO Physics: Kinematics & Advanced Constrained Motion (Calculus & Relative Frames)',
            'NSEP/INPhO Physics: Newtonian Dynamics, Pseudo-Forces & Work-Energy Theorem',
            'NSEP/INPhO Physics: Rotational Dynamics & Moment of Inertia (Rolling Without Slipping, Angular Momentum)',
            'NSEP/INPhO Physics: Gravitation, Central Forces & Keplerian Orbital Mechanics',
            'NSEP/INPhO Physics: Fluid Dynamics & Surface Phenomena (Bernoulli, Torricelli, Capillary Ascent)',
            'NSEP/INPhO Physics: Oscillations, Coupled SHM & Wave Mechanics (Doppler Effect, Resonance)',
            'NSEP/INPhO Physics: Thermodynamics & Kinetic Theory (Carnot Cycle, Indicator Diagrams, Heat Conduction)',
            'NSEC/INChO Chemistry: Atomic Structure, Quantum Mechanics & Electronic Transitions',
            'NSEC/INChO Chemistry: Chemical Bonding, VSEPR, Hybridization & Molecular Orbital Theory',
            'NSEC/INChO Chemistry: Chemical Thermodynamics, Enthalpy, Entropy & Spontaneity (ΔG)',
            'NSEC/INChO Chemistry: Chemical & Ionic Equilibrium (Buffer Solutions, Solubility Product Ksp)',
            'NSEC/INChO Chemistry: Redox Titrations & Electrochemistry Principles',
            'NSEC/INChO Chemistry: Organic Reaction Mechanisms, Electronic Effects & Aromaticity',
            'NSEC/INChO Chemistry: Hydrocarbons (Electrophilic Addition, Free Radical Halogenation, Ozonolysis)',
            'NSEB/INBO Biology: Cell Biology & Cytoskeleton (Endomembrane System, Organelle Specialization)',
            'NSEB/INBO Biology: Biomolecules & Enzyme Kinetics (Michaelis-Menten Kinetics, Active Sites)',
            'NSEB/INBO Biology: Cell Cycle, Checkpoints & Chromosomal Mechanics (Mitosis & Meiosis)',
            'NSEB/INBO Biology: Plant Physiology (Photosystem Z-Scheme, Calvin & C4 Cycles, Photophosphorylation)',
            'NSEB/INBO Biology: Cellular Respiration (Glycolysis, Krebs Cycle, Chemiosmotic ATP Synthase)',
            'NSEB/INBO Biology: Human Physiology (Renal Counter-Current, Gas Transport Curves, Neural Action Potential)'
        ],
        12: [
            'Electric Charges and Fields (Coulomb’s Law, Gauss’s Theorem)',
            'Electrostatic Potential and Capacitance',
            'Current Electricity (Kirchhoff’s Laws, Potentiometer, Meter Bridge)',
            'Moving Charges and Magnetism (Biot-Savart Law, Ampere’s Circuital Law)',
            'Magnetism and Matter (Earth’s Magnetism, Magnetic Materials)',
            'Electromagnetic Induction (Faraday’s Law, Lenz’s Law) & Alternating Currents (LCR Circuit)',
            'Electromagnetic Waves & Ray Optics and Optical Instruments',
            'Wave Optics (Huygens’ Principle, Interference, Diffraction)',
            'Dual Nature of Radiation and Matter (Photoelectric Effect, de Broglie)',
            'Atoms and Nuclei (Bohr Model, Radioactivity, Nuclear Fission/Fusion)',
            'Semiconductor Electronics (p-n Junction, Diodes, Logic Gates)',
            'Solutions (Colligative Properties, Raoult’s Law) & Electrochemistry (Nernst Equation)',
            'Chemical Kinetics (Rate Law, Arrhenius Equation) & Coordination Compounds',
            'Haloalkanes, Alcohols, Phenols, Ethers, Aldehydes, Ketones, Carboxylic Acids & Amines',
            'Biomolecules (Carbohydrates, Proteins, Nucleic Acids)'
        ]
    },

    // ──────────── ENGLISH ────────────
    English: {
        1: [
            'Letters of the Alphabet & Vowels and Consonants',
            'Nouns: Naming Words for People, Places, Animals, Things',
            'One and Many (Singular and Plural with -s and -es)',
            'Pronouns: He, She, It, They, We, I',
            'Verbs: Action Words in Present Tense (am, is, are, doing words)',
            'Adjectives: Describing Words for Colors, Sizes, Numbers',
            'Prepositions: In, On, Under, Near, Behind',
            'Opposites & Word Association',
            'Picture Story Comprehension & Answering Simple Questions'
        ],
        2: [
            'Alphabetical Order & Dictionary Entry Basics',
            'Common and Proper Nouns & Gender (Masculine/Feminine)',
            'Singular and Plural (Irregular Plurals: children, feet, teeth)',
            'Articles: A, An, The',
            'Pronouns (Subject and Object: me, him, her, us)',
            'Verbs: Present and Past Actions (was, were, -ed words)',
            'Adjectives: Comparisons (tall, taller, tallest)',
            'Prepositions of Place and Time (at, in, on, over)',
            'Punctuation: Capital Letters, Full Stops, Question Marks',
            'Vocabulary, Synonyms, Antonyms & Picture Comprehension'
        ],
        3: [
            'Nouns (Collective Nouns, Possessive Nouns with Apostrophe)',
            'Pronouns (Demonstrative: this, that, these, those)',
            'Tenses: Simple Present, Simple Past, Simple Future',
            'Helping Verbs & Subject-Verb Agreement',
            'Adverbs of Manner, Time, and Place (ending in -ly)',
            'Conjunctions: And, But, Or, Because',
            'Homophones & Rhyming Words',
            'Prefixes and Suffixes (un-, re-, -ful, -less)',
            'Reading Comprehension (Extracting Information, Main Idea)',
            'Sentence Rearrangement & Para Jumbles'
        ],
        4: [
            'Abstract and Material Nouns',
            'Pronouns (Relative: who, which, that; Reflexive: myself, herself)',
            'Tenses: Present and Past Continuous Tenses',
            'Modal Verbs: Can, May, Must, Should',
            'Degrees of Comparison of Adjectives (irregular: good, better, best)',
            'Adverbs (Frequency and Degree: always, rarely, very)',
            'Prepositions of Movement and Direction (through, towards, into)',
            'Conjunctions: Although, Though, While, If',
            'Idioms, Proverbs & Common Collocations',
            'Reading Comprehension: Direct & Inferential Questions',
            'Spelling Rules & Compound Words'
        ],
        5: [
            'Types of Sentences: Declarative, Interrogative, Imperative, Exclamatory',
            'Subject and Predicate Identification',
            'Perfect Tenses: Present Perfect & Past Perfect',
            'Active and Passive Voice (Basic Conversions)',
            'Direct and Indirect Speech (Statements and Commands)',
            'Transitive and Intransitive Verbs',
            'Question Tags (is he?, aren’t they?)',
            'Synonyms, Antonyms, Analogies & One-Word Substitution',
            'Reading Comprehension: Narrative, Descriptive & Expository Passages',
            'Error Spotting in Sentences'
        ],
        6: [
            'Nouns: Countable/Uncountable, Quantifiers (much, many, few, little)',
            'Pronouns: Indefinite and Distributive Pronouns (each, either, neither, anyone)',
            'Detailed Tenses: All 12 Tenses in Context',
            'Modal Auxiliaries: Ought to, Need, Dare, Used to',
            'Non-Finite Verbs: Infinitives, Gerunds and Participles',
            'Prepositions and Phrasal Verbs (give up, look after, carry on)',
            'Clauses: Independent and Dependent Clauses',
            'Reported Speech: Reporting Questions and Exclamations',
            'Figures of Speech: Simile, Metaphor, Personification',
            'Critical Reading Comprehension (Tone, Vocabulary in Context)'
        ],
        7: [
            'Subject-Verb Agreement with Complex Subjects',
            'Conditionals: Zero, First, Second, and Third Conditionals',
            'Active and Passive Voice in Continuous and Perfect Tenses',
            'Reported Speech: Reporting Suggestions, Wishes, and Dialogue Transformation',
            'Connectors and Discourse Markers (however, furthermore, consequently)',
            'Relative Clauses (Defining and Non-defining)',
            'Collocations, Idiomatic Expressions, Phrasal Verbs',
            'Vocabulary: Etymology, Latin/Greek Roots, Synonyms/Antonyms',
            'Reading Comprehension: Analytical and Persuasive Passages',
            'Sentence Synthesis and Transformation of Sentences'
        ],
        8: [
            'Advanced Determiners and Quantifiers',
            'Subjunctive Mood & Inversion of Word Order for Emphasis',
            'Complex Sentence Structures & Reduction of Clauses',
            'Parallelism in Sentence Construction',
            'Modifiers: Misplaced and Dangling Modifiers',
            'Advanced Phrasal Verbs, Fixed Prepositions & Idioms',
            'Figures of Speech: Hyperbole, Alliteration, Oxymoron, Irony',
            'Analytical Reading: Fact vs Opinion, Tone, Author’s Purpose',
            'Text Completion, Cloze Tests & Para Jumbles',
            'Vocabulary: High-Frequency Academic Words'
        ],
        9: [
            'Advanced Syntax: Sentence Correction and Precision',
            'Nuances of Tenses & Aspect in Literature',
            'Complex Passive Constructions (Impersonal Passive)',
            'Ellipsis, Inversion and Emphasis',
            'Concord, Punctuation Nuances (Semicolons, Colons, Dashes, Hyphens)',
            'Critical Reasoning: Deductive and Inductive Arguments',
            'Vocabulary in Academic and Literary Contexts',
            'Reading Comprehension: Comparative and Multi-Paragraph Arguments',
            'Error Detection & Idiomatic Mastery'
        ],
        10: [
            'Mastery of Grammar: Cohesion and Coherence',
            'Transformations: Affirmative/Negative, Simple/Compound/Complex, Degrees',
            'Advanced Vocabulary: Contextual Clues, Homonyms, Paronyms',
            'Idiomatic Expressions, Foreign Words & Phrases in English',
            'Literary Devices: Allegory, Symbolism, Satire, Foreshadowing',
            'Reading Comprehension: Complex Expository and Philosophical Passages',
            'Synthesis of Ideas, Summarization & Paraphrasing Accuracy',
            'Verbal Analogies, Logical Deductions & Para Summary'
        ],
        11: [
            'Advanced Rhetorical Structures and Discourse Analysis',
            'Sentence Variety and Stylistic Inversion',
            'Tone, Stance, Mood, and Perspective Identification',
            'Vocabulary: High-Level Academic and Technical Lexicon',
            'Synthesizing Multiple Texts & Data Inferences',
            'Logical Fallacies in Argumentative Text',
            'Sentence Completion with Subtle Differentiations',
            'Advanced Critical Reading & Semantic Analysis'
        ],
        12: [
            'Mastery of Academic and Professional English',
            'Discourse Markers, Rhetorical Devices & Stylistics',
            'Contextual Inference in Dense Literary and Scholarly Texts',
            'Nuanced Vocabulary: Connotation, Register, and Precision',
            'Advanced Sentence Correction & Syntactical Purity',
            'Critical Reasoning & Evaluating Evidence in Passages',
            'Abstract Comprehension: Epistemological, Scientific and Cultural Essays',
            'Verbal Aptitude & Verbal Reasoning Olympiad Standards'
        ]
    }
};

/**
 * Returns topics for given class and subject.
 */
export function getTopicsForClassAndSubject(classGrade, subject) {
    const classNum = Number(classGrade);
    const subj = String(subject).charAt(0).toUpperCase() + String(subject).slice(1).toLowerCase();
    return OLYMPIAD_SYLLABUS[subj]?.[classNum] || [];
}


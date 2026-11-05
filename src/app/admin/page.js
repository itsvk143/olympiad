'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import styles from './page.module.css';
import { olympiadTests } from '../../data/exams/olympiad';
import { OLYMPIAD_SYLLABUS } from '../../data/exams/olympiadSyllabus';

import dynamic from 'next/dynamic';
const LatexRenderer = dynamic(() => import('../../components/LatexRenderer'), { ssr: false });
import TestManager from './TestManager';
import TestMappingPanel from './TestMappingPanel';
import QuestionMappingModal, { normalizeDifficulty } from './QuestionMappingModal';
import { normalizeQuestion } from '../../lib/questionFormatter';
import AdminReportedQuestions from '../../components/AdminReportedQuestions';
import AdminTestAudit from '../../components/AdminTestAudit';

export const LEGACY_UMBRELLAS = new Set([
    'diversity in living world',
    'genetics and evolution',
    'ecology and environment',
    'plant physiology',
    'cell structure and function',
    'reproduction in plants',
    'human physiology',
    'reproduction',
    'biology and human welfare',
    'structural organisation in animals and plants'
]);

export const EXCLUDED_NEET_CHAPTERS = new Set([
    'digestion and absorption',
    'transport in plants',
    'reproduction in organisms',
    'mineral nutrition',
    'environmental issues'
]);

// Hardcoded map: exact chapter name (as used in dropdown) → subtopics
// Covers Physics, Chemistry, Mathematics, Botany, Zoology
// Comprehensive static chapter map strictly aligned with NTA NEET & JEE Mains 2027 Syllabus (74 chapters)
export const STATIC_CHAPTER_MAP = {
    Physics: [
        "Physics and Measurement", "Kinematics", "Laws of Motion", "Work, Energy, and Power",
        "Rotational Motion", "Gravitation", "Properties of Solids and Liquids", "Thermodynamics",
        "Kinetic Theory of Gases", "Oscillations and Waves", "Electrostatics", "Current Electricity",
        "Magnetic Effects of Current and Magnetism", "Electromagnetic Induction and Alternating Currents",
        "Electromagnetic Waves", "Optics", "Dual Nature of Matter and Radiation", "Atoms and Nuclei",
        "Electronic Devices", "Experimental Skills"
    ],
    Chemistry: [
        "Some Basic Concepts in Chemistry", "Atomic Structure", "Chemical Bonding and Molecular Structure",
        "Chemical Thermodynamics", "Solutions", "Equilibrium", "Redox Reactions and Electrochemistry",
        "Chemical Kinetics", "Classification of Elements and Periodicity in Properties", "P-Block Elements",
        "d and f- Block Elements", "Co-ordination Compounds", "Purification and Characterisation of Organic Compounds",
        "Some Basic Principles of Organic Chemistry", "Organic Reaction Mechanism", "Hydrocarbons", "Organic Compounds Containing Halogens",
        "Organic Compounds Containing Oxygen", "Organic Compounds Containing Nitrogen", "Biomolecules",
        "Principles Related to Practical Chemistry"
    ],
    Mathematics: [
        "Sets, Relations, and Functions", "Complex Numbers", "Quadratic Equations", "Sequences & Series",
        "Permutations & Combinations", "Binomial Theorem", "Straight Lines", "Circles",
        "Conic Sections (Parabola, Ellipse, Hyperbola)", "Trigonometric Identities",
        "Inverse Trigonometric Functions", "Matrices & Determinants", "Limits, Continuity & Differentiability",
        "Application of Derivatives", "Integrals", "Differential Equations", "Areas", "Vectors",
        "3D Geometry", "Probability", "Linear Programming", "Statistics"
    ],
    Botany: [
        "The Living World", "Biological Classification", "Plant Kingdom",
        "Morphology of Flowering Plants", "Anatomy of Flowering Plants",
        "Cell: The Unit of Life", "Cell Cycle and Cell Division",
        "Photosynthesis in Higher Plants", "Respiration in Plants",
        "Plant Growth and Development", "Sexual Reproduction in Flowering Plants",
        "Principles of Inheritance and Variation", "Molecular Basis of Inheritance",
        "Microbes in Human Welfare", "Organisms and Populations",
        "Ecosystem", "Biodiversity and Conservation"
    ],
    Zoology: [
        "Animal Kingdom", "Structural Organisation in Animals", "Biomolecules",
        "Breathing and Exchange of Gases", "Body Fluids and Circulation",
        "Excretory Products and their Elimination", "Locomotion and Movement",
        "Neural Control and Coordination", "Chemical Coordination and Integration",
        "Human Reproduction", "Reproductive Health", "Evolution",
        "Human Health and Disease", "Biotechnology: Principles and Processes",
        "Biotechnology and Its Applications"
    ],
    Biology: [
        "The Living World", "Biological Classification", "Plant Kingdom",
        "Morphology of Flowering Plants", "Anatomy of Flowering Plants",
        "Cell: The Unit of Life", "Cell Cycle and Cell Division",
        "Photosynthesis in Higher Plants", "Respiration in Plants",
        "Plant Growth and Development", "Sexual Reproduction in Flowering Plants",
        "Principles of Inheritance and Variation", "Molecular Basis of Inheritance",
        "Microbes in Human Welfare", "Organisms and Populations",
        "Ecosystem", "Biodiversity and Conservation",
        "Animal Kingdom", "Structural Organisation in Animals", "Biomolecules",
        "Breathing and Exchange of Gases", "Body Fluids and Circulation",
        "Excretory Products and their Elimination", "Locomotion and Movement",
        "Neural Control and Coordination", "Chemical Coordination and Integration",
        "Human Reproduction", "Reproductive Health", "Evolution",
        "Human Health and Disease", "Biotechnology: Principles and Processes",
        "Biotechnology and Its Applications"
    ],
    'English Proficiency': [
        "Vocabulary", "Grammar", "Sentence Skills", "Reading Comprehension"
    ],
    'Logical Reasoning': [
        "Verbal Reasoning", "Non-Verbal Reasoning", "Analytical Reasoning"
    ]
};

// Hardcoded map: exact chapter name (as used in dropdown) → subtopics
// Strictly filtered: Contains ONLY topics under the active NEET & JEE Mains 2027 syllabi (74 chapters, 483 subtopics)
export const CHAPTER_SUBTOPICS = {
    // ── PHYSICS (100% NEET / JEE 2027 Compliant) ────────────────
    'Physics and Measurement': [
        'Units and dimensions', 'Error analysis', 'Significant figures',
        'Dimensional analysis and applications', 'Least count and precision'
    ],
    'Kinematics': [
        'Motion in a straight line/plane', 'Projectile motion', 'Relative velocity', 'Uniform circular motion',
        'Uniformly accelerated motion and equations', 'Graphical analysis of motion (x-t, v-t graphs)'
    ],
    'Laws of Motion': [
        "Newton's laws", 'Impulse', 'Conservation of momentum', 'Friction', 'Banking of roads',
        'Connected motion and pulley problems', 'Equilibrium of concurrent forces'
    ],
    'Work, Energy, and Power': [
        'Work-energy theorem', 'Kinetic/potential energy', 'Elastic and inelastic collisions',
        'Conservation of mechanical energy', 'Power and variable force', 'Vertical circular motion'
    ],
    'Rotational Motion': [
        'Center of mass', 'Torque', 'Angular momentum conservation', 'Moment of inertia',
        'Theorems of parallel and perpendicular axes'
    ],
    'Gravitation': [
        "Kepler's laws", "Newton's law of gravitation", 'Gravitational potential energy', 'Escape velocity',
        'Acceleration due to gravity (variation with height, depth, latitude)', 'Orbital velocity and satellite motion'
    ],
    'Properties of Solids and Liquids': [
        "Elasticity (Hooke's law, Young's modulus)", "Fluid mechanics (Pascal's law, Bernoulli's principle, viscosity)",
        'Surface tension, surface energy, and capillarity', 'Thermal expansion and calorimetry',
        "Stefan's law of radiation"
    ],
    'Thermodynamics': [
        'Thermal equilibrium', 'Laws of thermodynamics (zeroth, first, second)',
        'Isothermal and adiabatic processes', 'Work done in thermodynamic processes'
    ],
    'Kinetic Theory of Gases': [
        'Equation of state', 'Kinetic interpretation of temperature', 'Degrees of freedom',
        'Law of equipartition of energy', 'Mean free path and molecular speeds (rms, average, most probable)'
    ],
    'Oscillations and Waves': [
        'Simple Harmonic Motion (SHM)', 'Wave motion', 'Superposition of waves',
        'Standing waves in strings and organ pipes', 'Beats'
    ],
    'Electrostatics': [
        "Coulomb's law", 'Electric field/flux', "Gauss's law", 'Potential energy', 'Capacitors', 'Dielectrics',
        'Electric dipole and dipole moment', 'Equipotential surfaces', 'Combination of capacitors and energy stored'
    ],
    'Current Electricity': [
        "Ohm's law", "Kirchhoff's laws", 'Meter bridge', 'Wheatstone bridge', 'Resistivity',
        'Drift velocity and mobility', 'Internal resistance of a cell and EMF', 'Electrical energy and power'
    ],
    'Magnetic Effects of Current and Magnetism': [
        'Lorentz force', "Ampere's law", 'Magnetic field calculation',
        'Biot-Savart law and applications', 'Force between two parallel currents',
        'Moving coil galvanometer and conversion to ammeter/voltmeter',
        'Magnetic properties (dia, para, ferromagnetism)'
    ],
    'Electromagnetic Induction and Alternating Currents': [
        "Faraday's law", "Lenz's law", 'AC circuits', 'RMS values',
        'Self and mutual inductance', 'LC oscillations', 'Transformers and AC generator'
    ],
    'Electromagnetic Waves': [
        'Displacement current', 'EM spectrum', 'Transverse nature of EM waves',
        'Energy density and Poynting vector'
    ],
    'Optics': [
        'Reflection/refraction', 'Lens formula', 'Optical instruments (microscope, telescope)',
        'Interference', 'Diffraction', "Young's double-slit experiment",
        'Total internal reflection and prisms', 'Mirror formula and combination of lenses',
        'Polarization of light (Brewster\'s law)'
    ],
    'Dual Nature of Matter and Radiation': [
        'Photoelectric effect', 'de Broglie wavelength', "Bohr's model", 'Wave-particle duality',
        "Einstein's photoelectric equation and work function"
    ],
    'Atoms and Nuclei': [
        'Atomic models', 'Nuclear reactions', 'Binding energy', 'Nuclear fission and fusion',
        "Rutherford's scattering and Bohr's quantization", 'Hydrogen spectrum and Rydberg formula', 'Mass defect and nuclear force'
    ],
    'Electronic Devices': [
        'Energy bands', 'Intrinsic/extrinsic semiconductors', 'Diodes', 'Logic gates',
        'p-n junction diode applications (rectifiers, Zener diode)', 'Solar cell, photodiode, and LED'
    ],
    'Experimental Skills': [
        'Vernier calipers', 'Screw gauge', 'Simple pendulum', 'Meter bridge',
        'Focal length of concave mirror and convex lens', "Resistance of wire using Ohm's law"
    ],

    // ── CHEMISTRY (100% NEET / JEE 2027 Compliant) ──────────────
    'Some Basic Concepts in Chemistry': [
        'Mole concept', 'Molar mass', 'Empirical/molecular formula', 'Stoichiometry',
        'Percentage composition and limiting reagent', 'Concentration terms (molarity, molality, normality, mole fraction)'
    ],
    'Atomic Structure': [
        "Bohr's model", 'Quantum mechanical model', 'Electronic configuration', 'Quantum numbers', 'Orbital shapes',
        'Dual nature of matter and de Broglie equation', 'Heisenberg uncertainty principle',
        "Aufbau principle, Pauli exclusion principle, Hund's rule"
    ],
    'Chemical Bonding and Molecular Structure': [
        'VSEPR theory', 'Hybridization', 'Molecular orbital theory', 'Ionic and covalent bonds', 'Polarity',
        'Dipole moment and hydrogen bonding', 'Resonance and formal charge'
    ],
    'Chemical Thermodynamics': [
        'First law of thermodynamics', 'Enthalpy (ΔH)', 'Entropy (ΔS)', 'Gibbs free energy (ΔG)', 'Spontaneity',
        "Hess's law of constant heat summation", 'Work done in isothermal and adiabatic expansions',
        'Heat capacity (Cp, Cv) and relation Cp - Cv = R'
    ],
    'Solutions': [
        'Concentration terms', "Raoult's law", 'Ideal/non-ideal solutions', 'Colligative properties',
        "Henry's law and solubility of gases", "Van 't Hoff factor and abnormal molar mass", 'Osmotic pressure and reverse osmosis'
    ],
    'Equilibrium': [
        'Chemical equilibrium', "Le Chatelier's principle", 'Ionic equilibrium', 'pH', 'Buffer solutions',
        'Law of chemical equilibrium and equilibrium constants (Kp, Kc)', 'Solubility product (Ksp) and common ion effect',
        'Hydrolysis of salts and acid-base concepts (Arrhenius, Bronsted, Lewis)'
    ],
    'Redox Reactions and Electrochemistry': [
        'Oxidation number', 'Balancing redox reactions', 'Electrochemical cells', 'Nernst equation', 'Conductivity',
        "Kohlrausch's law and molar conductivity", "Faraday's laws of electrolysis", 'Batteries, fuel cells, and corrosion'
    ],
    'Chemical Kinetics': [
        'Rate of reaction', 'Rate law', 'Arrhenius equation', 'Catalysis', 'Order of reaction',
        'Integrated rate equations (zero and first order)', 'Half-life and activation energy', 'Collision theory of reactions'
    ],
    'Classification of Elements and Periodicity in Properties': [
        'Trends in periodic properties', 'Ionization enthalpy', 'Electronegativity', 'Atomic radius',
        'Electron gain enthalpy', 'Modern periodic law and periodic table blocks (s, p, d, f)'
    ],
    'P-Block Elements': [
        'Group 13 to Group 18 electronic configuration', 'Trends in physical and chemical properties',
        'Inert pair effect and allotropy', 'Oxoacids of phosphorus, sulfur, and halogens',
        'Interhalogen compounds and noble gas compounds'
    ],
    'd and f- Block Elements': [
        'Transition elements', 'Lanthanides', 'Actinoids', 'Alloys', 'Complex compounds',
        'Variable oxidation states and catalytic properties', 'Magnetic properties and color of transition ions',
        'Lanthanoid contraction and consequences'
    ],
    'Co-ordination Compounds': [
        "Werner's theory", 'IUPAC nomenclature', 'Bonding in coordination compounds', 'Isomerism',
        'Valence bond theory (VBT)', 'Crystal field theory (CFT) and orbital splitting',
        'Stability and biological importance of coordination compounds'
    ],
    'Purification and Characterisation of Organic Compounds': [
        'Purification techniques', 'Qualitative analysis', 'Quantitative analysis',
        'Chromatography (TLC, column chromatography)', 'Calculations of empirical and molecular formulas'
    ],
    'Some Basic Principles of Organic Chemistry': [
        'Nomenclature', 'Isomerism', 'Electronic effect', 'Acidic strength', 'Reaction mechanisms',
        'Inductive, electromeric, resonance, and hyperconjugation effects',
        'Carbocations, carbanions, and free radicals stability',
        'Types of organic reactions (substitution, addition, elimination, rearrangement)'
    ],
    'Organic Reaction Mechanism': [
        'Carbocation rearrangements and shifts',
        'Nucleophilic substitution (SN1, SN2, SNi)',
        'Elimination mechanisms (E1, E2, E1cb)',
        'Electrophilic addition to alkenes and alkynes',
        'Electrophilic aromatic substitution (EAS)',
        'Nucleophilic addition to carbonyls and condensations',
        'Free radical mechanisms and peroxide effect',
        'Aromaticity and intermediate stability'
    ],
    'Hydrocarbons': [
        'Alkanes', 'Alkenes', 'Alkynes', 'Aromatic hydrocarbons', 'Conformations',
        "Electrophilic addition and Markovnikov's rule", 'Ozonolysis and oxidation of alkenes',
        'Electrophilic aromatic substitution (nitration, halogenation, Friedel-Crafts)'
    ],
    'Organic Compounds Containing Halogens': [
        'Nomenclature', 'Nature of C–X bond', 'Mechanism of substitution', 'Haloalkanes', 'Haloarenes',
        'SN1 and SN2 reaction mechanisms and stereochemistry', "Elimination reactions (Saytzeff's rule)",
        'Polyhalogen compounds (chloroform, iodoform, DDT, Freons)'
    ],
    'Organic Compounds Containing Oxygen': [
        'Alcohols', 'Phenols', 'Ethers', 'Aldehydes', 'Ketones', 'Carboxylic acids',
        'Lucas test and oxidation of alcohols', "Reimer-Tiemann and Kolbe's reactions of phenols",
        'Nucleophilic addition reactions of carbonyls (aldol, Cannizzaro)', 'Acidic nature and reactions of carboxylic acids'
    ],
    'Organic Compounds Containing Nitrogen': [
        'Amines', 'Diazonium salts', 'Cyanides', 'Isocyanides',
        'Basicity of amines (gas phase vs aqueous phase)',
        'Gabriel phthalimide synthesis and Hoffmann bromamide degradation',
        'Coupling reactions and synthetic uses of diazonium salts'
    ],
    'Biomolecules': [
        'Carbohydrates', 'Proteins', 'Nucleic acids', 'Vitamins', 'Enzymes', 'Hormones',
        'Monosaccharides (glucose and fructose structures)', 'Primary, secondary, tertiary, and quaternary protein structures',
        'DNA and RNA structures'
    ],
    'Principles Related to Practical Chemistry': [
        'Detection of elements', 'Qualitative analysis', 'Purification methods', 'Preparation of compounds',
        'Salt analysis (cation and anion systematic detection)', 'Volumetric titration (acid-base and redox titration)'
    ],

    // ── MATHEMATICS (100% JEE Mains 2027 Compliant) ─────────────
    'Sets, Relations, and Functions': [
        'Sets, subsets, power set, and Venn diagrams', 'Set operations (union, intersection, difference, complement)',
        'Types of relations (reflexive, symmetric, transitive, equivalence)', 'Functions (domain, codomain, range)',
        'Types of functions (one-one, onto, composite, invertible)'
    ],
    'Complex Numbers': [
        'Modulus and argument', 'Square roots', 'Triangle inequality', 'Argand plane',
        "Euler's form and rotation of complex numbers", 'Geometry in complex plane (circle, line equations)'
    ],
    'Quadratic Equations': [
        'Nature of roots', 'Discriminant', 'Sum and product of roots', 'Quadratic inequalities', 'Roots of polynomial',
        'Common roots of two quadratic equations', 'Location of roots', 'Maximum and minimum values of quadratic expressions'
    ],
    'Sequences & Series': [
        'Arithmetic Progression', 'Geometric Progression',
        'Insertion of AM and GM', 'General term and sum of AP and GP', 'Infinite geometric series'
    ],
    'Permutations & Combinations': [
        'Fundamental principles', 'Linear permutations', 'Circular permutations', 'Combinations',
        'Permutations of objects not all distinct', 'Division into groups and distribution',
        'Derangements and grid/distribution problems'
    ],
    'Binomial Theorem': [
        'General term', 'Middle term', 'Coefficient estimation', 'Binomial identities',
        'Sum of binomial coefficients and series'
    ],
    'Straight Lines': [
        'Slope and intercept forms', 'Perpendicular distance', 'Angle between lines', 'Concurrent lines',
        'Family of lines and angular bisectors', 'Distance between parallel lines'
    ],
    'Circles': [
        'Standard equation', 'General equation of circle', 'Chord of contact', 'Circle through three points',
        'Parametric equation of circle', 'Director circle and chord with given midpoint'
    ],
    'Conic Sections (Parabola, Ellipse, Hyperbola)': [
        'Standard forms of parabola', 'Ellipse equations', 'Hyperbola equations',
        'Focal properties and eccentricity of conics', 'Directrix and focus equations',
        'Rectangular hyperbola and asymptotes'
    ],
    'Trigonometric Identities': [
        'Multiple and sub-multiple angles', 'Trigonometric equations and general solutions',
        'Maximum and minimum values of trigonometric expressions'
    ],
    'Inverse Trigonometric Functions': [
        'Principal values', 'Properties of inverse trig functions', 'Equations involving inverse trig functions',
        'Domain and range of inverse trigonometric functions', 'Sum and difference formulas for inverse trig functions'
    ],
    'Matrices & Determinants': [
        'Types of matrices', 'Adjoint and inverse', 'Solution of linear equations', "Cramer's rule",
        'Properties of determinants', 'System of linear equations (consistency and rank)',
        'Orthogonal, symmetric, and skew-symmetric matrices'
    ],
    'Limits, Continuity & Differentiability': [
        "L'Hospital rule", 'Derivative as a rate of change',
        'Standard limits and evaluation of indeterminate forms', 'Continuity of functions at a point and in an interval',
        'Differentiability and differentiation rules'
    ],
    'Application of Derivatives': [
        'Maxima and minima', 'Rate of change', 'Increasing and decreasing functions',
        'Points of inflection and concavity', 'Monotonicity of functions', 'Optimization problems'
    ],
    'Integrals': [
        'Fundamental theorem of calculus', 'Integration by parts', 'Definite integrals', 'Properties of definite integrals',
        'Integration by substitution and algebraic fractions', 'Trigonometric and irrational integrals',
        'Leibniz rule (differentiation under integral sign)'
    ],
    'Differential Equations': [
        'Order and degree', 'Separation of variables', 'Linear differential equations', 'Homogeneous equations',
        'Exact differential equations and integrating factors', 'Formation of differential equations'
    ],
    'Areas': [
        'Area under a curve', 'Area between two curves',
        'Area bounded by parabolas, circles, and lines', 'Symmetrical areas and piecewise integrations'
    ],
    'Vectors': [
        'Scalar and vector products', 'Position vectors',
        'Collinearity and coplanarity of vectors', 'Section formula and projection of vectors',
        'Vector addition and unit vectors'
    ],
    '3D Geometry': [
        'Direction cosines and ratios', 'Vector and Cartesian equations of lines',
        'Angle between two lines', 'Shortest distance between two skew lines', 'Distance between parallel lines'
    ],
    'Probability': [
        'Conditional probability', 'Independent events', "Bayes' theorem", 'Probability distribution',
        'Total probability theorem', 'Random variables, expectation, and variance', 'Geometric probability and odds'
    ],
    'Statistics': [
        'Mean, median, mode', 'Standard deviation', 'Variance',
        'Mean deviation about mean and median', 'Coefficient of variation and grouped frequency distributions'
    ],

    // ── BOTANY (17 Active Chapters) ─────────────────────────
    'The Living World': [
        'What is Living & Taxonomy', 'Taxonomic Categories & Hierarchy', 'Taxonomical Aids', 'Binomial nomenclature'
    ],
    'Biological Classification': [
        'Five Kingdom Classification', 'Kingdom Monera', 'Kingdom Protista', 'Kingdom Fungi',
        'Viruses, viroids, prions, and lichens', 'Five kingdom classification system'
    ],
    'Plant Kingdom': [
        'Algae', 'Bryophytes', 'Pteridophytes', 'Gymnosperms', 'Angiosperms',
        'Plant Life Cycles & Alternation of Generations'
    ],
    'Morphology of Flowering Plants': [
        'Root, Stem and Leaf Modifications', 'Inflorescence and Flower Structure',
        'Placentation, Fruit and Seed', 'Plant Families (Fabaceae, Solanaceae, Liliaceae)'
    ],
    'Anatomy of Flowering Plants': [
        'Meristematic and Permanent Tissues', 'Tissue Systems', 'Internal Structure of Root and Stem',
        'Anatomy of Leaf & Secondary Growth'
    ],
    'Cell: The Unit of Life': [
        'Prokaryotic Cell Structure', 'Plasma Membrane & Cell Wall', 'Endomembrane System',
        'Mitochondria, Plastids and Ribosomes', 'Nucleus and Chromosomes', 'Cell organelles', 'Cell membrane and fluid mosaic model'
    ],
    'Cell Cycle and Cell Division': [
        'Cell Cycle Stages (G1, S, G2)', 'Mitosis and Cytokinesis', 'Meiosis I Stages',
        'Meiosis II & Significance', 'Cell life & division', 'Cell cycle regulation and checkpoints'
    ],
    'Photosynthesis in Higher Plants': [
        'Photosynthetic Pigments', 'Light Reaction & Photophosphorylation', 'Calvin Cycle (C3 Pathway)',
        'Hatch-Slack Pathway (C4 Pathway)', 'Photorespiration & Factors', 'Light reaction and Calvin cycle (C3 and C4 pathways)'
    ],
    'Respiration in Plants': [
        'Glycolysis (EMP Pathway)', 'Fermentation', 'TCA Cycle (Krebs Cycle)',
        'ETS and Oxidative Phosphorylation', 'Respiratory Quotient (RQ)', 'Glycolysis, Krebs cycle, and oxidative phosphorylation'
    ],
    'Plant Growth and Development': [
        'Phases of Growth', 'Plant Growth Regulators (Auxin, GA, CK)', 'Plant Growth Inhibitors (Ethylene, ABA)',
        'Photoperiodism & Vernalization', 'Plant hormones', 'Photoperiodism, vernalization, and seed dormancy'
    ],
    'Sexual Reproduction in Flowering Plants': [
        'Microsporogenesis & Pollen', 'Megasporogenesis & Embryo Sac', 'Pollination & Outbreeding Devices',
        'Double Fertilization & Triple Fusion', 'Endosperm, Embryo & Seed Development', 'Apomixis and Polyembryony',
        'Structure of flower and gametophyte development', 'Pollination mechanisms and outbreeding devices'
    ],
    'Principles of Inheritance and Variation': [
        "Mendel's Laws of Inheritance", 'Incomplete Dominance & Codominance', 'Chromosomal Theory of Inheritance',
        'Linkage and Genetic Recombination', 'Sex Determination & Mutations', 'Genetic Disorders',
        'Principles of Inheritance', 'Mendelian genetics, monohybrid, and dihybrid crosses', 'Linkage, crossing over, and chromosome mapping'
    ],
    'Molecular Basis of Inheritance': [
        'DNA Structure and Packaging', 'DNA Replication', 'Transcription & RNA Processing',
        'Genetic Code & Translation', 'Regulation of Gene Expression (Lac Operon)', 'Human Genome Project & DNA Fingerprinting',
        'Molecular Basis of Inheritance', 'Gene expression'
    ],
    'Microbes in Human Welfare': [
        'Microbes in Household & Industrial Products', 'Microbes in Sewage Treatment & Biogas',
        'Microbes as Biocontrol Agents & Biofertilizers', 'Microbes in human welfare', 'Microbes in sewage treatment, biogas production, and biocontrol'
    ],
    'Organisms and Populations': [
        'Organism and Abiotic Factors / Adaptations', 'Population Growth & Attributes', 'Population Interactions',
        'Organisms and Populations', 'Population interactions (mutualism, competition, predation, parasitism)'
    ],
    'Ecosystem': [
        'Ecosystem Structure & Productivity', 'Energy Flow & Decomposition', 'Ecological Pyramids',
        'Ecological Succession & Nutrient Cycling', 'Ecosystem Structure', 'Ecological pyramids'
    ],
    'Biodiversity and Conservation': [
        'Patterns and Levels of Biodiversity', 'Loss of Biodiversity & Causes', 'In-situ and Ex-situ Conservation Strategies',
        'Biodiversity & Conservation', 'In-situ and ex-situ conservation methods'
    ],

    // ── ZOOLOGY (15 Active Chapters) ────────────────────────
    'Animal Kingdom': [
        'Basis of animal classification (levels of organization, symmetry, germ layers, coelom)',
        'Non-chordates (Porifera to Hemichordata characteristics)',
        'Chordata (Protochordata, Cyclostomata, Chondrichthyes, Osteichthyes)',
        'Tetrapoda (Amphibia, Reptilia, Aves, Mammalia)'
    ],
    'Structural Organisation in Animals': [
        'Epithelial Tissue & Junctions', 'Connective Tissue (Bone, Cartilage, Blood)',
        'Muscular and Nervous Tissues', 'Cockroach & Frog Anatomy',
        'Animal tissues', 'Cockroach anatomy and morphology', 'Frog morphology and anatomy',
        'Epithelial, connective, muscular, and neural tissues in animals'
    ],
    'Biomolecules': [
        'Primary and Secondary Metabolites', 'Carbohydrates & Lipids',
        'Proteins Structure & Nucleic Acids', 'Enzymes Properties, Mechanism & Inhibition',
        'Biomolecules'
    ],
    'Breathing and Exchange of Gases': [
        'Respiratory System Anatomy', 'Mechanism of Breathing & Respiratory Volumes',
        'Gas Exchange and Transport (O2 & CO2)', 'Regulation of Respiration & Disorders',
        'Breathing & Exchange of Gases', 'Mechanism of breathing and gas transport (O2-Hb dissociation curve)'
    ],
    'Body Fluids and Circulation': [
        'Blood Composition, Groups (ABO, Rh)', 'Human Heart Anatomy & Cardiac Cycle',
        'ECG & Double Circulation', 'Circulatory System Disorders',
        'Body Fluids & Circulation', 'Cardiac cycle, ECG, and blood grouping (ABO and Rh)'
    ],
    'Excretory Products and their Elimination': [
        'Human Excretory System Anatomy', 'Nephron Structure & Urine Formation',
        'Counter-Current Mechanism', 'Regulation of Kidney Function (RAAS, ADH)',
        'Excretory Disorders & Dialysis', 'Excretory Products & Elimination', 'Nephron structure and counter-current mechanism'
    ],
    'Locomotion and Movement': [
        'Types of Movement & Muscle Structure', 'Mechanism of Muscle Contraction (Sliding Filament)',
        'Human Skeletal System (Axial & Appendicular)', 'Joints Types & Locomotory Disorders',
        'Locomotion & Movement'
    ],
    'Neural Control and Coordination': [
        'Neuron Structure & Nerve Impulse Conduction', 'Synaptic Transmission',
        'Central Nervous System (Brain & Spinal Cord)', 'Reflex Action & Sense Organs',
        'Neural Control & Coordination', 'Conduction of nerve impulse and reflex action'
    ],
    'Chemical Coordination and Integration': [
        'Endocrine Glands & Hormone Mechanism', 'Hypothalamus and Pituitary Hormones',
        'Thyroid, Parathyroid, Adrenal, Pancreas', 'Gonadal Hormones & Endocrine Disorders',
        'Chemical Coordination & Integration', 'Endocrine glands and hormones action'
    ],
    'Human Reproduction': [
        'Male Reproductive System', 'Female Reproductive System', 'Gametogenesis (Spermatogenesis & Oogenesis)',
        'Menstrual Cycle & Hormones', 'Fertilization, Implantation & Embryonic Development', 'Parturition and Lactation',
        'Human reproduction', 'Spermatogenesis, oogenesis, and hormonal regulation', 'Menstrual cycle phases'
    ],
    'Reproductive Health': [
        'Reproductive Health & Population Control', 'Contraceptive Methods',
        'Medical Termination of Pregnancy (MTP) & STIs', 'Infertility and Assisted Reproductive Technologies (ART)',
        'Reproductive health', 'Contraception methods and Assisted Reproductive Technologies (ART: IVF, ZIFT, GIFT)'
    ],
    'Evolution': [
        'Origin of Life Theories', 'Evidences of Evolution (Homology, Analogy)',
        'Theories of Evolution (Darwinism, Mutation)', 'Hardy-Weinberg Principle & Speciation', 'Human Evolution',
        'Origin of life and biochemical evolution (Miller-Urey experiment)', 'Adaptive radiation and Speciation'
    ],
    'Human Health and Disease': [
        'Common Infectious Diseases in Humans', 'Innate and Acquired Immunity & Antibodies',
        'AIDS and HIV Pathogenesis', 'Cancer Types, Causes and Treatment', 'Drugs and Alcohol Abuse',
        'Common diseases', 'Immunity', 'Cancer', 'Drug abuse'
    ],
    'Biotechnology: Principles and Processes': [
        'Genetic Engineering & Recombinant DNA', 'Tools of r-DNA (Restriction Enzymes, Vectors)',
        'Processes of r-DNA (PCR Amplification, Ligation)', 'Bioreactors and Downstream Processing',
        'Principles & Processes', 'Recombinant DNA technology', 'Polymerase Chain Reaction (PCR) and gel electrophoresis'
    ],
    'Biotechnology and Its Applications': [
        'Biotechnology in Agriculture (Bt Crops, RNAi)', 'Biotechnology in Medicine (Insulin, Gene Therapy)',
        'Molecular Diagnostics (PCR, ELISA)', 'Transgenic Animals & Ethical Issues',
        'Applications in medicine', 'Applications in agriculture', 'Transgenic animals, genetically modified crops (Bt crops), and gene therapy'
    ],

    // ── LEGACY UNIT SYNONYMS (Preserved for backward-compatibility with older tests) ──
    'Diversity in Living World': [
        'Biological Classification', 'Plant Kingdom', 'Algae', 'Bryophytes', 'Pteridophytes', 'Gymnosperms', 'Angiosperms',
        'Five kingdom classification system', 'Viruses, viroids, prions, and lichens'
    ],
    'Plant Physiology': [
        'Photosynthesis', 'Respiration', 'Growth & Development', 'Plant hormones',
        'Light reaction and Calvin cycle (C3 and C4 pathways)', 'Glycolysis, Krebs cycle, and oxidative phosphorylation',
        'Photoperiodism, vernalization, and seed dormancy'
    ],
    'Cell Structure and Function': [
        'Cell life & division', 'Biomolecules', 'Cell organelles', 'Mitosis', 'Meiosis',
        'Prokaryotic and eukaryotic cell ultrastructure', 'Cell membrane and fluid mosaic model',
        'Cell cycle regulation and checkpoints'
    ],
    'Genetics and Evolution': [
        'Principles of Inheritance', 'Molecular Basis of Inheritance', 'DNA replication', 'Gene expression', 'Mutations',
        'Mendelian genetics, monohybrid, and dihybrid crosses', 'Linkage, crossing over, and chromosome mapping',
        'Transcription, genetic code, and translation'
    ],
    'Ecology and Environment': [
        'Organisms and Populations', 'Ecosystem Structure', 'Biodiversity & Conservation', 'Ecological pyramids',
        'Population interactions (mutualism, competition, predation, parasitism)',
        'Ecological succession and nutrient cycling (carbon and phosphorus)', 'In-situ and ex-situ conservation methods'
    ],
    'Reproduction in Plants': [
        'Structure of flower and gametophyte development', 'Pollination mechanisms and outbreeding devices',
        'Double fertilization and triple fusion', 'Development of endosperm, embryo, and seed',
        'Apomixis and polyembryony'
    ],
    'Structural Organisation in Animals and Plants': [
        'Animal tissues', 'Cockroach anatomy and morphology', 'Frog morphology and anatomy',
        'Morphology of flowering plants', 'Anatomy of flowering plants',
        'Epithelial, connective, muscular, and neural tissues in animals'
    ],
    'Human Physiology': [
        'Breathing & Exchange of Gases', 'Body Fluids & Circulation', 'Excretory Products & Elimination',
        'Locomotion & Movement', 'Neural Control & Coordination', 'Chemical Coordination & Integration',
        'Cardiac cycle, ECG, and blood grouping (ABO and Rh)', 'Mechanism of breathing and gas transport (O2-Hb dissociation curve)',
        'Nephron structure and counter-current mechanism', 'Conduction of nerve impulse and reflex action',
        'Endocrine glands and hormones action'
    ],
    'Reproduction': [
        'Human reproduction', 'Reproductive health', 'Male reproductive system', 'Female reproductive system', 'Fertilization and development',
        'Spermatogenesis, oogenesis, and hormonal regulation', 'Menstrual cycle phases', 'Parturition, lactation, and embryonic development',
        'Contraception methods and Assisted Reproductive Technologies (ART: IVF, ZIFT, GIFT)'
    ],
    'Biology and Human Welfare': [
        'Common diseases', 'Immunity', 'Cancer', 'Drug abuse', 'Microbes in human welfare',
        'Innate and acquired immunity, vaccination, and AIDS',
        'Bacterial, viral, protozoan, and fungal diseases in humans',
        'Microbes in sewage treatment, biogas production, and biocontrol'
    ],

    // ── BITSAT ENGLISH PROFICIENCY ─────────────────────────────────
    'Vocabulary': [
        'Synonyms', 'Antonyms', 'Word meaning', 'Contextual vocabulary',
        'One-word substitution', 'Idioms and phrases', 'Appropriate word usage'
    ],
    'Grammar': [
        'Parts of speech', 'Articles', 'Prepositions', 'Conjunctions', 'Tenses',
        'Subject-verb agreement', 'Pronouns', 'Adjectives', 'Adverbs', 'Modals',
        'Active/passive voice', 'Direct/indirect speech', 'Sentence correction', 'Error detection'
    ],
    'Sentence Skills': [
        'Sentence completion', 'Fill in the blanks', 'Sentence improvement',
        'Correct usage', 'Rearrangement', 'Choosing the grammatically correct sentence'
    ],
    'Reading Comprehension': [
        'Short passages', 'Passage-based questions', 'Main idea',
        'Inference', 'Vocabulary in context', 'Tone/purpose', 'Specific information'
    ],

    // ── BITSAT LOGICAL REASONING ──────────────────────────────────
    'Verbal Reasoning': [
        'Analogy', 'Classification', 'Series', 'Coding-decoding', 'Blood relations',
        'Direction sense', 'Ranking/order', 'Logical deductions', 'Statement and conclusion',
        'Statement and assumption', 'Cause and effect', 'Assertion and reasoning', 'Syllogisms', 'Data sufficiency'
    ],
    'Non-Verbal Reasoning': [
        'Number series', 'Letter series', 'Mixed series', 'Pattern recognition',
        'Figure-based reasoning', 'Odd one out', 'Matrix/pattern problems', 'Missing number',
        'Arrangement', 'Seating arrangement', 'Puzzle-based reasoning'
    ],
    'Analytical Reasoning': [
        'Linear arrangement', 'Circular arrangement', 'Selection problems',
        'Distribution problems', 'Scheduling', 'Logical puzzles', 'Constraint-based problems'
    ]
};

export default function AdminPanel() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('questions'); // 'questions' | 'tests'
    const [unresolvedReportsCount, setUnresolvedReportsCount] = useState(0);

    const refreshReportBadge = async () => {
        try {
            const res = await fetch('/api/admin/reports/badge');
            if (res.ok) {
                const data = await res.json();
                setUnresolvedReportsCount(data.unresolvedCount || 0);
            }
        } catch (e) {
            console.error('Failed to load reports badge', e);
        }
    };

    useEffect(() => {
        refreshReportBadge();
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab === 'audit' || tab === 'test-audit') {
                setActiveTab('audit');
            }
            if (tab === 'chapter-mapping-audit') {
                setActiveTab('chapter-mapping-audit');
            }
        }
    }, []);
    const [selectedExam, setSelectedExam] = useState('olympiad');
    const [selectedTestType, setSelectedTestType] = useState('ALL');
    const [selectedSubject, setSelectedSubject] = useState('ALL');
    const [selectedChapterFilter, setSelectedChapterFilter] = useState('ALL');
    const [selectedTestId, setSelectedTestId] = useState('');
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null); // null = add mode
    const [savingQuestion, setSavingQuestion] = useState(false);
    const [uploadMode, setUploadMode] = useState('single'); // 'single' | 'ai' | 'bulk' | 'latex'
    const [bulkJson, setBulkJson] = useState('');
    const [bulkError, setBulkError] = useState('');
    const [latexInput, setLatexInput] = useState('');
    const [latexError, setLatexError] = useState('');
    const [latexPreview, setLatexPreview] = useState(null); // converted questions array
    const [showLatexJson, setShowLatexJson] = useState(false);
    const [detectedFormat, setDetectedFormat] = useState('');
    const [aiForm, setAiForm] = useState({ subject: '', chapter: '', subtopic: '', classGrade: '', count: selectedExam === 'neet' ? 45 : 25, difficulty: 'Mixed' });

    useEffect(() => {
        setAiForm(prev => ({ ...prev, count: selectedExam === 'neet' ? 45 : 25 }));
    }, [selectedExam]);
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [chapterDropdownOpen, setChapterDropdownOpen] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiPreview, setAiPreview] = useState(null);
    const [aiSaving, setAiSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [shouldAutoCreate, setShouldAutoCreate] = useState(false);
    const [globalQuestions, setGlobalQuestions] = useState([]);
    const [loadingGlobal, setLoadingGlobal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchSubject, setSearchSubject] = useState('ALL');
    const [stats, setStats] = useState({});
    const [loadingStats, setLoadingStats] = useState(false);
    const [explorerSubject, setExplorerSubject] = useState('');
    const [explorerChapter, setExplorerChapter] = useState('');
    const [explorerSubtopic, setExplorerSubtopic] = useState('ALL');
    const [explorerTypeFilter, setExplorerTypeFilter] = useState('ALL'); // 'ALL' | 'MCQ' | 'NUMERICAL' | 'ASSERTION_REASON'
    const [explorerDifficultyFilter, setExplorerDifficultyFilter] = useState('ALL'); // 'ALL' | 'EASY' | 'MODERATE' | 'DIFFICULT'
    const [explorerSearchText, setExplorerSearchText] = useState('');
    const [explorerQuestions, setExplorerQuestions] = useState([]);
    const [loadingExplorerQs, setLoadingExplorerQs] = useState(false);
    const [explorerMappingFilter, setExplorerMappingFilter] = useState('ALL'); // 'ALL' | 'ASSIGNED' | 'UNASSIGNED'
    const [explorerTestFilter, setExplorerTestFilter] = useState('ALL');
    const [allTestsList, setAllTestsList] = useState([]);
    const [loadingTestsList, setLoadingTestsList] = useState(false);
    const [mappingModalQuestion, setMappingModalQuestion] = useState(null);
    const [expandedTestPills, setExpandedTestPills] = useState({});
    const [filterSubject, setFilterSubject] = useState('ALL');
    const [filterChapter, setFilterChapter] = useState('ALL');
    const globalSubjects = ['Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology', 'English Proficiency', 'Logical Reasoning'];
    const questionsPerPage = 50;

    const [editingQuestionAssignedTests, setEditingQuestionAssignedTests] = useState([]);
    const [loadingQuestionTests, setLoadingQuestionTests] = useState(false);

    const [formData, setFormData] = useState({
        type: 'MCQ',
        text: '',
        image: '',
        subject: 'Physics',
        chapter: '',
        subtopic: '',
        difficulty: 'Medium',
        correctOption: 'a',
        explanation: '',
        optionA: '',
        optionAImage: '',
        optionB: '',
        optionBImage: '',
        optionC: '',
        optionCImage: '',
        optionD: '',
        optionDImage: ''
    });

    const availableTests = olympiadTests;

    const filteredTests = availableTests.filter(t => {
        if (selectedTestType !== 'ALL' && t.type !== selectedTestType) return false;
        if (selectedSubject !== 'ALL' && t.subject !== selectedSubject) return false;
        if (selectedChapterFilter !== 'ALL' && t.chapter !== selectedChapterFilter) return false;
        return true;
    });

    // Derive available subjects from Olympiad
    const subjectsByExam = {
        olympiad: ['Mathematics', 'Science', 'English'],
    };
    const availableSubjects = subjectsByExam[selectedExam] || ['Mathematics', 'Science', 'English'];

    // Admin authentication check
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status === 'authenticated' && !session?.user?.isAdmin) {
            router.push('/dashboard');
        }
    }, [status, session, router]);

    useEffect(() => {
        if (filteredTests.length > 0 && !selectedTestId) {
            setSelectedTestId(filteredTests[0].id);
        }
    }, [selectedExam, selectedTestType, filteredTests, selectedTestId]);

    useEffect(() => {
        if (selectedTestId) {
            setCurrentPage(1);
            fetchQuestions();
            
            // Sync form subject with top selection if it's a specific subject
            if (selectedSubject !== 'ALL') {
                setFormData(prev => ({ ...prev, subject: selectedSubject }));
                setAiForm(prev => ({ ...prev, subject: selectedSubject }));
            } else if (availableSubjects.length > 0 && !availableSubjects.includes(formData.subject)) {
                // If current form subject is invalid for new exam, pick first available
                setFormData(prev => ({ ...prev, subject: availableSubjects[0] }));
                setAiForm(prev => ({ ...prev, subject: availableSubjects[0] }));
            }
        }
    }, [selectedTestId, selectedSubject, selectedExam]);

    useEffect(() => {
        if (activeTab === 'questionBank') {
            setSelectedTestId('global');
        } else if (activeTab === 'questions') {
            if (selectedTestId === 'global' || !selectedTestId) {
                if (filteredTests.length > 0) {
                    setSelectedTestId(filteredTests[0].id);
                } else {
                    setSelectedTestId('');
                }
            }
        }
    }, [activeTab, filteredTests]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const subjectQuery = filterSubject !== 'ALL' ? `&subject=${filterSubject}` : '';
            const chapterQuery = filterChapter !== 'ALL' ? `&chapter=${filterChapter}` : '';
            const res = await fetch(`/api/questions?testId=${selectedTestId}${subjectQuery}${chapterQuery}`);
            const data = await res.json();
            if (!res.ok) {
                console.error('Failed to fetch questions:', data);
                setQuestions([]);
                return;
            }
            setQuestions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchGlobalQuestions = async () => {
        setLoadingGlobal(true);
        try {
            const res = await fetch('/api/questions?testId=global');
            const data = await res.json();
            setGlobalQuestions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingGlobal(false);
        }
    };

    const handleToggleLink = async (q, isLinked) => {
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: selectedTestId,
                    action: isLinked ? 'UNLINK_QUESTION' : 'LINK_QUESTIONS',
                    ...(isLinked ? { questionId: q._id } : { questionIds: [q._id] })
                })
            });
            if (!res.ok) throw new Error('Action failed');
            fetchQuestions(); // Refresh test's questions
        } catch (err) {
            alert('Error toggling link: ' + err.message);
        }
    };

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await fetch('/api/admin/question-stats');
            const data = await res.json();
            if (res.ok) {
                setStats(data);
            }
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    const fetchExplorerQuestions = async (sub, ch) => {
        setLoadingExplorerQs(true);
        try {
            let url;
            if (ch === '__uncategorized__') {
                // Fetch questions with no chapter for this subject
                url = `/api/questions?testId=global&subject=${encodeURIComponent(sub)}&chapter=__empty__&limit=5000`;
            } else {
                url = `/api/questions?testId=global&subject=${encodeURIComponent(sub)}&chapter=${encodeURIComponent(ch)}&limit=5000`;
            }
            const res = await fetch(url);
            const data = await res.json();
            setExplorerQuestions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch explorer questions:', err);
            setExplorerQuestions([]);
        } finally {
            setLoadingExplorerQs(false);
        }
    };

    // Fetch stats on mount so chapter dropdown in edit form is always populated
    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        if (activeTab === 'explorer') {
            fetchStats();
            setExplorerSubject('Physics');
            setExplorerChapter('');
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedTestId === 'global') {
            fetchQuestions();
        }
    }, [filterSubject, filterChapter, selectedTestId]);

    useEffect(() => {
        if (activeTab === 'explorer' && explorerSubject && explorerChapter) {
            setExplorerSubtopic('ALL');
            setExplorerTypeFilter('ALL');
            setExplorerDifficultyFilter('ALL');
            setExplorerMappingFilter('ALL');
            setExplorerTestFilter('ALL');
            setExplorerSearchText('');
            fetchExplorerQuestions(explorerSubject, explorerChapter);
        } else {
            setExplorerQuestions([]);
        }
    }, [explorerSubject, explorerChapter, activeTab]);

    useEffect(() => {
        if (activeTab === 'explorer') {
            fetchAllTestsList();
        }
    }, [activeTab]);

    const fetchAllTestsList = async () => {
        if (allTestsList.length > 0) return;
        setLoadingTestsList(true);
        try {
            const res = await fetch('/api/admin/tests-list');
            const data = await res.json();
            if (data.success && Array.isArray(data.tests)) {
                setAllTestsList(data.tests);
            }
        } catch (err) {
            console.error('Failed to load tests list:', err);
        } finally {
            setLoadingTestsList(false);
        }
    };

    const handleUnlinkQuestion = async (qId, testId, testTitle) => {
        if (!confirm(`Unlink this question from "${testTitle}"?`)) return;
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId,
                    questionId: qId,
                    action: 'UNLINK_QUESTION'
                })
            });
            const data = await res.json();
            if (data.success) {
                setEditingQuestionAssignedTests(prev => prev.filter(t => t.testId !== testId));
                setExplorerQuestions(prev => prev.map(q => {
                    if (q._id === qId) {
                        const updated = (q.assignedTests || []).filter(t => t.testId !== testId);
                        return { ...q, assignedTests: updated, isAssigned: updated.length > 0 };
                    }
                    return q;
                }));
                setMappingModalQuestion(prev => {
                    if (!prev || prev._id !== qId) return prev;
                    const updated = (prev.assignedTests || []).filter(t => t.testId !== testId);
                    return { ...prev, assignedTests: updated, isAssigned: updated.length > 0 };
                });
            } else {
                alert('Failed to unlink: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error unlinking question:', err);
            alert('Failed to unlink question');
        }
    };

    const handleLinkQuestion = async (targetTest) => {
        if (!mappingModalQuestion) return;
        const qId = mappingModalQuestion._id;
        const res = await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                testId: targetTest.testId,
                questionIds: [qId],
                action: 'LINK_QUESTIONS'
            })
        });
        const data = await res.json();
        if (data.success) {
            const newTestObj = {
                testId: targetTest.testId,
                title: targetTest.title,
                exam: targetTest.exam,
                subject: targetTest.subject
            };
            setExplorerQuestions(prev => prev.map(q => {
                if (q._id === qId) {
                    const current = q.assignedTests || [];
                    if (!current.some(t => t.testId === targetTest.testId)) {
                        const updated = [...current, newTestObj];
                        return { ...q, assignedTests: updated, isAssigned: true };
                    }
                }
                return q;
            }));
            setEditingQuestionAssignedTests(prev => {
                if (prev.some(t => t.testId === targetTest.testId)) return prev;
                return [...prev, newTestObj];
            });
            setMappingModalQuestion(prev => {
                if (!prev || prev._id !== qId) return prev;
                const current = prev.assignedTests || [];
                if (!current.some(t => t.testId === targetTest.testId)) {
                    return { ...prev, assignedTests: [...current, newTestObj], isAssigned: true };
                }
                return prev;
            });
        } else {
            throw new Error(data.error || 'Failed to map question');
        }
    };

    const handleUnlinkFromEdit = async (qId, testId, testTitle) => {
        await handleUnlinkQuestion(qId, testId, testTitle);
    };

    useEffect(() => {
        if (editingQuestion?._id) {
            if (Array.isArray(editingQuestion.assignedTests) && editingQuestion.assignedTests.length > 0) {
                setEditingQuestionAssignedTests(editingQuestion.assignedTests);
            } else {
                setLoadingQuestionTests(true);
                fetch(`/api/admin/question-tests?questionId=${editingQuestion._id}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && Array.isArray(data.tests)) {
                            setEditingQuestionAssignedTests(data.tests);
                        } else {
                            setEditingQuestionAssignedTests([]);
                        }
                    })
                    .catch(() => setEditingQuestionAssignedTests([]))
                    .finally(() => setLoadingQuestionTests(false));
            }
        } else {
            setEditingQuestionAssignedTests([]);
        }
    }, [editingQuestion?._id]);

    const toggleTestPills = (qId) => {
        setExpandedTestPills(prev => ({ ...prev, [qId]: !prev[qId] }));
    };

    useEffect(() => {
        if (activeTab === 'explorer' && !explorerSubject) {
            setExplorerSubject('Physics');
        }
    }, [activeTab]);

    // List of subtopics in current chapter with question counts
    const explorerSubtopicsList = useMemo(() => {
        if (!explorerChapter) return [];
        const subCounts = new Map();
        for (const q of explorerQuestions) {
            const sub = (q.subTopic || q.subtopic || '').trim() || 'General / Uncategorized';
            subCounts.set(sub, (subCounts.get(sub) || 0) + 1);
        }
        return Array.from(subCounts.entries()).sort((a, b) => b[1] - a[1]);
    }, [explorerQuestions, explorerChapter]);

    // Breakdown by question type (respecting subtopic filter if active)
    const explorerTypeCounts = useMemo(() => {
        let pool = explorerQuestions;
        if (explorerSubtopic !== 'ALL') {
            pool = pool.filter(q => {
                const s = (q.subTopic || q.subtopic || '').trim() || 'General / Uncategorized';
                return s === explorerSubtopic;
            });
        }
        let mcq = 0, num = 0, ar = 0;
        for (const q of pool) {
            const t = (q.type || 'MCQ').toUpperCase();
            if (t === 'NUMERICAL') num++;
            else if (t.includes('ASSERTION')) ar++;
            else mcq++;
        }
        return {
            total: pool.length,
            mcq,
            num,
            ar
        };
    }, [explorerQuestions, explorerSubtopic]);

    // Breakdown by test assignment status
    const explorerMappingCounts = useMemo(() => {
        let pool = explorerQuestions;
        if (explorerSubtopic !== 'ALL') {
            pool = pool.filter(q => {
                const s = (q.subTopic || q.subtopic || '').trim() || 'General / Uncategorized';
                return s === explorerSubtopic;
            });
        }
        let assigned = 0, unassigned = 0;
        for (const q of pool) {
            if (q.assignedTests && q.assignedTests.length > 0) assigned++;
            else unassigned++;
        }
        return { assigned, unassigned };
    }, [explorerQuestions, explorerSubtopic]);

    // Breakdown by question difficulty level (respecting subtopic filter if active)
    const explorerDifficultyCounts = useMemo(() => {
        let pool = explorerQuestions;
        if (explorerSubtopic !== 'ALL') {
            pool = pool.filter(q => {
                const s = (q.subTopic || q.subtopic || '').trim() || 'General / Uncategorized';
                return s === explorerSubtopic;
            });
        }
        let easy = 0, moderate = 0, difficult = 0;
        for (const q of pool) {
            const d = normalizeDifficulty(q.difficulty);
            if (d === 'EASY') easy++;
            else if (d === 'DIFFICULT') difficult++;
            else moderate++;
        }
        return { easy, moderate, difficult };
    }, [explorerQuestions, explorerSubtopic]);

    const handleUpdateDifficulty = async (qId, newDiff) => {
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'UPDATE_DIFFICULTY',
                    questionId: qId,
                    difficulty: newDiff
                })
            });
            const data = await res.json();
            if (data.success) {
                setExplorerQuestions(prev => prev.map(q => {
                    if (q._id === qId) {
                        return { ...q, difficulty: newDiff };
                    }
                    return q;
                }));
                setQuestions(prev => prev.map(q => {
                    if (q._id === qId) {
                        return { ...q, difficulty: newDiff };
                    }
                    return q;
                }));
                if (editingQuestion?._id === qId) {
                    setEditingQuestion(prev => ({ ...prev, difficulty: newDiff }));
                    setFormData(prev => ({ ...prev, difficulty: newDiff }));
                }
                if (mappingModalQuestion?._id === qId) {
                    setMappingModalQuestion(prev => ({ ...prev, difficulty: newDiff }));
                }
            } else {
                alert('Failed to update difficulty: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error updating difficulty:', err);
            alert('Failed to update difficulty');
        }
    };

    // All distinct tests assigned to questions in the current chapter
    const chapterAssignedTests = useMemo(() => {
        const map = new Map();
        for (const q of explorerQuestions) {
            if (Array.isArray(q.assignedTests)) {
                for (const t of q.assignedTests) {
                    if (t.testId && !map.has(t.testId)) {
                        map.set(t.testId, t);
                    }
                }
            }
        }
        return Array.from(map.values()).sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }, [explorerQuestions]);

    // Filtered questions based on subtopic, type, difficulty, mapping status, test, and search term
    const filteredExplorerQuestions = useMemo(() => {
        return explorerQuestions.filter(q => {
            // Subtopic filter
            if (explorerSubtopic !== 'ALL') {
                const s = (q.subTopic || q.subtopic || '').trim() || 'General / Uncategorized';
                if (s !== explorerSubtopic) return false;
            }
            // Type filter
            if (explorerTypeFilter !== 'ALL') {
                const t = (q.type || 'MCQ').toUpperCase();
                if (explorerTypeFilter === 'NUMERICAL' && t !== 'NUMERICAL') return false;
                if (explorerTypeFilter === 'ASSERTION_REASON' && !t.includes('ASSERTION')) return false;
                if (explorerTypeFilter === 'MCQ' && (t === 'NUMERICAL' || t.includes('ASSERTION'))) return false;
            }
            // Difficulty filter
            if (explorerDifficultyFilter !== 'ALL') {
                const d = normalizeDifficulty(q.difficulty);
                if (d !== explorerDifficultyFilter) return false;
            }
            // Mapping status filter
            if (explorerMappingFilter === 'ASSIGNED') {
                if (!q.assignedTests || q.assignedTests.length === 0) return false;
            } else if (explorerMappingFilter === 'UNASSIGNED') {
                if (q.assignedTests && q.assignedTests.length > 0) return false;
            }
            // Specific test filter
            if (explorerTestFilter && explorerTestFilter !== 'ALL') {
                if (!q.assignedTests || !q.assignedTests.some(t => t.testId === explorerTestFilter)) return false;
            }
            // Search filter (matches text, ID, or mapped test name/ID)
            if (explorerSearchText.trim()) {
                const term = explorerSearchText.toLowerCase();
                const textMatch = (q.text || '').toLowerCase().includes(term);
                const idMatch = (q._id || '').toString().toLowerCase().includes(term);
                const testMatch = (q.assignedTests || []).some(t =>
                    (t.title || '').toLowerCase().includes(term) ||
                    (t.testId || '').toLowerCase().includes(term)
                );
                if (!textMatch && !idMatch && !testMatch) return false;
            }
            return true;
        });
    }, [explorerQuestions, explorerSubtopic, explorerTypeFilter, explorerDifficultyFilter, explorerMappingFilter, explorerTestFilter, explorerSearchText]);

    useEffect(() => {
        if (uploadMode === 'link') {
            fetchGlobalQuestions();
        }
    }, [uploadMode]);

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: data
            });
            const result = await res.json();
            if (result.success) {
                setFormData(prev => ({ ...prev, [field]: result.url }));
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file');
        }
    };

    const handleSave = async () => {
        // Validation
        if (!formData.text || !formData.text.trim()) {
            alert('⚠️ Please enter the Question Text before saving.');
            return;
        }

        if (formData.type === 'NUMERICAL') {
            if (formData.correctOption === undefined || formData.correctOption === null || String(formData.correctOption).trim() === '') {
                alert('⚠️ Please provide a valid numerical answer for the question.');
                return;
            }
        } else {
            // For MCQ and Assertion-Reasoning, require all 4 options
            if (!formData.optionA?.trim() || !formData.optionB?.trim() || !formData.optionC?.trim() || !formData.optionD?.trim()) {
                alert('⚠️ Please fill in all 4 options (A, B, C, and D) for this question.');
                return;
            }
        }

        const targetTestId = selectedTestId || 'global';

        const questionPayload = {
            _id: editingQuestion ? editingQuestion._id : undefined,
            id: editingQuestion ? editingQuestion.id : undefined,
            type: formData.type || 'MCQ',
            text: formData.text,
            image: formData.image,
            subject: formData.subject,
            chapter: formData.chapter,
            subtopic: formData.subtopic,
            subTopic: formData.subtopic,
            difficulty: formData.difficulty || 'Medium',
            explanation: formData.explanation,
            ...(formData.type === 'NUMERICAL' ? {
                correctOption: String(formData.correctOption).trim(),
                options: []
            } : {
                correctOption: formData.correctOption || 'a',
                options: [
                    { id: 'a', text: formData.optionA, image: formData.optionAImage },
                    { id: 'b', text: formData.optionB, image: formData.optionBImage },
                    { id: 'c', text: formData.optionC, image: formData.optionCImage },
                    { id: 'd', text: formData.optionD, image: formData.optionDImage },
                ]
            })
        };

        const action = editingQuestion ? 'EDIT' : 'ADD';
        setSavingQuestion(true);

        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: targetTestId,
                    question: questionPayload,
                    action
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to save question');
            }

            alert(`✅ Question ${editingQuestion ? 'updated' : 'added'} successfully!`);
            setEditingQuestion(null);
            resetForm();
            fetchQuestions();
            if (activeTab === 'explorer') {
                fetchExplorerQuestions(explorerSubject, explorerChapter);
            }
        } catch (error) {
            console.error('Save question error:', error);
            alert(`❌ Error saving question: ${error.message}`);
        } finally {
            setSavingQuestion(false);
        }
    };

    const handleBulkUpload = async () => {
        setBulkError('');
        try {
            if (!bulkJson.trim()) {
                throw new Error("JSON input is empty.");
            }
            
            const parsedData = JSON.parse(bulkJson);
            
            if (!Array.isArray(parsedData)) {
                throw new Error("Expected a JSON array of questions.");
            }
            
            if (parsedData.length === 0) {
                throw new Error("JSON array is empty.");
            }

            // Basic validation and NORMALIZATION
            const normalizedData = parsedData.map((q, idx) => {
                try {
                    // Inject selected subject, chapter, subtopic, type if the question doesn't have one
                    const questionObj = {
                        ...q,
                        subject: q.subject || formData.subject,
                        chapter: q.chapter || formData.chapter,
                        subtopic: q.subtopic || formData.subtopic,
                        type: q.type || formData.type || 'MCQ'
                    };
                    return normalizeQuestion(questionObj);
                } catch (err) {
                    throw new Error(`Error formatting question at index ${idx}: ${err.message}`);
                }
            });

            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: selectedTestId || 'global',
                    question: normalizedData,
                    action: 'ADD_BULK'
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to bulk upload questions');
            }

            setBulkJson('');
            setUploadMode('single');
            alert(`Successfully added ${parsedData.length} questions!`);
            fetchQuestions();

        } catch (e) {
            setBulkError(e.message);
        }
    };

    const handleFileUploadBulk = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setBulkJson(event.target.result);
        };
        reader.readAsText(file);
    };

    // ── LaTeX helpers ──────────────────────────────────────────

    /** Strip common LaTeX formatting commands, preserve math delimiters */
    function cleanLatexText(text) {
        return text
            .replace(/\\textbf\{([^}]*)\}/g, '$1')
            .replace(/\\textit\{([^}]*)\}/g, '$1')
            .replace(/\\emph\{([^}]*)\}/g, '$1')
            .replace(/\\underline\{([^}]*)\}/g, '$1')
            .replace(/\\underline\{\\hspace\{[^}]*\}\}/g, '_____')
            .replace(/\\hspace\{[^}]*\}/g, ' ')
            .replace(/\\vspace\{[^}]*\}/g, '')
            .replace(/\\noindent\b/g, '')
            .replace(/\\\\\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /** Extract answer key from anywhere in the text.
     *  Supports: "1. A", "1) B", "1-C", "1: D", "1 A", "01. (b)",
     *            "ANSWERS: 1-A 2-C", "Ans. B" (inline per-question)
     */
    function extractAnswerMap(text) {
        const map = {};
        // Match: optional 'Q'/'Ans' prefix, number, separator, letter (optionally in parens)
        const pattern = /(?:^|[\s,;])\s*(?:[Qq]\.?\s*)?(\d{1,3})\s*[.)\-:\s]\s*\(?([A-Da-d])\)?/gm;
        let m;
        while ((m = pattern.exec(text)) !== null) {
            const num = parseInt(m[1], 10);
            if (!map[num]) map[num] = m[2].toLowerCase();
        }
        // Also match compact form: "1A 2C 3B" or "1.A 2.C"
        const compact = /\b(\d{1,3})\.?([A-Da-d])\b/g;
        while ((m = compact.exec(text)) !== null) {
            const num = parseInt(m[1], 10);
            if (!map[num]) map[num] = m[2].toLowerCase();
        }
        return map;
    }

    /**
     * STRATEGY 1 – enumerate / \item style
     * Each question is an \item before a \begin{enumerate} block.
     * Options are \item lines inside that block.
     */
    function parseEnumerateStyle(normalized, defaultSubject, answerMap) {
        const questions = [];
        const blocks = normalized.split(/\\end\{enumerate\}/);
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (!block.trim()) continue;
            const enumMatch = block.match(/(\\begin\{enumerate\}(?:\[[^\]]*\])?)/);
            if (!enumMatch) continue;
            const enumStart = block.indexOf(enumMatch[0]);
            const beforeEnum = block.substring(0, enumStart);
            const afterEnum = block.substring(enumStart + enumMatch[0].length);
            const itemParts = beforeEnum.split('\\item');
            if (itemParts.length < 2) continue;
            const questionText = cleanLatexText(itemParts[itemParts.length - 1]);
            if (!questionText) continue;
            const rawOptions = afterEnum.split('\\item').slice(1);
            if (rawOptions.length < 2) continue;
            const optionIds = ['a', 'b', 'c', 'd'];
            const options = rawOptions.slice(0, 4).map((optText, idx) => ({
                id: optionIds[idx],
                text: cleanLatexText(optText)
            }));
            const qNumber = questions.length + 1;
            questions.push({
                subject: defaultSubject,
                text: questionText,
                options,
                correctOption: answerMap[qNumber] || 'a',
                explanation: ''
            });
        }
        return questions;
    }

    /**
     * STRATEGY 2 – Numbered questions with (A)/(B)/(C)/(D) options.
     * Supports:
     *   "1. Question text..."  or  "Q1. ..."  or  "1) ..."
     *   followed by (A)/(B)/(C)/(D) or A) B) C) D) options.
     * Answer key at end: "1-B", "1. B", "ANSWERS: 1-A 2-C"
     */
    function parseNumberedStyle(normalized, defaultSubject, answerMap) {
        const questions = [];
        // Split into lines for processing
        const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

        // Detect answer-key section — stop collecting questions there
        const answerKeyLineIdx = lines.findIndex(l =>
            /^(?:answer[s]?\s*key|answer[s]?\s*:|ans\.?\s*key)/i.test(l)
        );
        const questionLines = answerKeyLineIdx >= 0 ? lines.slice(0, answerKeyLineIdx) : lines;

        // Group lines into question blocks
        // A question starts with a line matching: 1. / Q1. / Q.1 / 1)
        const qStartRegex = /^(?:Q\.?\s*)?(\d{1,3})[.)\s]\s+\S/;
        // An option line: (A) ... or A. ... or A) ...
        const optRegex = /^\(?([A-Da-d])[.)\s]\s*(.*)/i;

        let currentQ = null;
        let qNum = 0;

        const flush = () => {
            if (!currentQ || !currentQ.text) return;
            while (currentQ.options.length < 4) {
                currentQ.options.push({ id: String.fromCharCode(97 + currentQ.options.length), text: 'N/A' });
            }
            // Check for inline answer at end of question text: "...Ans: B" or "[Ans. (C)]"
            const inlineAns = currentQ.text.match(/(?:ans\.?|answer:?)\s*\(?([A-Da-d])\)?\s*$/i);
            if (inlineAns) {
                currentQ.correctOption = inlineAns[1].toLowerCase();
                currentQ.text = currentQ.text.replace(/[\[(]?(?:ans\.?|answer:?)\s*\(?[A-Da-d]\)?[\]).]?\s*$/i, '').trim();
            }
            questions.push(currentQ);
            currentQ = null;
        };

        for (const line of questionLines) {
            // Skip LaTeX preamble / document structure lines
            if (/^\\(?:documentclass|usepackage|begin\{document\}|end\{document\}|maketitle|pagestyle|geometry|setlength|renewcommand|newcommand)/.test(line)) continue;

            const qMatch = line.match(/^(?:Q\.?\s*)?(\d{1,3})[.)\s]\s+(.+)/);
            if (qMatch) {
                flush();
                qNum = parseInt(qMatch[1], 10);
                currentQ = {
                    subject: defaultSubject,
                    text: cleanLatexText(qMatch[2]),
                    options: [],
                    correctOption: answerMap[qNum] || 'a',
                    explanation: ''
                };
                continue;
            }

            if (currentQ) {
                const optMatch = line.match(/^\(?([A-Da-d])[.)\s]\s*(.*)/i);
                if (optMatch) {
                    currentQ.options.push({
                        id: optMatch[1].toLowerCase(),
                        text: cleanLatexText(optMatch[2])
                    });
                    continue;
                }
                // Continuation of question text (no option detected yet)
                if (currentQ.options.length === 0 && line && !optRegex.test(line)) {
                    currentQ.text += ' ' + cleanLatexText(line);
                }
            }
        }
        flush();

        // Backfill correctOption from answerMap (may have been populated after question blocks)
        questions.forEach((q, i) => {
            const num = i + 1;
            if (answerMap[num]) q.correctOption = answerMap[num];
        });

        return questions.filter(q => q.options.length >= 2);
    }

    /**
     * STRATEGY 3 – \question / \choice MCQ environment.
     * Common in LaTeX exam class (exam.cls).
     */
    function parseQuestionChoiceStyle(normalized, defaultSubject, answerMap) {
        const questions = [];
        // Split on \question
        const blocks = normalized.split(/\\question\s*/);
        for (let i = 1; i < blocks.length; i++) {
            const block = blocks[i].trim();
            if (!block) continue;
            // Split off choices
            const choiceSplit = block.split(/\\choice\s*/);
            if (choiceSplit.length < 3) continue; // need at least 2 choices
            const questionText = cleanLatexText(choiceSplit[0]);
            if (!questionText) continue;
            const optionIds = ['a', 'b', 'c', 'd'];
            const options = choiceSplit.slice(1, 5).map((c, idx) => ({
                id: optionIds[idx],
                text: cleanLatexText(c.split('\n')[0])
            }));
            const qNumber = questions.length + 1;
            questions.push({
                subject: defaultSubject,
                text: questionText,
                options,
                correctOption: answerMap[qNumber] || 'a',
                explanation: ''
            });
        }
        return questions;
    }

    /** Master parser — tries all strategies, returns most questions */
    function parseLatexToQuestions(latex, defaultSubject) {
        const normalized = latex.replace(/\r\n/g, '\n');

        // Extract answer map globally
        const answerMap = extractAnswerMap(normalized);

        // Try all three strategies
        const results = [
            { name: 'enumerate style (\\item + \\begin{enumerate})', questions: parseEnumerateStyle(normalized, defaultSubject, answerMap) },
            { name: 'numbered style (1. Q ... (A)(B)(C)(D))', questions: parseNumberedStyle(normalized, defaultSubject, answerMap) },
            { name: '\\question / \\choice MCQ style', questions: parseQuestionChoiceStyle(normalized, defaultSubject, answerMap) },
        ];

        // Pick the strategy with the most valid questions
        const best = results.reduce((a, b) => a.questions.length >= b.questions.length ? a : b);
        return { questions: best.questions, answerMap, detectedFormat: best.name };
    }

    const handleLatexConvert = () => {
        setLatexError('');
        setLatexPreview(null);
        setDetectedFormat('');
        setShowLatexJson(false);
        if (!latexInput.trim()) {
            setLatexError('LaTeX input is empty.');
            return;
        }
        try {
            const { questions, answerMap, detectedFormat: fmt } = parseLatexToQuestions(latexInput, formData.subject);
            if (questions.length === 0) {
                setLatexError(
                    'No questions found. The parser tried 3 formats but could not find valid question blocks.\n\n' +
                    'Supported formats:\n' +
                    '• enumerate: \\item Question \\begin{enumerate} \\item Opt... \\end{enumerate}\n' +
                    '• numbered: 1. Question\\n(A) Opt A\\n(B) Opt B ... + ANSWER KEY\n' +
                    '• MCQ class: \\question ... \\choice A \\choice B\n\n' +
                    'Tip: Click "📋 Sample" to see a working template.'
                );
                return;
            }
            setLatexPreview(questions);
            setDetectedFormat(fmt);
        } catch (e) {
            setLatexError('Parsing error: ' + e.message);
        }
    };

    const handleLatexUpload = async () => {
        if (!latexPreview || latexPreview.length === 0) return;
        setBulkError('');
        try {
            const normalizedData = latexPreview.map((q, idx) => {
                try {
                    const questionObj = {
                        ...q,
                        subject: q.subject || formData.subject,
                        chapter: q.chapter || formData.chapter,
                        subtopic: q.subtopic || formData.subtopic,
                        type: q.type || formData.type || 'MCQ'
                    };
                    return normalizeQuestion(questionObj);
                }
                catch (err) { throw new Error(`Error at question ${idx + 1}: ${err.message}`); }
            });
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testId: selectedTestId || 'global', question: normalizedData, action: 'ADD_BULK' })
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Upload failed');
            setLatexInput('');
            setLatexPreview(null);
            setUploadMode('single');
            alert(`✅ Successfully added ${normalizedData.length} questions!`);
            fetchQuestions();
        } catch (e) {
            setBulkError(e.message);
        }
    };

    const handleLatexFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setLatexInput(ev.target.result);
        reader.readAsText(file);
    };

    const handleDelete = async (q) => {
        if (!confirm('Are you sure you want to delete this question?')) return;

        await fetch('/api/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                testId: selectedTestId || 'global',
                question: { id: q.id, _id: q._id },
                action: 'DELETE'
            })
        });
        fetchQuestions();
    };

    const handleEdit = (q) => {
        setEditingQuestion(q);
        setEditingQuestionAssignedTests(q.assignedTests || []);
        setFormData({
            type: q.type || 'MCQ',
            difficulty: q.difficulty || 'Medium',
            text: q.text,
            image: q.image || '',
            subject: q.subject,
            chapter: q.chapter || '',
            subtopic: q.subtopic || q.subTopic || '',
            correctOption: q.correctOption !== undefined && q.correctOption !== null ? String(q.correctOption) : 'a',
            explanation: q.explanation || '',
            optionA: q.options?.find(o => o.id === 'a')?.text || '',
            optionAImage: q.options?.find(o => o.id === 'a')?.image || '',
            optionB: q.options?.find(o => o.id === 'b')?.text || '',
            optionBImage: q.options?.find(o => o.id === 'b')?.image || '',
            optionC: q.options?.find(o => o.id === 'c')?.text || '',
            optionCImage: q.options?.find(o => o.id === 'c')?.image || '',
            optionD: q.options?.find(o => o.id === 'd')?.text || '',
            optionDImage: q.options?.find(o => o.id === 'd')?.image || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingQuestion(null);
        setEditingQuestionAssignedTests([]);
        setSavingQuestion(false);
        setFormData({
            type: 'MCQ',
            difficulty: 'Medium',
            text: '',
            image: '',
            subject: selectedSubject !== 'ALL' ? selectedSubject : (availableSubjects[0] || 'Physics'),
            chapter: '',
            subtopic: '',
            correctOption: 'a',
            explanation: '',
            optionA: '',
            optionAImage: '',
            optionB: '',
            optionBImage: '',
            optionC: '',
            optionCImage: '',
            optionD: '',
            optionDImage: ''
        });
    };

    // Show loading while checking authentication
    if (status === 'loading') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e27', color: 'white' }}>
                <div>Loading...</div>
            </div>
        );
    }

    // Don't render if not admin
    if (!session?.user?.isAdmin) {
        return null;
    }

    return (
        <div className={styles.container}>
            <Navbar />
            <div className={styles.wrapper} style={activeTab === 'mapping' ? { maxWidth: '100%', width: '100%', padding: '1.25rem 2rem' } : undefined}>
                {/* Header */}
                <div className={styles.headerSection}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.title}>Admin Control Center</h1>
                        <span className={styles.adminBadge}>Admin Mode</span>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'questions' ? styles.activeTab : ''}`}
                        onClick={() => {
                            setActiveTab('questions');
                            setSelectedTestId('global');
                        }}
                    >
                        <span>📝</span> Manage Questions
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'explorer' ? styles.activeTab : ''}`}
                        onClick={() => {
                            setActiveTab('explorer');
                        }}
                    >
                        <span>🔍</span> Question Bank Explorer
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'tests' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('tests')}
                    >
                        <span>⚙️</span> Manage Tests & Dates
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'mapping' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('mapping')}
                    >
                        <span>🗺️</span> Test Mapping
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'reports' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('reports')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <span>🚩</span> Reported Questions
                        {unresolvedReportsCount > 0 && (
                            <span style={{
                                background: '#ef4444',
                                color: '#fff',
                                fontSize: '0.72rem',
                                fontWeight: '800',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                lineHeight: 1.2
                            }}>
                                {unresolvedReportsCount}
                            </span>
                        )}
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'audit' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('audit')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                        <span>📋</span> Test Audit
                    </button>
                </div>
 
                {activeTab === 'tests' && (
                    <div className={styles.controls}>
                        <select
                            value={selectedExam}
                            onChange={(e) => { 
                                setSelectedExam(e.target.value); 
                            }}
                            className={styles.select}
                        >
                            <option value="olympiad">Olympiad (Classes 1–12)</option>
                        </select>
                    </div>
                )}

                {activeTab === 'audit' ? (
                    <AdminTestAudit />
                ) : activeTab === 'reports' ? (
                    <AdminReportedQuestions onReportStatusChange={refreshReportBadge} />
                ) : activeTab === 'mapping' ? (
                    <TestMappingPanel
                        allTests={olympiadTests}
                    />
                ) : activeTab === 'tests' ? (
                    <TestManager 
                        selectedExam={selectedExam} 
                        availableTests={availableTests} 
                        autoCreate={shouldAutoCreate}
                        onAutoCreateHandled={() => setShouldAutoCreate(false)}
                    />
                ) : activeTab === 'explorer' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', marginTop: '20px' }}>
                        {/* Left Side: Subject list, Chapter list, and Subtopics list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Subject selector tabs */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
                                <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#818cf8', fontWeight: 'bold' }}>Subjects</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {globalSubjects.map(sub => {
                                        const subData = stats[sub] || {};
                                        const totalCount = subData._total || 0;
                                        const isSelected = explorerSubject === sub;

                                        return (
                                            <div key={sub}>
                                                <button
                                                    onClick={() => { setExplorerSubject(sub); setExplorerChapter(''); setExplorerSubtopic('ALL'); }}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        background: isSelected ? 'rgba(99,102,241,0.15)' : 'transparent',
                                                        border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                                                        color: isSelected ? 'white' : '#94a3b8',
                                                        padding: '10px 14px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontSize: '0.9rem',
                                                        fontWeight: isSelected ? 'bold' : 'normal',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <span>{sub}</span>
                                                    <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '12px', color: '#cbd5e1' }}>
                                                        {totalCount}
                                                    </span>
                                                </button>

                                                {/* Subject-level type breakdown pills when selected */}
                                                {isSelected && subData._types && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '6px', padding: '0 4px' }}>
                                                        <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                            MCQ {subData._types.MCQ || 0}
                                                        </span>
                                                        <span style={{ fontSize: '0.68rem', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                            Num {subData._types.NUMERICAL || 0}
                                                        </span>
                                                        <span style={{ fontSize: '0.68rem', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', padding: '2px 4px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(245,158,11,0.2)' }}>
                                                            AR {subData._types.ASSERTION_REASON || 0}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Chapter list */}
                            {explorerSubject && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
                                    <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#14b8a6', fontWeight: 'bold' }}>Chapters in {explorerSubject}</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
                                        {(() => {
                                            const subData = stats[explorerSubject] || {};
                                            const uncategorizedCount = subData._uncategorized || 0;
                                            
                                            // Determine canonical chapter list in configured order
                                            let canonicalList = subData._order || STATIC_CHAPTER_MAP[explorerSubject] || [];
                                            
                                            let chapterEntries = [];
                                            if (canonicalList.length > 0) {
                                                chapterEntries = canonicalList
                                                    .filter(ch => !LEGACY_UMBRELLAS.has(ch.toLowerCase()) && !EXCLUDED_NEET_CHAPTERS.has(ch.toLowerCase()))
                                                    .map(ch => [ch, subData._chapters?.[ch]?.total ?? subData[ch] ?? 0]);
                                            } else {
                                                chapterEntries = Object.entries(subData)
                                                    .filter(([k]) => !k.startsWith('_') && !LEGACY_UMBRELLAS.has(k.toLowerCase()) && !EXCLUDED_NEET_CHAPTERS.has(k.toLowerCase()))
                                                    .sort((a, b) => b[1] - a[1]);
                                            }

                                            if (chapterEntries.length === 0 && uncategorizedCount === 0) {
                                                return <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No questions found for this subject.</p>;
                                            }

                                            const chapterButtons = chapterEntries.map(([ch, count]) => (
                                                <button
                                                    key={ch}
                                                    onClick={() => setExplorerChapter(ch)}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        background: explorerChapter === ch ? 'rgba(20,184,166,0.15)' : 'transparent',
                                                        border: `1px solid ${explorerChapter === ch ? 'rgba(20,184,166,0.4)' : 'transparent'}`,
                                                        color: explorerChapter === ch ? 'white' : '#cbd5e1',
                                                        padding: '8px 12px',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        fontSize: '0.8rem',
                                                        fontWeight: explorerChapter === ch ? 'bold' : 'normal',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <span style={{ flex: 1, marginRight: '10px', whiteSpace: 'normal', lineHeight: '1.3' }}>{ch}</span>
                                                    <span style={{ fontSize: '0.7rem', background: 'rgba(20,184,166,0.2)', border: '1px solid #14b8a644', padding: '1px 6px', borderRadius: '10px', color: '#14b8a6', fontWeight: 'bold' }}>
                                                        {count}
                                                    </span>
                                                </button>
                                            ));

                                            if (uncategorizedCount > 0) {
                                                chapterButtons.push(
                                                    <button
                                                        key="__uncategorized__"
                                                        onClick={() => setExplorerChapter('__uncategorized__')}
                                                        style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            background: explorerChapter === '__uncategorized__' ? 'rgba(100,116,139,0.15)' : 'transparent',
                                                            border: `1px solid ${explorerChapter === '__uncategorized__' ? 'rgba(100,116,139,0.4)' : 'transparent'}`,
                                                            color: '#64748b',
                                                            padding: '8px 12px',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            fontSize: '0.8rem',
                                                            transition: 'all 0.2s',
                                                            marginTop: '4px',
                                                            borderTop: '1px solid rgba(255,255,255,0.06)'
                                                        }}
                                                    >
                                                        <span style={{ flex: 1, marginRight: '10px', fontStyle: 'italic' }}>Uncategorized</span>
                                                        <span style={{ fontSize: '0.7rem', background: 'rgba(100,116,139,0.2)', padding: '1px 6px', borderRadius: '10px', color: '#94a3b8', fontWeight: 'bold' }}>
                                                            {uncategorizedCount}
                                                        </span>
                                                    </button>
                                                );
                                            }

                                            return chapterButtons;
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Subtopics filter list in sidebar */}
                            {explorerChapter && explorerSubtopicsList.length > 0 && (
                                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#38bdf8', fontWeight: 'bold' }}>Subtopics</h3>
                                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{explorerSubtopicsList.length} total</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '350px', overflowY: 'auto' }}>
                                        <button
                                            onClick={() => setExplorerSubtopic('ALL')}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                background: explorerSubtopic === 'ALL' ? 'rgba(56,189,248,0.2)' : 'transparent',
                                                border: `1px solid ${explorerSubtopic === 'ALL' ? 'rgba(56,189,248,0.5)' : 'transparent'}`,
                                                color: explorerSubtopic === 'ALL' ? '#38bdf8' : '#cbd5e1',
                                                padding: '7px 10px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                fontSize: '0.78rem',
                                                fontWeight: explorerSubtopic === 'ALL' ? 'bold' : 'normal',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <span>All Subtopics</span>
                                            <span style={{ fontSize: '0.7rem', background: 'rgba(56,189,248,0.15)', padding: '1px 6px', borderRadius: '10px', color: '#38bdf8' }}>
                                                {explorerQuestions.length}
                                            </span>
                                        </button>
                                        {explorerSubtopicsList.map(([subName, subCount]) => (
                                            <button
                                                key={subName}
                                                onClick={() => setExplorerSubtopic(subName)}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    background: explorerSubtopic === subName ? 'rgba(56,189,248,0.2)' : 'transparent',
                                                    border: `1px solid ${explorerSubtopic === subName ? 'rgba(56,189,248,0.5)' : 'transparent'}`,
                                                    color: explorerSubtopic === subName ? '#38bdf8' : '#94a3b8',
                                                    padding: '7px 10px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    fontSize: '0.78rem',
                                                    fontWeight: explorerSubtopic === subName ? 'bold' : 'normal',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <span style={{ flex: 1, marginRight: '8px', whiteSpace: 'normal', lineHeight: '1.2' }}>{subName}</span>
                                                <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '10px', color: '#cbd5e1' }}>
                                                    {subCount}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Header, Segregation Cards, Subtopic Pills, and Questions List */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {explorerChapter ? (
                                <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                                    {/* Header & Search */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>
                                                <span>{explorerSubject}</span>
                                                <span>›</span>
                                                <span style={{ color: '#14b8a6' }}>{explorerChapter === '__uncategorized__' ? 'Uncategorized' : explorerChapter}</span>
                                                {explorerSubtopic !== 'ALL' && (
                                                    <>
                                                        <span>›</span>
                                                        <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{explorerSubtopic}</span>
                                                    </>
                                                )}
                                            </div>
                                            <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#f8fafc', fontWeight: 'bold' }}>
                                                {explorerChapter === '__uncategorized__' ? 'Uncategorized Questions' : explorerChapter}
                                                <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '8px' }}>
                                                    ({filteredExplorerQuestions.length} of {explorerQuestions.length} Questions)
                                                </span>
                                            </h2>
                                        </div>

                                        {/* Search Filter */}
                                        <div style={{ position: 'relative', width: '260px' }}>
                                            <input
                                                type="text"
                                                placeholder="Search in questions..."
                                                value={explorerSearchText}
                                                onChange={(e) => setExplorerSearchText(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.12)',
                                                    borderRadius: '8px',
                                                    color: 'white',
                                                    fontSize: '0.85rem'
                                                }}
                                            />
                                            {explorerSearchText && (
                                                <button
                                                    onClick={() => setExplorerSearchText('')}
                                                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >✕</button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Question Type & Mapping Segregation Cards (Interactive Filter Bar) */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                                        {/* ALL */}
                                        <div
                                            onClick={() => setExplorerTypeFilter('ALL')}
                                            style={{
                                                background: explorerTypeFilter === 'ALL' ? 'linear-gradient(135deg, rgba(99,102,241,0.22), rgba(79,70,229,0.12))' : 'rgba(255,255,255,0.02)',
                                                border: `1.5px solid ${explorerTypeFilter === 'ALL' ? '#818cf8' : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: explorerTypeFilter === 'ALL' ? '0 0 16px rgba(99,102,241,0.25)' : 'none',
                                                borderRadius: '12px',
                                                padding: '12px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>All Questions</span>
                                                <span style={{ fontSize: '1.1rem' }}>📚</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>
                                                {explorerTypeCounts.total}
                                            </div>
                                            {explorerTypeFilter === 'ALL' && (
                                                <span style={{ fontSize: '0.62rem', background: '#4f46e5', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', position: 'absolute', bottom: '8px', right: '8px' }}>
                                                    ACTIVE
                                                </span>
                                            )}
                                        </div>

                                        {/* MCQ */}
                                        <div
                                            onClick={() => setExplorerTypeFilter(explorerTypeFilter === 'MCQ' ? 'ALL' : 'MCQ')}
                                            style={{
                                                background: explorerTypeFilter === 'MCQ' ? 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.12))' : 'rgba(255,255,255,0.02)',
                                                border: `1.5px solid ${explorerTypeFilter === 'MCQ' ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: explorerTypeFilter === 'MCQ' ? '0 0 16px rgba(16,185,129,0.25)' : 'none',
                                                borderRadius: '12px',
                                                padding: '12px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MCQ</span>
                                                <span style={{ fontSize: '1.1rem' }}>📝</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                                {explorerTypeCounts.mcq}
                                            </div>
                                            {explorerTypeFilter === 'MCQ' && (
                                                <span style={{ fontSize: '0.62rem', background: '#059669', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', position: 'absolute', bottom: '8px', right: '8px' }}>
                                                    FILTERED
                                                </span>
                                            )}
                                        </div>

                                        {/* Numerical */}
                                        <div
                                            onClick={() => setExplorerTypeFilter(explorerTypeFilter === 'NUMERICAL' ? 'ALL' : 'NUMERICAL')}
                                            style={{
                                                background: explorerTypeFilter === 'NUMERICAL' ? 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(37,99,235,0.12))' : 'rgba(255,255,255,0.02)',
                                                border: `1.5px solid ${explorerTypeFilter === 'NUMERICAL' ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: explorerTypeFilter === 'NUMERICAL' ? '0 0 16px rgba(59,130,246,0.25)' : 'none',
                                                borderRadius: '12px',
                                                padding: '12px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Numerical</span>
                                                <span style={{ fontSize: '1.1rem' }}>🔢</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                                {explorerTypeCounts.num}
                                            </div>
                                            {explorerTypeFilter === 'NUMERICAL' && (
                                                <span style={{ fontSize: '0.62rem', background: '#2563eb', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', position: 'absolute', bottom: '8px', right: '8px' }}>
                                                    FILTERED
                                                </span>
                                            )}
                                        </div>

                                        {/* Assertion-Reasoning */}
                                        <div
                                            onClick={() => setExplorerTypeFilter(explorerTypeFilter === 'ASSERTION_REASON' ? 'ALL' : 'ASSERTION_REASON')}
                                            style={{
                                                background: explorerTypeFilter === 'ASSERTION_REASON' ? 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(217,119,6,0.12))' : 'rgba(255,255,255,0.02)',
                                                border: `1.5px solid ${explorerTypeFilter === 'ASSERTION_REASON' ? '#fbbf24' : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: explorerTypeFilter === 'ASSERTION_REASON' ? '0 0 16px rgba(245,158,11,0.25)' : 'none',
                                                borderRadius: '12px',
                                                padding: '12px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title="Assertion–Reason">Assertion–Reason</span>
                                                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginLeft: '4px' }}>⚖️</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                                {explorerTypeCounts.ar}
                                            </div>
                                            {explorerTypeFilter === 'ASSERTION_REASON' && (
                                                <span style={{ fontSize: '0.62rem', background: '#d97706', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', position: 'absolute', bottom: '8px', right: '8px' }}>
                                                    FILTERED
                                                </span>
                                            )}
                                        </div>

                                        {/* Mapped in Tests */}
                                        <div
                                            onClick={() => {
                                                setExplorerMappingFilter(explorerMappingFilter === 'ASSIGNED' ? 'ALL' : 'ASSIGNED');
                                            }}
                                            style={{
                                                background: explorerMappingFilter === 'ASSIGNED' ? 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.16))' : 'rgba(255,255,255,0.02)',
                                                border: `1.5px solid ${explorerMappingFilter === 'ASSIGNED' ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: explorerMappingFilter === 'ASSIGNED' ? '0 0 16px rgba(16,185,129,0.3)' : 'none',
                                                borderRadius: '12px',
                                                padding: '12px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                                    Mapped in Tests
                                                </span>
                                                <span style={{ fontSize: '1.1rem' }}>🗺️</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                                {explorerMappingCounts.assigned}
                                            </div>
                                            {explorerMappingFilter === 'ASSIGNED' && (
                                                <span style={{ fontSize: '0.62rem', background: '#059669', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', position: 'absolute', bottom: '8px', right: '8px' }}>
                                                    FILTERED
                                                </span>
                                            )}
                                        </div>

                                        {/* Unassigned */}
                                        <div
                                            onClick={() => {
                                                setExplorerMappingFilter(explorerMappingFilter === 'UNASSIGNED' ? 'ALL' : 'UNASSIGNED');
                                            }}
                                            style={{
                                                background: explorerMappingFilter === 'UNASSIGNED' ? 'linear-gradient(135deg, rgba(244,63,94,0.28), rgba(225,29,72,0.16))' : 'rgba(255,255,255,0.02)',
                                                border: `1.5px solid ${explorerMappingFilter === 'UNASSIGNED' ? '#fb7185' : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: explorerMappingFilter === 'UNASSIGNED' ? '0 0 16px rgba(244,63,94,0.3)' : 'none',
                                                borderRadius: '12px',
                                                padding: '12px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#fb7185', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                                    Unassigned
                                                </span>
                                                <span style={{ fontSize: '1.1rem' }}>⚪</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f43f5e' }}>
                                                {explorerMappingCounts.unassigned}
                                            </div>
                                            {explorerMappingFilter === 'UNASSIGNED' && (
                                                <span style={{ fontSize: '0.62rem', background: '#e11d48', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', position: 'absolute', bottom: '8px', right: '8px' }}>
                                                    FILTERED
                                                </span>
                                            )}
                                        </div>

                                        {/* EASY */}
                                        <div
                                            onClick={() => {
                                                setExplorerDifficultyFilter(explorerDifficultyFilter === 'EASY' ? 'ALL' : 'EASY');
                                            }}
                                            style={{
                                                background: explorerDifficultyFilter === 'EASY' ? 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.16))' : 'rgba(255,255,255,0.02)',
                                                border: `1.5px solid ${explorerDifficultyFilter === 'EASY' ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: explorerDifficultyFilter === 'EASY' ? '0 0 16px rgba(16,185,129,0.3)' : 'none',
                                                borderRadius: '12px',
                                                padding: '12px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                                    Easy
                                                </span>
                                                <span style={{ fontSize: '1.1rem' }}>🟢</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                                {explorerDifficultyCounts.easy}
                                            </div>
                                            {explorerDifficultyFilter === 'EASY' && (
                                                <span style={{ fontSize: '0.62rem', background: '#059669', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', position: 'absolute', bottom: '8px', right: '8px' }}>
                                                    FILTERED
                                                </span>
                                            )}
                                        </div>

                                        {/* MODERATE */}
                                        <div
                                            onClick={() => {
                                                setExplorerDifficultyFilter(explorerDifficultyFilter === 'MODERATE' ? 'ALL' : 'MODERATE');
                                            }}
                                            style={{
                                                background: explorerDifficultyFilter === 'MODERATE' ? 'linear-gradient(135deg, rgba(245,158,11,0.28), rgba(217,119,6,0.16))' : 'rgba(255,255,255,0.02)',
                                                border: `1.5px solid ${explorerDifficultyFilter === 'MODERATE' ? '#fbbf24' : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: explorerDifficultyFilter === 'MODERATE' ? '0 0 16px rgba(245,158,11,0.3)' : 'none',
                                                borderRadius: '12px',
                                                padding: '12px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                                    Moderate
                                                </span>
                                                <span style={{ fontSize: '1.1rem' }}>🟡</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                                {explorerDifficultyCounts.moderate}
                                            </div>
                                            {explorerDifficultyFilter === 'MODERATE' && (
                                                <span style={{ fontSize: '0.62rem', background: '#d97706', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', position: 'absolute', bottom: '8px', right: '8px' }}>
                                                    FILTERED
                                                </span>
                                            )}
                                        </div>

                                        {/* DIFFICULT */}
                                        <div
                                            onClick={() => {
                                                setExplorerDifficultyFilter(explorerDifficultyFilter === 'DIFFICULT' ? 'ALL' : 'DIFFICULT');
                                            }}
                                            style={{
                                                background: explorerDifficultyFilter === 'DIFFICULT' ? 'linear-gradient(135deg, rgba(239,68,68,0.28), rgba(220,38,38,0.16))' : 'rgba(255,255,255,0.02)',
                                                border: `1.5px solid ${explorerDifficultyFilter === 'DIFFICULT' ? '#f87171' : 'rgba(255,255,255,0.08)'}`,
                                                boxShadow: explorerDifficultyFilter === 'DIFFICULT' ? '0 0 16px rgba(239,68,68,0.3)' : 'none',
                                                borderRadius: '12px',
                                                padding: '12px 14px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                                                    Difficult
                                                </span>
                                                <span style={{ fontSize: '1.1rem' }}>🔴</span>
                                            </div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                                {explorerDifficultyCounts.difficult}
                                            </div>
                                            {explorerDifficultyFilter === 'DIFFICULT' && (
                                                <span style={{ fontSize: '0.62rem', background: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', position: 'absolute', bottom: '8px', right: '8px' }}>
                                                    FILTERED
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Test Mapping Filter Toolbar */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        background: 'rgba(15,23,42,0.6)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '10px',
                                        padding: '10px 14px',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                🗺️ Test Mapping:
                                            </span>
                                            {[
                                                { id: 'ALL', label: `All (${explorerQuestions.length})` },
                                                { id: 'ASSIGNED', label: `Mapped (${explorerMappingCounts.assigned})` },
                                                { id: 'UNASSIGNED', label: `Unassigned (${explorerMappingCounts.unassigned})` }
                                            ].map(btn => (
                                                <button
                                                    key={btn.id}
                                                    onClick={() => setExplorerMappingFilter(btn.id)}
                                                    style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${explorerMappingFilter === btn.id ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                                                        background: explorerMappingFilter === btn.id ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.03)',
                                                        color: explorerMappingFilter === btn.id ? '#a5b4fc' : '#cbd5e1',
                                                        fontSize: '0.74rem',
                                                        fontWeight: explorerMappingFilter === btn.id ? 'bold' : 'normal',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Filter by Specific Assigned Test Dropdown */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
                                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                                In Test:
                                            </span>
                                            <select
                                                value={explorerTestFilter}
                                                onChange={(e) => setExplorerTestFilter(e.target.value)}
                                                style={{
                                                    background: 'rgba(15,23,42,0.9)',
                                                    border: `1px solid ${explorerTestFilter !== 'ALL' ? '#38bdf8' : 'rgba(255,255,255,0.15)'}`,
                                                    color: explorerTestFilter !== 'ALL' ? '#38bdf8' : '#cbd5e1',
                                                    padding: '5px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    outline: 'none',
                                                    maxWidth: '260px'
                                                }}
                                            >
                                                <option value="ALL">🎯 Any Test ({chapterAssignedTests.length} tests)</option>
                                                {chapterAssignedTests.map(t => (
                                                    <option key={t.testId} value={t.testId}>
                                                        [{t.exam || 'TEST'}] {t.title}
                                                    </option>
                                                ))}
                                            </select>
                                            {explorerTestFilter !== 'ALL' && (
                                                <button
                                                    onClick={() => setExplorerTestFilter('ALL')}
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', padding: '0 4px' }}
                                                    title="Clear test filter"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Difficulty Level Filter Toolbar */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '10px',
                                        background: 'rgba(15,23,42,0.6)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '10px',
                                        padding: '10px 14px',
                                        marginBottom: '18px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                ⚡ Difficulty:
                                            </span>
                                            {[
                                                { id: 'ALL', label: `All (${explorerQuestions.length})`, color: '#818cf8', bg: 'rgba(99,102,241,0.25)' },
                                                { id: 'EASY', label: `🟢 Easy (${explorerDifficultyCounts.easy})`, color: '#34d399', bg: 'rgba(16,185,129,0.25)' },
                                                { id: 'MODERATE', label: `🟡 Moderate (${explorerDifficultyCounts.moderate})`, color: '#fbbf24', bg: 'rgba(245,158,11,0.25)' },
                                                { id: 'DIFFICULT', label: `🔴 Difficult (${explorerDifficultyCounts.difficult})`, color: '#f87171', bg: 'rgba(239,68,68,0.25)' }
                                            ].map(btn => (
                                                <button
                                                    key={btn.id}
                                                    onClick={() => setExplorerDifficultyFilter(btn.id)}
                                                    style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${explorerDifficultyFilter === btn.id ? btn.color : 'rgba(255,255,255,0.1)'}`,
                                                        background: explorerDifficultyFilter === btn.id ? btn.bg : 'rgba(255,255,255,0.03)',
                                                        color: explorerDifficultyFilter === btn.id ? btn.color : '#cbd5e1',
                                                        fontSize: '0.74rem',
                                                        fontWeight: explorerDifficultyFilter === btn.id ? 'bold' : 'normal',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>

                                        {explorerDifficultyFilter !== 'ALL' && (
                                            <button
                                                onClick={() => setExplorerDifficultyFilter('ALL')}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                            >
                                                Clear Difficulty Filter
                                            </button>
                                        )}
                                    </div>

                                    {/* Subtopics Pill Carousel Bar */}
                                    {explorerSubtopicsList.length > 0 && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    🏷️ Filter by Subtopic:
                                                </span>
                                                {explorerSubtopic !== 'ALL' && (
                                                    <button
                                                        onClick={() => setExplorerSubtopic('ALL')}
                                                        style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                                                    >
                                                        Clear Subtopic Filter
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                                                <button
                                                    onClick={() => setExplorerSubtopic('ALL')}
                                                    style={{
                                                        whiteSpace: 'nowrap',
                                                        padding: '5px 12px',
                                                        borderRadius: '20px',
                                                        border: `1px solid ${explorerSubtopic === 'ALL' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                                                        background: explorerSubtopic === 'ALL' ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)',
                                                        color: explorerSubtopic === 'ALL' ? '#38bdf8' : '#cbd5e1',
                                                        fontSize: '0.78rem',
                                                        cursor: 'pointer',
                                                        fontWeight: explorerSubtopic === 'ALL' ? 'bold' : 'normal',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    All Subtopics ({explorerQuestions.length})
                                                </button>
                                                {explorerSubtopicsList.map(([subName, count]) => (
                                                    <button
                                                        key={subName}
                                                        onClick={() => setExplorerSubtopic(subName)}
                                                        style={{
                                                            whiteSpace: 'nowrap',
                                                            padding: '5px 12px',
                                                            borderRadius: '20px',
                                                            border: `1px solid ${explorerSubtopic === subName ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                                                            background: explorerSubtopic === subName ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.03)',
                                                            color: explorerSubtopic === subName ? '#38bdf8' : '#94a3b8',
                                                            fontSize: '0.78rem',
                                                            cursor: 'pointer',
                                                            fontWeight: explorerSubtopic === subName ? 'bold' : 'normal',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {subName} ({count})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Questions List */}
                                    {loadingExplorerQs ? (
                                        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Loading questions...</p>
                                    ) : filteredExplorerQuestions.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                            <p style={{ margin: 0, fontSize: '1rem' }}>No questions match the selected filters.</p>
                                            {(explorerSubtopic !== 'ALL' || explorerTypeFilter !== 'ALL' || explorerMappingFilter !== 'ALL' || explorerTestFilter !== 'ALL' || explorerSearchText) && (
                                                <button
                                                    onClick={() => {
                                                        setExplorerSubtopic('ALL');
                                                        setExplorerTypeFilter('ALL');
                                                        setExplorerMappingFilter('ALL');
                                                        setExplorerTestFilter('ALL');
                                                        setExplorerSearchText('');
                                                    }}
                                                    style={{ marginTop: '12px', background: 'transparent', border: '1px solid #6366f1', color: '#818cf8', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' }}
                                                >
                                                    Reset All Filters
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {filteredExplorerQuestions.map((q, idx) => {
                                                const qType = (q.type || 'MCQ').toUpperCase();
                                                const isAR = qType.includes('ASSERTION');
                                                const isNum = qType === 'NUMERICAL';
                                                const typeBadgeColor = isAR ? '#f59e0b' : isNum ? '#3b82f6' : '#10b981';
                                                const typeBadgeBg = isAR ? 'rgba(245,158,11,0.15)' : isNum ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)';
                                                const typeBadgeLabel = isAR ? 'Assertion–Reason' : isNum ? 'Numerical' : 'MCQ';
                                                const dNorm = normalizeDifficulty(q.difficulty);
                                                const dColor = dNorm === 'EASY' ? '#34d399' : dNorm === 'DIFFICULT' ? '#f87171' : '#fbbf24';
                                                const dBg = dNorm === 'EASY' ? 'rgba(16,185,129,0.18)' : dNorm === 'DIFFICULT' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)';
                                                const dBorder = dNorm === 'EASY' ? '#10b981' : dNorm === 'DIFFICULT' ? '#ef4444' : '#f59e0b';

                                                return (
                                                    <div key={q._id || q.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '16px 20px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: '0.82rem', color: '#818cf8', fontWeight: 'bold' }}>
                                                                    Question #{idx + 1}
                                                                </span>
                                                                <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                                                    (ID: {q._id})
                                                                </span>
                                                                <span style={{ fontSize: '0.7rem', background: typeBadgeBg, color: typeBadgeColor, border: `1px solid ${typeBadgeColor}44`, padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                                                                    {typeBadgeLabel}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '0.7rem',
                                                                    background: dBg,
                                                                    color: dColor,
                                                                    border: `1.5px solid ${dBorder}`,
                                                                    padding: '2px 8px',
                                                                    borderRadius: '6px',
                                                                    fontWeight: 'bold',
                                                                    letterSpacing: '0.5px'
                                                                }}>
                                                                    {dNorm === 'EASY' ? '🟢 EASY' : dNorm === 'DIFFICULT' ? '🔴 DIFFICULT' : '🟡 MODERATE'}
                                                                </span>
                                                                {q.subTopic && (
                                                                    <span style={{ fontSize: '0.7rem', background: 'rgba(20,184,166,0.15)', color: '#2dd4bf', border: '1px solid rgba(20,184,166,0.3)', padding: '2px 8px', borderRadius: '6px' }}>
                                                                        🏷️ {q.subTopic}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                {/* Quick Inline Level Selector */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(15,23,42,0.75)', padding: '3px 8px', borderRadius: '6px', border: `1px solid ${dBorder}55` }}>
                                                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Level:</span>
                                                                    <select
                                                                        value={dNorm}
                                                                        onChange={(e) => handleUpdateDifficulty(q._id, e.target.value)}
                                                                        style={{
                                                                            background: 'transparent',
                                                                            border: 'none',
                                                                            color: dColor,
                                                                            fontSize: '0.72rem',
                                                                            fontWeight: 'bold',
                                                                            cursor: 'pointer',
                                                                            outline: 'none'
                                                                        }}
                                                                    >
                                                                        <option value="EASY" style={{ background: '#0f172a', color: '#34d399' }}>🟢 Easy</option>
                                                                        <option value="MODERATE" style={{ background: '#0f172a', color: '#fbbf24' }}>🟡 Moderate</option>
                                                                        <option value="DIFFICULT" style={{ background: '#0f172a', color: '#f87171' }}>🔴 Difficult</option>
                                                                    </select>
                                                                </div>
                                                                <button 
                                                                    onClick={() => {
                                                                        handleEdit(q);
                                                                        setActiveTab('questions');
                                                                    }} 
                                                                    style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button 
                                                                    onClick={async () => {
                                                                        if (confirm('Are you sure you want to delete this question?')) {
                                                                            await fetch('/api/questions', {
                                                                                method: 'POST',
                                                                                headers: { 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({
                                                                                    testId: 'global',
                                                                                    question: { id: q.id, _id: q._id },
                                                                                    action: 'DELETE'
                                                                                })
                                                                            });
                                                                            fetchExplorerQuestions(explorerSubject, explorerChapter);
                                                                            fetchStats();
                                                                        }
                                                                    }} 
                                                                    style={{ background: 'transparent', border: '1px solid #ef444466', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Hierarchy Breadcrumb */}
                                                        <div style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '2px 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ color: '#cbd5e1', fontWeight: '500' }}>{q.subject || explorerSubject}</span>
                                                            <span style={{ color: '#64748b' }}>→</span>
                                                            <span style={{ color: '#cbd5e1', fontWeight: '500' }}>{q.chapter || explorerChapter}</span>
                                                            {q.subTopic && (
                                                                <>
                                                                    <span style={{ color: '#64748b' }}>→</span>
                                                                    <span style={{ color: '#2dd4bf', fontWeight: '500' }}>{q.subTopic}</span>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Test Mapping Strip */}
                                                        <div style={{
                                                            margin: '6px 0 12px 0',
                                                            padding: '8px 12px',
                                                            background: 'rgba(255,255,255,0.02)',
                                                            border: '1px solid rgba(255,255,255,0.06)',
                                                            borderRadius: '8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            flexWrap: 'wrap',
                                                            gap: '8px'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    🗺️ Test Mapping:
                                                                </span>
                                                                {q.assignedTests && q.assignedTests.length > 0 ? (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setMappingModalQuestion(q);
                                                                                fetchAllTestsList();
                                                                            }}
                                                                            title="Click to view detailed test mapping table"
                                                                            style={{
                                                                                fontSize: '0.68rem',
                                                                                background: 'rgba(16,185,129,0.15)',
                                                                                color: '#34d399',
                                                                                border: '1px solid rgba(16,185,129,0.35)',
                                                                                padding: '2px 8px',
                                                                                borderRadius: '12px',
                                                                                fontWeight: 'bold',
                                                                                cursor: 'pointer'
                                                                            }}
                                                                        >
                                                                            {q.assignedTests.length} {q.assignedTests.length === 1 ? 'Test' : 'Tests'} ↗
                                                                        </button>
                                                                        {(expandedTestPills[q._id] ? q.assignedTests : q.assignedTests.slice(0, 3)).map(t => {
                                                                            const examColor = t.exam?.includes('NEET') ? '#10b981' : t.exam?.includes('JEE') ? '#3b82f6' : '#8b5cf6';
                                                                            return (
                                                                                <span
                                                                                    key={t.testId}
                                                                                    title={`Test ID: ${t.testId}`}
                                                                                    style={{
                                                                                        display: 'inline-flex',
                                                                                        alignItems: 'center',
                                                                                        gap: '6px',
                                                                                        fontSize: '0.72rem',
                                                                                        background: 'rgba(30,41,59,0.7)',
                                                                                        border: '1px solid rgba(255,255,255,0.12)',
                                                                                        borderRadius: '6px',
                                                                                        padding: '2px 7px',
                                                                                        color: '#e2e8f0'
                                                                                    }}
                                                                                >
                                                                                    <span style={{ fontSize: '0.62rem', fontWeight: 'bold', color: examColor, background: `${examColor}20`, padding: '1px 4px', borderRadius: '3px' }}>
                                                                                        {t.exam || 'TEST'}
                                                                                    </span>
                                                                                    <span style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                        {t.title}
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() => handleUnlinkQuestion(q._id, t.testId, t.title)}
                                                                                        title={`Unlink from ${t.title}`}
                                                                                        style={{
                                                                                            background: 'transparent',
                                                                                            border: 'none',
                                                                                            color: '#94a3b8',
                                                                                            cursor: 'pointer',
                                                                                            fontSize: '0.75rem',
                                                                                            padding: '0 2px',
                                                                                            lineHeight: 1,
                                                                                            transition: 'color 0.15s'
                                                                                        }}
                                                                                        onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                                                                                        onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                                                                                    >
                                                                                        ✕
                                                                                    </button>
                                                                                </span>
                                                                            );
                                                                        })}
                                                                        {q.assignedTests.length > 3 && (
                                                                            <button
                                                                                onClick={() => toggleTestPills(q._id)}
                                                                                style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.72rem', cursor: 'pointer', textDecoration: 'underline' }}
                                                                            >
                                                                                {expandedTestPills[q._id] ? 'Show less' : `+${q.assignedTests.length - 3} more`}
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic' }}>
                                                                        ⚪ Not assigned to any test yet
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <button
                                                                onClick={() => {
                                                                    setMappingModalQuestion(q);
                                                                    fetchAllTestsList();
                                                                }}
                                                                style={{
                                                                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(129,140,248,0.2))',
                                                                    border: '1px solid rgba(99,102,241,0.4)',
                                                                    color: '#a5b4fc',
                                                                    borderRadius: '6px',
                                                                    padding: '3px 10px',
                                                                    fontSize: '0.72rem',
                                                                    fontWeight: '600',
                                                                    cursor: 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                <span>➕</span> Map to Test
                                                            </button>
                                                        </div>

                                                        {/* Question text */}
                                                        <div style={{ color: 'white', lineHeight: '1.5', fontSize: '0.9rem', marginBottom: '10px', whiteSpace: 'pre-line' }}>
                                                            <LatexRenderer text={q.text} />
                                                        </div>

                                                        {/* Numerical correct value or MCQ options */}
                                                        {isNum ? (
                                                            <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Correct Numerical Value:</span>
                                                                <span style={{ fontSize: '0.9rem', color: '#60a5fa', fontWeight: 'bold' }}>{q.correctOption}</span>
                                                            </div>
                                                        ) : (
                                                            q.type !== 'SUBJECTIVE' && q.options && q.options.length > 0 && (
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                                                                    {q.options.map(opt => (
                                                                        <span key={opt.id} style={{ fontSize: '0.8rem', color: opt.id === q.correctOption ? '#10b981' : '#cbd5e1', fontWeight: opt.id === q.correctOption ? 'bold' : 'normal', background: opt.id === q.correctOption ? 'rgba(16,185,129,0.1)' : 'transparent', padding: '4px 8px', borderRadius: '6px' }}>
                                                                            ({opt.id.toUpperCase()}) <LatexRenderer text={opt.text} />
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )
                                                        )}

                                                        {/* Solution / Explanation */}
                                                        {q.explanation && (
                                                            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.06)', fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                                                <span style={{ color: '#818cf8', fontWeight: '600' }}>Explanation: </span>
                                                                <LatexRenderer text={q.explanation} />
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '350px', background: 'rgba(255,255,255,0.01)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.1)', padding: '40px', color: '#64748b' }}>
                                    <span style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</span>
                                    <p style={{ margin: 0, fontSize: '1rem', color: '#cbd5e1', fontWeight: '500' }}>Select a subject and chapter/topic to explore questions.</p>
                                    <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem' }}>View question counts by type (MCQ, Numerical, Assertion–Reasoning) and filter by subtopic.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                  <>
                <div className={styles.editor}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                        <h2 className={styles.subtitle}>{editingQuestion ? `Edit Question #${editingQuestion.id}` : 'Add New Question(s)'}</h2>
                        {!editingQuestion && (
                            <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', flexWrap: 'wrap' }}>
                                <button 
                                    onClick={() => setUploadMode('single')}
                                    style={{
                                        background: uploadMode === 'single' ? '#4f46e5' : 'transparent',
                                        color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: uploadMode === 'single' ? 'bold' : 'normal'
                                    }}
                                >Single Entry</button>
                                <button 
                                    onClick={() => { setUploadMode('ai'); setAiPreview(null); }}
                                    style={{
                                        background: uploadMode === 'ai' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                                        color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
                                    }}
                                >🤖 AI Generate</button>
                                <button 
                                    onClick={() => setUploadMode('bulk')}
                                    style={{
                                        background: uploadMode === 'bulk' ? '#10b981' : 'transparent',
                                        color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: uploadMode === 'bulk' ? 'bold' : 'normal'
                                    }}
                                >Bulk JSON Upload</button>
                                <button
                                    onClick={() => setUploadMode('latex')}
                                    style={{
                                        background: uploadMode === 'latex' ? '#f59e0b' : 'transparent',
                                        color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: uploadMode === 'latex' ? 'bold' : 'normal'
                                    }}
                                >📄 LaTeX Upload</button>
                                {selectedTestId !== 'global' && (
                                    <button 
                                        onClick={() => setUploadMode('link')}
                                        style={{
                                            background: uploadMode === 'link' ? '#14b8a6' : 'transparent',
                                            color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: uploadMode === 'link' ? 'bold' : 'normal'
                                        }}
                                    >🔗 Link from Bank</button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Inline AI Generate Panel ── */}
                    {uploadMode === 'ai' ? (
                        <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '12px', padding: '18px' }}>
                            <p style={{ margin: '0 0 12px', color: '#a5b4fc', fontWeight: '700', fontSize: '0.95rem' }}>🤖 Gemini AI — Generate &amp; Save to: <span style={{ color: 'white' }}>{filteredTests.find(t => t.id === selectedTestId)?.title || selectedTestId}</span></p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                                {/* Subject dropdown */}
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                    Subject
                                    <select value={aiForm.subject} onChange={e => setAiForm(f => ({ ...f, subject: e.target.value }))} style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '14px' }}>
                                        <option value="">Any / All</option>
                                        {globalSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </label>
                                {/* Chapter multi-select dropdown */}
                                {(() => {
                                    // Merge all chapters from all exams for subject
                                    let chapters = [];
                                    if (aiForm.subject) {
                                        const allChapterData = { neet: neetChapters, 'jee-mains': jeeMainsChapters, bitsat: bitsatChapters };
                                        Object.values(allChapterData).forEach(examData => {
                                            if (examData[aiForm.subject]) {
                                                const subjectChapters = examData[aiForm.subject];
                                                if (aiForm.classGrade && subjectChapters[aiForm.classGrade]) {
                                                    chapters.push(...subjectChapters[aiForm.classGrade]);
                                                } else {
                                                    chapters.push(...Object.values(subjectChapters).flat());
                                                }
                                            }
                                        });
                                        chapters = [...new Set(chapters)].sort((a, b) => a.localeCompare(b));
                                    }
                                    const toggleChapter = (ch) => {
                                        setSelectedChapters(prev =>
                                            prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
                                        );
                                    };
                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', gridColumn: chapters.length > 0 ? 'span 2' : 'span 1' }}>
                                            Chapter / Topic
                                            {chapters.length === 0 ? (
                                                <input
                                                    type="text"
                                                    value={aiForm.chapter}
                                                    onChange={e => setAiForm(f => ({ ...f, chapter: e.target.value }))}
                                                    placeholder="e.g. Kinematics (select a subject first)"
                                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '14px' }}
                                                />
                                            ) : (
                                                <div style={{ position: 'relative' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setChapterDropdownOpen(p => !p)}
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '7px 10px', color: selectedChapters.length ? 'white' : '#64748b', fontSize: '14px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                    >
                                                        <span>{selectedChapters.length ? `${selectedChapters.length} chapter${selectedChapters.length > 1 ? 's' : ''} selected` : 'Select chapters…'}</span>
                                                        <span>{chapterDropdownOpen ? '▲' : '▼'}</span>
                                                    </button>
                                                    {chapterDropdownOpen && (
                                                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99, background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', maxHeight: '220px', overflowY: 'auto', marginTop: '4px', padding: '6px' }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', color: '#a5b4fc', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '4px' }}>
                                                                <input type="checkbox"
                                                                    checked={selectedChapters.length === chapters.length}
                                                                    onChange={() => setSelectedChapters(selectedChapters.length === chapters.length ? [] : [...chapters])}
                                                                /> Select All
                                                            </label>
                                                            {chapters.map(ch => (
                                                                <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: '6px', cursor: 'pointer', color: selectedChapters.includes(ch) ? 'white' : '#94a3b8', background: selectedChapters.includes(ch) ? 'rgba(99,102,241,0.15)' : 'transparent' }}>
                                                                    <input type="checkbox" checked={selectedChapters.includes(ch)} onChange={() => toggleChapter(ch)} />
                                                                    {ch}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {selectedChapters.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                                            {selectedChapters.map(ch => (
                                                                <span key={ch} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '20px', padding: '2px 10px', fontSize: '0.75rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    {ch}
                                                                    <button onClick={() => toggleChapter(ch)} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                                {/* Difficulty dropdown */}
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                    Difficulty
                                    <select value={aiForm.difficulty} onChange={e => setAiForm(f => ({ ...f, difficulty: e.target.value }))} style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '14px' }}>
                                        <option value="Mixed">Mixed</option>
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </label>
                                {/* Class Grade */}
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                    Class Grade
                                    <select value={aiForm.classGrade} onChange={e => setAiForm(f => ({ ...f, classGrade: e.target.value }))} style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '14px' }}>
                                        <option value="">Any</option>
                                        <option value="11">Class 11</option>
                                        <option value="12">Class 12</option>
                                    </select>
                                </label>
                                {/* Subtopic dropdown (AI) */}
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                    Subtopic (Optional)
                                    {(() => {
                                        let availableAiSubtopics = [];
                                        if (selectedChapters.length > 0) {
                                            availableAiSubtopics = [...new Set(
                                                availableTests
                                                    .filter(t => t.type === 'SUBTOPIC' && t.subject === aiForm.subject && selectedChapters.includes(t.chapter))
                                                    .map(t => t.title)
                                            )];
                                        }
                                        if (availableAiSubtopics.length === 0) {
                                            availableAiSubtopics = [...new Set(
                                                availableTests
                                                    .filter(t => t.type === 'SUBTOPIC' && t.subject === aiForm.subject)
                                                    .map(t => t.title)
                                            )];
                                        }

                                        return availableAiSubtopics.length > 0 ? (
                                            <select
                                                value={aiForm.subtopic}
                                                onChange={e => setAiForm(f => ({ ...f, subtopic: e.target.value }))}
                                                style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '14px' }}
                                            >
                                                <option value="">— Any / Full Chapter —</option>
                                                {availableAiSubtopics.map(sub => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={aiForm.subtopic}
                                                onChange={e => setAiForm(f => ({ ...f, subtopic: e.target.value }))}
                                                placeholder="e.g. Bohr's Model"
                                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '14px' }}
                                            />
                                        );
                                    })()}
                                </label>
                                {/* Count */}
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                    No. of Questions
                                    <input
                                        type="number" min={1} max={50}
                                        value={aiForm.count}
                                        onChange={e => setAiForm(f => ({ ...f, count: e.target.value }))}
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '7px 10px', color: 'white', fontSize: '14px' }}
                                    />
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: aiPreview ? '16px' : 0 }}>
                                <button
                                    onClick={async () => {
                                        setAiGenerating(true); setAiPreview(null);
                                        try {
                                            const res = await fetch('/api/admin/ai-questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exam: selectedExam, subject: aiForm.subject, chapter: selectedChapters.length ? selectedChapters.join(', ') : aiForm.chapter, subtopic: aiForm.subtopic, classGrade: aiForm.classGrade, difficulty: aiForm.difficulty, count: Number(aiForm.count), saveToDb: false }) });
                                            const data = await res.json();
                                            if (!res.ok) throw new Error(data.error || 'Unknown error');
                                            setAiPreview(data.questions);
                                        } catch(e) { alert('AI Error: ' + e.message); }
                                        finally { setAiGenerating(false); }
                                    }}
                                    disabled={aiGenerating}
                                    style={{ background: aiGenerating ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 18px', fontWeight: '700', cursor: aiGenerating ? 'not-allowed' : 'pointer' }}
                                >
                                    {aiGenerating ? '⏳ Generating...' : '✨ Generate'}
                                </button>
                                {aiPreview && (
                                    <button
                                        onClick={async () => {
                                            setAiSaving(true);
                                            try {
                                                const targetTestId = selectedTestId || 'global';
                                                const normalizedData = aiPreview.map((q, idx) => {
                                                    try {
                                                        const qObj = {
                                                            ...q,
                                                            subject: q.subject || aiForm.subject,
                                                            chapter: q.chapter || (selectedChapters.length ? selectedChapters.join(', ') : aiForm.chapter),
                                                            subtopic: q.subtopic || aiForm.subtopic,
                                                            difficulty: q.difficulty || aiForm.difficulty,
                                                            class: q.class || aiForm.classGrade || 'Class 12'
                                                        };
                                                        return normalizeQuestion(qObj);
                                                    }
                                                    catch (err) { throw new Error(`Error at AI question ${idx + 1}: ${err.message}`); }
                                                });
                                                const res = await fetch('/api/questions', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ testId: targetTestId, question: normalizedData, action: 'ADD_BULK' })
                                                });
                                                const data = await res.json();
                                                if (!res.ok || data.error) throw new Error(data.error || 'Database upload failed');
                                                alert(`✅ Successfully saved ${normalizedData.length} AI questions!`);
                                                setAiPreview(null);
                                                fetchQuestions();
                                            } catch(e) { alert('Save Error: ' + e.message); }
                                            finally { setAiSaving(false); }
                                        }}
                                        disabled={aiSaving}
                                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', padding: '8px 18px', fontWeight: '700', cursor: aiSaving ? 'not-allowed' : 'pointer' }}
                                    >
                                        {aiSaving ? 'Saving...' : `💾 Save ${aiPreview?.length} Questions`}
                                    </button>
                                )}
                                {aiPreview && <button onClick={() => setAiPreview(null)} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>Discard</button>}
                            </div>
                            {/* Preview list */}
                            {aiPreview && (
                                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                    {aiPreview.map((q, i) => (
                                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.07)', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#818cf8', fontWeight: '700', marginRight: '8px' }}>Q{i+1}.</span>
                                            <span style={{ color: 'white' }}><LatexRenderer text={q.text} /></span>
                                            <div style={{ marginTop: '6px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                {q.options?.map(o => (
                                                    <span key={o.id} style={{ fontSize: '0.8rem', color: o.id === q.correctOption ? '#34d399' : '#64748b', fontWeight: o.id === q.correctOption ? 700 : 400 }}>
                                                        ({o.id}) <LatexRenderer text={o.text} /> {o.id === q.correctOption ? '✓' : ''}
                                                    </span>
                                                ))}
                                            </div>
                                            {q.explanation && (
                                                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                                                    <strong>Explanation:</strong> <LatexRenderer text={q.explanation} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : uploadMode === 'latex' ? (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.3)' }}>
                            {/* Header row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                <label style={{ fontSize: '0.95rem', color: '#fbbf24', fontWeight: '700' }}>📄 LaTeX → JSON Converter</label>
                                <select
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value, chapter: '', subtopic: '' })}
                                    className={styles.input}
                                    style={{ width: '120px', margin: 0, padding: '6px 10px' }}
                                >
                                    {globalSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select
                                    value={formData.chapter}
                                    onChange={e => setFormData({ ...formData, chapter: e.target.value, subtopic: '' })}
                                    className={styles.input}
                                    style={{ width: '180px', margin: 0, padding: '6px 10px' }}
                                >
                                    <option value="">— Chapter —</option>
                                    {[...new Set([
                                        ...(neetChapters[formData.subject]?.['11'] || []),
                                        ...(neetChapters[formData.subject]?.['12'] || []),
                                        ...(jeeMainsChapters[formData.subject]?.['11'] || []),
                                        ...(jeeMainsChapters[formData.subject]?.['12'] || []),
                                        ...(bitsatChapters[formData.subject]?.['11'] || []),
                                        ...(bitsatChapters[formData.subject]?.['12'] || [])
                                    ])].sort((a, b) => a.localeCompare(b)).map(ch => <option key={ch} value={ch}>{ch}</option>)}
                                </select>
                                <select
                                    value={formData.subtopic}
                                    onChange={e => setFormData({ ...formData, subtopic: e.target.value })}
                                    className={styles.input}
                                    style={{ width: '180px', margin: 0, padding: '6px 10px' }}
                                    disabled={!formData.chapter}
                                >
                                    <option value="">— Subtopic —</option>
                                    {(CHAPTER_SUBTOPICS[formData.chapter] || []).map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                    {/* Merge with DB stats if needed */}
                                    {(() => {
                                        const dbSubtopics = (stats && stats[formData.subject] && stats[formData.subject][formData.chapter])
                                            ? Object.keys(stats[formData.subject][formData.chapter]).filter(k => !k.startsWith('_'))
                                            : [];
                                        const staticSubs = CHAPTER_SUBTOPICS[formData.chapter] || [];
                                        const extraSubs = dbSubtopics.filter(s => !staticSubs.includes(s));
                                        return extraSubs.map(sub => <option key={sub} value={sub}>{sub}</option>);
                                    })()}
                                </select>
                                <select
                                    value={formData.type || 'MCQ'}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className={styles.input}
                                    style={{ width: '150px', margin: 0, padding: '6px 10px' }}
                                >
                                    <option value="MCQ">MCQ</option>
                                    <option value="NUMERICAL">Numerical</option>
                                    <option value="ASSERTION_REASON">Assertion/Reasoning</option>
                                </select>
                                {/* Sample template button */}
                                <button
                                    onClick={() => {
                                        setLatexInput(
`% ── Format 2: Numbered style (most common) ──────────────────────────
% Paste your questions below. Answer key goes at the END.

1. The SI unit of electric charge is:
(A) Ampere
(B) Coulomb
(C) Volt
(D) Ohm

2. Speed of light in vacuum is approximately:
(A) $3 \\times 10^6$ m/s
(B) $3 \\times 10^8$ m/s
(C) $3 \\times 10^{10}$ m/s
(D) $3 \\times 10^{4}$ m/s

3. Which of the following is a vector quantity?
(A) Speed
(B) Temperature
(C) Velocity
(D) Mass

ANSWER KEY
1-B  2-B  3-C`);
                                        setLatexError('');
                                        setLatexPreview(null);
                                        setDetectedFormat('');
                                    }}
                                    style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#fbbf24', borderRadius: '7px', padding: '5px 13px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
                                >
                                    📋 Sample
                                </button>
                                <input type="file" accept=".tex,.txt" onChange={handleLatexFileUpload} style={{ fontSize: '0.85rem', color: '#cbd5e1' }} />
                            </div>

                            {/* Format guide */}
                            <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.82rem', color: '#94a3b8' }}>
                                <strong style={{ color: '#fbbf24' }}>3 Supported Formats — auto-detected:</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '8px', marginTop: '8px' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '8px 10px' }}>
                                        <div style={{ color: '#c084fc', fontWeight: '700', marginBottom: '4px' }}>① enumerate style</div>
                                        <code style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'pre' }}>{`\\item Question\n\\begin{enumerate}\n\\item Opt A\n\\end{enumerate}\n...\n1. A  2. C`}</code>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '8px 10px' }}>
                                        <div style={{ color: '#34d399', fontWeight: '700', marginBottom: '4px' }}>② numbered style</div>
                                        <code style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'pre' }}>{`1. Question text\n(A) Option A\n(B) Option B\n...\nANSWER KEY\n1-A  2-C`}</code>
                                    </div>
                                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '8px 10px' }}>
                                        <div style={{ color: '#60a5fa', fontWeight: '700', marginBottom: '4px' }}>③ MCQ class style</div>
                                        <code style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'pre' }}>{`\\question Text\n\\choice A \\choice B\n\\choice C \\choice D\nAnswer: A`}</code>
                                    </div>
                                </div>
                                <div style={{ marginTop: '8px', color: '#64748b' }}>
                                    💡 LaTeX math works everywhere: <code>$x^2$</code> or <code>{"$$\\frac{a}{b}$$"}</code> — rendered via KaTeX.
                                    Answer key can be at the end as <code>1-A 2-B</code> or <code>ANSWER KEY\n1. A\n2. C</code>
                                </div>
                            </div>

                            <textarea
                                className={styles.textarea}
                                rows={14}
                                value={latexInput}
                                onChange={e => { setLatexInput(e.target.value); setLatexError(''); setLatexPreview(null); setDetectedFormat(''); }}
                                placeholder={'Paste your LaTeX questions here, or click "📋 Sample" above to see a working example.'}
                                style={{ fontFamily: 'monospace', fontSize: '0.85rem', background: '#0f172a' }}
                            />

                            {latexError && (
                                <div style={{ color: '#ef4444', marginTop: '10px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                    {latexError}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button
                                    onClick={handleLatexConvert}
                                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', border: 'none', borderRadius: '8px', padding: '9px 20px', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    ⚡ Convert to JSON
                                </button>
                                {latexPreview && (
                                    <button
                                        onClick={handleLatexUpload}
                                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#10b981', borderRadius: '8px', padding: '9px 20px', fontWeight: '700', cursor: 'pointer' }}
                                    >
                                        💾 Save {latexPreview.length} Question{latexPreview.length !== 1 ? 's' : ''} to DB
                                    </button>
                                )}
                                {latexPreview && (
                                    <button
                                        onClick={() => setShowLatexJson(p => !p)}
                                        style={{ background: showLatexJson ? 'rgba(99,102,241,0.25)' : 'transparent', border: '1px solid rgba(99,102,241,0.5)', color: '#a5b4fc', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        {showLatexJson ? '🙈 Hide JSON' : '{ } View JSON'}
                                    </button>
                                )}
                                {latexPreview && (
                                    <button onClick={() => { setLatexPreview(null); setDetectedFormat(''); setShowLatexJson(false); }} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '8px', padding: '9px 14px', cursor: 'pointer' }}>Discard</button>
                                )}
                            </div>

                            {latexPreview && (
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                        <p style={{ color: '#a3e635', fontSize: '0.85rem', margin: 0 }}>✅ Parsed <strong>{latexPreview.length}</strong> question{latexPreview.length !== 1 ? 's' : ''}</p>
                                        {detectedFormat && (
                                            <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: '20px', padding: '2px 10px' }}>
                                                Detected: {detectedFormat}
                                            </span>
                                        )}
                                    </div>

                                    {/* JSON raw output */}
                                    {showLatexJson && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Converted JSON — copy &amp; inspect</span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(latexPreview, null, 2))}
                                                    style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}
                                                >📋 Copy</button>
                                            </div>
                                            <textarea
                                                readOnly
                                                value={JSON.stringify(latexPreview, null, 2)}
                                                rows={10}
                                                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.78rem', background: '#0a0f1e', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', padding: '10px', color: '#a5b4fc', resize: 'vertical', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    )}

                                    {/* Rendered preview */}
                                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px' }}>Review below before saving (LaTeX math rendered via KaTeX):</p>
                                    <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {latexPreview.map((q, i) => (
                                            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px 14px', border: `1px solid ${q.options.length < 2 ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`, fontSize: '0.85rem' }}>
                                                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                    <span style={{ color: '#818cf8', fontWeight: '700', whiteSpace: 'nowrap', marginTop: '2px' }}>Q{i + 1}.</span>
                                                    <span style={{ flex: 1 }}><LatexRenderer text={q.text} /></span>
                                                    <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: '700', whiteSpace: 'nowrap', background: 'rgba(52,211,153,0.1)', borderRadius: '4px', padding: '2px 7px' }}>Ans: {q.correctOption.toUpperCase()}</span>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                                                    {q.options.map(o => (
                                                        <span key={o.id} style={{ fontSize: '0.8rem', color: o.id === q.correctOption ? '#34d399' : '#64748b', fontWeight: o.id === q.correctOption ? 700 : 400, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ background: o.id === q.correctOption ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '4px', padding: '1px 6px', minWidth: '22px', textAlign: 'center' }}>{o.id.toUpperCase()}</span>
                                                            <LatexRenderer text={o.text} />
                                                            {o.id === q.correctOption && <span style={{ color: '#34d399' }}>✓</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                                {q.options.length < 2 && (
                                                    <div style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '6px' }}>⚠️ Less than 2 options detected — check your LaTeX format</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {bulkError && <div style={{ color: '#ef4444', marginTop: '10px', fontSize: '0.9rem' }}>{bulkError}</div>}
                        </div>
                    ) : uploadMode === 'bulk' ? (
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <label style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Apply tags to all:</label>
                                    <select
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value, chapter: '', subtopic: '' })}
                                        className={styles.input}
                                        style={{ width: '140px', margin: 0 }}
                                    >
                                        {globalSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <select
                                        value={formData.chapter}
                                        onChange={e => setFormData({ ...formData, chapter: e.target.value, subtopic: '' })}
                                        className={styles.input}
                                        style={{ width: '200px', margin: 0 }}
                                    >
                                        <option value="">— Select Chapter —</option>
                                        {[...new Set([
                                            ...(neetChapters[formData.subject]?.['11'] || []),
                                            ...(neetChapters[formData.subject]?.['12'] || []),
                                            ...(jeeMainsChapters[formData.subject]?.['11'] || []),
                                            ...(jeeMainsChapters[formData.subject]?.['12'] || []),
                                            ...(bitsatChapters[formData.subject]?.['11'] || []),
                                            ...(bitsatChapters[formData.subject]?.['12'] || [])
                                        ])].sort((a, b) => a.localeCompare(b)).map(ch => <option key={ch} value={ch}>{ch}</option>)}
                                    </select>
                                    <select
                                        value={formData.subtopic}
                                        onChange={e => setFormData({ ...formData, subtopic: e.target.value })}
                                        className={styles.input}
                                        style={{ width: '200px', margin: 0 }}
                                        disabled={!formData.chapter}
                                    >
                                        <option value="">— Select Subtopic —</option>
                                        {(CHAPTER_SUBTOPICS[formData.chapter] || []).map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                        {(() => {
                                            const dbSubtopics = (stats && stats[formData.subject] && stats[formData.subject][formData.chapter])
                                                ? Object.keys(stats[formData.subject][formData.chapter]).filter(k => !k.startsWith('_'))
                                                : [];
                                            const staticSubs = CHAPTER_SUBTOPICS[formData.chapter] || [];
                                            const extraSubs = dbSubtopics.filter(s => !staticSubs.includes(s));
                                            return extraSubs.map(sub => <option key={sub} value={sub}>{sub}</option>);
                                        })()}
                                    </select>
                                    <select
                                        value={formData.type || 'MCQ'}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className={styles.input}
                                        style={{ width: '150px', margin: 0 }}
                                    >
                                        <option value="MCQ">MCQ</option>
                                        <option value="NUMERICAL">Numerical</option>
                                        <option value="ASSERTION_REASON">Assertion/Reasoning</option>
                                    </select>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '10px' }}>
                                    Paste a JSON array of questions or upload a <code>.json</code> file.
                                </p>
                                <input 
                                    type="file" 
                                    accept=".json" 
                                    onChange={handleFileUploadBulk} 
                                    style={{ fontSize: '0.9rem', color: '#cbd5e1' }}
                                />
                            </div>
                            
                            {bulkError && <div style={{ color: '#ef4444', marginBottom: '10px', fontSize: '0.9rem', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>{bulkError}</div>}
                            
                            <textarea
                                className={styles.textarea}
                                rows={15}
                                value={bulkJson}
                                onChange={e => { setBulkJson(e.target.value); setBulkError(''); }}
                                placeholder="[{ &quot;subject&quot;: &quot;Physics&quot;, &quot;text&quot;: &quot;...&quot;, &quot;correctOption&quot;: &quot;a&quot;, &quot;options&quot;: [{ &quot;id&quot;: &quot;a&quot;, &quot;text&quot;: &quot;...&quot; }] }]"
                                style={{ fontFamily: 'monospace', fontSize: '0.9rem', background: '#0f172a' }}
                            />
                            
                            <div className={styles.actions} style={{ marginTop: '20px' }}>
                                <button className={styles.saveBtn} style={{ background: '#10b981' }} onClick={handleBulkUpload}>
                                    Upload Bulk Questions
                                </button>
                            </div>
                        </div>
                    ) : uploadMode === 'link' ? (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <p style={{ margin: '0 0 12px', color: '#14b8a6', fontWeight: '700', fontSize: '0.95rem' }}>🔗 Link Existing Questions to: <span style={{ color: 'white' }}>{filteredTests.find(t => t.id === selectedTestId)?.title || selectedTestId}</span></p>
                            
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="Search by text..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '14px', minWidth: '200px' }}
                                />
                                <select
                                    value={searchSubject}
                                    onChange={e => setSearchSubject(e.target.value)}
                                    style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '14px' }}
                                >
                                    <option value="ALL">All Subjects</option>
                                    {globalSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <button 
                                    onClick={fetchGlobalQuestions}
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}
                                >
                                    🔄 Refresh Bank
                                </button>
                            </div>

                            {loadingGlobal ? (
                                <p style={{ color: 'var(--text-muted)' }}>Loading Central Bank...</p>
                            ) : (
                                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {(() => {
                                        const filtered = globalQuestions.filter(q => {
                                            if (searchSubject !== 'ALL' && q.subject !== searchSubject) return false;
                                            if (searchTerm.trim()) {
                                                const term = searchTerm.toLowerCase();
                                                const matchesText = q.text?.toLowerCase().includes(term);
                                                const matchesChapter = q.chapter?.toLowerCase().includes(term);
                                                if (!matchesText && !matchesChapter) return false;
                                            }
                                            return true;
                                        });

                                        if (filtered.length === 0) {
                                            return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No matching questions found in Central Bank.</p>;
                                        }

                                        return filtered.map((q) => {
                                            const isLinked = questions.some(tq => tq._id === q._id);
                                            return (
                                                <div key={q._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 16px' }}>
                                                    <div style={{ flex: 1, fontSize: '0.85rem' }}>
                                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px', fontSize: '0.75rem' }}>
                                                            <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>#{q.id}</span>
                                                            <span style={{ color: 'var(--accent)', background: 'rgba(99,102,241,0.15)', padding: '1px 6px', borderRadius: '4px' }}>{q.subject}</span>
                                                            {q.chapter && <span style={{ color: '#a5b4fc', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>{q.chapter}</span>}
                                                            <span style={{ color: q.type === 'SUBJECTIVE' ? '#f59e0b' : '#34d399', fontWeight: 'bold' }}>{q.type}</span>
                                                        </div>
                                                        <div style={{ color: 'white', lineHeight: '1.4' }}>
                                                            <LatexRenderer text={q.text} />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleToggleLink(q, isLinked)}
                                                        style={{
                                                            background: isLinked ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                                                            border: `1px solid ${isLinked ? '#ef4444' : '#10b981'}`,
                                                            color: isLinked ? '#ef4444' : '#10b981',
                                                            borderRadius: '6px',
                                                            padding: '6px 14px',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            whiteSpace: 'nowrap',
                                                            alignSelf: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {isLinked ? '❌ Unlink' : '➕ Link to Test'}
                                                    </button>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}
                        </div>
                    ) : (
                    <div className={styles.formGrid}>
                        {/* Jump to Question # */}
                        <div className={styles.col2}>
                            <label>Question Type
                                <select
                                    value={formData.type || 'MCQ'}
                                    onChange={e => {
                                        const newType = e.target.value;
                                        let updated = { ...formData, type: newType };
                                        if (newType === 'ASSERTION_REASON' && (!formData.optionA || formData.optionA.trim() === '')) {
                                            updated.optionA = "Both Assertion (A) and Reason (R) are true and Reason (R) is the correct explanation of Assertion (A).";
                                            updated.optionB = "Both Assertion (A) and Reason (R) are true but Reason (R) is NOT the correct explanation of Assertion (A).";
                                            updated.optionC = "Assertion (A) is true but Reason (R) is false.";
                                            updated.optionD = "Assertion (A) is false but Reason (R) is true.";
                                        }
                                        setFormData(updated);
                                    }}
                                    className={styles.input}
                                >
                                    <option value="MCQ">Multiple Choice (MCQ)</option>
                                    <option value="NUMERICAL">Numerical Value</option>
                                    <option value="ASSERTION_REASON">Assertion & Reasoning</option>
                                </select>
                            </label>
                            <label>Question No.
                                <select
                                    value={editingQuestion?.id || ''}
                                    onChange={e => {
                                        const qId = Number(e.target.value);
                                        if (!qId) { resetForm(); return; }
                                        const found = questions.find(q => q.id === qId);
                                        if (found) handleEdit(found);
                                    }}
                                    className={styles.input}
                                >
                                    <option value="">— Add New Question —</option>
                                    {questions.map(q => (
                                        <option key={q.id} value={q.id}>
                                            #{q.id} [{q.subject}] {q.text?.slice(0, 50)}{q.text?.length > 50 ? '…' : ''}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        
                        <div className={styles.col2}>
                            <label>Subject
                                <select
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value, chapter: '', subtopic: '' })}
                                    className={styles.input}
                                >
                                    {globalSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </label>
                            <label>Chapter / Topic
                                {(() => {
                                    // Always start with the full static chapter list for the selected subject
                                    const staticChapters = STATIC_CHAPTER_MAP[formData.subject] || [];

                                    // Merge with any chapters already in DB stats (so newly added chapters also appear)
                                    const dbChapters = (stats && stats[formData.subject])
                                        ? Object.keys(stats[formData.subject]).filter(k => !k.startsWith('_') && !LEGACY_UMBRELLAS.has(k.toLowerCase()) && !EXCLUDED_NEET_CHAPTERS.has(k.toLowerCase()))
                                        : [];

                                    // Combine & deduplicate, sorted alphabetically
                                    const allChapters = [...new Set([...staticChapters, ...dbChapters])].sort((a, b) => a.localeCompare(b));

                                    return allChapters.length > 0 ? (
                                        <select
                                            value={formData.chapter}
                                            onChange={e => setFormData({ ...formData, chapter: e.target.value, subtopic: '' })}
                                            className={styles.input}
                                        >
                                            <option value="">— Select Chapter —</option>
                                            {allChapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={formData.chapter}
                                            onChange={e => setFormData({ ...formData, chapter: e.target.value, subtopic: '' })}
                                            className={styles.input}
                                            placeholder="Enter Chapter Name"
                                        />
                                    );
                                })()}
                            </label>
                        </div>
                        
                        <div className={styles.col2} style={{ marginBottom: '1rem' }}>
                            <label>Subtopic / Topic
                                {(() => {
                                    if (!formData.chapter) {
                                        return (
                                            <input
                                                type="text"
                                                value={formData.subtopic}
                                                onChange={e => setFormData({ ...formData, subtopic: e.target.value })}
                                                className={styles.input}
                                                placeholder="Select a chapter first to see subtopics"
                                                disabled
                                                style={{ opacity: 0.45, cursor: 'not-allowed' }}
                                            />
                                        );
                                    }

                                    const staticSubtopics = CHAPTER_SUBTOPICS[formData.chapter] || [];

                                    // Merge with any subtopics already stored in DB for this subject+chapter
                                    const dbSubtopics = (
                                        stats &&
                                        stats[formData.subject] &&
                                        stats[formData.subject][formData.chapter]
                                    )
                                        ? Object.keys(stats[formData.subject][formData.chapter]).filter(k => !k.startsWith('_'))
                                        : [];

                                    const allSubtopics = [...new Set([...staticSubtopics, ...dbSubtopics])].sort((a, b) => a.localeCompare(b));

                                    return allSubtopics.length > 0 ? (
                                        <select
                                            value={formData.subtopic}
                                            onChange={e => setFormData({ ...formData, subtopic: e.target.value })}
                                            className={styles.input}
                                        >
                                            <option value="">— Select Subtopic (optional) —</option>
                                            {allSubtopics.map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={formData.subtopic}
                                            onChange={e => setFormData({ ...formData, subtopic: e.target.value })}
                                            className={styles.input}
                                            placeholder="e.g. Bohr's Model, Kinematics in 1D, etc."
                                        />
                                    );
                                })()}
                            </label>

                            <label>Difficulty Level
                                <select
                                    value={formData.difficulty || 'Medium'}
                                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                    className={styles.input}
                                    style={{
                                        borderColor: (formData.difficulty === 'Easy') ? '#10b981' : (formData.difficulty === 'Hard' || formData.difficulty === 'Difficult') ? '#ef4444' : '#f59e0b',
                                        color: (formData.difficulty === 'Easy') ? '#34d399' : (formData.difficulty === 'Hard' || formData.difficulty === 'Difficult') ? '#f87171' : '#fbbf24',
                                        fontWeight: 600
                                    }}
                                >
                                    <option value="Easy">🟢 Easy</option>
                                    <option value="Medium">🟡 Medium / Moderate</option>
                                    <option value="Hard">🔴 Hard / Difficult</option>
                                </select>
                            </label>
                        </div>

                        {/* Test Mapping & Tagged Tests Panel */}
                        <div style={{
                            marginBottom: '1.25rem',
                            padding: '1rem',
                            background: 'rgba(30, 41, 59, 0.45)',
                            borderRadius: '10px',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        🗺️ Test Mapping & Tagged Tests
                                    </span>
                                    {editingQuestion && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            background: editingQuestionAssignedTests.length > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)',
                                            color: editingQuestionAssignedTests.length > 0 ? '#34d399' : '#f87171',
                                            border: `1px solid ${editingQuestionAssignedTests.length > 0 ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.25)'}`,
                                            fontWeight: 600
                                        }}>
                                            {loadingQuestionTests ? 'Checking tests...' : `${editingQuestionAssignedTests.length} Assigned`}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!editingQuestion) {
                                                alert('Please save the question first before mapping to tests.');
                                                return;
                                            }
                                            fetchAllTestsList();
                                            setMappingModalQuestion({
                                                ...editingQuestion,
                                                assignedTests: editingQuestionAssignedTests
                                            });
                                        }}
                                        style={{
                                            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '6px 14px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            boxShadow: '0 2px 8px rgba(79,70,229,0.3)'
                                        }}
                                    >
                                        ➕ Map to Test
                                    </button>
                                </div>
                            </div>

                            {/* Mapped Tests list */}
                            {loadingQuestionTests ? (
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                    Loading mapped test papers...
                                </div>
                            ) : editingQuestion ? (
                                editingQuestionAssignedTests.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {editingQuestionAssignedTests.map(test => (
                                            <div
                                                key={test.testId}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    background: 'rgba(15, 23, 42, 0.75)',
                                                    border: '1px solid rgba(99, 102, 241, 0.35)',
                                                    padding: '5px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    background: test.exam === 'jee' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                                                    color: test.exam === 'jee' ? '#60a5fa' : '#34d399',
                                                    border: `1px solid ${test.exam === 'jee' ? 'rgba(59,130,246,0.4)' : 'rgba(16,185,129,0.4)'}`,
                                                    padding: '1px 5px',
                                                    borderRadius: '4px',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {test.exam || 'TEST'}
                                                </span>
                                                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                                                    {test.title || test.testId}
                                                </span>
                                                <button
                                                    type="button"
                                                    title={`Unlink from ${test.title || test.testId}`}
                                                    onClick={() => handleUnlinkQuestion(editingQuestion._id, test.testId, test.title || test.testId)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#94a3b8',
                                                        cursor: 'pointer',
                                                        padding: '0 2px',
                                                        fontSize: '0.85rem',
                                                        lineHeight: 1,
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                    onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        This question is not mapped to any tests yet. Click <strong>➕ Map to Test</strong> to link it to test papers.
                                    </div>
                                )
                            ) : (
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    Save this question to map it to test papers.
                                </div>
                            )}
                        </div>



                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                            {formData.type === 'NUMERICAL' ? (
                                <label style={{ flex: 1, paddingRight: '1rem' }}>Correct Numerical Value / Answer
                                    <input
                                        type="text"
                                        value={formData.correctOption}
                                        onChange={e => setFormData({ ...formData, correctOption: e.target.value })}
                                        className={styles.input}
                                        placeholder="e.g. 5.25 or 10"
                                    />
                                </label>
                            ) : (
                                <label style={{ flex: 1, paddingRight: '1rem' }}>Correct Option
                                    <select
                                        value={formData.correctOption}
                                        onChange={e => setFormData({ ...formData, correctOption: e.target.value })}
                                        className={styles.input}
                                    >
                                        <option value="a">Option A</option>
                                        <option value="b">Option B</option>
                                        <option value="c">Option C</option>
                                        <option value="d">Option D</option>
                                    </select>
                                </label>
                            )}
                            {editingQuestion && (
                                <button
                                    onClick={() => { if (confirm(`Delete Question #${editingQuestion.id}?`)) { handleDelete(editingQuestion); resetForm(); } }}
                                    style={{ marginLeft: '16px', marginTop: '20px', background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: '700', whiteSpace: 'nowrap' }}
                                >
                                    🗑 Delete Q#{editingQuestion.id}
                                </button>
                            )}
                        </div>

                        <label>Question Text (Supports LaTeX: $math$ or $$math$$)
                            <textarea
                                className={styles.textarea}
                                rows={3}
                                value={formData.text}
                                onChange={e => setFormData({ ...formData, text: e.target.value })}
                                placeholder="Enter question. Use $x^2$ for inline math."
                            />
                            <div style={{ marginTop: '10px' }}>
                                <small>Attach Image (Optional): </small>
                                <input type="file" onChange={(e) => handleFileUpload(e, 'image')} accept="image/*" />
                                {formData.image && <img src={formData.image} alt="Preview" style={{ maxHeight: '100px', display: 'block', marginTop: '5px' }} />}
                            </div>
                            {formData.text && <div className={styles.preview}><small>Preview:</small> <LatexRenderer text={formData.text} /></div>}
                        </label>

                        {formData.type !== 'NUMERICAL' && (
                            <div className={styles.col2}>
                                <div>
                                    <input className={styles.input} placeholder="Option A" value={formData.optionA} onChange={e => setFormData({ ...formData, optionA: e.target.value })} />
                                    <input type="file" onChange={(e) => handleFileUpload(e, 'optionAImage')} accept="image/*" style={{ fontSize: '0.8rem', marginTop: '5px' }} />
                                    {formData.optionAImage && <img src={formData.optionAImage} alt="Opt A" style={{ maxHeight: '50px', display: 'block' }} />}
                                    {formData.optionA && <div className={styles.previewSmall}><LatexRenderer text={formData.optionA} /></div>}
                                </div>
                                <div>
                                    <input className={styles.input} placeholder="Option B" value={formData.optionB} onChange={e => setFormData({ ...formData, optionB: e.target.value })} />
                                    <input type="file" onChange={(e) => handleFileUpload(e, 'optionBImage')} accept="image/*" style={{ fontSize: '0.8rem', marginTop: '5px' }} />
                                    {formData.optionBImage && <img src={formData.optionBImage} alt="Opt B" style={{ maxHeight: '50px', display: 'block' }} />}
                                    {formData.optionB && <div className={styles.previewSmall}><LatexRenderer text={formData.optionB} /></div>}
                                </div>
                                <div>
                                    <input className={styles.input} placeholder="Option C" value={formData.optionC} onChange={e => setFormData({ ...formData, optionC: e.target.value })} />
                                    <input type="file" onChange={(e) => handleFileUpload(e, 'optionCImage')} accept="image/*" style={{ fontSize: '0.8rem', marginTop: '5px' }} />
                                    {formData.optionCImage && <img src={formData.optionCImage} alt="Opt C" style={{ maxHeight: '50px', display: 'block' }} />}
                                    {formData.optionC && <div className={styles.previewSmall}><LatexRenderer text={formData.optionC} /></div>}
                                </div>
                                <div>
                                    <input className={styles.input} placeholder="Option D" value={formData.optionD} onChange={e => setFormData({ ...formData, optionD: e.target.value })} />
                                    <input type="file" onChange={(e) => handleFileUpload(e, 'optionDImage')} accept="image/*" style={{ fontSize: '0.8rem', marginTop: '5px' }} />
                                    {formData.optionDImage && <img src={formData.optionDImage} alt="Opt D" style={{ maxHeight: '50px', display: 'block' }} />}
                                    {formData.optionD && <div className={styles.previewSmall}><LatexRenderer text={formData.optionD} /></div>}
                                </div>
                            </div>
                        )}

                        <label>Explanation
                            <textarea
                                className={styles.textarea}
                                rows={2}
                                value={formData.explanation}
                                onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                                placeholder="Explain the solution..."
                            />
                            {formData.explanation && <div className={styles.preview}><small>Preview:</small> <LatexRenderer text={formData.explanation} /></div>}
                        </label>

                        <div className={styles.actions}>
                            <button
                                className={styles.saveBtn}
                                onClick={handleSave}
                                disabled={savingQuestion}
                                style={{ opacity: savingQuestion ? 0.7 : 1, cursor: savingQuestion ? 'not-allowed' : 'pointer' }}
                            >
                                {savingQuestion ? 'Saving...' : (editingQuestion ? 'Update Question' : 'Add Question')}
                            </button>
                            {editingQuestion && <button className={styles.cancelBtn} onClick={resetForm}>Cancel</button>}
                        </div>
                    </div>
                    )}
                </div>

                <div className={styles.list}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                            <h2 className={styles.subtitle} style={{ margin: 0 }}>Existing Questions ({questions.length})</h2>
                            
                            {/* Subject Filter */}
                            <select
                                value={filterSubject}
                                onChange={e => { setFilterSubject(e.target.value); setFilterChapter('ALL'); setCurrentPage(1); }}
                                className={styles.select}
                                style={{ margin: 0, padding: '6px 12px', fontSize: '0.85rem' }}
                            >
                                <option value="ALL">All Subjects</option>
                                {globalSubjects.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            {/* Chapter Filter */}
                            {filterSubject !== 'ALL' && (
                                <select
                                    value={filterChapter}
                                    onChange={e => { setFilterChapter(e.target.value); setCurrentPage(1); }}
                                    className={styles.select}
                                    style={{ margin: 0, padding: '6px 12px', fontSize: '0.85rem' }}
                                >
                                    <option value="ALL">All Chapters</option>
                                    {(() => {
                                        const dbChapters = (stats && stats[filterSubject])
                                            ? Object.keys(stats[filterSubject]).filter(k => !k.startsWith('_') && !LEGACY_UMBRELLAS.has(k.toLowerCase()) && !EXCLUDED_NEET_CHAPTERS.has(k.toLowerCase()))
                                            : [];
                                        const uniqueChapters = [...new Set([...(STATIC_CHAPTER_MAP[filterSubject] || []), ...dbChapters])].sort((a, b) => a.localeCompare(b));
                                        return uniqueChapters.map(ch => (
                                            <option key={ch} value={ch}>{ch}</option>
                                        ));
                                    })()}
                                </select>
                            )}
                        </div>
                        {questions.length > questionsPerPage && (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                                >
                                    &lt; Prev
                                </button>
                                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                                    Range: {(currentPage - 1) * questionsPerPage + 1} - {Math.min(currentPage * questionsPerPage, questions.length)}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(questions.length / questionsPerPage), p + 1))}
                                    disabled={currentPage === Math.ceil(questions.length / questionsPerPage)}
                                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: currentPage === Math.ceil(questions.length / questionsPerPage) ? 'not-allowed' : 'pointer', opacity: currentPage === Math.ceil(questions.length / questionsPerPage) ? 0.5 : 1 }}
                                >
                                    Next &gt;
                                </button>
                            </div>
                        )}
                    </div>
                    {loading ? <p>Loading...</p> : (
                        questions.length === 0 ? <p className={styles.empty}>No custom questions added yet. (Mock data will be used mostly)</p> :
                            questions.slice((currentPage - 1) * questionsPerPage, currentPage * questionsPerPage).map(q => (
                                <div key={q.id} className={styles.questionItem}>
                                    <div className={styles.qHeader}>
                                        <span className={styles.qId}>#{q.id}</span>
                                        <span className={styles.qSubject}>{q.subject}</span>
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            padding: '3px 8px', 
                                            background: q.type === 'NUMERICAL' ? '#8b5cf6' : q.type === 'ASSERTION_REASON' ? '#f59e0b' : '#3b82f6', 
                                            color: 'white', 
                                            borderRadius: '6px', 
                                            fontWeight: 'bold' 
                                        }}>
                                            {q.type === 'ASSERTION_REASON' ? 'ASSERTION & REASON' : (q.type || 'MCQ')}
                                        </span>
                                        <div className={styles.qActions}>
                                            <button onClick={() => handleEdit(q)} className={styles.editBtn}>Edit</button>
                                            <button onClick={() => handleDelete(q)} className={styles.deleteBtn}>Delete</button>
                                        </div>
                                    </div>
                                    <div className={styles.qText} style={{ whiteSpace: 'pre-line' }}>
                                        <LatexRenderer text={q.text} />
                                        {q.image && <img src={q.image} alt="Q" style={{ maxHeight: '100px', display: 'block', marginTop: '10px' }} />}
                                    </div>
                                    {q.type === 'NUMERICAL' ? (
                                        <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '6px' }}>
                                            Correct Answer: {q.correctOption}
                                        </div>
                                    ) : (
                                        q.options && (
                                            <div className={styles.qOptions}>
                                                <span className={q.correctOption === 'a' ? styles.correct : ''}>
                                                    A: <LatexRenderer text={q.options[0]?.text || ""} />
                                                    {q.options[0]?.image && <img src={q.options[0]?.image} alt="Opt A" style={{ maxHeight: '40px', display: 'block' }} />}
                                                </span>
                                                <span className={q.correctOption === 'b' ? styles.correct : ''}>
                                                    B: <LatexRenderer text={q.options[1]?.text || ""} />
                                                    {q.options[1]?.image && <img src={q.options[1]?.image} alt="Opt B" style={{ maxHeight: '40px', display: 'block' }} />}
                                                </span>
                                                <span className={q.correctOption === 'c' ? styles.correct : ''}>
                                                    C: <LatexRenderer text={q.options[2]?.text || ""} />
                                                    {q.options[2]?.image && <img src={q.options[2]?.image} alt="Opt C" style={{ maxHeight: '40px', display: 'block' }} />}
                                                </span>
                                                <span className={q.correctOption === 'd' ? styles.correct : ''}>
                                                    D: <LatexRenderer text={q.options[3]?.text || ""} />
                                                    {q.options[3]?.image && <img src={q.options[3]?.image} alt="Opt D" style={{ maxHeight: '40px', display: 'block' }} />}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            ))
                    )}
                </div>
                  </>
                )}

                {mappingModalQuestion && (
                    <QuestionMappingModal
                        question={mappingModalQuestion}
                        allTests={allTestsList}
                        loadingTests={loadingTestsList}
                        onClose={() => setMappingModalQuestion(null)}
                        onLink={handleLinkQuestion}
                        onUnlink={(testId, testTitle) => handleUnlinkQuestion(mappingModalQuestion._id, testId, testTitle)}
                        onUpdateDifficulty={handleUpdateDifficulty}
                    />
                )}
            </div>
        </div>
    );
}

// 10-Year JEE Main PYQ Pattern & Chapter Weightage Blueprint
// Based on historical analysis of JEE Main (2015-2025) across 100+ shift papers.

export const JEE_MAIN_10_YEAR_TRENDS = {
  Physics: {
    // Top-tier chapters (~40% weightage)
    "Current Electricity": { weight: 8.5, cls: 12, avgQs: 2.1 },
    "Electrostatics": { weight: 8.0, cls: 12, avgQs: 2.0 },
    "Optics": { weight: 8.0, cls: 12, avgQs: 2.0 },
    "Rotational Motion": { weight: 7.0, cls: 11, avgQs: 1.8 },
    "Thermodynamics": { weight: 6.5, cls: 11, avgQs: 1.6 },
    "Magnetic Effects of Current and Magnetism": { weight: 6.5, cls: 12, avgQs: 1.6 },
    // Mid-tier chapters (~40% weightage)
    "Kinematics": { weight: 6.0, cls: 11, avgQs: 1.5 },
    "Laws of Motion": { weight: 5.5, cls: 11, avgQs: 1.4 },
    "Work, Energy & Power": { weight: 5.5, cls: 11, avgQs: 1.4 },
    "Dual Nature of Matter and Radiation": { weight: 5.0, cls: 12, avgQs: 1.3 },
    "Atoms and Nuclei": { weight: 5.0, cls: 12, avgQs: 1.3 },
    "Electromagnetic Induction and Alternating Currents": { weight: 5.0, cls: 12, avgQs: 1.3 },
    "Gravitation": { weight: 4.5, cls: 11, avgQs: 1.1 },
    "Properties of Solids and Liquids": { weight: 4.5, cls: 11, avgQs: 1.1 },
    "Oscillations and Waves": { weight: 4.5, cls: 11, avgQs: 1.1 },
    // Foundational & specialized (~20% weightage)
    "Electronic Devices": { weight: 3.5, cls: 12, avgQs: 0.9 },
    "Kinetic Theory of Gases": { weight: 3.0, cls: 11, avgQs: 0.8 },
    "Electromagnetic Waves": { weight: 2.5, cls: 12, avgQs: 0.6 },
    "Physics and Measurement": { weight: 2.5, cls: 11, avgQs: 0.6 },
    "Experimental Skills": { weight: 1.5, cls: 12, avgQs: 0.4 }
  },
  Chemistry: {
    // Top-tier chapters (~40% weightage)
    "Chemical Bonding and Molecular Structure": { weight: 8.0, cls: 11, avgQs: 2.0 },
    "Co-ordination Compounds": { weight: 7.5, cls: 12, avgQs: 1.9 },
    "Chemical Thermodynamics": { weight: 7.0, cls: 11, avgQs: 1.8 },
    "Equilibrium": { weight: 6.5, cls: 11, avgQs: 1.6 },
    "Solutions": { weight: 6.0, cls: 12, avgQs: 1.5 },
    "Electrochemistry": { weight: 6.0, cls: 12, avgQs: 1.5 },
    // Mid-tier chapters (~40% weightage)
    "d and f- Block Elements": { weight: 5.5, cls: 12, avgQs: 1.4 },
    "Chemical Kinetics": { weight: 5.5, cls: 12, avgQs: 1.4 },
    "Hydrocarbons": { weight: 5.0, cls: 11, avgQs: 1.3 },
    "Organic Compounds Containing Oxygen": { weight: 5.5, cls: 12, avgQs: 1.4 },
    "Organic Compounds Containing Nitrogen": { weight: 4.5, cls: 12, avgQs: 1.1 },
    "Some Basic Principles of Organic Chemistry": { weight: 5.0, cls: 11, avgQs: 1.3 },
    "Atomic Structure": { weight: 4.5, cls: 11, avgQs: 1.1 },
    "Organic Compounds Containing Halogens": { weight: 4.5, cls: 12, avgQs: 1.1 },
    "P-Block Elements": { weight: 4.5, cls: 12, avgQs: 1.1 },
    // Foundational & specialized (~20% weightage)
    "Some Basic Concepts in Chemistry": { weight: 3.5, cls: 11, avgQs: 0.9 },
    "Classification of Elements and Periodicity in Properties": { weight: 3.5, cls: 11, avgQs: 0.9 },
    "Biomolecules": { weight: 3.5, cls: 12, avgQs: 0.9 },
    "Redox Reactions and Electrochemistry": { weight: 2.5, cls: 11, avgQs: 0.6 },
    "Principles Related to Practical Chemistry": { weight: 1.5, cls: 12, avgQs: 0.4 }
  },
  Mathematics: {
    // Top-tier chapters (~40% weightage)
    "Vectors": { weight: 7.5, cls: 12, avgQs: 1.9 },
    "3D Geometry": { weight: 7.5, cls: 12, avgQs: 1.9 },
    "Integrals": { weight: 7.0, cls: 12, avgQs: 1.8 },
    "Matrices & Determinants": { weight: 7.0, cls: 12, avgQs: 1.8 },
    "Conic Sections (Parabola, Ellipse, Hyperbola)": { weight: 6.5, cls: 11, avgQs: 1.6 },
    "Differential Equations": { weight: 6.0, cls: 12, avgQs: 1.5 },
    // Mid-tier chapters (~40% weightage)
    "Limits, Continuity & Differentiability": { weight: 5.5, cls: 12, avgQs: 1.4 },
    "Application of Derivatives": { weight: 5.5, cls: 12, avgQs: 1.4 },
    "Complex Numbers": { weight: 5.0, cls: 11, avgQs: 1.3 },
    "Sequences & Series": { weight: 5.0, cls: 11, avgQs: 1.3 },
    "Straight Lines": { weight: 4.5, cls: 11, avgQs: 1.1 },
    "Circles": { weight: 4.5, cls: 11, avgQs: 1.1 },
    "Binomial Theorem": { weight: 4.5, cls: 11, avgQs: 1.1 },
    "Permutations & Combinations": { weight: 4.5, cls: 11, avgQs: 1.1 },
    "Probability": { weight: 4.5, cls: 12, avgQs: 1.1 },
    // Foundational & specialized (~20% weightage)
    "Quadratic Equations": { weight: 3.5, cls: 11, avgQs: 0.9 },
    "Sets, Relations, and Functions": { weight: 3.5, cls: 11, avgQs: 0.9 },
    "Areas": { weight: 3.0, cls: 12, avgQs: 0.8 },
    "Statistics": { weight: 2.5, cls: 11, avgQs: 0.6 },
    "Inverse Trigonometric Functions": { weight: 2.0, cls: 12, avgQs: 0.5 },
    "Trigonometric Identities": { weight: 1.0, cls: 11, avgQs: 0.3 }
  }
};

export const CLASS_11_CHAPTERS = {
  Physics: [
    "Physics and Measurement",
    "Kinematics",
    "Motion in a Straight Line",
    "Laws of Motion",
    "Work, Energy & Power",
    "Work, Energy, and Power",
    "Rotational Motion",
    "Gravitation",
    "Properties of Solids and Liquids",
    "Thermodynamics",
    "Kinetic Theory of Gases",
    "Oscillations and Waves"
  ],
  Chemistry: [
    "Some Basic Concepts in Chemistry",
    "Atomic Structure",
    "Structure of Atom",
    "Classification of Elements and Periodicity",
    "Classification of Elements and Periodicity in Properties",
    "Chemical Bonding and Molecular Structure",
    "Chemical Thermodynamics",
    "Equilibrium",
    "Redox Reactions and Electrochemistry",
    "Some Basic Principles of Organic Chemistry",
    "Purification and Characterisation of Organic Compounds",
    "Hydrocarbons",
    "States of Matter"
  ],
  Mathematics: [
    "Sets, Relations, and Functions",
    "Complex Numbers",
    "Quadratic Equations",
    "Permutations & Combinations",
    "Permutations and Combinations",
    "Binomial Theorem",
    "Sequences & Series",
    "Sequences and Series",
    "Straight Lines",
    "Circles",
    "Conic Sections (Parabola, Ellipse, Hyperbola)",
    "Trigonometric Identities",
    "Statistics"
  ]
};

export const CLASS_12_CHAPTERS = {
  Physics: [
    "Electrostatics",
    "Current Electricity",
    "Magnetic Effects of Current and Magnetism",
    "Electromagnetic Induction and Alternating Currents",
    "Electromagnetic Waves",
    "Optics",
    "Dual Nature of Matter and Radiation",
    "Atoms and Nuclei",
    "Electronic Devices",
    "Experimental Skills"
  ],
  Chemistry: [
    "Solutions",
    "Electrochemistry",
    "Chemical Kinetics",
    "Surface Chemistry",
    "d and f- Block Elements",
    "Co-ordination Compounds",
    "Organic Compounds Containing Halogens",
    "Alcohols, Phenols, and Ethers",
    "Organic Compounds Containing Oxygen",
    "Organic Compounds Containing Nitrogen",
    "Biomolecules",
    "Principles Related to Practical Chemistry",
    "P-Block Elements",
    "Organic Name Reactions",
    "Organic Reaction Mechanism"
  ],
  Mathematics: [
    "Matrices & Determinants",
    "Inverse Trigonometric Functions",
    "Limits, Continuity & Differentiability",
    "Application of Derivatives",
    "Integrals",
    "Differential Equations",
    "Areas",
    "Vectors",
    "3D Geometry",
    "Probability"
  ]
};

export const PART_TEST_ALIAS_MAP = {
  Physics: {
    "Units & Measurements": ["Physics and Measurement"],
    "Motion in a Straight Line": ["Motion in a Straight Line", "Kinematics"],
    "Motion in a Plane": ["Kinematics"],
    "Laws of Motion": ["Laws of Motion"],
    "Work, Energy & Power": ["Work, Energy & Power", "Work, Energy, and Power"],
    "System of Particles & Rotational Motion": ["Rotational Motion"],
    "Gravitation": ["Gravitation"],
    "Mechanical Properties of Solids": ["Properties of Solids and Liquids"],
    "Mechanical Properties of Fluids": ["Properties of Solids and Liquids"],
    "Thermal Properties of Matter": ["Properties of Solids and Liquids", "Thermodynamics"],
    "Thermodynamics": ["Thermodynamics"],
    "Kinetic Theory": ["Kinetic Theory of Gases"],
    "Oscillations": ["Oscillations and Waves"],
    "Waves": ["Oscillations and Waves"],
    "Electric Charges & Fields": ["Electrostatics"],
    "Electrostatic Potential & Capacitance": ["Electrostatics"],
    "Current Electricity": ["Current Electricity"],
    "Moving Charges & Magnetism": ["Magnetic Effects of Current and Magnetism"],
    "Magnetism & Matter": ["Magnetic Effects of Current and Magnetism"],
    "Electromagnetic Induction": ["Electromagnetic Induction and Alternating Currents"],
    "Alternating Current": ["Electromagnetic Induction and Alternating Currents"],
    "Electromagnetic Waves": ["Electromagnetic Waves"],
    "Ray Optics & Optical Instruments": ["Optics"],
    "Wave Optics": ["Optics"],
    "Dual Nature of Radiation & Matter": ["Dual Nature of Matter and Radiation"],
    "Atoms": ["Atoms and Nuclei"],
    "Nuclei": ["Atoms and Nuclei"],
    "Semiconductor Electronics": ["Electronic Devices"]
  },
  Chemistry: {
    "Some Basic Concepts of Chemistry": ["Some Basic Concepts in Chemistry"],
    "Structure of Atom": ["Atomic Structure", "Structure of Atom"],
    "Classification of Elements and Periodicity": ["Classification of Elements and Periodicity", "Classification of Elements and Periodicity in Properties"],
    "Chemical Bonding and Molecular Structure": ["Chemical Bonding and Molecular Structure"],
    "Thermodynamics": ["Chemical Thermodynamics"],
    "Equilibrium": ["Equilibrium"],
    "Redox Reactions": ["Redox Reactions and Electrochemistry"],
    "The p-Block Elements": ["P-Block Elements"],
    "Organic Chemistry – Some Basic Principles and Techniques": ["Some Basic Principles of Organic Chemistry", "Purification and Characterisation of Organic Compounds"],
    "Hydrocarbons": ["Hydrocarbons"],
    "Solutions": ["Solutions"],
    "Electrochemistry": ["Electrochemistry", "Redox Reactions and Electrochemistry"],
    "Chemical Kinetics": ["Chemical Kinetics"],
    "d- and f-Block Elements": ["d and f- Block Elements"],
    "Coordination Compounds": ["Co-ordination Compounds"],
    "Haloalkanes and Haloarenes": ["Organic Compounds Containing Halogens"],
    "Alcohols, Phenols and Ethers": ["Alcohols, Phenols, and Ethers"],
    "Aldehydes, Ketones and Carboxylic Acids": ["Organic Compounds Containing Oxygen"],
    "Amines": ["Organic Compounds Containing Nitrogen"],
    "Biomolecules": ["Biomolecules"]
  },
  Mathematics: {
    "Sets, Relations and Functions": ["Sets, Relations, and Functions"],
    "Complex Numbers and Quadratic Equations": ["Complex Numbers", "Quadratic Equations"],
    "Matrices and Determinants": ["Matrices & Determinants"],
    "Permutations and Combinations": ["Permutations & Combinations", "Permutations and Combinations"],
    "Binomial Theorem": ["Binomial Theorem"],
    "Sequence and Series": ["Sequences & Series", "Sequences and Series"],
    "Limit, Continuity and Differentiability": ["Limits, Continuity & Differentiability"],
    "Integral Calculus": ["Integrals", "Areas"],
    "Differential Equations": ["Differential Equations"],
    "Coordinate Geometry": ["Straight Lines", "Circles", "Conic Sections (Parabola, Ellipse, Hyperbola)"],
    "Three Dimensional Geometry": ["3D Geometry"],
    "Vector Algebra": ["Vectors"],
    "Statistics and Probability": ["Statistics", "Probability"],
    "Trigonometry": ["Trigonometric Identities", "Inverse Trigonometric Functions"]
  }
};

/**
 * Calculates subject chapter quotas based on 10-year weightages and target class scope
 */
export function calculateSubjectChapterQuotas(subject, targetCount, classScope = 'ALL') {
  const trends = JEE_MAIN_10_YEAR_TRENDS[subject] || {};
  let eligibleChapters = Object.keys(trends);
  
  if (classScope === '11') {
    eligibleChapters = eligibleChapters.filter(ch => trends[ch].cls === 11);
  } else if (classScope === '12') {
    eligibleChapters = eligibleChapters.filter(ch => trends[ch].cls === 12);
  }

  const totalWeight = eligibleChapters.reduce((sum, ch) => sum + (trends[ch].weight || 1), 0);
  const quotas = {};
  let assignedCount = 0;

  // Initial proportional allocation
  for (const ch of eligibleChapters) {
    const rawCount = Math.round((trends[ch].weight / totalWeight) * targetCount);
    quotas[ch] = Math.max(1, rawCount);
    assignedCount += quotas[ch];
  }

  // Adjust delta
  while (assignedCount > targetCount) {
    const maxCh = eligibleChapters.reduce((max, ch) => (quotas[ch] > quotas[max] ? ch : max), eligibleChapters[0]);
    if (quotas[maxCh] > 1) {
      quotas[maxCh]--;
      assignedCount--;
    } else break;
  }

  while (assignedCount < targetCount) {
    const minCh = eligibleChapters.reduce((min, ch) => {
      const ratioMin = quotas[min] / (trends[min]?.weight || 1);
      const ratioCh = quotas[ch] / (trends[ch]?.weight || 1);
      return ratioCh < ratioMin ? ch : min;
    }, eligibleChapters[0]);
    quotas[minCh]++;
    assignedCount++;
  }

  return quotas;
}


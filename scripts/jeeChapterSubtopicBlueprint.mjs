// 10-Year JEE Main Chapterwise & Subtopicwise PYQ Analysis Blueprint (2017-2026)
// Provides historical NTA frequency, concept breakdown, canonical mapping, and difficulty quotas.

export const JEE_CHAPTER_SUBTOPIC_PYQ_DATA = {
  Physics: {
    "Physics and Measurement": {
      weight: 2.5,
      subtopics: [
        { name: "Units and dimensions", pyqWeight: 40, freq: "HIGH" },
        { name: "Error analysis", pyqWeight: 30, freq: "HIGH" },
        { name: "Dimensional analysis and applications", pyqWeight: 20, freq: "MED" },
        { name: "Least count and precision", pyqWeight: 10, freq: "LOW" }
      ]
    },
    "Kinematics": {
      weight: 6.0,
      subtopics: [
        { name: "Motion in a straight line/plane", pyqWeight: 30, freq: "HIGH" },
        { name: "Projectile motion", pyqWeight: 30, freq: "HIGH" },
        { name: "Uniformly accelerated motion and equations", pyqWeight: 20, freq: "MED" },
        { name: "Relative velocity", pyqWeight: 10, freq: "MED" },
        { name: "Graphical analysis of motion (x-t, v-t graphs)", pyqWeight: 10, freq: "LOW" }
      ]
    },
    "Laws of Motion": {
      weight: 5.5,
      subtopics: [
        { name: "Newton's laws", pyqWeight: 30, freq: "HIGH" },
        { name: "Friction", pyqWeight: 25, freq: "HIGH" },
        { name: "Connected motion and pulley problems", pyqWeight: 20, freq: "MED" },
        { name: "Conservation of momentum", pyqWeight: 15, freq: "MED" },
        { name: "Banking of roads", pyqWeight: 10, freq: "LOW" }
      ]
    },
    "Work, Energy & Power": {
      weight: 5.5,
      subtopics: [
        { name: "Work-energy theorem", pyqWeight: 35, freq: "HIGH" },
        { name: "Kinetic/potential energy", pyqWeight: 20, freq: "MED" },
        { name: "Conservation of mechanical energy", pyqWeight: 20, freq: "MED" },
        { name: "Power and variable force", pyqWeight: 15, freq: "MED" },
        { name: "Elastic and inelastic collisions", pyqWeight: 10, freq: "LOW" }
      ]
    },
    "Rotational Motion": {
      weight: 7.0,
      subtopics: [
        { name: "Moment of inertia", pyqWeight: 35, freq: "HIGH" },
        { name: "Torque", pyqWeight: 25, freq: "HIGH" },
        { name: "Angular momentum conservation", pyqWeight: 20, freq: "MED" },
        { name: "Rolling motion", pyqWeight: 10, freq: "MED" },
        { name: "Center of mass", pyqWeight: 10, freq: "LOW" }
      ]
    },
    "Gravitation": {
      weight: 4.5,
      subtopics: [
        { name: "Acceleration due to gravity (variation with height, depth, latitude)", pyqWeight: 30, freq: "HIGH" },
        { name: "Gravitational potential energy", pyqWeight: 25, freq: "HIGH" },
        { name: "Escape velocity", pyqWeight: 20, freq: "MED" },
        { name: "Orbital velocity and satellite motion", pyqWeight: 15, freq: "MED" },
        { name: "Kepler's laws", pyqWeight: 10, freq: "LOW" }
      ]
    },
    "Properties of Solids and Liquids": {
      weight: 4.5,
      subtopics: [
        { name: "Fluid mechanics (Pascal's law, Bernoulli's principle, viscosity)", pyqWeight: 35, freq: "HIGH" },
        { name: "Surface tension, surface energy, and capillarity", pyqWeight: 25, freq: "HIGH" },
        { name: "Elasticity (Hooke's law, Young's modulus)", pyqWeight: 20, freq: "MED" },
        { name: "Thermal expansion and calorimetry", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Thermodynamics": {
      weight: 6.5,
      subtopics: [
        { name: "Isothermal and adiabatic processes", pyqWeight: 40, freq: "HIGH" },
        { name: "Work done in thermodynamic processes", pyqWeight: 30, freq: "HIGH" },
        { name: "Laws of thermodynamics (zeroth, first, second)", pyqWeight: 30, freq: "HIGH" }
      ]
    },
    "Kinetic Theory of Gases": {
      weight: 3.0,
      subtopics: [
        { name: "Degrees of freedom", pyqWeight: 35, freq: "HIGH" },
        { name: "Mean free path and molecular speeds (rms, average, most probable)", pyqWeight: 35, freq: "HIGH" },
        { name: "Law of equipartition of energy", pyqWeight: 30, freq: "MED" }
      ]
    },
    "Oscillations and Waves": {
      weight: 4.5,
      subtopics: [
        { name: "Simple Harmonic Motion (SHM)", pyqWeight: 40, freq: "HIGH" },
        { name: "Standing waves in strings and organ pipes", pyqWeight: 30, freq: "HIGH" },
        { name: "Beats", pyqWeight: 15, freq: "MED" },
        { name: "Superposition of waves", pyqWeight: 15, freq: "MED" }
      ]
    },
    "Electrostatics": {
      weight: 8.0,
      subtopics: [
        { name: "Capacitors", pyqWeight: 30, freq: "HIGH" },
        { name: "Combination of capacitors and energy stored", pyqWeight: 25, freq: "HIGH" },
        { name: "Gauss's law", pyqWeight: 20, freq: "MED" },
        { name: "Electric field/flux", pyqWeight: 15, freq: "MED" },
        { name: "Potential energy", pyqWeight: 10, freq: "LOW" }
      ]
    },
    "Current Electricity": {
      weight: 8.5,
      subtopics: [
        { name: "Kirchhoff's laws", pyqWeight: 30, freq: "HIGH" },
        { name: "Drift velocity and mobility", pyqWeight: 25, freq: "HIGH" },
        { name: "Ohm's law", pyqWeight: 20, freq: "MED" },
        { name: "Internal resistance of a cell and EMF", pyqWeight: 15, freq: "MED" },
        { name: "Wheatstone bridge", pyqWeight: 10, freq: "LOW" }
      ]
    },
    "Magnetic Effects of Current and Magnetism": {
      weight: 6.5,
      subtopics: [
        { name: "Biot-Savart law and applications", pyqWeight: 30, freq: "HIGH" },
        { name: "Lorentz force", pyqWeight: 25, freq: "HIGH" },
        { name: "Ampere's law", pyqWeight: 20, freq: "MED" },
        { name: "Moving coil galvanometer and conversion to ammeter/voltmeter", pyqWeight: 15, freq: "MED" },
        { name: "Magnetic properties (dia, para, ferromagnetism)", pyqWeight: 10, freq: "LOW" }
      ]
    },
    "Electromagnetic Induction and Alternating Currents": {
      weight: 5.0,
      subtopics: [
        { name: "AC circuits", pyqWeight: 35, freq: "HIGH" },
        { name: "Faraday's law", pyqWeight: 25, freq: "HIGH" },
        { name: "Self and mutual inductance", pyqWeight: 20, freq: "MED" },
        { name: "Transformers and AC generator", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Electromagnetic Waves": {
      weight: 2.5,
      subtopics: [
        { name: "EM spectrum", pyqWeight: 40, freq: "HIGH" },
        { name: "Transverse nature of EM waves", pyqWeight: 30, freq: "HIGH" },
        { name: "Energy density and Poynting vector", pyqWeight: 30, freq: "MED" }
      ]
    },
    "Optics": {
      weight: 8.0,
      subtopics: [
        { name: "Refraction and lenses", pyqWeight: 35, freq: "HIGH" },
        { name: "Young's double slit experiment (YDSE)", pyqWeight: 30, freq: "HIGH" },
        { name: "Prism and dispersion", pyqWeight: 20, freq: "MED" },
        { name: "Diffraction and polarization", pyqWeight: 15, freq: "LOW" }
      ]
    },
    "Dual Nature of Matter and Radiation": {
      weight: 5.0,
      subtopics: [
        { name: "Photoelectric effect", pyqWeight: 40, freq: "HIGH" },
        { name: "de Broglie wavelength", pyqWeight: 40, freq: "HIGH" },
        { name: "Wave-particle duality", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Atoms and Nuclei": {
      weight: 5.0,
      subtopics: [
        { name: "Bohr's model", pyqWeight: 40, freq: "HIGH" },
        { name: "Nuclear binding energy and mass defect", pyqWeight: 30, freq: "HIGH" },
        { name: "Radioactivity and decay laws", pyqWeight: 30, freq: "MED" }
      ]
    },
    "Electronic Devices": {
      weight: 3.5,
      subtopics: [
        { name: "p-n junction diode", pyqWeight: 40, freq: "HIGH" },
        { name: "Logic gates", pyqWeight: 35, freq: "HIGH" },
        { name: "Zener diode as voltage regulator", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Experimental Skills": {
      weight: 1.5,
      subtopics: [
        { name: "Vernier callipers and screw gauge", pyqWeight: 50, freq: "HIGH" },
        { name: "Meter bridge and potentiometer", pyqWeight: 50, freq: "HIGH" }
      ]
    }
  },
  Chemistry: {
    "Some Basic Concepts in Chemistry": {
      weight: 3.5,
      subtopics: [
        { name: "Mole concept and molar masses", pyqWeight: 45, freq: "HIGH" },
        { name: "Stoichiometry and limiting reagent", pyqWeight: 35, freq: "HIGH" },
        { name: "Concentration terms", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Atomic Structure": {
      weight: 4.5,
      subtopics: [
        { name: "Bohr's model", pyqWeight: 40, freq: "HIGH" },
        { name: "Quantum numbers and electronic configuration", pyqWeight: 35, freq: "HIGH" },
        { name: "de Broglie relation and Heisenberg uncertainty", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Chemical Bonding and Molecular Structure": {
      weight: 8.0,
      subtopics: [
        { name: "VSEPR theory and hybridization", pyqWeight: 40, freq: "HIGH" },
        { name: "Molecular orbital theory (MOT)", pyqWeight: 35, freq: "HIGH" },
        { name: "Dipole moment and hydrogen bonding", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Chemical Thermodynamics": {
      weight: 7.0,
      subtopics: [
        { name: "Enthalpy and Hess's law", pyqWeight: 35, freq: "HIGH" },
        { name: "Gibbs free energy and spontaneity", pyqWeight: 35, freq: "HIGH" },
        { name: "First law and work done", pyqWeight: 30, freq: "HIGH" }
      ]
    },
    "Equilibrium": {
      weight: 6.5,
      subtopics: [
        { name: "Ionic equilibrium (pH, buffers, hydrolysis)", pyqWeight: 40, freq: "HIGH" },
        { name: "Solubility product (Ksp)", pyqWeight: 30, freq: "HIGH" },
        { name: "Chemical equilibrium and Le Chatelier's principle", pyqWeight: 30, freq: "MED" }
      ]
    },
    "Solutions": {
      weight: 6.0,
      subtopics: [
        { name: "Colligative properties", pyqWeight: 45, freq: "HIGH" },
        { name: "van 't Hoff factor (i)", pyqWeight: 35, freq: "HIGH" },
        { name: "Raoult's law and ideal/non-ideal solutions", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Redox Reactions and Electrochemistry": {
      weight: 6.5,
      subtopics: [
        { name: "Electrochemical cells & cell potential", pyqWeight: 35, freq: "HIGH" },
        { name: "Nernst equation", pyqWeight: 35, freq: "HIGH" },
        { name: "Kohlrausch's law & molar conductance", pyqWeight: 15, freq: "MED" },
        { name: "Faraday's laws of electrolysis", pyqWeight: 15, freq: "MED" }
      ]
    },
    "Chemical Kinetics": {
      weight: 5.5,
      subtopics: [
        { name: "Integrated rate equations (zero, first order)", pyqWeight: 45, freq: "HIGH" },
        { name: "Arrhenius equation and activation energy", pyqWeight: 35, freq: "HIGH" },
        { name: "Order and molecularity", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Co-ordination Compounds": {
      weight: 7.5,
      subtopics: [
        { name: "Crystal field theory (CFT)", pyqWeight: 40, freq: "HIGH" },
        { name: "Isomerism in coordination compounds", pyqWeight: 30, freq: "HIGH" },
        { name: "IUPAC nomenclature and Werner's theory", pyqWeight: 30, freq: "MED" }
      ]
    },
    "d and f- Block Elements": {
      weight: 5.5,
      subtopics: [
        { name: "Trends in 3d series (oxidation states, magnetic properties)", pyqWeight: 45, freq: "HIGH" },
        { name: "KMnO4 and K2Cr2O7 chemistry", pyqWeight: 35, freq: "HIGH" },
        { name: "Lanthanide contraction", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Hydrocarbons": {
      weight: 5.0,
      subtopics: [
        { name: "Electrophilic aromatic substitution", pyqWeight: 40, freq: "HIGH" },
        { name: "Alkenes addition reactions (Markovnikov)", pyqWeight: 35, freq: "HIGH" },
        { name: "Alkanes and alkynes reactions", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Organic Compounds Containing Halogens": {
      weight: 4.5,
      subtopics: [
        { name: "SN1 and SN2 reaction mechanisms", pyqWeight: 50, freq: "HIGH" },
        { name: "Elimination reactions (E1, E2)", pyqWeight: 30, freq: "HIGH" },
        { name: "Aryl halides and haloarenes", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Organic Compounds Containing Oxygen": {
      weight: 5.5,
      subtopics: [
        { name: "Aldol and Cannizzaro reactions", pyqWeight: 40, freq: "HIGH" },
        { name: "Nucleophilic addition to carbonyls", pyqWeight: 35, freq: "HIGH" },
        { name: "Acidity of carboxylic acids and phenols", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Organic Compounds Containing Nitrogen": {
      weight: 4.5,
      subtopics: [
        { name: "Basicity of amines", pyqWeight: 45, freq: "HIGH" },
        { name: "Diazonium salts and coupling reactions", pyqWeight: 35, freq: "HIGH" },
        { name: "Preparation and reduction reactions", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Biomolecules": {
      weight: 3.5,
      subtopics: [
        { name: "Carbohydrates (structures, mutarotation)", pyqWeight: 45, freq: "HIGH" },
        { name: "Proteins and peptide linkage", pyqWeight: 35, freq: "HIGH" },
        { name: "Nucleic acids and vitamins", pyqWeight: 20, freq: "MED" }
      ]
    }
  },
  Mathematics: {
    "Vectors": {
      weight: 7.5,
      subtopics: [
        { name: "Dot product and cross product", pyqWeight: 40, freq: "HIGH" },
        { name: "Scalar triple product and vector triple product", pyqWeight: 35, freq: "HIGH" },
        { name: "Linear combination and coplanarity", pyqWeight: 25, freq: "MED" }
      ]
    },
    "3D Geometry": {
      weight: 7.5,
      subtopics: [
        { name: "Shortest distance between skew lines", pyqWeight: 40, freq: "HIGH" },
        { name: "Equations of lines and planes", pyqWeight: 35, freq: "HIGH" },
        { name: "Direction cosines and ratios", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Integrals": {
      weight: 7.0,
      subtopics: [
        { name: "Properties of definite integrals (King's rule)", pyqWeight: 45, freq: "HIGH" },
        { name: "Definite integral as limit of sum", pyqWeight: 30, freq: "HIGH" },
        { name: "Standard indefinite integration techniques", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Matrices & Determinants": {
      weight: 7.0,
      subtopics: [
        { name: "System of linear equations (Cramer's rule)", pyqWeight: 45, freq: "HIGH" },
        { name: "Properties of determinants", pyqWeight: 30, freq: "HIGH" },
        { name: "Adjoint and inverse of matrix", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Conic Sections (Parabola, Ellipse, Hyperbola)": {
      weight: 6.5,
      subtopics: [
        { name: "Parabola (tangent, focal chord)", pyqWeight: 40, freq: "HIGH" },
        { name: "Ellipse (eccentricity, tangents)", pyqWeight: 35, freq: "HIGH" },
        { name: "Hyperbola (asymptotes, standard form)", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Differential Equations": {
      weight: 6.0,
      subtopics: [
        { name: "Linear differential equations (integrating factor)", pyqWeight: 45, freq: "HIGH" },
        { name: "Homogeneous differential equations", pyqWeight: 30, freq: "HIGH" },
        { name: "Separable variable form", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Limits, Continuity & Differentiability": {
      weight: 5.5,
      subtopics: [
        { name: "L'Hopital's rule and standard limits", pyqWeight: 45, freq: "HIGH" },
        { name: "Continuity and differentiability at a point", pyqWeight: 35, freq: "HIGH" },
        { name: "Algebra of limits", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Application of Derivatives": {
      weight: 5.5,
      subtopics: [
        { name: "Maxima and minima", pyqWeight: 45, freq: "HIGH" },
        { name: "Increasing and decreasing functions", pyqWeight: 35, freq: "HIGH" },
        { name: "Tangents and normals", pyqWeight: 20, freq: "MED" }
      ]
    },
    "Complex Numbers": {
      weight: 5.0,
      subtopics: [
        { name: "Modulus, argument, and conjugate", pyqWeight: 35, freq: "HIGH" },
        { name: "Cube roots of unity (omega)", pyqWeight: 35, freq: "HIGH" },
        { name: "Geometry of complex numbers", pyqWeight: 30, freq: "MED" }
      ]
    },
    "Sequences & Series": {
      weight: 5.0,
      subtopics: [
        { name: "Arithmetic Progression (AP)", pyqWeight: 35, freq: "HIGH" },
        { name: "Geometric Progression (GP)", pyqWeight: 35, freq: "HIGH" },
        { name: "Arithmetico-Geometric Progression & Special series", pyqWeight: 30, freq: "MED" }
      ]
    },
    "Straight Lines": {
      weight: 4.5,
      subtopics: [
        { name: "Angle between lines & perpendicular distance", pyqWeight: 40, freq: "HIGH" },
        { name: "Family of lines and concurrency", pyqWeight: 35, freq: "HIGH" },
        { name: "Equation of straight line forms", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Circles": {
      weight: 4.5,
      subtopics: [
        { name: "Equation of tangent and chord of contact", pyqWeight: 45, freq: "HIGH" },
        { name: "Standard equation of circle", pyqWeight: 30, freq: "HIGH" },
        { name: "Family of circles & common tangent", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Binomial Theorem": {
      weight: 4.5,
      subtopics: [
        { name: "General and middle terms", pyqWeight: 40, freq: "HIGH" },
        { name: "Remainder and divisibility problems", pyqWeight: 35, freq: "HIGH" },
        { name: "Properties of binomial coefficients", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Permutations & Combinations": {
      weight: 4.5,
      subtopics: [
        { name: "Combinations and selections", pyqWeight: 40, freq: "HIGH" },
        { name: "Permutations with repetition & circular", pyqWeight: 35, freq: "HIGH" },
        { name: "Fundamental principle of counting", pyqWeight: 25, freq: "MED" }
      ]
    },
    "Probability": {
      weight: 4.5,
      subtopics: [
        { name: "Bayes' theorem and conditional probability", pyqWeight: 45, freq: "HIGH" },
        { name: "Independent events and multiplication rule", pyqWeight: 35, freq: "HIGH" },
        { name: "Random variables and probability distribution", pyqWeight: 20, freq: "MED" }
      ]
    }
  }
};

/**
 * Calculates difficulty and Assertion-Reasoning quotas for a given question count
 * using the largest-remainder method.
 */
export function calculateTestQuotas(totalQuestions) {
  const rawEasy = totalQuestions * 0.20;
  const rawMod = totalQuestions * 0.50;
  const rawDiff = totalQuestions * 0.30;

  let easy = Math.floor(rawEasy);
  let mod = Math.floor(rawMod);
  let diff = Math.floor(rawDiff);

  let remainder = totalQuestions - (easy + mod + diff);
  const fracs = [
    { type: 'mod', frac: rawMod - mod },
    { type: 'diff', frac: rawDiff - diff },
    { type: 'easy', frac: rawEasy - easy }
  ].sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder; i++) {
    if (fracs[i].type === 'mod') mod++;
    else if (fracs[i].type === 'diff') diff++;
    else easy++;
  }

  return {
    total: totalQuestions,
    easy,
    moderate: mod,
    difficult: diff,
    modAR: 3,
    diffAR: 2,
    totalAR: 5,
    modStd: mod - 3,
    diffStd: diff - 2,
    easyStd: easy
  };
}


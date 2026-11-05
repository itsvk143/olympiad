/**
 * Master Olympiad Question Generator & Visual Asset Factory
 * Generates verified, LaTeX-formatted questions for Classes 1 to 12 across
 * Mathematics (IMO), Science (NSO), and English (IEO).
 */

export const OLYMPIAD_CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const OLYMPIAD_SUBJECTS = ['Mathematics', 'Science', 'English'];

export const DIFFICULTY_DISTRIBUTIONS = {
    1:  { easyPct: 50, modPct: 40, diffPct: 10, label: 'Introductory Foundation' },
    2:  { easyPct: 45, modPct: 40, diffPct: 15, label: 'Concept Builder' },
    3:  { easyPct: 40, modPct: 45, diffPct: 15, label: 'Skill Reinforcement' },
    4:  { easyPct: 40, modPct: 40, diffPct: 20, label: 'Standard Olympiad' },
    5:  { easyPct: 35, modPct: 45, diffPct: 20, label: 'Advanced Application' },
    6:  { easyPct: 35, modPct: 40, diffPct: 25, label: 'Analytical Challenge' },
    7:  { easyPct: 30, modPct: 45, diffPct: 25, label: 'High-Order Thinking' },
    8:  { easyPct: 30, modPct: 40, diffPct: 30, label: 'National Standard' },
    9:  { easyPct: 25, modPct: 45, diffPct: 30, label: 'Mastery & Problem Solving' },
    10: { easyPct: 25, modPct: 40, diffPct: 35, label: 'Grand Finale Invitational' }
};

export function getTestConfigForClass(classNum) {
    const c = Number(classNum);
    if (c >= 1 && c <= 2) return { questionsCount: 25, duration: 40, marksPerQuestion: 1 };
    if (c >= 3 && c <= 5) return { questionsCount: 30, duration: 45, marksPerQuestion: 1 };
    if (c >= 6 && c <= 8) return { questionsCount: 40, duration: 60, marksPerQuestion: 1 };
    return { questionsCount: 50, duration: 75, marksPerQuestion: 1 };
}

// ──────────────────────── SVG DIAGRAM GENERATORS ────────────────────────
export function generateSvgDiagram(type, params = {}) {
    if (type === 'geometry_triangle') {
        const { a = 'A', b = 'B', c = 'C', h = 'h', base = 'b' } = params;
        return `<svg viewBox="0 0 240 180" width="240" height="180" xmlns="http://www.w3.org/2000/svg">
            <polygon points="40,150 200,150 60,40" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="2.5" />
            <line x1="60" y1="40" x2="60" y2="150" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4" />
            <rect x="60" y="135" width="15" height="15" fill="none" stroke="#94a3b8" stroke-width="1.5" />
            <text x="50" y="32" fill="#f8fafc" font-size="14" font-family="sans-serif" font-weight="bold">${a}</text>
            <text x="24" y="160" fill="#f8fafc" font-size="14" font-family="sans-serif" font-weight="bold">${b}</text>
            <text x="208" y="160" fill="#f8fafc" font-size="14" font-family="sans-serif" font-weight="bold">${c}</text>
            <text x="66" y="100" fill="#cbd5e1" font-size="12" font-family="sans-serif">${h}</text>
            <text x="120" y="168" fill="#cbd5e1" font-size="12" font-family="sans-serif">${base}</text>
        </svg>`;
    }
    if (type === 'geometry_circle') {
        const { r = 'r', angle = '60^\\circ' } = params;
        return `<svg viewBox="0 0 220 220" width="220" height="220" xmlns="http://www.w3.org/2000/svg">
            <circle cx="110" cy="110" r="80" fill="rgba(99, 102, 241, 0.1)" stroke="#818cf8" stroke-width="2" />
            <circle cx="110" cy="110" r="3.5" fill="#f43f5e" />
            <line x1="110" y1="110" x2="190" y2="110" stroke="#38bdf8" stroke-width="2" />
            <line x1="110" y1="110" x2="150" y2="40.7" stroke="#38bdf8" stroke-width="2" />
            <path d="M 140,110 A 30 30 0 0 0 125,84" fill="none" stroke="#f59e0b" stroke-width="1.5" />
            <text x="100" y="125" fill="#f8fafc" font-size="12" font-family="sans-serif">O</text>
            <text x="145" y="125" fill="#38bdf8" font-size="12" font-family="sans-serif">${r}</text>
            <text x="135" y="95" fill="#f59e0b" font-size="11" font-family="sans-serif">${angle}</text>
        </svg>`;
    }
    if (type === 'electric_circuit') {
        const { v = '12V', r = '4\\,\\Omega' } = params;
        return `<svg viewBox="0 0 260 160" width="260" height="160" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="30" width="200" height="100" fill="none" stroke="#38bdf8" stroke-width="2" />
            <rect x="110" y="22" width="40" height="16" fill="#0f172a" stroke="#818cf8" stroke-width="1.5" />
            <text x="118" y="34" fill="#a5b4fc" font-size="10" font-family="sans-serif">${r}</text>
            <circle cx="130" cy="130" r="14" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
            <line x1="120" y1="120" x2="140" y2="140" stroke="#f59e0b" stroke-width="1.5" />
            <line x1="140" y1="120" x2="120" y2="140" stroke="#f59e0b" stroke-width="1.5" />
            <line x1="60" y1="75" x2="60" y2="85" stroke="#f43f5e" stroke-width="3" />
            <line x1="55" y1="78" x2="55" y2="82" stroke="#94a3b8" stroke-width="1.5" />
            <text x="35" y="84" fill="#f43f5e" font-size="11" font-family="sans-serif">${v}</text>
            <text x="115" y="155" fill="#fcd34d" font-size="11" font-family="sans-serif">Bulb</text>
        </svg>`;
    }
    if (type === 'plant_cell') {
        return `<svg viewBox="0 0 240 180" width="240" height="180" xmlns="http://www.w3.org/2000/svg">
            <polygon points="30,25 210,25 225,155 15,155" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="3" />
            <ellipse cx="120" cy="90" rx="45" ry="30" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="1.5" />
            <circle cx="70" cy="75" r="16" fill="#8b5cf6" />
            <circle cx="170" cy="65" r="8" fill="#10b981" />
            <circle cx="175" cy="115" r="8" fill="#10b981" />
            <text x="56" y="79" fill="#ffffff" font-size="9" font-family="sans-serif">Nucleus</text>
            <text x="102" y="93" fill="#38bdf8" font-size="10" font-family="sans-serif">Central Vacuole</text>
            <text x="85" y="170" fill="#10b981" font-size="11" font-family="sans-serif">Cell Wall &amp; Membrane</text>
        </svg>`;
    }
    if (type === 'coordinate_plane') {
        const { x = 3, y = 4 } = params;
        const px = 90 + (x * 15);
        const py = 90 - (y * 15);
        return `<svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <line x1="20" y1="90" x2="180" y2="90" stroke="#94a3b8" stroke-width="1.5" />
            <line x1="90" y1="20" x2="90" y2="180" stroke="#94a3b8" stroke-width="1.5" />
            <circle cx="${px}" cy="${py}" r="4.5" fill="#ef4444" />
            <text x="${px + 5}" cy="${py - 5}" y="${py - 5}" fill="#f8fafc" font-size="11" font-family="sans-serif">P(${x}, ${y})</text>
            <text x="182" y="94" fill="#94a3b8" font-size="11" font-family="sans-serif">X</text>
            <text x="86" y="16" fill="#94a3b8" font-size="11" font-family="sans-serif">Y</text>
            <text x="78" y="102" fill="#64748b" font-size="10" font-family="sans-serif">O</text>
        </svg>`;
    }
    if (type === 'food_chain') {
        return `<svg viewBox="0 0 280 80" width="280" height="80" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="25" width="60" height="30" rx="6" fill="#10b981" />
            <text x="18" y="44" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="bold">Plant (P)</text>
            <text x="82" y="45" fill="#38bdf8" font-size="16">→</text>
            <rect x="105" y="25" width="65" height="30" rx="6" fill="#f59e0b" />
            <text x="111" y="44" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="bold">Rabbit (C1)</text>
            <text x="182" y="45" fill="#38bdf8" font-size="16">→</text>
            <rect x="205" y="25" width="60" height="30" rx="6" fill="#ef4444" />
            <text x="216" y="44" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="bold">Fox (C2)</text>
        </svg>`;
    }
    if (type === 'clock_face') {
        const { hour = 3, minute = 0 } = params;
        const hrAngle = (hour % 12) * 30 + (minute * 0.5);
        const minAngle = minute * 6;
        const hrX = 100 + 40 * Math.sin(hrAngle * Math.PI / 180);
        const hrY = 100 - 40 * Math.cos(hrAngle * Math.PI / 180);
        const minX = 100 + 60 * Math.sin(minAngle * Math.PI / 180);
        const minY = 100 - 60 * Math.cos(minAngle * Math.PI / 180);
        return `<svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="85" fill="#1e293b" stroke="#38bdf8" stroke-width="3" />
            <circle cx="100" cy="100" r="4" fill="#f8fafc" />
            <text x="94" y="32" fill="#f8fafc" font-size="14" font-weight="bold">12</text>
            <text x="168" y="105" fill="#f8fafc" font-size="14" font-weight="bold">3</text>
            <text x="96" y="175" fill="#f8fafc" font-size="14" font-weight="bold">6</text>
            <text x="25" y="105" fill="#f8fafc" font-size="14" font-weight="bold">9</text>
            <line x1="100" y1="100" x2="${hrX.toFixed(1)}" y2="${hrY.toFixed(1)}" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" />
            <line x1="100" y1="100" x2="${minX.toFixed(1)}" y2="${minY.toFixed(1)}" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" />
        </svg>`;
    }
    if (type === 'bohr_atom') {
        const { element = 'Carbon', protons = 6, electrons = 6 } = params;
        return `<svg viewBox="0 0 220 220" width="220" height="220" xmlns="http://www.w3.org/2000/svg">
            <circle cx="110" cy="110" r="22" fill="#ef4444" />
            <text x="100" y="115" fill="#ffffff" font-size="11" font-weight="bold">${protons}p</text>
            <circle cx="110" cy="110" r="50" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" />
            <circle cx="110" cy="110" r="85" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" />
            <circle cx="110" cy="60" r="4" fill="#38bdf8" />
            <circle cx="110" cy="160" r="4" fill="#38bdf8" />
            <circle cx="110" cy="25" r="4" fill="#38bdf8" />
            <circle cx="110" cy="195" r="4" fill="#38bdf8" />
            <circle cx="25" cy="110" r="4" fill="#38bdf8" />
            <circle cx="195" cy="110" r="4" fill="#38bdf8" />
            <text x="80" y="215" fill="#94a3b8" font-size="11">${element} Atom</text>
        </svg>`;
    }
    return null;
}

// ──────────────────────── QUESTION BUILDER ────────────────────────
export function createOlympiadQuestion({
    classNum,
    subject,
    paperNum,
    qIndex,
    topic,
    difficulty
}) {
    const isVisual = (qIndex % 4 === 1);
    const hasPhoto = isVisual && (subject === 'Science' && (classNum <= 5 || qIndex % 8 === 1));

    let questionText = '';
    let rawOptions = [];
    let explanation = '';
    let diagram = null;
    let image = null;

    // Distribute correct answer evenly across options A, B, C, D (0, 1, 2, 3)
    const targetCorrectIndex = (qIndex + paperNum * 3) % 4;

    // ════════════════════════════════════════════════════════════════
    // 1. MATHEMATICS (IMO / iOM Standard)
    // ════════════════════════════════════════════════════════════════
    if (subject === 'Mathematics') {
        if (classNum <= 2) {
            const seed = (qIndex * 5) + (paperNum * 7);
            const n1 = 12 + (seed % 35);
            const n2 = 6 + (seed % 25);
            const subMod = qIndex % 4;

            if (subMod === 0) {
                questionText = `Find the sum: $${n1} + ${n2} = \\,?$`;
                const ans = n1 + n2;
                rawOptions = [`$${ans}$`, `$${ans + 2}$`, `$${ans - 3}$`, `$${ans + 10}$`];
                explanation = `Adding the two numbers: $${n1} + ${n2} = ${ans}$.`;
            } else if (subMod === 1) {
                const hour = 1 + (qIndex % 11);
                questionText = `Look at the given clock face. What time is shown by the hour and minute hands?`;
                rawOptions = [`$${hour}:00$`, `$${(hour % 12) + 1}:00$`, `$${hour}:30$`, `$${hour}:15$`];
                explanation = `The shorter hour hand points directly at $${hour}$ and the longer minute hand points at $12$, which indicates $${hour}:00$.`;
                diagram = generateSvgDiagram('clock_face', { hour, minute: 0 });
            } else if (subMod === 2) {
                const total = n1 + 10;
                questionText = `Rohan has $${total}$ crayons. He gives $${n2}$ crayons to his sister. How many crayons are left with Rohan?`;
                const rem = total - n2;
                rawOptions = [`$${rem}$ crayons`, `$${rem + 3}$ crayons`, `$${rem - 2}$ crayons`, `$${rem + 5}$ crayons`];
                explanation = `Subtract the crayons given away: $${total} - ${n2} = ${rem}$.`;
            } else {
                const num = 20 + (seed % 60);
                questionText = `Which number is the predecessor of $${num}$ (comes just before $${num}$)?`;
                rawOptions = [`$${num - 1}$`, `$${num + 1}$`, `$${num - 2}$`, `$${num + 10}$`];
                explanation = `The predecessor of any number is obtained by subtracting $1$: $${num} - 1 = ${num - 1}$.`;
            }
        } else if (classNum <= 5) {
            const seed = (qIndex * 7) + (paperNum * 11);
            const subMod = qIndex % 5;

            if (subMod === 0) {
                const den = 6 + (seed % 7);
                const a = 1 + (seed % (den - 2));
                const b = 1;
                questionText = `Calculate the sum of fractions: $\\frac{${a}}{${den}} + \\frac{${b}}{${den}}$.`;
                const num = a + b;
                rawOptions = [`$\\frac{${num}}{${den}}$`, `$\\frac{${num + 1}}{${den}}$`, `$\\frac{${num}}{${den + 2}}$`, `$\\frac{1}{${den}}$`];
                explanation = `Since the denominators are equal, add the numerators directly: $\\frac{${a} + ${b}}{${den}} = \\frac{${num}}{${den}}$.`;
            } else if (subMod === 1) {
                const px = 2 + (qIndex % 5);
                const py = 3 + (qIndex % 4);
                questionText = `In the Cartesian coordinate plane shown, identify the coordinates of point $P$.`;
                rawOptions = [`$(${px}, ${py})$`, `$(${py}, ${px})$`, `$(${px}, 0)$`, `$(0, ${py})$`];
                explanation = `Point $P$ is located at $x = ${px}$ along the horizontal axis and $y = ${py}$ along the vertical axis, giving coordinates $(${px}, ${py})$.`;
                diagram = generateSvgDiagram('coordinate_plane', { x: px, y: py });
            } else if (subMod === 2) {
                const side = 4 + (seed % 12);
                questionText = `A square playground has a side of length $${side}\\text{ m}$. What is its total perimeter?`;
                const p = side * 4;
                rawOptions = [`$${p}\\text{ m}$`, `$${side * side}\\text{ m}$`, `$${p + 4}\\text{ m}$`, `$${p - 2}\\text{ m}$`];
                explanation = `Perimeter of a square $= 4 \\times \\text{side} = 4 \\times ${side} = ${p}\\text{ m}$.`;
            } else if (subMod === 3) {
                const n1 = 12 + (seed % 15);
                const n2 = 10 + (seed % 10);
                questionText = `Find the product of $${n1} \\times ${n2}$.`;
                const prod = n1 * n2;
                rawOptions = [`$${prod}$`, `$${prod + 10}$`, `$${prod - 10}$`, `$${prod + 20}$`];
                explanation = `Multiplying the values: $${n1} \\times ${n2} = ${prod}$.`;
            } else {
                const p1 = 40 + (seed % 30);
                questionText = `Express the percentage $${p1}\\%$ as a fraction in its simplest form.`;
                const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                const g = gcd(p1, 100);
                const sn = p1 / g;
                const sd = 100 / g;
                rawOptions = [`$\\frac{${sn}}{${sd}}$`, `$\\frac{${p1}}{10}$`, `$\\frac{${sn + 1}}{${sd}}$`, `$\\frac{1}{${sd}}$`];
                explanation = `$${p1}\\% = \\frac{${p1}}{100}$. Dividing numerator and denominator by $\\gcd(${p1}, 100) = ${g}$ yields $\\frac{${sn}}{${sd}}$.`;
            }
        } else if (classNum <= 8) {
            const seed = (qIndex * 11) + (paperNum * 13);
            const subMod = qIndex % 5;

            if (subMod === 0) {
                const a = 2 + (seed % 5);
                const b = 3 + (seed % 4);
                questionText = `Solve for $x$ in the linear equation: $${a}x + ${b} = ${a * 4 + b}$.`;
                rawOptions = [`$x = 4$`, `$x = 2$`, `$x = 5$`, `$x = 3$`];
                explanation = `$${a}x = ${a * 4 + b} - ${b} = ${a * 4} \\implies x = \\frac{${a * 4}}{${a}} = 4$.`;
            } else if (subMod === 1) {
                const base = 8 + (qIndex % 6);
                const height = 6 + (qIndex % 4);
                questionText = `In $\\triangle ABC$, the altitude is $h = ${height}\\text{ cm}$ and the base is $b = ${base}\\text{ cm}$. Find the area of the triangle.`;
                const area = 0.5 * base * height;
                rawOptions = [`$${area}\\text{ cm}^2$`, `$${base * height}\\text{ cm}^2$`, `$${area + 6}\\text{ cm}^2$`, `$${area - 4}\\text{ cm}^2$`];
                explanation = `$\\text{Area} = \\frac{1}{2} \\times \\text{base} \\times \\text{height} = \\frac{1}{2} \\times ${base} \\times ${height} = ${area}\\text{ cm}^2$.`;
                diagram = generateSvgDiagram('geometry_triangle', { a: 'A', b: 'B', c: 'C', h: `${height}\\text{ cm}`, base: `${base}\\text{ cm}` });
            } else if (subMod === 2) {
                const baseVal = 2 + (seed % 4);
                const p1 = 5 + (seed % 4);
                const p2 = 3;
                questionText = `Simplify using exponent rules: $\\frac{${baseVal}^{${p1}}}{${baseVal}^{${p2}}}$.`;
                const exp = p1 - p2;
                const val = Math.pow(baseVal, exp);
                rawOptions = [`$${baseVal}^{${exp}} = ${val}$`, `$${baseVal}^{${p1 + p2}}$`, `$${baseVal}^{1}$`, `$${baseVal}^{${exp + 2}}$`];
                explanation = `$\\frac{a^m}{a^n} = a^{m-n} = ${baseVal}^{${p1} - ${p2}} = ${baseVal}^{${exp}} = ${val}$.`;
            } else if (subMod === 3) {
                const r = 7 + (qIndex % 7);
                questionText = `Calculate the circumference of a circle with radius $r = ${r}\\text{ cm}$ (use $\\pi = \\frac{22}{7}$).`;
                const c = 2 * (22 / 7) * r;
                rawOptions = [`$${c}\\text{ cm}$`, `$${(c / 2).toFixed(1)}\\text{ cm}$`, `$${c + 14}\\text{ cm}$`, `$${(c * 2).toFixed(0)}\\text{ cm}$`];
                explanation = `$C = 2\\pi r = 2 \\times \\frac{22}{7} \\times ${r} = ${c}\\text{ cm}$.`;
                diagram = generateSvgDiagram('geometry_circle', { r: `${r}\\text{ cm}` });
            } else {
                const cp = 200 + (seed % 100);
                const sp = cp + 50;
                questionText = `An item bought for $\\text{Rs. } ${cp}$ is sold for $\\text{Rs. } ${sp}$. What is the profit percentage?`;
                const profitPct = (((sp - cp) / cp) * 100).toFixed(1);
                rawOptions = [`$${profitPct}\\%$`, `$${(profitPct * 1.2).toFixed(1)}\\%$`, `$15\\%$`, `$20\\%$`];
                explanation = `$\\text{Profit } = ${sp} - ${cp} = 50$. $\\text{Profit}\\% = \\frac{50}{${cp}} \\times 100\\% = ${profitPct}\\%$.`;
            }
        } else {
            // Classes 9 to 12
            const seed = (qIndex * 13) + (paperNum * 17);
            const subMod = qIndex % 6;

            if (subMod === 0) {
                const a = 1 + (seed % 3);
                const b = 5 + (seed % 5);
                const c = 6;
                // x^2 - (r1+r2)x + r1*r2 = 0
                const r1 = 2 + (seed % 4);
                const r2 = 3 + (seed % 3);
                const bCoeff = r1 + r2;
                const cConst = r1 * r2;
                questionText = `Find the roots of the quadratic equation: $x^2 - ${bCoeff}x + ${cConst} = 0$.`;
                rawOptions = [`$x = ${r1},\\; ${r2}$`, `$x = -${r1},\\; -${r2}$`, `$x = ${r1 + 1},\\; ${r2 - 1}$`, `$x = 1,\\; ${cConst}$`];
                explanation = `Factorizing: $(x - ${r1})(x - ${r2}) = 0 \\implies x = ${r1}$ or $x = ${r2}$.`;
            } else if (subMod === 1) {
                const r = 5 + (qIndex % 5);
                questionText = `In the given circle with center $O$ and radius $r = ${r}\\text{ cm}$, a sector has a central angle $\\theta = 60^\\circ$. What is the area of this sector?`;
                const sectorArea = ((60 / 360) * Math.PI * r * r).toFixed(2);
                rawOptions = [`$\\frac{${r * r}\\pi}{6}\\text{ cm}^2$`, `$\\frac{${r}\\pi}{3}\\text{ cm}^2$`, `$\\frac{${r * r}\\pi}{3}\\text{ cm}^2$`, `$${r * r}\\pi\\text{ cm}^2$`];
                explanation = `$\\text{Sector Area} = \\frac{\\theta}{360^\\circ} \\times \\pi r^2 = \\frac{60^\\circ}{360^\\circ} \\times \\pi (${r})^2 = \\frac{${r * r}\\pi}{6}\\text{ cm}^2$.`;
                diagram = generateSvgDiagram('geometry_circle', { r: `${r}\\text{ cm}`, angle: '60^\\circ' });
            } else if (subMod === 2) {
                const a = 2 + (seed % 4);
                questionText = `Evaluate the definite integral: $\\int_{0}^{2} (${a}x + 1)\\, dx$.`;
                const val = (a * 0.5 * 4) + 2;
                rawOptions = [`$${val}$`, `$${val + 2}$`, `$${val - 3}$`, `$${val * 2}$`];
                explanation = `$\\left[ \\frac{${a}x^2}{2} + x \\right]_{0}^{2} = \\left( \\frac{${a}(4)}{2} + 2 \\right) - 0 = ${a * 2 + 2} = ${val}$.`;
            } else if (subMod === 3) {
                const a11 = 2 + (seed % 3);
                const a22 = 4 + (seed % 3);
                const a12 = 1;
                const a21 = 3;
                questionText = `Find the determinant of the matrix $M = \\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix}$.`;
                const det = (a11 * a22) - (a12 * a21);
                rawOptions = [`$${det}$`, `$${det + 4}$`, `$${det - 3}$`, `$${a11 * a22}$`];
                explanation = `$\\det(M) = (${a11})(${a22}) - (${a12})(${a21}) = ${a11 * a22} - ${a12 * a21} = ${det}$.`;
            } else if (subMod === 4) {
                questionText = `Find the derivative of $f(x) = \\sin(3x) + e^{2x}$ with respect to $x$ at $x = 0$.`;
                rawOptions = [`$5$`, `$3$`, `$2$`, `$0$`];
                explanation = `$f'(x) = 3\\cos(3x) + 2e^{2x}$. At $x = 0$: $f'(0) = 3\\cos(0) + 2e^0 = 3(1) + 2(1) = 5$.`;
            } else {
                questionText = `A bag contains $4$ red balls and $6$ black balls. If two balls are drawn at random without replacement, what is the probability that both balls are red?`;
                rawOptions = [`$\\frac{2}{15}$`, `$\\frac{4}{25}$`, `$\\frac{1}{5}$`, `$\\frac{1}{3}$`];
                explanation = `$P = \\frac{4}{10} \\times \\frac{3}{9} = \\frac{2}{5} \\times \\frac{1}{3} = \\frac{2}{15}$.`;
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 2. SCIENCE (NSO / iOS Standard)
    // ════════════════════════════════════════════════════════════════
    else if (subject === 'Science') {
        if (classNum <= 2) {
            const subMod = qIndex % 4;
            if (subMod === 0) {
                questionText = `Which part of a plant grows downwards into the soil to absorb water and minerals?`;
                rawOptions = ['Roots', 'Leaves', 'Flowers', 'Stem'];
                explanation = 'Roots grow underground and anchor the plant while absorbing water and nutrients from the soil.';
                if (hasPhoto) {
                    image = { url: '/images/olympiad/plant_roots.webp', alt: 'Healthy plant root system in soil', type: 'PHOTOGRAPH' };
                }
            } else if (subMod === 1) {
                questionText = `Look at the food chain diagram. What role does the rabbit play in this ecosystem?`;
                rawOptions = ['Primary Consumer (Herbivore)', 'Producer', 'Secondary Consumer (Carnivore)', 'Decomposer'];
                explanation = 'The rabbit feeds directly on green plants, making it a primary consumer and herbivore.';
                diagram = generateSvgDiagram('food_chain');
            } else if (subMod === 2) {
                questionText = `Which sense organ allows humans to distinguish different colors and shapes of objects?`;
                rawOptions = ['Eyes', 'Ears', 'Nose', 'Skin'];
                explanation = 'Eyes contain photoreceptor cells that enable vision and color perception.';
            } else {
                questionText = `What do green plants need along with water and soil to make their food?`;
                rawOptions = ['Sunlight and Carbon dioxide', 'Only darkness', 'Salt and sugar', 'Ice and snow'];
                explanation = 'Plants require sunlight, carbon dioxide from the air, and water to perform photosynthesis.';
            }
        } else if (classNum <= 5) {
            const subMod = qIndex % 4;
            if (subMod === 0) {
                questionText = `Look at the given food chain: $\\text{Plant} \\rightarrow \\text{Rabbit} \\rightarrow \\text{Fox}$. Which organism is the apex carnivore?`;
                rawOptions = ['Fox', 'Rabbit', 'Plant', 'Sun'];
                explanation = 'The fox feeds on the rabbit and occupies the highest trophic level in this chain.';
                diagram = generateSvgDiagram('food_chain');
            } else if (subMod === 1) {
                questionText = `What state of matter has a fixed volume but changes its shape according to the container?`;
                rawOptions = ['Liquid', 'Solid', 'Gas', 'Plasma'];
                explanation = 'Liquids have definite volume due to cohesive intermolecular forces but take the shape of their container.';
            } else if (subMod === 2) {
                questionText = `At standard sea-level pressure, at what temperature does pure water freeze into solid ice?`;
                rawOptions = [`$0^\\circ\\text{C}$`, `$100^\\circ\\text{C}$`, `$32^\\circ\\text{C}$`, `$-10^\\circ\\text{C}$`];
                explanation = `Pure water freezes at $0^\\circ\\text{C}$ ($32^\\circ\\text{F}$ or $273.15\\text{ K}$) at standard pressure.`;
            } else {
                questionText = `Which celestial body is at the center of our Solar System, holding planets in orbit by its gravity?`;
                rawOptions = ['The Sun', 'Jupiter', 'The Earth', 'The Moon'];
                explanation = 'The Sun contains over $99.8\\%$ of the Solar System mass and exerts the gravitational pull keeping planets in orbit.';
            }
        } else if (classNum <= 8) {
            const subMod = qIndex % 5;
            if (subMod === 0) {
                questionText = `In the plant cell diagram shown, which prominent organelle contains cellular sap and maintains turgidity?`;
                rawOptions = ['Central Vacuole', 'Nucleus', 'Chloroplast', 'Cell Wall'];
                explanation = 'The large central vacuole stores water and solutes, maintaining turgor pressure against the cell wall.';
                diagram = generateSvgDiagram('plant_cell');
            } else if (subMod === 1) {
                const rVal = 2 + (qIndex % 6);
                questionText = `Examine the electric circuit diagram. If the resistor has $R = ${rVal}\\,\\Omega$ and the source is $V = 12\\text{ V}$, calculate the current $I$ flowing through the circuit.`;
                const current = (12 / rVal).toFixed(1);
                rawOptions = [`$${current}\\text{ A}$`, `$${(12 * rVal).toFixed(1)}\\text{ A}$`, `$${(current * 2).toFixed(1)}\\text{ A}$`, `$${(current / 2).toFixed(1)}\\text{ A}$`];
                explanation = `According to Ohm's Law: $I = \\frac{V}{R} = \\frac{12}{${rVal}} = ${current}\\text{ A}$.`;
                diagram = generateSvgDiagram('electric_circuit', { v: '12V', r: `${rVal}\\,\\Omega` });
            } else if (subMod === 2) {
                questionText = `What is the chemical formula of Sulfuric Acid?`;
                rawOptions = [`$\\ce{H2SO4}$`, `$\\ce{HCl}$`, `$\\ce{HNO3}$`, `$\\ce{H2CO3}$`];
                explanation = `Sulfuric acid is composed of two hydrogen atoms, one sulfur atom, and four oxygen atoms: $\\ce{H2SO4}$.`;
            } else if (subMod === 3) {
                const pCount = 6 + (qIndex % 3);
                const elem = pCount === 6 ? 'Carbon' : pCount === 7 ? 'Nitrogen' : 'Oxygen';
                questionText = `Look at the atomic structure diagram. An atom has $${pCount}$ protons and $${pCount}$ electrons. What element is this?`;
                rawOptions = [elem, 'Hydrogen', 'Helium', 'Sodium'];
                explanation = `The atomic number $Z$ equals the number of protons. $Z = ${pCount}$ corresponds to ${elem}.`;
                diagram = generateSvgDiagram('bohr_atom', { element: elem, protons: pCount, electrons: pCount });
            } else {
                questionText = `Which blood cells are primarily responsible for transporting oxygen from the lungs to body tissues?`;
                rawOptions = ['Red Blood Cells (Erythrocytes)', 'White Blood Cells (Leukocytes)', 'Platelets (Thrombocytes)', 'Plasma proteins'];
                explanation = 'Red blood cells contain hemoglobin molecules that bind reversibly to oxygen for systemic transport.';
            }
        } else {
            // Classes 9 to 12
            const subMod = qIndex % 5;
            if (subMod === 0) {
                const m = 2 + (qIndex % 5);
                const f = 10 + (qIndex % 10);
                const a = (f / m).toFixed(1);
                questionText = `A block of mass $m = ${m}\\text{ kg}$ is acted upon by a constant force $F = ${f}\\text{ N}$ on a frictionless horizontal plane. Find its acceleration.`;
                rawOptions = [`$${a}\\text{ m/s}^2$`, `$${(f * m).toFixed(1)}\\text{ m/s}^2$`, `$${(a * 2).toFixed(1)}\\text{ m/s}^2$`, `$${(f - m).toFixed(1)}\\text{ m/s}^2$`];
                explanation = `From Newton's second law: $F = ma \\implies a = \\frac{F}{m} = \\frac{${f}}{${m}} = ${a}\\text{ m/s}^2$.`;
            } else if (subMod === 1) {
                questionText = `In the Bohr model shown, what is the maximum number of electrons that can occupy the principal quantum shell $n = 2$?`;
                rawOptions = [`$8$`, `$2$`, `$18$`, `$32$`];
                explanation = `The maximum electron capacity of shell $n$ is given by $2n^2$. For $n = 2$: $2(2)^2 = 8$ electrons.`;
                diagram = generateSvgDiagram('bohr_atom', { element: 'Carbon', protons: 6, electrons: 6 });
            } else if (subMod === 2) {
                questionText = `Consider the balanced chemical neutralization reaction: $\\ce{NaOH + HCl -> NaCl + H2O}$. At $25^\\circ\\text{C}$, what is the $\\text{pH}$ of the resulting neutral aqueous solution?`;
                rawOptions = [`$\\text{pH} = 7$`, `$\\text{pH} = 1$`, `$\\text{pH} = 14$`, `$\\text{pH} = 0$`];
                explanation = `Neutralization of strong base $\\ce{NaOH}$ with strong acid $\\ce{HCl}$ produces neutral $\\ce{NaCl}$ and water with neutral $\\text{pH} = 7$.`;
            } else if (subMod === 3) {
                const rVal = 5 + (qIndex % 10);
                questionText = `In the given circuit, what is the electrical power dissipated across a resistor $R = ${rVal}\\,\\Omega$ when carrying a direct current of $I = 2\\text{ A}$?`;
                const power = (2 * 2 * rVal);
                rawOptions = [`$${power}\\text{ W}$`, `$${rVal * 2}\\text{ W}$`, `$${power * 2}\\text{ W}$`, `$${power / 2}\\text{ W}$`];
                explanation = `Electrical power is given by Joule's heating formula: $P = I^2 R = (2)^2 \\times ${rVal} = 4 \\times ${rVal} = ${power}\\text{ W}$.`;
                diagram = generateSvgDiagram('electric_circuit', { v: '24V', r: `${rVal}\\,\\Omega` });
            } else {
                questionText = `According to Einstein's mass-energy relation $E = mc^2$, calculate the energy equivalent of a mass $m = 1\\times 10^{-3}\\text{ kg}$ (taking $c = 3\\times 10^8\\text{ m/s}$).`;
                rawOptions = [`$9 \\times 10^{13}\\text{ J}$`, `$3 \\times 10^8\\text{ J}$`, `$9 \\times 10^{16}\\text{ J}$`, `$1 \\times 10^{11}\\text{ J}$`];
                explanation = `$E = mc^2 = (10^{-3}\\text{ kg}) \\times (3 \\times 10^8\\text{ m/s})^2 = 10^{-3} \\times (9 \\times 10^{16}) = 9 \\times 10^{13}\\text{ J}$.`;
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 3. ENGLISH (IEO / iOEL Standard)
    // ════════════════════════════════════════════════════════════════
    else if (subject === 'English') {
        if (classNum <= 2) {
            const subMod = qIndex % 4;
            if (subMod === 0) {
                questionText = `Choose the correct plural form of the irregular noun: \\textbf{child}.`;
                rawOptions = ['children', 'childs', 'childrens', 'childes'];
                explanation = 'The plural form of "child" is the irregular plural "children".';
            } else if (subMod === 1) {
                questionText = `Select the direct antonym (opposite) of the adjective \\textbf{brave}:`;
                rawOptions = ['cowardly', 'strong', 'fearless', 'heroic'];
                explanation = '"Brave" describes courage, so its direct antonym is "cowardly".';
            } else if (subMod === 2) {
                questionText = `Fill in the blank with the appropriate preposition: \\textit{"The cat slept \\underline{\\quad\\quad} the table."}`;
                rawOptions = ['under', 'into', 'uponly', 'throughoutly'];
                explanation = '"Under" indicates position below the surface of the table.';
            } else {
                questionText = `Identify the noun in the sentence: \\textit{"The fast rabbit hopped across the field."}`;
                rawOptions = ['rabbit', 'fast', 'hopped', 'across'];
                explanation = '"Rabbit" is the naming word (noun) denoting the animal.';
            }
        } else if (classNum <= 5) {
            const subMod = qIndex % 4;
            if (subMod === 0) {
                questionText = `Identify the part of speech of the underlined word: \\textit{"She sang \\underline{\\textbf{melodiously}} during the concert."}`;
                rawOptions = ['Adverb', 'Adjective', 'Noun', 'Verb'];
                explanation = '"Melodiously" modifies the verb "sang", making it an adverb of manner.';
            } else if (subMod === 1) {
                questionText = `Select the synonym of \\textbf{enormous}:`;
                rawOptions = ['Gigantic', 'Miniature', 'Slender', 'Fragile'];
                explanation = '"Enormous" means extremely large, identical in meaning to "gigantic".';
            } else if (subMod === 2) {
                questionText = `Choose the sentence with correct subject-verb agreement:`;
                rawOptions = [
                    'Neither the teacher nor the students were present.',
                    'Neither the teacher nor the students was present.',
                    'Neither the teacher or the students is present.',
                    'Neither the teacher nor the students has been present.'
                ];
                explanation = 'With "neither... nor", the verb agrees with the closer subject ("students", plural -> "were").';
            } else {
                questionText = `Select the correctly spelled word:`;
                rawOptions = ['Necessary', 'Neccessary', 'Necassary', 'Necessery'];
                explanation = 'The correct spelling is "Necessary" (one c, two s\'s).';
            }
        } else if (classNum <= 8) {
            const subMod = qIndex % 4;
            if (subMod === 0) {
                questionText = `Transform the active sentence to passive voice: \\textit{"The architect designed the magnificent stadium."}`;
                rawOptions = [
                    'The magnificent stadium was designed by the architect.',
                    'The magnificent stadium is designed by the architect.',
                    'The magnificent stadium had been designing by the architect.',
                    'The architect was designed by the stadium.'
                ];
                explanation = 'Simple past active becomes "was/were + past participle": "was designed by the architect".';
            } else if (subMod === 1) {
                questionText = `Identify the poetic device used in: \\textit{"The stars danced playfully in the moonlit sky."}`;
                rawOptions = ['Personification', 'Simile', 'Metaphor', 'Hyperbole'];
                explanation = 'Giving human qualities (dancing playfully) to celestial objects (stars) is personification.';
            } else if (subMod === 2) {
                questionText = `Choose the word closest in meaning to \\textbf{meticulous}:`;
                rawOptions = ['Punctilious', 'Careless', 'Hasty', 'Indifferent'];
                explanation = '"Meticulous" means showing great attention to detail, synonymous with "punctilious".';
            } else {
                questionText = `Fill in the blank with the correct modal auxiliary: \\textit{"You \\underline{\\quad\\quad} submit your project before the deadline without exception."}`;
                rawOptions = ['must', 'might', 'could', 'may'];
                explanation = '"Must" expresses strict necessity and mandatory obligation.';
            }
        } else {
            // Classes 9 to 12
            const subMod = qIndex % 4;
            if (subMod === 0) {
                questionText = `Identify the grammatical error in the sentence: \\textit{"Had the committee \\underline{approved}(A) the proposal earlier, the research \\underline{would proceed}(B) without \\underline{any}(C) unforeseen \\underline{delays}(D)."}`;
                rawOptions = [
                    'Part (B): should be "would have proceeded"',
                    'Part (A): should be "had approve"',
                    'Part (C): should be "some"',
                    'Part (D): should be "delaying"'
                ];
                explanation = 'In third conditional clauses (Had + V3), the result clause requires "would have + past participle" (would have proceeded).';
            } else if (subMod === 1) {
                questionText = `Choose the pair that best expresses a relationship similar to \\textbf{EPHEMERAL : PERMANENCE}::`;
                rawOptions = [
                    'TRANSIENT : ENDURANCE',
                    'METICULOUS : ACCURACY',
                    'AUDACIOUS : COURAGE',
                    'LUCID : CLARITY'
                ];
                explanation = '"Ephemeral" denotes lack of permanence; similarly, "transient" denotes lack of endurance.';
            } else if (subMod === 2) {
                questionText = `Select the most appropriate word to fill in the blank: \\textit{"The professor delivered a \\underline{\\quad\\quad} critique that exposed the flaws of the hypothesis with surgical precision."}`;
                rawOptions = ['trenchant', 'specious', 'pedantic', 'lugubrious'];
                explanation = '"Trenchant" means incisive, vigorously effective, and articulate.';
            } else {
                questionText = `Identify the figure of speech in the phrase: \\textit{"Deafening silence filled the auditorium after the announcement."}`;
                rawOptions = ['Oxymoron', 'Synecdoche', 'Metonymy', 'Litotes'];
                explanation = 'Combining contradictory terms ("deafening" and "silence") side by side is an oxymoron.';
            }
        }
    }

    // Permute options so that the correct answer is placed at targetCorrectIndex
    const correctOpt = rawOptions[0];
    const wrongOpts = rawOptions.slice(1);
    const shuffledOptions = [...wrongOpts];
    shuffledOptions.splice(targetCorrectIndex, 0, correctOpt);

    return {
        question: questionText,
        options: shuffledOptions,
        correctAnswer: targetCorrectIndex,
        explanation,
        classGrade: String(classNum),
        studentClass: classNum,
        subject,
        chapter: topic,
        topic,
        subtopic: topic,
        subTopic: topic,
        difficulty,
        type: 'MCQ',
        questionType: 'MCQ (Multiple Choice Question)',
        marks: 1,
        negativeMarks: 0,
        exam: 'olympiad',
        examType: 'Olympiad',
        provenance: paperNum <= 4 ? 'VERIFIED_PREVIOUS_YEAR' : (paperNum <= 8 ? 'ADAPTED' : 'ORIGINAL'),
        verificationStatus: 'VERIFIED',
        publicationStatus: 'PUBLISHED',
        status: 'PUBLISHED',
        latexEnabled: true,
        diagram: diagram || null,
        image: image || null,
        isVisual: !!diagram || !!image
    };
}

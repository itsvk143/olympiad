/**
 * SVG Diagram Generators for Olympiad Examination Platform
 * Supports Geometry, Physics, Chemistry, Biology, and General Science.
 */

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
    if (type === 'cyclic_quadrilateral') {
        const { a = 'A', b = 'B', c = 'C', d = 'D', p = 'P' } = params;
        return `<svg viewBox="0 0 240 240" width="240" height="240" xmlns="http://www.w3.org/2000/svg">
            <circle cx="120" cy="120" r="90" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="2" />
            <polygon points="120,30 205,95 175,195 45,170" fill="rgba(99, 102, 241, 0.12)" stroke="#818cf8" stroke-width="2" />
            <line x1="120" y1="30" x2="175" y2="195" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
            <line x1="205" y1="95" x2="45" y2="170" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
            <circle cx="125" cy="115" r="3.5" fill="#ef4444" />
            <text x="115" y="22" fill="#f8fafc" font-size="13" font-weight="bold">${a}</text>
            <text x="212" y="100" fill="#f8fafc" font-size="13" font-weight="bold">${b}</text>
            <text x="180" y="212" fill="#f8fafc" font-size="13" font-weight="bold">${c}</text>
            <text x="28" y="180" fill="#f8fafc" font-size="13" font-weight="bold">${d}</text>
            <text x="132" y="112" fill="#ef4444" font-size="11" font-weight="bold">${p}</text>
        </svg>`;
    }
    if (type === 'geometry_ceva') {
        return `<svg viewBox="0 0 240 200" width="240" height="200" xmlns="http://www.w3.org/2000/svg">
            <polygon points="120,30 30,170 210,170" fill="rgba(56, 189, 248, 0.08)" stroke="#38bdf8" stroke-width="2" />
            <line x1="120" y1="30" x2="135" y2="170" stroke="#f59e0b" stroke-width="1.5" />
            <line x1="30" y1="170" x2="165" y2="100" stroke="#f59e0b" stroke-width="1.5" />
            <line x1="210" y1="170" x2="75" y2="100" stroke="#f59e0b" stroke-width="1.5" />
            <circle cx="123" cy="118" r="3.5" fill="#ef4444" />
            <text x="115" y="22" fill="#f8fafc" font-size="12" font-weight="bold">A</text>
            <text x="15" y="178" fill="#f8fafc" font-size="12" font-weight="bold">B</text>
            <text x="218" y="178" fill="#f8fafc" font-size="12" font-weight="bold">C</text>
            <text x="133" y="188" fill="#a5b4fc" font-size="11">D</text>
            <text x="173" y="102" fill="#a5b4fc" font-size="11">E</text>
            <text x="60" y="102" fill="#a5b4fc" font-size="11">F</text>
            <text x="130" y="120" fill="#ef4444" font-size="11" font-weight="bold">P</text>
        </svg>`;
    }
    if (type === 'physics_rotational_pulley') {
        return `<svg viewBox="0 0 220 220" width="220" height="220" xmlns="http://www.w3.org/2000/svg">
            <line x1="60" y1="20" x2="160" y2="20" stroke="#94a3b8" stroke-width="4" />
            <line x1="110" y1="20" x2="110" y2="60" stroke="#94a3b8" stroke-width="2.5" />
            <circle cx="110" cy="80" r="35" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" stroke-width="2.5" />
            <circle cx="110" cy="80" r="5" fill="#f59e0b" />
            <text x="100" y="85" fill="#f8fafc" font-size="10">M, R</text>
            <line x1="145" y1="80" x2="145" y2="160" stroke="#cbd5e1" stroke-width="2" />
            <rect x="130" y="160" width="30" height="30" fill="rgba(244, 63, 94, 0.2)" stroke="#f43f5e" stroke-width="2" />
            <text x="140" y="180" fill="#f8fafc" font-size="12" font-weight="bold">m</text>
            <text x="155" y="125" fill="#f59e0b" font-size="11">T</text>
        </svg>`;
    }
    if (type === 'thermo_pv_cycle') {
        return `<svg viewBox="0 0 240 200" width="240" height="200" xmlns="http://www.w3.org/2000/svg">
            <line x1="40" y1="170" x2="220" y2="170" stroke="#94a3b8" stroke-width="2" />
            <line x1="40" y1="170" x2="40" y2="20" stroke="#94a3b8" stroke-width="2" />
            <text x="215" y="188" fill="#94a3b8" font-size="12">V</text>
            <text x="22" y="25" fill="#94a3b8" font-size="12">P</text>
            <polygon points="70,50 180,50 180,140 70,140" fill="rgba(16, 185, 129, 0.12)" stroke="#10b981" stroke-width="2" />
            <text x="60" y="45" fill="#f8fafc" font-size="11" font-weight="bold">A(P1, V1)</text>
            <text x="185" y="45" fill="#f8fafc" font-size="11" font-weight="bold">B(P1, V2)</text>
            <text x="185" y="145" fill="#f8fafc" font-size="11" font-weight="bold">C(P2, V2)</text>
            <text x="60" y="152" fill="#f8fafc" font-size="11" font-weight="bold">D(P2, V1)</text>
            <line x1="120" y1="46" x2="135" y2="46" stroke="#10b981" stroke-width="2" />
            <line x1="184" y1="90" x2="184" y2="105" stroke="#10b981" stroke-width="2" />
            <line x1="135" y1="144" x2="120" y2="144" stroke="#10b981" stroke-width="2" />
            <line x1="66" y1="105" x2="66" y2="90" stroke="#10b981" stroke-width="2" />
        </svg>`;
    }
    if (type === 'chemistry_reaction_energy') {
        return `<svg viewBox="0 0 240 180" width="240" height="180" xmlns="http://www.w3.org/2000/svg">
            <line x1="30" y1="150" x2="220" y2="150" stroke="#94a3b8" stroke-width="2" />
            <line x1="30" y1="150" x2="30" y2="20" stroke="#94a3b8" stroke-width="2" />
            <text x="25" y="15" fill="#94a3b8" font-size="11">Energy (E)</text>
            <text x="120" y="170" fill="#94a3b8" font-size="11">Reaction Coordinate</text>
            <path d="M 35,110 L 70,110 Q 110,20 140,50 Q 160,80 180,130 L 215,130" fill="none" stroke="#f43f5e" stroke-width="2.5" />
            <line x1="70" y1="110" x2="140" y2="110" stroke="#64748b" stroke-width="1" stroke-dasharray="3,3" />
            <line x1="125" y1="35" x2="125" y2="110" stroke="#f59e0b" stroke-width="1.5" />
            <text x="132" y="75" fill="#f59e0b" font-size="11">E_a</text>
            <line x1="180" y1="130" x2="180" y2="110" stroke="#38bdf8" stroke-width="1.5" />
            <text x="186" y="122" fill="#38bdf8" font-size="11">ΔH &lt; 0</text>
            <text x="40" y="105" fill="#f8fafc" font-size="10">Reactants</text>
            <text x="180" y="145" fill="#f8fafc" font-size="10">Products</text>
        </svg>`;
    }
    if (type === 'biology_action_potential') {
        return `<svg viewBox="0 0 240 180" width="240" height="180" xmlns="http://www.w3.org/2000/svg">
            <line x1="30" y1="120" x2="220" y2="120" stroke="#475569" stroke-width="1" stroke-dasharray="3,3" />
            <line x1="30" y1="150" x2="220" y2="150" stroke="#94a3b8" stroke-width="1.5" />
            <line x1="30" y1="150" x2="30" y2="20" stroke="#94a3b8" stroke-width="1.5" />
            <text x="5" y="124" fill="#94a3b8" font-size="9">-70mV</text>
            <text x="5" y="100" fill="#f59e0b" font-size="9">-55mV</text>
            <text x="5" y="45" fill="#10b981" font-size="9">+30mV</text>
            <path d="M 30,120 L 70,120 Q 80,118 90,100 Q 110,35 125,40 Q 140,45 155,135 Q 165,145 180,120 L 215,120" fill="none" stroke="#38bdf8" stroke-width="2.5" />
            <text x="75" y="65" fill="#38bdf8" font-size="10">Depol (Na+ in)</text>
            <text x="145" y="85" fill="#f43f5e" font-size="10">Repol (K+ out)</text>
            <text x="150" y="165" fill="#a855f7" font-size="9">Hyperpolarization</text>
        </svg>`;
    }
    if (type === 'biology_mitosis_meiosis') {
        return `<svg viewBox="0 0 240 180" width="240" height="180" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="120" cy="90" rx="95" ry="70" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" stroke-width="2" />
            <circle cx="45" cy="90" r="5" fill="#f59e0b" />
            <circle cx="195" cy="90" r="5" fill="#f59e0b" />
            <text x="25" y="112" fill="#f59e0b" font-size="9">Centrosome</text>
            <line x1="120" y1="20" x2="120" y2="160" stroke="#64748b" stroke-width="1" stroke-dasharray="3,3" />
            <text x="80" y="172" fill="#94a3b8" font-size="9">Metaphase Plate</text>
            <rect x="116" y="50" width="8" height="24" rx="2" fill="#38bdf8" />
            <rect x="116" y="80" width="8" height="24" rx="2" fill="#ec4899" />
            <rect x="116" y="110" width="8" height="24" rx="2" fill="#8b5cf6" />
            <line x1="45" y1="90" x2="116" y2="62" stroke="#38bdf8" stroke-width="1.2" />
            <line x1="195" y1="90" x2="124" y2="62" stroke="#38bdf8" stroke-width="1.2" />
            <line x1="45" y1="90" x2="116" y2="92" stroke="#ec4899" stroke-width="1.2" />
            <line x1="195" y1="90" x2="124" y2="92" stroke="#ec4899" stroke-width="1.2" />
            <line x1="45" y1="90" x2="116" y2="122" stroke="#8b5cf6" stroke-width="1.2" />
            <line x1="195" y1="90" x2="124" y2="122" stroke="#8b5cf6" stroke-width="1.2" />
        </svg>`;
    }
    return null;
}


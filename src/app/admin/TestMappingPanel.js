'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

const LatexRenderer = dynamic(() => import('../../components/LatexRenderer'), { ssr: false });

// ── Full static chapter map ─────────────────────────────────────────────────
const STATIC_CHAPTERS = {
    Physics: [
        "Physics and Measurement","Kinematics","Laws of Motion","Work, Energy, and Power",
        "Rotational Motion","Gravitation","Properties of Solids and Liquids","Thermodynamics",
        "Kinetic Theory of Gases","Oscillations and Waves","Electrostatics","Current Electricity",
        "Magnetic Effects of Current and Magnetism","Electromagnetic Induction and Alternating Currents",
        "Electromagnetic Waves","Optics","Dual Nature of Matter and Radiation","Atoms and Nuclei",
        "Electronic Devices","Experimental Skills"
    ],
    Chemistry: [
        "Some Basic Concepts in Chemistry","Atomic Structure","Chemical Bonding and Molecular Structure",
        "Chemical Thermodynamics","Solutions","Equilibrium","Redox Reactions and Electrochemistry",
        "Chemical Kinetics","Classification of Elements and Periodicity in Properties","P-Block Elements",
        "d and f- Block Elements","Co-ordination Compounds","Purification and Characterisation of Organic Compounds",
        "Some Basic Principles of Organic Chemistry","Organic Name Reactions","Hydrocarbons","Organic Compounds Containing Halogens",
        "Organic Compounds Containing Oxygen","Organic Compounds Containing Nitrogen",
        "Biomolecules","Principles Related to Practical Chemistry"
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

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Botany', 'Zoology', 'English Proficiency', 'Logical Reasoning'];

const TYPE_COLORS = {
    MCQ: '#3b82f6',
    NUMERICAL: '#8b5cf6',
    ASSERTION_REASON: '#f59e0b',
};

const TYPE_LABEL = { MCQ: 'MCQ', NUMERICAL: 'Numerical', ASSERTION_REASON: 'Assertion & Reason' };

export const normalizeDifficulty = (diff) => {
    if (!diff) return 'MODERATE';
    const s = String(diff).trim().toUpperCase();
    if (s.includes('EASY')) return 'EASY';
    if (s.includes('HARD') || s.includes('DIFF')) return 'DIFFICULT';
    return 'MODERATE';
};

// ── Helper badges ─────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
    const t = type || 'MCQ';
    return (
        <span style={{
            fontSize: '0.7rem', padding: '2px 7px', borderRadius: '5px',
            background: TYPE_COLORS[t] || '#475569', color: 'white', fontWeight: 700,
        }}>
            {TYPE_LABEL[t] || t}
        </span>
    );
}

function DifficultyBadge({ difficulty }) {
    const d = normalizeDifficulty(difficulty);
    const color = d === 'EASY' ? '#34d399' : d === 'DIFFICULT' ? '#f87171' : '#fbbf24';
    const bg = d === 'EASY' ? 'rgba(16,185,129,0.18)' : d === 'DIFFICULT' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)';
    const border = d === 'EASY' ? '#10b981' : d === 'DIFFICULT' ? '#ef4444' : '#f59e0b';
    return (
        <span style={{
            fontSize: '0.68rem', padding: '2px 7px', borderRadius: '5px',
            background: bg, color: color, border: `1px solid ${border}44`, fontWeight: 700,
            whiteSpace: 'nowrap'
        }}>
            {d === 'EASY' ? '🟢 EASY' : d === 'DIFFICULT' ? '🔴 DIFFICULT' : '🟡 MODERATE'}
        </span>
    );
}

// ── Helper parser for Assertion & Reasoning vs standard question ─────────────
function parseQuestionContent(q) {
    if (!q) return { introText: '', assertion: '', reason: '', mainText: '', isAR: false };

    const rawType = (q.type || q.questionType || '').toString().toUpperCase();
    const isARType = rawType.includes('ASSERTION') || rawType === 'AR';

    let text = (q.text || q.question || '').trim();
    let assertion = (q.assertion || '').trim();
    let reason = (q.reason || '').trim();
    let introText = '';

    if (assertion && reason) {
        if (text) {
            const beforeAR = text.split(/Assertion\s*(?:\(A\))?\s*:/i)[0]?.trim();
            if (beforeAR && !beforeAR.toLowerCase().startsWith('assertion')) {
                introText = beforeAR;
            } else if (!text.includes(assertion)) {
                introText = text;
            }
        }
    } else {
        const arRegex = /Assertion\s*(?:\(A\))?\s*:\s*([\s\S]+?)\s*Reason\s*(?:\(R\))?\s*:\s*([\s\S]+)$/i;
        const match = text.match(arRegex);
        if (match) {
            const beforeAR = text.split(/Assertion\s*(?:\(A\))?\s*:/i)[0]?.trim();
            introText = beforeAR || 'Given below are two statements: one is labelled as Assertion (A) and the other is labelled as Reason (R).';
            assertion = match[1].replace(/In\s+(?:the\s+)?light\s+of\s+the\s+above\s+statements[\s\S]*$/i, '').trim();
            reason = match[2].replace(/In\s+(?:the\s+)?light\s+of\s+the\s+above\s+statements[\s\S]*$/i, '').trim();
        }
    }

    const actuallyAR = isARType || Boolean(assertion && reason);

    return {
        introText,
        assertion,
        reason,
        mainText: actuallyAR ? '' : text,
        isAR: actuallyAR
    };
}

// ── Question Card Body Renderer ──────────────────────────────────────────────
function QuestionCardBody({ q, viewMode }) {
    const [showOptions, setShowOptions] = useState(false);
    const { introText, assertion, reason, mainText, isAR } = useMemo(() => parseQuestionContent(q), [q]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            {isAR ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {introText && (
                        <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.5 }}>
                            <LatexRenderer text={introText} />
                        </div>
                    )}
                    {/* Assertion Box */}
                    <div style={{
                        background: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderLeft: '4px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '9px 12px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{
                                background: '#f59e0b',
                                color: '#0f172a',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                letterSpacing: '0.5px'
                            }}>ASSERTION (A)</span>
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#fef3c7', lineHeight: 1.55 }}>
                            <LatexRenderer text={assertion || q.assertion || ''} />
                        </div>
                    </div>

                    {/* Reason Box */}
                    <div style={{
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderLeft: '4px solid #38bdf8',
                        borderRadius: '6px',
                        padding: '9px 12px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{
                                background: '#38bdf8',
                                color: '#0f172a',
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                letterSpacing: '0.5px'
                            }}>REASON (R)</span>
                        </div>
                        <div style={{ fontSize: '0.88rem', color: '#e0f2fe', lineHeight: 1.55 }}>
                            <LatexRenderer text={reason || q.reason || ''} />
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    fontSize: '0.88rem',
                    color: '#e2e8f0',
                    lineHeight: 1.55,
                    wordBreak: 'break-word',
                    ...(viewMode === 'compact' ? { maxHeight: '4.8em', overflow: 'hidden', textOverflow: 'ellipsis' } : {})
                }}>
                    <LatexRenderer text={mainText || q.text || q.assertion || ''} />
                </div>
            )}

            {/* Diagram (SVG) if present */}
            {q.diagram && (
                <div 
                    style={{ marginTop: '8px', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}
                    dangerouslySetInnerHTML={{ __html: q.diagram }}
                />
            )}

            {/* Image if present */}
            {(q.image || q.img) && (
                <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'center' }}>
                    <img 
                        src={typeof (q.image || q.img) === 'string' ? (q.image || q.img) : (q.image?.url || q.img?.url || '')} 
                        alt="Question Diagram" 
                        style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} 
                    />
                </div>
            )}

            {/* Numerical answer if NUMERICAL */}
            {q.type === 'NUMERICAL' && (q.correctOption || q.numericalAnswer) && (
                <div style={{ fontSize: '0.78rem', color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>
                    Correct Answer: <strong>{q.correctOption || q.numericalAnswer}</strong>
                </div>
            )}

            {/* Options toggle */}
            {q.options && q.options.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setShowOptions(v => !v); }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#818cf8',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            padding: '2px 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600
                        }}
                    >
                        <span>{showOptions ? '▴ Hide Options' : '▾ View Options (' + q.options.length + ')'}</span>
                    </button>
                    {showOptions && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '6px',
                            marginTop: '6px',
                            padding: '8px',
                            background: 'rgba(0,0,0,0.25)',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.06)'
                        }}>
                            {q.options.map((opt, i) => {
                                const optId = (opt.id || String.fromCharCode(97 + i)).toLowerCase();
                                const isCorrect = optId === (q.correctOption || '').toLowerCase();
                                return (
                                    <div key={optId} style={{
                                        fontSize: '0.78rem',
                                        padding: '5px 8px',
                                        borderRadius: '5px',
                                        background: isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`,
                                        color: isCorrect ? '#6ee7b7' : '#94a3b8',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '6px'
                                    }}>
                                        <strong style={{ color: isCorrect ? '#34d399' : '#cbd5e1' }}>({optId.toUpperCase()})</strong>
                                        <div style={{ flex: 1 }}>
                                            <LatexRenderer text={opt.text || ''} />
                                        </div>
                                        {isCorrect && <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Edit modal ───────────────────────────────────────────────────────────────
function EditModal({ question, onSave, onClose }) {
    const [form, setForm] = useState({
        text: question.text || '',
        subject: question.subject || 'Physics',
        chapter: question.chapter || '',
        subtopic: question.subtopic || question.subTopic || '',
        type: question.type || 'MCQ',
        difficulty: normalizeDifficulty(question.difficulty),
        correctOption: question.correctOption || 'a',
        explanation: question.explanation || '',
        optionA: question.options?.[0]?.text || '',
        optionB: question.options?.[1]?.text || '',
        optionC: question.options?.[2]?.text || '',
        optionD: question.options?.[3]?.text || '',
        numericalAnswer: question.numericalAnswer || '',
        assertion: question.assertion || '',
        reason: question.reason || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                testId: 'global',
                action: 'EDIT',
                question: {
                    _id: question._id,
                    id: question.id,
                    type: form.type,
                    difficulty: form.difficulty || 'MODERATE',
                    text: form.text,
                    subject: form.subject,
                    chapter: form.chapter,
                    subtopic: form.subtopic,
                    correctOption: form.correctOption,
                    explanation: form.explanation,
                    numericalAnswer: form.numericalAnswer,
                    assertion: form.assertion,
                    reason: form.reason,
                    options: [
                        { id: 'a', text: form.optionA },
                        { id: 'b', text: form.optionB },
                        { id: 'c', text: form.optionC },
                        { id: 'd', text: form.optionD },
                    ],
                },
            };
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Save failed');
            onSave();
        } catch (e) {
            alert('Error saving: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.9rem',
        width: '100%', boxSizing: 'border-box', outline: 'none',
        transition: 'border-color 0.2s',
    };
    const labelStyle = { display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.8rem', color: '#94a3b8' };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(160deg, #1e1b4b 0%, #0f172a 100%)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '18px', padding: '28px', maxWidth: '760px', width: '100%',
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#a5b4fc' }}>
                        ✏️ Edit Question <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>#{question.id} · {question._id}</span>
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <label style={labelStyle}>Subject
                        <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value, chapter: '' }))} style={inputStyle}>
                            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </label>
                    <label style={labelStyle}>Chapter
                        <select value={form.chapter} onChange={e => setForm(f => ({ ...f, chapter: e.target.value }))} style={inputStyle}>
                            <option value="">— Select —</option>
                            {(STATIC_CHAPTERS[form.subject] || []).map(ch => <option key={ch}>{ch}</option>)}
                        </select>
                    </label>
                    <label style={labelStyle}>Subtopic
                        <input style={inputStyle} value={form.subtopic} onChange={e => setForm(f => ({ ...f, subtopic: e.target.value }))} placeholder="Optional subtopic" />
                    </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <label style={labelStyle}>Question Type
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                            <option value="MCQ">MCQ</option>
                            <option value="NUMERICAL">Numerical</option>
                            <option value="ASSERTION_REASON">Assertion &amp; Reason</option>
                        </select>
                    </label>
                    <label style={labelStyle}>Difficulty Level
                        <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))} style={inputStyle}>
                            <option value="EASY">🟢 Easy</option>
                            <option value="MODERATE">🟡 Moderate</option>
                            <option value="DIFFICULT">🔴 Difficult</option>
                        </select>
                    </label>
                    {form.type === 'MCQ' && (
                        <label style={labelStyle}>Correct Option
                            <select value={form.correctOption} onChange={e => setForm(f => ({ ...f, correctOption: e.target.value }))} style={inputStyle}>
                                {['a', 'b', 'c', 'd'].map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                            </select>
                        </label>
                    )}
                    {form.type === 'NUMERICAL' && (
                        <label style={labelStyle}>Correct Answer
                            <input style={inputStyle} value={form.numericalAnswer} onChange={e => setForm(f => ({ ...f, numericalAnswer: e.target.value }))} placeholder="Numerical answer" />
                        </label>
                    )}
                </div>

                {form.type === 'ASSERTION_REASON' ? (
                    <>
                        <label style={{ ...labelStyle, marginBottom: '12px' }}>Assertion
                            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.assertion} onChange={e => setForm(f => ({ ...f, assertion: e.target.value }))} />
                        </label>
                        <label style={{ ...labelStyle, marginBottom: '12px' }}>Reason
                            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
                        </label>
                    </>
                ) : (
                    <label style={{ ...labelStyle, marginBottom: '12px' }}>Question Text
                        <textarea style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} />
                    </label>
                )}

                {form.type === 'MCQ' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                        {['A', 'B', 'C', 'D'].map((ltr, i) => {
                            const key = `option${ltr}`;
                            return (
                                <label key={ltr} style={{ ...labelStyle, borderLeft: `3px solid ${form.correctOption === ltr.toLowerCase() ? '#10b981' : 'transparent'}`, paddingLeft: '8px' }}>
                                    Option {ltr} {form.correctOption === ltr.toLowerCase() && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>✓ Correct</span>}
                                    <input style={inputStyle} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                                </label>
                            );
                        })}
                    </div>
                )}

                <label style={{ ...labelStyle, marginBottom: '18px' }}>Explanation (optional)
                    <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
                </label>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', padding: '10px 22px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white',
                        padding: '10px 26px', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer',
                        fontWeight: 700, opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s'
                    }}>
                        {saving ? 'Saving…' : '💾 Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function TestMappingPanel({ allTests }) {
    // ─ Test selector state ─
    const [examFilter, setExamFilter] = useState('olympiad');
    const [testTypeFilter, setTestTypeFilter] = useState('ALL');
    const [testSubjectFilter, setTestSubjectFilter] = useState('ALL');
    const [testSearch, setTestSearch] = useState('');
    const [testChapterFilter, setTestChapterFilter] = useState('');
    const [selectedTestId, setSelectedTestId] = useState('');

    // ─ Mapped questions (right list) ─
    const [mappedQuestions, setMappedQuestions] = useState([]);
    const [loadingMapped, setLoadingMapped] = useState(false);

    // ─ Question picker (left panel) ─
    const [pickerSubject, setPickerSubject] = useState('');
    const [pickerChapter, setPickerChapter] = useState('');
    const [pickerSubtopic, setPickerSubtopic] = useState('');
    const [pickerType, setPickerType] = useState('');
    const [pickerDifficulty, setPickerDifficulty] = useState('');
    const [pickerSearch, setPickerSearch] = useState('');
    const [bankQuestions, setBankQuestions] = useState([]);
    const [loadingBank, setLoadingBank] = useState(false);
    const [linkingId, setLinkingId] = useState(null);  // which question is being linked

    // ─ Edit modal ─
    const [editingQ, setEditingQ] = useState(null);

    // ─ Unlink confirm ─
    const [unlinkConfirm, setUnlinkConfirm] = useState(null); // { questionId, _id }

    // ─ Bulk Unlink state ─
    const [bulkUnlinkConfirm, setBulkUnlinkConfirm] = useState(false);
    const [unlinkingAll, setUnlinkingAll] = useState(false);

    // ─ JEE Chemistry Topic Audit Modal state ─
    const [auditModalOpen, setAuditModalOpen] = useState(false);
    const [auditInitialTab, setAuditInitialTab] = useState('full');

    // ─ View, Layout & Fullscreen state ─
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [layoutMode, setLayoutMode] = useState('split'); // 'split' | 'mapped' | 'bank'
    const [viewMode, setViewMode] = useState('full'); // 'full' | 'compact'
    const [mappedSearch, setMappedSearch] = useState('');

    // Escape listener for fullscreen
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            setIsFullscreen(true);
            try {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } catch {}
        } else {
            setIsFullscreen(false);
            try {
                if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
            } catch {}
        }
    };

    // Filter mapped questions by search query
    const filteredMappedQuestions = useMemo(() => {
        if (!mappedSearch.trim()) return mappedQuestions;
        const term = mappedSearch.trim().toLowerCase();
        return mappedQuestions.filter(q => {
            const searchable = [
                q.text,
                q.question,
                q.assertion,
                q.reason,
                q.subject,
                q.chapter,
                q.subtopic,
                q.subTopic,
                q._id,
                q.id
            ].filter(Boolean).join(' ').toLowerCase();
            return searchable.includes(term);
        });
    }, [mappedQuestions, mappedSearch]);

    // Dynamic available chapters for Topic-wise (Subtopic) test type
    const availableTestChapters = useMemo(() => {
        if (testTypeFilter !== 'SUBTOPIC') return [];
        const chapterMap = new Map();
        (allTests || []).forEach(t => {
            if (!t || t.type !== 'SUBTOPIC') return;
            if (t.category !== examFilter) return;
            if (testSubjectFilter !== 'ALL') {
                const sFilter = testSubjectFilter.toLowerCase();
                const tSub = (t.subject || '').toLowerCase();
                if (tSub !== sFilter && !tSub.includes(sFilter)) return;
            }
            const chap = t.chapter || (t.chapters && t.chapters[0]);
            if (chap && typeof chap === 'string' && chap.trim()) {
                const trimmed = chap.trim();
                const key = trimmed.toLowerCase();
                if (!chapterMap.has(key)) {
                    chapterMap.set(key, trimmed);
                }
            }
        });
        return Array.from(chapterMap.values());
    }, [allTests, testTypeFilter, examFilter, testSubjectFilter]);

    // Ensure selected chapter remains valid when available chapters change
    useEffect(() => {
        if (testTypeFilter === 'SUBTOPIC' && testChapterFilter) {
            const stillValid = availableTestChapters.some(
                ch => ch.toLowerCase() === testChapterFilter.toLowerCase()
            );
            if (!stillValid) {
                setTestChapterFilter('');
            }
        }
    }, [availableTestChapters, testTypeFilter, testChapterFilter]);

    // Filter tests by exam, test type, subject, chapter (for subtopics), and search query
    const filteredTests = useMemo(() => {
        // When Topic-wise (Subtopic) is selected, require a chapter to be chosen first
        if (testTypeFilter === 'SUBTOPIC' && !testChapterFilter) {
            return [];
        }

        const seenChapterTitles = new Set();

        return (allTests || []).filter(t => {
            if (!t) return false;
            if (t.category !== examFilter) return false;

            if (testTypeFilter !== 'ALL') {
                if (testTypeFilter === 'LIVE') {
                    if (t.type !== 'LIVE' && t.type !== 'PART' && t.type !== 'SUNDAY') return false;
                } else if (t.type !== testTypeFilter) {
                    return false;
                }
            }

            // For Chapter-wise, strictly filter by selected Exam & Subject (no cross-subject leakage!)
            if (testTypeFilter === 'CHAPTER') {
                if (testSubjectFilter === 'ALL' || !testSubjectFilter) {
                    return false;
                }
                const sFilter = testSubjectFilter.toLowerCase();
                const tSub = (t.subject || '').toLowerCase();
                if (tSub !== sFilter) {
                    return false;
                }
                // Deduplicate chapters if duplicates exist in database
                const titleKey = (t.title || t.chapter || t.id || '').trim().toLowerCase();
                if (seenChapterTitles.has(titleKey)) {
                    return false;
                }
                seenChapterTitles.add(titleKey);
            } else if (testSubjectFilter !== 'ALL') {
                const sFilter = testSubjectFilter.toLowerCase();
                const tSub = (t.subject || '').toLowerCase();
                const tTitle = (t.title || '').toLowerCase();
                if (tSub !== sFilter && !tTitle.includes(sFilter)) {
                    return false;
                }
            }

            // For Topic-wise (Subtopic), strictly match the selected Chapter
            if (testTypeFilter === 'SUBTOPIC' && testChapterFilter) {
                const tChap = (t.chapter || (t.chapters && t.chapters[0]) || '').trim();
                const normT = tChap.toLowerCase().replace(/\b(in|of)\b/g, ' ').replace(/\s+/g, ' ').trim();
                const normF = testChapterFilter.toLowerCase().replace(/\b(in|of)\b/g, ' ').replace(/\s+/g, ' ').trim();
                if (normT !== normF && tChap.toLowerCase() !== testChapterFilter.toLowerCase()) {
                    return false;
                }
            }

            if (testSearch.trim()) {
                const q = testSearch.trim().toLowerCase();
                const inTitle = (t.title || '').toLowerCase().includes(q);
                const inId = (t.id || '').toLowerCase().includes(q);
                const inSubject = (t.subject || '').toLowerCase().includes(q);
                const inChapter = (t.chapter || '').toLowerCase().includes(q);
                if (!inTitle && !inId && !inSubject && !inChapter) return false;
            }

            return true;
        });
    }, [allTests, examFilter, testTypeFilter, testSubjectFilter, testChapterFilter, testSearch]);

    // Chapters for the right-side Question Bank picker
    const chaptersForPicker = useMemo(() => {
        if (!pickerSubject) return [];
        const set = new Set(STATIC_CHAPTERS[pickerSubject] || []);
        (allTests || []).forEach(t => {
            if (!t) return;
            const tSub = (t.subject || '').toLowerCase();
            if (tSub === pickerSubject.toLowerCase()) {
                const c = t.chapter || (t.chapters && t.chapters[0]);
                if (c && typeof c === 'string' && c.trim()) set.add(c.trim());
            }
        });
        return Array.from(set);
    }, [pickerSubject, allTests]);

    // When a SUBTOPIC or CHAPTER test is selected, conveniently synchronize the Question Bank picker
    useEffect(() => {
        if ((testTypeFilter === 'SUBTOPIC' || testTypeFilter === 'CHAPTER') && selectedTestId) {
            const curTest = (allTests || []).find(t => t.id === selectedTestId);
            if (curTest) {
                if (curTest.subject && curTest.subject !== pickerSubject) {
                    setPickerSubject(curTest.subject);
                }
                const curChap = curTest.chapter || curTest.title || (curTest.chapters && curTest.chapters[0]);
                if (curChap && curChap !== pickerChapter) {
                    setPickerChapter(curChap);
                }
            }
        }
    }, [selectedTestId, testTypeFilter, allTests, pickerChapter, pickerSubject]);

    // Dynamic subjects for Olympiad
    const subjectsForExam = useMemo(() => {
        return ['Mathematics', 'Science', 'English'];
    }, []);

    // Reset subject filter, chapter filter, search, and selected chapter when exam changes
    const handleExamChange = (newExam) => {
        setExamFilter(newExam);
        const newSubjects = ['Mathematics', 'Science', 'English'];
        if (testTypeFilter === 'CHAPTER') {
            setSelectedTestId('');
            setMappedQuestions([]);
            if (!newSubjects.includes(testSubjectFilter)) {
                setTestSubjectFilter(newSubjects[0]);
            }
        } else {
            setTestSubjectFilter('ALL');
        }
        setTestChapterFilter('');
        setTestSearch('');
        if (testTypeFilter !== 'CHAPTER') {
            setSelectedTestId('');
            setMappedQuestions([]);
        }
    };

    // Reset chapter and search when test type changes
    const handleTestTypeChange = (newType) => {
        setTestTypeFilter(newType);
        if (newType === 'CHAPTER') {
            // For Chapter-wise, ensure a valid subject is selected (not 'ALL')
            if (testSubjectFilter === 'ALL' || !subjectsForExam.includes(testSubjectFilter)) {
                setTestSubjectFilter(subjectsForExam[0] || 'Physics');
            }
            setSelectedTestId('');
            setMappedQuestions([]);
        }
        if (newType !== 'SUBTOPIC') {
            setTestChapterFilter('');
        }
        setTestSearch('');
    };

    // Reset chapter selection when subject filter changes
    const handleSubjectChange = (newSubject) => {
        setTestSubjectFilter(newSubject);
        if (testTypeFilter === 'CHAPTER') {
            // Clear currently selected chapter when Subject changes
            setSelectedTestId('');
            setMappedQuestions([]);
        }
        setTestChapterFilter('');
        setTestSearch('');
    };

    // Keep selectedTestId in sync with filteredTests
    useEffect(() => {
        if (filteredTests.length > 0) {
            const exists = filteredTests.some(t => t.id === selectedTestId);
            if (!exists) {
                setSelectedTestId(filteredTests[0].id);
            }
        } else {
            setSelectedTestId('');
            setMappedQuestions([]);
        }
    }, [filteredTests, selectedTestId]);

    // Load mapped questions for selected test
    const fetchMappedQuestions = useCallback(async () => {
        if (!selectedTestId) {
            setMappedQuestions([]);
            return;
        }
        setLoadingMapped(true);
        try {
            const res = await fetch(`/api/questions?testId=${selectedTestId}`);
            const data = await res.json();
            setMappedQuestions(Array.isArray(data) ? data : []);
        } catch {
            setMappedQuestions([]);
        } finally {
            setLoadingMapped(false);
        }
    }, [selectedTestId]);

    useEffect(() => { fetchMappedQuestions(); }, [fetchMappedQuestions]);

    // Load bank questions when picker filters change
    useEffect(() => {
        if (!pickerSubject) { setBankQuestions([]); return; }
        const fetchBank = async () => {
            setLoadingBank(true);
            try {
                const params = new URLSearchParams({ testId: 'global', subject: pickerSubject });
                if (pickerChapter && pickerChapter !== 'ALL') params.set('chapter', pickerChapter);
                const res = await fetch(`/api/questions?${params}`);
                const data = await res.json();
                setBankQuestions(Array.isArray(data) ? data : []);
            } catch {
                setBankQuestions([]);
            } finally {
                setLoadingBank(false);
            }
        };
        fetchBank();
    }, [pickerSubject, pickerChapter]);

    const availableSubtopics = [...new Set(bankQuestions.map(q => q.subTopic || q.subtopic || '').filter(Boolean))].sort((a,b) => a.localeCompare(b));
    const availableTypes = [...new Set(bankQuestions.map(q => q.type || 'MCQ'))].sort((a,b) => a.localeCompare(b));

    // Derived: filter bank questions by subtopic, search, type, and difficulty
    const filteredBankQuestions = useMemo(() => {
        return bankQuestions.filter(q => {
            const matchSubtopic = !pickerSubtopic || (q.subTopic || q.subtopic || '') === pickerSubtopic;
            const matchType = !pickerType || (q.type || 'MCQ') === pickerType;
            const matchDiff = !pickerDifficulty || normalizeDifficulty(q.difficulty) === pickerDifficulty;
            if (!pickerSearch.trim()) return matchSubtopic && matchType && matchDiff;

            const term = pickerSearch.trim().toLowerCase();
            const searchable = [
                q.text,
                q.question,
                q.assertion,
                q.reason,
                q.chapter,
                q.subtopic,
                q.subTopic,
                q._id,
                q.id
            ].filter(Boolean).join(' ').toLowerCase();

            return matchSubtopic && matchType && matchDiff && searchable.includes(term);
        });
    }, [bankQuestions, pickerSubtopic, pickerSearch, pickerType, pickerDifficulty]);

    // Derive which bank question IDs are already mapped
    const mappedIds = new Set(mappedQuestions.map(q => q._id));

    // ─ Actions ─
    const handleLink = async (q) => {
        if (!selectedTestId) { alert('Please select a test first.'); return; }
        setLinkingId(q._id);
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testId: selectedTestId, action: 'LINK_QUESTIONS', questionIds: [q._id] }),
            });
            if (!res.ok) throw new Error('Link failed');
            await fetchMappedQuestions();
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            setLinkingId(null);
        }
    };

    const handleUnlink = async (q) => {
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testId: selectedTestId, action: 'UNLINK_QUESTION', questionId: q._id }),
            });
            if (!res.ok) throw new Error('Unlink failed');
            setUnlinkConfirm(null);
            await fetchMappedQuestions();
        } catch (e) {
            alert('Error: ' + e.message);
        }
    };

    const handleBulkUnlink = async () => {
        if (!selectedTestId || mappedQuestions.length === 0) return;
        setUnlinkingAll(true);
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testId: selectedTestId, action: 'UNLINK_ALL' }),
            });
            if (!res.ok) throw new Error('Bulk unlink failed');
            setBulkUnlinkConfirm(false);
            await fetchMappedQuestions();
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            setUnlinkingAll(false);
        }
    };

    // ─ Shared styles ─
    const card = {
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '14px', padding: '18px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    };
    const inputSty = {
        background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px', padding: '7px 12px', color: 'white', fontSize: '0.85rem',
        width: '100%', boxSizing: 'border-box', outline: 'none',
    };
    const sectionTitle = { margin: '0', fontSize: '0.95rem', fontWeight: 800, color: '#a5b4fc' };

    return (
        <div style={isFullscreen ? {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0a0f1d 60%, #020617 100%)',
            overflowY: 'auto',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
        } : {
            marginTop: '20px',
            width: '100%'
        }}>

            {/* ── Top: Test Selector & Filters ─────────────────────────── */}
            <div style={{ ...card, marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    {/* 1. Exam Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#94a3b8', minWidth: '110px' }}>
                        <span style={{ fontWeight: 600 }}>Exam</span>
                        <select value={examFilter} onChange={e => handleExamChange(e.target.value)} style={inputSty}>
                            <option value="olympiad">Olympiad</option>
                        </select>
                    </div>

                    {/* 2. Test Type Filter */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#94a3b8', minWidth: '175px' }}>
                        <span style={{ fontWeight: 600, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>🏷️</span> Test Type
                        </span>
                        <select 
                            value={testTypeFilter} 
                            onChange={e => handleTestTypeChange(e.target.value)} 
                            style={{ ...inputSty, borderColor: testTypeFilter !== 'ALL' ? 'rgba(129,140,248,0.6)' : inputSty.border }}
                        >
                            <option value="ALL">All Types</option>
                            <option value="MOCK">Mock Tests (Full)</option>
                            <option value="PYQ">Previous Year (PYQ)</option>
                            <option value="SUBJECT">Subject-wise</option>
                            <option value="CHAPTER">Chapter-wise</option>
                            <option value="SUBTOPIC">Topic-wise (Subtopic)</option>
                            <option value="LIVE">Live / Cumulative</option>
                        </select>
                    </div>

                    {/* 3. Subject Filter for Tests */}
                    {['ALL', 'SUBJECT', 'CHAPTER', 'SUBTOPIC'].includes(testTypeFilter) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#94a3b8', minWidth: '130px' }}>
                            <span style={{ fontWeight: 600 }}>Subject</span>
                            <select value={testSubjectFilter} onChange={e => handleSubjectChange(e.target.value)} style={inputSty}>
                                {testTypeFilter !== 'CHAPTER' && <option value="ALL">All Subjects</option>}
                                {subjectsForExam.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}

                    {/* 3b. Chapter Filter: Conditionally rendered only when Test Type = Topic-wise (Subtopic) */}
                    {testTypeFilter === 'SUBTOPIC' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#94a3b8', minWidth: '185px', flex: '1 1 185px' }}>
                            <span style={{ fontWeight: 600, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>📖</span> Chapter
                            </span>
                            <select 
                                value={testChapterFilter} 
                                onChange={e => {
                                    setTestChapterFilter(e.target.value);
                                    setTestSearch('');
                                }} 
                                style={{
                                    ...inputSty,
                                    borderColor: testChapterFilter ? 'rgba(129,140,248,0.7)' : 'rgba(255,255,255,0.12)',
                                    boxShadow: testChapterFilter ? '0 0 10px rgba(99,102,241,0.2)' : 'none'
                                }}
                            >
                                <option value="">Select Chapter</option>
                                {availableTestChapters.map(ch => (
                                    <option key={ch} value={ch}>{ch}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 4. Search Filter for Tests */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#94a3b8', minWidth: '150px' }}>
                        <span style={{ fontWeight: 600 }}>Search Test</span>
                        <input 
                            type="text" 
                            placeholder="🔍 Search title / ID..." 
                            value={testSearch} 
                            onChange={e => setTestSearch(e.target.value)} 
                            style={inputSty} 
                        />
                    </div>

                    {/* 5. Subtopic / Chapter / Test Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#94a3b8', flex: '1 1 240px', minWidth: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: (testTypeFilter === 'SUBTOPIC' || testTypeFilter === 'CHAPTER') ? '#a5b4fc' : '#94a3b8' }}>
                                {testTypeFilter === 'SUBTOPIC' ? 'Subtopic' : testTypeFilter === 'CHAPTER' ? 'Chapter' : 'Test'}
                            </span>
                            <span style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {testTypeFilter === 'SUBTOPIC' && !testChapterFilter 
                                    ? 'Select chapter first' 
                                    : `${filteredTests.length} ${testTypeFilter === 'SUBTOPIC' ? 'subtopic' : testTypeFilter === 'CHAPTER' ? 'chapter' : 'test'}${filteredTests.length === 1 ? '' : 's'}`
                                }
                            </span>
                        </div>
                        <select 
                            value={selectedTestId} 
                            onChange={e => setSelectedTestId(e.target.value)} 
                            disabled={testTypeFilter === 'SUBTOPIC' && !testChapterFilter}
                            style={{
                                ...inputSty,
                                opacity: (testTypeFilter === 'SUBTOPIC' && !testChapterFilter) ? 0.45 : 1,
                                cursor: (testTypeFilter === 'SUBTOPIC' && !testChapterFilter) ? 'not-allowed' : 'pointer',
                                borderColor: (testTypeFilter === 'SUBTOPIC' && !testChapterFilter) ? 'rgba(255,255,255,0.06)' : inputSty.border
                            }}
                        >
                            {testTypeFilter === 'SUBTOPIC' && !testChapterFilter ? (
                                <option value="">Select Chapter first</option>
                            ) : filteredTests.length === 0 ? (
                                <option value="">No {testTypeFilter === 'SUBTOPIC' ? 'subtopics' : testTypeFilter === 'CHAPTER' ? 'chapters' : 'tests'} match criteria</option>
                            ) : (
                                filteredTests.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.title || t.id} {t.type ? `[${t.type}]` : ''}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* 6. Badges Summary */}
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', paddingTop: '4px' }}>
                        {loadingMapped ? (
                            <div style={{ padding: '7px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '0.85rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                                Loading…
                            </div>
                        ) : (() => {
                            const subjectCounts = {};
                            mappedQuestions.forEach(q => {
                                const sub = q.subject || 'Other';
                                subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
                            });

                            const SUBJECT_COLORS = {
                                Physics:               { bg: 'rgba(59,130,246,0.13)',  border: 'rgba(59,130,246,0.35)',  text: '#93c5fd' },
                                Chemistry:             { bg: 'rgba(16,185,129,0.13)',  border: 'rgba(16,185,129,0.35)',  text: '#6ee7b7' },
                                Mathematics:           { bg: 'rgba(245,158,11,0.13)',  border: 'rgba(245,158,11,0.35)',  text: '#fcd34d' },
                                Botany:                { bg: 'rgba(34,197,94,0.13)',   border: 'rgba(34,197,94,0.35)',   text: '#86efac' },
                                Zoology:               { bg: 'rgba(168,85,247,0.13)',  border: 'rgba(168,85,247,0.35)',  text: '#d8b4fe' },
                                'English Proficiency': { bg: 'rgba(236,72,153,0.13)',  border: 'rgba(236,72,153,0.35)',  text: '#f472b6' },
                                'Logical Reasoning':   { bg: 'rgba(14,165,233,0.13)',  border: 'rgba(14,165,233,0.35)',  text: '#38bdf8' },
                                Other:                 { bg: 'rgba(100,116,139,0.13)', border: 'rgba(100,116,139,0.35)', text: '#94a3b8' },
                            };

                            return (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                    <div style={{
                                        padding: '6px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem',
                                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#34d399',
                                        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
                                    }}>
                                        <span style={{ fontSize: '1rem' }}>📊</span>
                                        Total: {mappedQuestions.length}
                                    </div>
                                    {Object.entries(subjectCounts)
                                        .sort((a, b) => b[1] - a[1])
                                        .map(([sub, count]) => {
                                            const c = SUBJECT_COLORS[sub] || SUBJECT_COLORS.Other;
                                            return (
                                                <div key={sub} style={{
                                                    padding: '5px 12px', borderRadius: '7px', fontWeight: 700, fontSize: '0.8rem',
                                                    background: c.bg, border: `1px solid ${c.border}`, color: c.text,
                                                    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px',
                                                }}>
                                                    <span style={{ opacity: 0.75, fontSize: '0.7rem' }}>{sub}</span>
                                                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                                                </div>
                                            );
                                        })}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Sub-toolbar: View mode, layout switchers & Fullscreen toggle */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    paddingTop: '10px',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600 }}>Screen Layout:</span>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <button
                                type="button"
                                onClick={() => setLayoutMode('split')}
                                style={{
                                    background: layoutMode === 'split' ? 'rgba(99,102,241,0.25)' : 'transparent',
                                    border: layoutMode === 'split' ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                                    color: layoutMode === 'split' ? '#a5b4fc' : '#94a3b8',
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                ⧉ Side-by-Side (50/50)
                            </button>
                            <button
                                type="button"
                                onClick={() => setLayoutMode('mapped')}
                                style={{
                                    background: layoutMode === 'mapped' ? 'rgba(99,102,241,0.25)' : 'transparent',
                                    border: layoutMode === 'mapped' ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                                    color: layoutMode === 'mapped' ? '#a5b4fc' : '#94a3b8',
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                📋 Full Mapped ({mappedQuestions.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setLayoutMode('bank')}
                                style={{
                                    background: layoutMode === 'bank' ? 'rgba(99,102,241,0.25)' : 'transparent',
                                    border: layoutMode === 'bank' ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                                    color: layoutMode === 'bank' ? '#a5b4fc' : '#94a3b8',
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                🔗 Full Question Bank
                            </button>
                        </div>

                        <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 600, marginLeft: '6px' }}>Detail Level:</span>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <button
                                type="button"
                                onClick={() => setViewMode('full')}
                                style={{
                                    background: viewMode === 'full' ? 'rgba(16,185,129,0.2)' : 'transparent',
                                    border: viewMode === 'full' ? '1px solid rgba(16,185,129,0.4)' : '1px solid transparent',
                                    color: viewMode === 'full' ? '#6ee7b7' : '#94a3b8',
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                📖 Complete Question
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('compact')}
                                style={{
                                    background: viewMode === 'compact' ? 'rgba(16,185,129,0.2)' : 'transparent',
                                    border: viewMode === 'compact' ? '1px solid rgba(16,185,129,0.4)' : '1px solid transparent',
                                    color: viewMode === 'compact' ? '#6ee7b7' : '#94a3b8',
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '0.74rem', cursor: 'pointer', fontWeight: 600
                                }}
                            >
                                📄 Compact
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            style={{
                                background: isFullscreen ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                border: 'none',
                                color: 'white',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: isFullscreen ? '0 0 16px rgba(239,68,68,0.4)' : '0 0 16px rgba(99,102,241,0.3)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span>{isFullscreen ? '✕' : '⛶'}</span>
                            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Workstation'}</span>
                            {isFullscreen && <span style={{ fontSize: '0.65rem', opacity: 0.8, background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: '4px' }}>Esc</span>}
                        </button>
                    </div>
                </div>

                {/* ── Test Audit Suite (NEET & JEE Main across all subjects) ── */}
                {(() => {
                    const isNeet = examFilter === 'neet' || (selectedTestId || '').toLowerCase().startsWith('neet');
                    const isBotany = (testSubjectFilter || '').toLowerCase().includes('botany') || (selectedTestId || '').toLowerCase().includes('botany');
                    const isZoology = (testSubjectFilter || '').toLowerCase().includes('zoology') || (selectedTestId || '').toLowerCase().includes('zoology');
                    const isMath = (testSubjectFilter || '').toLowerCase().includes('math') || (selectedTestId || '').toLowerCase().includes('math');
                    const isPhysics = (testSubjectFilter || '').toLowerCase().includes('physics') || (selectedTestId || '').toLowerCase().includes('physics');

                    const activeAuditExam = isNeet ? 'NEET' : 'JEE Main';
                    const activeAuditSubject = isBotany ? 'Botany' : (isZoology ? 'Zoology' : (isMath ? 'Mathematics' : (isPhysics ? 'Physics' : 'Chemistry')));
                    const activeEmoji = isBotany ? '🌿' : (isZoology ? '🧬' : (isMath ? '📐' : (isPhysics ? '⚛️' : '🧪')));
                    const isChapter = testTypeFilter === 'CHAPTER' || (selectedTestId || '').includes('-CHAPTER-');

                    const totalTestsCount = isNeet
                        ? (isChapter ? 80 : (isBotany ? 7 : (isZoology ? 7 : (isPhysics ? 42 : 24))))
                        : (activeAuditSubject === 'Mathematics' ? (isChapter ? 22 : 50) : (activeAuditSubject === 'Physics' ? (isChapter ? 42 : 533) : (isChapter ? 22 : 99)));
                    return (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px',
                            padding: '10px 14px',
                            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
                            borderRadius: '10px',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            marginTop: '2px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{activeEmoji}</span> {activeAuditExam} {activeAuditSubject} {isChapter ? 'Chapter' : 'Topic'} Audit:
                                </span>
                        
                        {/* Button 1: AUDIT TEST */}
                        <button
                            type="button"
                            onClick={() => {
                                setAuditInitialTab('full');
                                setAuditModalOpen(true);
                            }}
                            title={`Audit questions mapped to currently selected ${isChapter ? 'chapter' : 'topic'} test`}
                            style={{
                                background: 'rgba(99, 102, 241, 0.25)',
                                border: '1px solid rgba(99, 102, 241, 0.5)',
                                color: '#e0e7ff',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <span>🔬</span> AUDIT TEST
                        </button>

                        {/* Button 2: AUDIT DUPLICATES */}
                        <button
                            type="button"
                            onClick={() => {
                                setAuditInitialTab('duplicates');
                                setAuditModalOpen(true);
                            }}
                            title="Audit exact, high-similarity, and minor variation duplicate questions"
                            style={{
                                background: 'rgba(245, 158, 11, 0.2)',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                                color: '#fef3c7',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <span>🔍</span> AUDIT DUPLICATES
                        </button>

                        {/* Button 3: AUDIT CHAPTER or AUDIT CHAPTER + TOPIC */}
                        <button
                            type="button"
                            onClick={() => {
                                setAuditInitialTab('topic');
                                setAuditModalOpen(true);
                            }}
                            title={isChapter ? "Audit question chapter metadata against test target" : "Audit question chapter and topic metadata against test targets"}
                            style={{
                                background: 'rgba(56, 189, 248, 0.2)',
                                border: '1px solid rgba(56, 189, 248, 0.45)',
                                color: '#e0f2fe',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <span>🎯</span> {isChapter ? 'AUDIT CHAPTER' : 'AUDIT CHAPTER + TOPIC'}
                        </button>

                        {/* Button 4: FULL TEST AUDIT */}
                        <button
                            type="button"
                            onClick={() => {
                                setAuditInitialTab('full');
                                setAuditModalOpen(true);
                            }}
                            title={`Run combined ${isChapter ? 'Chapter' : 'Chapter/Topic'} Validation + Duplicate Detection + Replacement Preview`}
                            style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                border: 'none',
                                color: '#ffffff',
                                padding: '5px 14px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            <span>🛡️</span> FULL TEST AUDIT
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Mode 2: Complete Database Audit */}
                        <button
                            type="button"
                            onClick={() => {
                                setAuditInitialTab('global');
                                setAuditModalOpen(true);
                            }}
                            title={`View complete database statistics across all ${totalTestsCount} ${activeAuditExam} ${isChapter ? 'Chapter-wise' : 'Topic-wise'} tests`}
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#cbd5e1',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <span>🌐</span> COMPLETE DATABASE AUDIT
                        </button>
                    </div>
                </div>
            );
        })()}
    </div>

            {/* ── Main 2-column / 1-column grid ───────────────────────────── */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: layoutMode === 'mapped' ? '1fr' : layoutMode === 'bank' ? '1fr' : '1fr 1fr',
                gap: '20px',
                alignItems: 'start',
                flex: isFullscreen ? 1 : 'none',
                minHeight: 0
            }}>

                {/* ── LEFT: Mapped Questions ──────────────────────────────── */}
                {layoutMode !== 'bank' && (
                    <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h3 style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📋</span> Mapped Questions
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '12px' }}>
                                        {mappedQuestions.length}
                                    </span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setLayoutMode(m => m === 'mapped' ? 'split' : 'mapped')}
                                    style={{
                                        background: layoutMode === 'mapped' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        color: '#a5b4fc',
                                        borderRadius: '6px',
                                        padding: '3px 8px',
                                        fontSize: '0.72rem',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                    title={layoutMode === 'mapped' ? 'Switch back to side-by-side split' : 'Expand Mapped Questions to full width'}
                                >
                                    {layoutMode === 'mapped' ? '⧉ Split View' : '⤢ Full Width'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {mappedQuestions.length > 5 && (
                                    <input 
                                        type="text"
                                        placeholder="🔍 Search mapped…"
                                        value={mappedSearch}
                                        onChange={e => setMappedSearch(e.target.value)}
                                        style={{ ...inputSty, width: '150px', padding: '4px 10px', fontSize: '0.78rem' }}
                                    />
                                )}
                                {selectedTestId && (
                                    <button 
                                        onClick={() => setBulkUnlinkConfirm(true)} 
                                        disabled={unlinkingAll || mappedQuestions.length === 0} 
                                        style={{
                                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                                            color: '#f87171', borderRadius: '7px', padding: '5px 12px', fontSize: '0.78rem',
                                            cursor: mappedQuestions.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, 
                                            opacity: mappedQuestions.length === 0 ? 0.4 : 1,
                                        }}
                                    >
                                        {unlinkingAll ? 'Unlinking…' : '🗑️ Unlink All'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {!selectedTestId ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '50px 20px', fontSize: '0.9rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>👈</div>
                                Select a test from the dropdown above to view and manage its mapped questions.
                            </div>
                        ) : loadingMapped ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Loading questions…</div>
                        ) : mappedQuestions.length === 0 ? (
                            <div style={{
                                textAlign: 'center', color: '#64748b', padding: '50px 20px',
                                border: '2px dashed rgba(255,255,255,0.08)', borderRadius: '12px',
                            }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
                                <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>No questions mapped yet</div>
                                <div style={{ fontSize: '0.8rem' }}>Use the Question Picker on the right to link questions from the bank.</div>
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                maxHeight: isFullscreen ? 'calc(100vh - 240px)' : 'calc(100vh - 310px)',
                                minHeight: '520px',
                                overflowY: 'auto',
                                paddingRight: '4px'
                            }}>
                                {filteredMappedQuestions.map((q, idx) => (
                                    <div key={q._id || idx} style={{
                                        background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)',
                                        borderRadius: '10px', padding: '12px 14px', transition: 'border-color 0.2s',
                                    }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.12)', padding: '2px 7px', borderRadius: '5px' }}>
                                                #{idx + 1}
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 700, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>
                                                {q.commercialId || q.questionId || (q._id ? String(q._id).slice(-8) : '—')}
                                            </span>
                                            {q.subject && (
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#14b8a6', background: 'rgba(20,184,166,0.12)', padding: '2px 7px', borderRadius: '5px' }}>
                                                    {q.subject}
                                                </span>
                                            )}
                                            <TypeBadge type={q.type} />
                                            <DifficultyBadge difficulty={q.difficulty} />
                                            {(q.source || q.isPYQ) && (
                                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: q.isPYQ ? '#c084fc' : '#38bdf8', background: q.isPYQ ? 'rgba(192,132,252,0.15)' : 'rgba(56,189,248,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {q.isPYQ ? `Memory-Based PYQ ${q.sourceYear || ''}` : (q.source || 'Original')}
                                                </span>
                                            )}
                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                                <button onClick={() => setEditingQ(q)} style={{
                                                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                                                    color: '#818cf8', borderRadius: '6px', padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
                                                }}>✏️ Edit</button>
                                                <button onClick={() => setUnlinkConfirm(q)} style={{
                                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                                    color: '#f87171', borderRadius: '6px', padding: '3px 10px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600,
                                                }}>🔗 Unlink</button>
                                            </div>
                                        </div>

                                        {/* Chapter/subtopic breadcrumb */}
                                        {(q.chapter || q.subtopic || q.subTopic) && (
                                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '6px' }}>
                                                {[q.chapter, q.subtopic || q.subTopic].filter(Boolean).join(' › ')}
                                            </div>
                                        )}

                                        {/* Used In Tests tags */}
                                        {q.usedInTests && q.usedInTests.length > 0 && (
                                            <div style={{ fontSize: '0.7rem', color: '#818cf8', marginBottom: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                <span style={{ color: '#94a3b8' }}>Used In:</span>
                                                {q.usedInTests.slice(0, 4).map(t => (
                                                    <span key={t} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', padding: '1px 5px', borderRadius: '3px' }}>
                                                        {t}
                                                    </span>
                                                ))}
                                                {q.usedInTests.length > 4 && <span>+{q.usedInTests.length - 4} more</span>}
                                            </div>
                                        )}

                                        {/* Full Question Body with LaTeX math, Assertion-Reason formatting & options preview */}
                                        <QuestionCardBody q={q} viewMode={viewMode} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── RIGHT: Question Picker ─────────────────────────────── */}
                {layoutMode !== 'mapped' && (
                    <div style={{ ...card, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>🔗</span> Link from Question Bank
                            </h3>
                            <button
                                type="button"
                                onClick={() => setLayoutMode(m => m === 'bank' ? 'split' : 'bank')}
                                style={{
                                    background: layoutMode === 'bank' ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#a5b4fc',
                                    borderRadius: '6px',
                                    padding: '3px 8px',
                                    fontSize: '0.72rem',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                                title={layoutMode === 'bank' ? 'Switch back to side-by-side split' : 'Expand Question Bank to full width'}
                            >
                                {layoutMode === 'bank' ? '⧉ Split View' : '⤢ Full Width'}
                            </button>
                        </div>

                        {/* Cascade filters */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                Subject *
                                <select value={pickerSubject} onChange={e => { setPickerSubject(e.target.value); setPickerChapter(''); setPickerSubtopic(''); setPickerType(''); }} style={inputSty}>
                                    <option value="">— Select Subject —</option>
                                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                Chapter
                                <select value={pickerChapter} onChange={e => { setPickerChapter(e.target.value); setPickerSubtopic(''); }} style={inputSty} disabled={!pickerSubject}>
                                    <option value="">All Chapters</option>
                                    {chaptersForPicker.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                Subtopic
                                <select style={inputSty} value={pickerSubtopic} onChange={e => setPickerSubtopic(e.target.value)} disabled={!pickerSubject}>
                                    <option value="">All Subtopics</option>
                                    {availableSubtopics.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                Type
                                <select style={inputSty} value={pickerType} onChange={e => setPickerType(e.target.value)} disabled={!pickerSubject}>
                                    <option value="">All Types</option>
                                    {availableTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                Difficulty
                                <select style={inputSty} value={pickerDifficulty} onChange={e => setPickerDifficulty(e.target.value)} disabled={!pickerSubject}>
                                    <option value="">All Difficulties</option>
                                    <option value="EASY">🟢 Easy</option>
                                    <option value="MODERATE">🟡 Moderate</option>
                                    <option value="DIFFICULT">🔴 Difficult</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#94a3b8' }}>
                                Search text
                                <input style={inputSty} value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Keyword…" disabled={!pickerSubject} />
                            </div>
                        </div>

                        {/* Results count */}
                        {pickerSubject && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '8px' }}>
                                Showing {filteredBankQuestions.length} of {bankQuestions.length} questions
                                {loadingBank && ' · Loading…'}
                            </div>
                        )}

                        {/* Bank question list */}
                        {!pickerSubject ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '50px 20px', fontSize: '0.9rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏦</div>
                                Select a subject to browse the question bank.
                            </div>
                        ) : loadingBank ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Loading bank…</div>
                        ) : filteredBankQuestions.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px', fontSize: '0.85rem' }}>
                                No questions found for these filters.
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                maxHeight: isFullscreen ? 'calc(100vh - 300px)' : 'calc(100vh - 360px)',
                                minHeight: '520px',
                                overflowY: 'auto',
                                paddingRight: '4px'
                            }}>
                                {filteredBankQuestions.map((q, idx) => {
                                    const alreadyLinked = mappedIds.has(q._id);
                                    return (
                                        <div key={q._id || idx} style={{
                                            background: alreadyLinked ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${alreadyLinked ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                                            borderRadius: '10px', padding: '12px 14px',
                                            display: 'flex', gap: '12px', alignItems: 'flex-start',
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* Meta row */}
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
                                                        #{q._id ? String(q._id).slice(-8) : idx + 1}
                                                    </span>
                                                    {q.subject && (
                                                        <span style={{ fontSize: '0.68rem', color: '#14b8a6', fontWeight: 600 }}>{q.subject}</span>
                                                    )}
                                                    <TypeBadge type={q.type} />
                                                    <DifficultyBadge difficulty={q.difficulty} />
                                                    {q.chapter && <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{q.chapter}</span>}
                                                    {(q.subtopic || q.subTopic) && (
                                                        <span style={{ fontSize: '0.65rem', color: '#475569' }}>· {q.subtopic || q.subTopic}</span>
                                                    )}
                                                </div>

                                                {/* Full Question Body with LaTeX math, Assertion-Reason formatting & options preview */}
                                                <QuestionCardBody q={q} viewMode={viewMode} />
                                            </div>
                                            <div style={{ paddingTop: '2px' }}>
                                                {alreadyLinked ? (
                                                    <span style={{
                                                        fontSize: '0.72rem', fontWeight: 700, color: '#34d399',
                                                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                                                        borderRadius: '6px', padding: '5px 10px', whiteSpace: 'nowrap', display: 'inline-block'
                                                    }}>✓ Linked</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleLink(q)}
                                                        disabled={linkingId === q._id}
                                                        style={{
                                                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                                            border: 'none', color: 'white',
                                                            borderRadius: '7px', padding: '6px 14px', fontSize: '0.76rem',
                                                            cursor: linkingId === q._id ? 'not-allowed' : 'pointer',
                                                            fontWeight: 700, whiteSpace: 'nowrap',
                                                            opacity: linkingId === q._id ? 0.6 : 1, transition: 'opacity 0.2s',
                                                        }}
                                                    >
                                                        {linkingId === q._id ? '…' : '+ Link'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Edit Modal ─────────────────────────────────────────────── */}
            {editingQ && (
                <EditModal
                    question={editingQ}
                    onSave={() => { setEditingQ(null); fetchMappedQuestions(); }}
                    onClose={() => setEditingQ(null)}
                />
            )}

            {/* ── Unlink Confirm Dialog ──────────────────────────────────── */}
            {unlinkConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        background: '#0f172a', border: '1px solid rgba(239,68,68,0.35)',
                        borderRadius: '16px', padding: '28px 32px', maxWidth: '440px', width: '90%',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    }}>
                        <h3 style={{ margin: '0 0 10px', color: '#f87171', fontWeight: 800 }}>🔗 Unlink Question</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 20px', lineHeight: 1.6 }}>
                            This will <strong style={{ color: '#f8fafc' }}>remove</strong> the question from this test, but it will stay safe in the central question bank and remain on any other tests it&apos;s linked to.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setUnlinkConfirm(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontWeight: 600 }}>
                                Cancel
                            </button>
                            <button onClick={() => handleUnlink(unlinkConfirm)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700 }}>
                                Yes, Unlink
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bulk Unlink Confirm Dialog ──────────────────────────────── */}
            {bulkUnlinkConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        background: '#0f172a', border: '1px solid rgba(239,68,68,0.35)',
                        borderRadius: '16px', padding: '28px 32px', maxWidth: '440px', width: '90%',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    }}>
                        <h3 style={{ margin: '0 0 10px', color: '#f87171', fontWeight: 800 }}>🗑️ Unlink All Questions</h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 20px', lineHeight: 1.6 }}>
                            Are you sure you want to unlink all <strong style={{ color: '#f8fafc' }}>{mappedQuestions.length}</strong> questions from this test? The questions will remain safe in the central question bank.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setBulkUnlinkConfirm(false)} disabled={unlinkingAll} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontWeight: 600 }}>
                                Cancel
                            </button>
                            <button onClick={handleBulkUnlink} disabled={unlinkingAll} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#f87171', padding: '9px 20px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700 }}>
                                {unlinkingAll ? 'Unlinking…' : 'Yes, Unlink All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
}

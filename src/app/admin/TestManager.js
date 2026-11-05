import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
 
const LatexRenderer = dynamic(() => import('../../components/LatexRenderer'), { ssr: false });
import { olympiadTests } from '../../data/exams/olympiad';
import { OLYMPIAD_SYLLABUS } from '../../data/exams/olympiadSyllabus';

const subjectsByExam = {
    olympiad: ['Mathematics', 'Science', 'English']
};

// ── AI Generate Panel ──────────────────────────────────────────────────────
function AIGeneratePanel({ selectedTest, selectedExam, onSaved }) {
    const [aiForm, setAiForm] = useState({
        subject: selectedTest?.subject || '',
        chapter: '',
        classGrade: selectedTest?.classGrade || '',
        count: 10,
    });
    const [generating, setGenerating] = useState(false);
    const [preview, setPreview] = useState(null); // array of questions
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        setPreview(null);
        try {
            const res = await fetch('/api/admin/ai-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exam: selectedExam,
                    subject: aiForm.subject,
                    chapter: aiForm.chapter,
                    classGrade: aiForm.classGrade,
                    count: Number(aiForm.count),
                    testType: selectedTest?.type,
                    saveToDb: false, // preview first
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Generation failed');
            setPreview(data.questions);
        } catch (e) {
            setError(e.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!selectedTest?.id) { alert('Select a test first'); return; }
        if (!preview || preview.length === 0) { alert('No questions to save'); return; }
        setSaving(true);
        try {
            const normalizedData = preview.map((q) => ({
                ...q,
                subject: q.subject || aiForm.subject,
                chapter: q.chapter || aiForm.chapter,
                subtopic: q.subtopic || '',
                class: q.class || aiForm.classGrade || 'Class 12',
                difficulty: q.difficulty || 'Medium',
                type: q.type || 'MCQ'
            }));

            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: selectedTest.id,
                    question: normalizedData,
                    action: 'ADD_BULK'
                })
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Save failed');
            alert(`✅ ${preview.length} questions saved to "${selectedTest.title}"!`);
            setPreview(null);
            onSaved?.();
        } catch (e) {
            alert('Error: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: 'white',
        fontSize: '14px',
        width: '100%',
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <h3 style={{ margin: 0, color: '#a5b4fc', fontSize: '1.1rem', fontWeight: '700' }}>
                    Generate Questions with Gemini AI
                </h3>
                {selectedTest?.id && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
                        → {selectedTest.title}
                    </span>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Subject</span>
                    <input
                        value={aiForm.subject}
                        onChange={e => setAiForm(f => ({ ...f, subject: e.target.value }))}
                        placeholder="e.g. Physics"
                        style={inputStyle}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Chapter / Topic</span>
                    <input
                        value={aiForm.chapter}
                        onChange={e => setAiForm(f => ({ ...f, chapter: e.target.value }))}
                        placeholder="e.g. Kinematics"
                        style={inputStyle}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>Class Grade</span>
                    <select value={aiForm.classGrade} onChange={e => setAiForm(f => ({ ...f, classGrade: e.target.value }))} style={inputStyle}>
                        <option value="">Any</option>
                        <option value="11">Class 11</option>
                        <option value="12">Class 12</option>
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>No. of Questions</span>
                    <input
                        type="number" min="1" max="50"
                        value={aiForm.count}
                        onChange={e => setAiForm(f => ({ ...f, count: e.target.value }))}
                        style={inputStyle}
                    />
                </label>
            </div>

            <button
                onClick={handleGenerate}
                disabled={generating}
                style={{
                    background: generating ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontWeight: '700',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.95rem',
                }}
            >
                {generating ? (
                    <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Generating...</>
                ) : '✨ Generate Questions'}
            </button>

            {error && (
                <div style={{ marginTop: '12px', color: '#f87171', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.9rem' }}>
                    ❌ {error}
                </div>
            )}

            {/* Preview */}
            {preview && (
                <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#34d399', fontSize: '1rem' }}>
                            ✅ {preview.length} questions generated — Preview
                        </h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setPreview(null)}
                                style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer' }}
                            >
                                Discard
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !selectedTest?.id}
                                title={!selectedTest?.id ? 'Select a test by clicking Edit on it first' : ''}
                                style={{
                                    background: saving ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)',
                                    border: '1px solid #10b981',
                                    color: '#10b981',
                                    borderRadius: '6px',
                                    padding: '6px 16px',
                                    cursor: (saving || !selectedTest?.id) ? 'not-allowed' : 'pointer',
                                    fontWeight: '700',
                                    opacity: !selectedTest?.id ? 0.5 : 1,
                                }}
                            >
                                {saving ? 'Saving...' : `💾 Save to "${selectedTest?.title || 'Test'}"`}
                            </button>
                        </div>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {preview.map((q, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ color: '#818cf8', marginRight: '8px' }}>Q{i + 1}.</span>
                                    <LatexRenderer text={q.text} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '6px' }}>
                                    {q.options?.map(opt => (
                                        <span key={opt.id} style={{
                                            fontSize: '0.82rem',
                                            color: opt.id === q.correctOption ? '#34d399' : '#94a3b8',
                                            background: opt.id === q.correctOption ? 'rgba(52,211,153,0.1)' : 'transparent',
                                            borderRadius: '4px',
                                            padding: '2px 6px',
                                            fontWeight: opt.id === q.correctOption ? '700' : '400',
                                        }}>
                                            ({opt.id}) <LatexRenderer text={opt.text} /> {opt.id === q.correctOption ? '✓' : ''}
                                        </span>
                                    ))}
                                </div>
                                {q.explanation && (
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
                                        💡 <LatexRenderer text={q.explanation} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── AI Audit Modal ───────────────────────────────────────────────────────
function AIAuditModal({ isOpen, onClose, testId = null }) {
    const [stats, setStats] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [processedResults, setProcessedResults] = useState([]);
    const [error, setError] = useState('');

    // Reset state when opening for a new test
    useEffect(() => {
        if (isOpen) {
            setStats(null);
            setProcessedResults([]);
            setError('');
            setIsRunning(false);
            fetchStats();
        }
    }, [isOpen, testId]);

    const fetchStats = async () => {
        setIsScanning(true);
        try {
            const res = await fetch('/api/admin/auto-audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batchSize: 0, testId })
            });
            const data = await res.json();
            if (data.stats) setStats(data.stats);
        } catch (e) {
            console.error('Failed to fetch audit stats');
        } finally {
            setIsScanning(false);
        }
    };

    const runBatch = async () => {
        if (!isRunning) return;
        try {
            const res = await fetch('/api/admin/auto-audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batchSize: 10, testId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Audit batch failed');
            
            if (data.finished || data.processed === 0) {
                setIsRunning(false);
                alert(`🎉 Audit Complete! All questions${testId ? ` in "${testId}"` : ''} have been verified.`);
                fetchStats();
                return;
            }

            setStats(data.stats);
            setProcessedResults(prev => [...(data.results || []), ...prev].slice(0, 10));
            
            if (isRunning) {
                runBatch();
            }
        } catch (e) {
            setError(e.message);
            setIsRunning(false);
        }
    };

    useEffect(() => {
        if (isRunning) {
            runBatch();
        }
    }, [isRunning]);

    if (!isOpen) return null;

    const scopeLabel = testId ? `Test: ${testId}` : 'Entire Database';
    const scopeColor = testId ? '#10b981' : '#6366f1';

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                background: '#111827', width: '100%', maxWidth: '550px',
                borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)',
                padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#f3f4f6', fontSize: '1.5rem', fontWeight: '800' }}>
                            {testId ? '🔬 Test Audit' : '🔍 AI Database Audit'}
                        </h2>
                        <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>
                            Verifying answers & generating missing explanations
                        </p>
                        {testId && (
                            <span style={{
                                display: 'inline-block', marginTop: '6px',
                                background: 'rgba(16,185,129,0.15)', color: '#10b981',
                                padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600'
                            }}>
                                {scopeLabel}
                            </span>
                        )}
                    </div>
                    <button onClick={() => { setIsRunning(false); onClose(); }} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
                </div>

                {isScanning && !stats ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: scopeColor }}>Scanning{testId ? ` "${testId}"` : ' database'}...</div>
                ) : (
                    <>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <span style={{ color: '#9ca3af' }}>Progress</span>
                                <span style={{ color: scopeColor, fontWeight: 'bold' }}>{stats?.progress || 0}%</span>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${stats?.progress || 0}%`, height: '100%', background: `linear-gradient(90deg, ${scopeColor}, #8b5cf6)`, transition: 'width 0.5s ease' }} />
                            </div>
                            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Remaining</div>
                                    <div style={{ color: '#f3f4f6', fontSize: '1.2rem', fontWeight: '700' }}>{stats?.remaining || 0}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Done</div>
                                    <div style={{ color: scopeColor, fontSize: '1.2rem', fontWeight: '700' }}>{(stats?.total || 0) - (stats?.remaining || 0)}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total</div>
                                    <div style={{ color: '#f3f4f6', fontSize: '1.2rem', fontWeight: '700' }}>{stats?.total || 0}</div>
                                </div>
                            </div>
                        </div>

                        {processedResults.length > 0 && (
                            <div style={{ marginBottom: '24px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                                {processedResults.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ color: '#d1d5db', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%', textAlign: 'left' }}>{r.text}</span>
                                        <span style={{ color: r.corrected ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
                                            {r.corrected ? '⚠ Fixed Answer' : '✓ Verified'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {error && <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {!isRunning ? (
                                <button
                                    onClick={() => { setError(''); setIsRunning(true); }}
                                    style={{
                                        flex: 1, background: scopeColor, color: 'white', border: 'none',
                                        padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer'
                                    }}
                                >
                                    🚀 {testId ? 'Audit This Test' : 'Start Full Audit'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsRunning(false)}
                                    style={{
                                        flex: 1, background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)',
                                        padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer'
                                    }}
                                >
                                    ⏹️ Stop Processing
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Main TestManager ───────────────────────────────────────────────────────
export default function TestManager({ selectedExam, availableTests, autoCreate, onAutoCreateHandled }) {
    const [customTests, setCustomTests] = useState({});
    const [editingTest, setEditingTest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedForAI, setSelectedForAI] = useState(null); // test selected for AI generation
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [auditingTestId, setAuditingTestId] = useState(null); // null = whole DB, string = specific test
    const [managingQuestionsTest, setManagingQuestionsTest] = useState(null); 

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterSubject, setFilterSubject] = useState('ALL');


    const [testForm, setTestForm] = useState({
        id: '',
        title: '',
        type: 'MOCK',
        subject: '',
        chapter: '',
        description: '',
        liveStart: '',
        liveEnd: '',
    });

    useEffect(() => {
        fetchCustomTests();
    }, []);

    // Bridge for auto-create signal from parent
    useEffect(() => {
        if (autoCreate) {
            handleCreateNew();
            onAutoCreateHandled?.();
        }
    }, [autoCreate]);

    const fetchCustomTests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/tests');
            const data = await res.json();
            setCustomTests(data);
        } catch (err) {
            console.error('Failed to fetch custom tests', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (test) => {
        setEditingTest(test);
        
        let startIso = test.liveStart ? new Date(test.liveStart).toISOString().slice(0, 16) : '';
        let endIso = test.liveEnd ? new Date(test.liveEnd).toISOString().slice(0, 16) : '';

        setTestForm({
            id: test.id,
            title: test.title || '',
            type: test.type || 'MOCK',
            subject: test.subject || '',
            chapter: test.chapter || '',
            description: test.description || '',
            liveStart: startIso,
            liveEnd: endIso,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCreateNew = () => {
        setEditingTest({ isNew: true });
        setTestForm({
            id: `${selectedExam}-CUSTOM-${Date.now()}`,
            title: '',
            type: 'MOCK',
            subject: '',
            chapter: '',
            description: '',
            liveStart: '',
            liveEnd: '',
            category: selectedExam,
            year: new Date().getFullYear(),
            duration: 180,
            totalMarks: selectedExam === 'neet' ? 720 : 300,
            questionsCount: selectedExam === 'neet' ? 180 : 75,
            classGrade: '11',
        });
    };

    const handleSave = async () => {
        const payload = { ...editingTest, ...testForm };
        const isNewTest = editingTest.isNew;
        
        if (payload.type === 'LIVE') {
            payload.liveStart = new Date(testForm.liveStart).toISOString();
            payload.liveEnd = new Date(testForm.liveEnd).toISOString();
        }

        try {
            await fetch('/api/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SAVE', test: payload })
            });
            setEditingTest(null);
            fetchCustomTests();
            
            if (isNewTest) {
                alert('Test created successfully! Auto-opening Question Manager...');
                setManagingQuestionsTest({ ...payload, isCustom: true });
            } else {
                alert('Test saved successfully');
            }
        } catch (err) {
            alert('Failed to save test');
        }
    };

    const handleDelete = async (testId) => {
        if (!confirm(`Are you sure you want to delete test "${testId}"? This will only remove custom overrides and newly created tests.`)) return;
        
        try {
            const res = await fetch('/api/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE', test: { id: testId } })
            });
            if (res.ok) {
                fetchCustomTests();
                alert('Test removed successfully');
            } else {
                throw new Error('Failed to delete');
            }
        } catch (err) {
            alert('Error deleting test');
        }
    };

    const mergedTests = availableTests.map(staticTest => {
        return customTests[staticTest.id] ? { ...staticTest, ...customTests[staticTest.id], isEdited: true } : staticTest;
    });

    const purelyCustomTests = Object.values(customTests).filter(ct => ct.category === selectedExam && !availableTests.find(st => st.id === ct.id));
    let finalTestsList = [...mergedTests, ...purelyCustomTests];

    // Apply Filters
    if (filterCategory !== 'ALL') {
        finalTestsList = finalTestsList.filter(t => t.type === filterCategory);
    }
    if (filterSubject !== 'ALL') {
        finalTestsList = finalTestsList.filter(t => (t.subject || '').toLowerCase() === filterSubject.toLowerCase());
    }
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        finalTestsList = finalTestsList.filter(t => 
            t.title.toLowerCase().includes(query) || t.id.toLowerCase().includes(query)
        );
    }

    if (managingQuestionsTest) {
        return (
            <QuestionManager
                test={managingQuestionsTest}
                onBack={() => setManagingQuestionsTest(null)}
            />
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                <h2 className={styles.subtitle}>
                    {editingTest ? (editingTest.isNew ? 'Create New Test' : `Edit Test: ${editingTest.id}`) : `Manage ${selectedExam?.toUpperCase()} Tests`}
                </h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowAIPanel(p => !p)}
                        style={{
                            background: showAIPanel ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
                            border: '1px solid rgba(99,102,241,0.5)',
                            color: '#a5b4fc',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        🤖 {showAIPanel ? 'Hide AI Generator' : 'AI Generate Questions'}
                    </button>
                    <button
                        onClick={() => { setAuditingTestId(null); setShowAuditModal(true); }}
                        style={{
                            background: 'rgba(16,185,129,0.15)',
                            border: '1px solid rgba(16,185,129,0.5)',
                            color: '#6ee7b7',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        🔍 AI Audit DB
                    </button>
                    {!editingTest && (
                        <button className={styles.saveBtn} onClick={handleCreateNew} style={{ maxWidth: '200px' }}>
                            + Create New Test
                        </button>
                    )}
                </div>
            </div>

            {/* AI Panel */}
            {showAIPanel && (
                <AIGeneratePanel
                    selectedTest={selectedForAI}
                    selectedExam={selectedExam}
                    onSaved={fetchCustomTests}
                />
            )}

            <AIAuditModal 
                isOpen={showAuditModal} 
                onClose={() => setShowAuditModal(false)}
                testId={auditingTestId}
            />

            {editingTest && (
                <div className={styles.editor} style={{ marginBottom: '2rem' }}>
                    <div className={styles.formGrid}>
                        {editingTest.isNew && (
                            <label>Test ID (Unique Identifier)
                                <input className={styles.input} value={testForm.id} onChange={e => setTestForm({...testForm, id: e.target.value})} />
                            </label>
                        )}
                        
                        <div className={styles.col2}>
                            <label>Test Title
                                <input className={styles.input} value={testForm.title} onChange={e => setTestForm({...testForm, title: e.target.value})} placeholder="e.g. Weekly Major Test 1" />
                            </label>
                            <label>Test Type
                                <select className={styles.input} value={testForm.type} onChange={e => setTestForm({...testForm, type: e.target.value})}>
                                    <option value="MOCK">Full Test</option>
                                    <option value="LIVE">Cumulative Test</option>
                                    <option value="PART">Part Test</option>
                                    <option value="PYQ">PYQ Paper</option>
                                    <option value="SUBJECT">Subject Test</option>
                                    <option value="CHAPTER">Chapter Test</option>
                                    <option value="SUBTOPIC">Topicwise Test</option>
                                </select>
                            </label>
                            <label>Class / Grade
                                <select className={styles.input} value={testForm.classGrade || '11'} onChange={e => setTestForm({...testForm, classGrade: e.target.value})}>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                </select>
                            </label>
                        </div>

                        {(testForm.type === 'SUBJECT' || testForm.type === 'CHAPTER' || testForm.type === 'SUBTOPIC') && (
                            <div className={styles.col2}>
                                <label>Subject
                                    <select 
                                        className={styles.input} 
                                        value={testForm.subject} 
                                        onChange={e => setTestForm({...testForm, subject: e.target.value, chapter: ''})}
                                    >
                                        <option value="">— Select Subject —</option>
                                        {(subjectsByExam[selectedExam] || []).map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </label>
                                {(testForm.type === 'CHAPTER' || testForm.type === 'SUBTOPIC') && (
                                    <label>Chapter Name
                                        {(() => {
                                            const chapters = OLYMPIAD_SYLLABUS[testForm.subject] ? Object.values(OLYMPIAD_SYLLABUS[testForm.subject]).flat() : [];

                                            return chapters.length > 0 ? (
                                                <select
                                                    className={styles.input}
                                                    value={testForm.chapter}
                                                    onChange={e => setTestForm({...testForm, chapter: e.target.value})}
                                                >
                                                    <option value="">— Select Chapter —</option>
                                                    {chapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                                                </select>
                                            ) : (
                                                <input 
                                                    className={styles.input} 
                                                    value={testForm.chapter || ''} 
                                                    onChange={e => setTestForm({...testForm, chapter: e.target.value})} 
                                                    placeholder="e.g. Kinematics" 
                                                />
                                            );
                                        })()}
                                    </label>
                                )}
                            </div>
                        )}

                        {testForm.type === 'LIVE' && (
                            <div className={styles.col2}>
                                <label>Live Start Date & Time
                                    <input type="datetime-local" className={styles.input} value={testForm.liveStart} onChange={e => setTestForm({...testForm, liveStart: e.target.value})} />
                                </label>
                                <label>Live End Date & Time
                                    <input type="datetime-local" className={styles.input} value={testForm.liveEnd} onChange={e => setTestForm({...testForm, liveEnd: e.target.value})} />
                                </label>
                            </div>
                        )}

                        <label>Description / Syllabus
                            <textarea className={styles.textarea} rows={4} value={testForm.description} onChange={e => setTestForm({...testForm, description: e.target.value})} placeholder="Enter test description or detailed syllabus here..." />
                        </label>

                        <div className={styles.actions}>
                            <button className={styles.saveBtn} onClick={handleSave}>Save Test Details</button>
                            <button className={styles.cancelBtn} onClick={() => setEditingTest(null)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '1rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <input 
                    type="text" 
                    placeholder="🔍 Search Test Title or ID..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ flex: '1', minWidth: '200px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem' }}
                />
                <select 
                    value={filterCategory} 
                    onChange={e => setFilterCategory(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem' }}
                >
                    <option value="ALL">All Categories</option>
                    <option value="MOCK">Full Tests (Mock)</option>
                    <option value="PART">Part Tests</option>
                    <option value="LIVE">Cumulative (Live)</option>
                    <option value="PYQ">Previous Year (PYQ)</option>
                    <option value="SUBJECT">Subject-wise</option>
                    <option value="CHAPTER">Chapter-wise</option>
                    <option value="SUBTOPIC">Topic-wise</option>
                </select>
                <select 
                    value={filterSubject} 
                    onChange={e => setFilterSubject(e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '6px', padding: '8px 12px', fontSize: '0.9rem' }}
                >
                    <option value="ALL">All Subjects</option>
                    {selectedExam === 'neet' ? (
                        <>
                            <option value="physics">Physics</option>
                            <option value="chemistry">Chemistry</option>
                            <option value="botany">Botany</option>
                            <option value="zoology">Zoology</option>
                        </>
                    ) : (
                        <>
                            <option value="physics">Physics</option>
                            <option value="chemistry">Chemistry</option>
                            <option value="mathematics">Mathematics</option>
                        </>
                    )}
                </select>
            </div>

            <div className={styles.list}>
               {loading ? <p>Loading tests...</p> : (
                   <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                       <thead>
                           <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                               <th style={{ padding: '10px' }}>ID</th>
                               <th style={{ padding: '10px' }}>Title</th>
                               <th style={{ padding: '10px' }}>Type</th>
                               <th style={{ padding: '10px' }}>Status</th>
                               <th style={{ padding: '10px' }}>Actions</th>
                           </tr>
                       </thead>
                       <tbody>
                           {finalTestsList.map(test => (
                               <tr key={test.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                   <td style={{ padding: '10px', fontSize: '0.9rem', color: '#94a3b8' }}>{test.id}</td>
                                   <td style={{ padding: '10px', fontWeight: '500' }}>{test.title}</td>
                                   <td style={{ padding: '10px' }}><span style={{ background: 'var(--surface-hover)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>{test.type}</span></td>
                                   <td style={{ padding: '10px' }}>
                                        {test.isEdited && <span style={{ color: '#f59e0b', fontSize: '0.8rem', border: '1px solid #f59e0b', padding: '2px 6px', borderRadius: '4px' }}>Edited</span>}
                                        {(!test.isEdited && !test.isCustom) && <span style={{ color: '#10b981', fontSize: '0.8rem' }}>Default</span>}
                                        {(!test.isEdited && test.isCustom) && <span style={{ color: '#8b5cf6', fontSize: '0.8rem', border: '1px solid #8b5cf6', padding: '2px 6px', borderRadius: '4px' }}>Custom</span>}
                                   </td>
                                   <td style={{ padding: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                       <button onClick={() => handleEdit(test)} className={styles.editBtn}>Edit</button>
                                       <button
                                            onClick={() => setManagingQuestionsTest(test)}
                                            style={{
                                                background: 'rgba(52,211,153,0.15)',
                                                border: '1px solid rgba(52,211,153,0.4)',
                                                color: '#34d399',
                                                borderRadius: '6px',
                                                padding: '5px 10px',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                fontWeight: '600',
                                            }}
                                        >
                                            📝 Questions
                                        </button>
                                       <button
                                            onClick={() => {
                                               setAuditingTestId(test.id);
                                               setShowAuditModal(true);
                                            }}
                                           style={{
                                               background: 'rgba(99,102,241,0.15)',
                                               border: '1px solid rgba(99,102,241,0.4)',
                                               color: '#a5b4fc',
                                               borderRadius: '6px',
                                               padding: '5px 10px',
                                               cursor: 'pointer',
                                               fontSize: '0.8rem',
                                               fontWeight: '600',
                                           }}
                                       >
                                            🔬 Audit
                                       </button>
                                       {(test.isEdited || test.isCustom) && (
                                            <button 
                                                onClick={() => handleDelete(test.id)} 
                                                className={styles.deleteBtn}
                                                style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                            >
                                                Delete
                                            </button>
                                        )}
                                   </td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               )}
            </div>
        </div>
    );
}

// ── Question Manager ────────────────────────────────────────────────────────
function QuestionManager({ test, onBack }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSubMode, setActiveSubMode] = useState('list'); // 'list' | 'link'
    const [globalQuestions, setGlobalQuestions] = useState([]);
    const [loadingGlobal, setLoadingGlobal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchSubject, setSearchSubject] = useState('ALL');
    const [pastedIds, setPastedIds] = useState('');
    const [linkingPasted, setLinkingPasted] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, [test.id]);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/questions?testId=${test.id}`);
            const data = await res.json();
            setQuestions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Fetch questions failed', e);
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
        } catch (e) {
            console.error('Fetch global questions failed', e);
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
                    testId: test.id,
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

    const handleLinkPastedIds = async () => {
        if (!pastedIds.trim()) {
            alert('Please paste at least one Question ID');
            return;
        }
        const rawTokens = pastedIds.split(/[\s,;"']+/).map(t => t.trim()).filter(Boolean);
        if (rawTokens.length === 0) {
            alert('No valid Question IDs found');
            return;
        }

        setLinkingPasted(true);
        try {
            const res = await fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: test.id,
                    action: 'LINK_QUESTIONS',
                    questionIds: rawTokens
                })
            });
            const data = await res.json();
            if (!res.ok || data.error) throw new Error(data.error || 'Failed to link question IDs');
            alert(`✅ Successfully linked ${rawTokens.length} question(s) to "${test.title}"!`);
            setPastedIds('');
            fetchQuestions();
            setActiveSubMode('list');
        } catch (err) {
            alert('Error linking IDs: ' + err.message);
        } finally {
            setLinkingPasted(false);
        }
    };

    useEffect(() => {
        if (activeSubMode === 'link') {
            fetchGlobalQuestions();
        }
    }, [activeSubMode]);

    const examSubjects = subjectsByExam[test.exam || 'olympiad'] || subjectsByExam.olympiad || ['Mathematics', 'Science', 'English'];

    return (
        <div style={{ padding: '10px 0' }}>
            {activeSubMode === 'list' ? (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                        <button 
                          onClick={onBack}
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          ← Back to List
                        </button>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#818cf8' }}>
                            Test Questions: <span style={{ color: 'white' }}>{test.title}</span> ({questions.length})
                        </h3>
                        <button 
                            onClick={() => setActiveSubMode('link')}
                            style={{ marginLeft: 'auto', background: 'rgba(20,184,166,0.2)', border: '1px solid #14b8a6', color: '#99f6e4', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            🔗 Link Questions from Bank
                        </button>
                    </div>

                    {/* List Table */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        {loading ? <p style={{ padding: '20px', textAlign: 'center' }}>Loading questions...</p> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        <th style={{ padding: '15px', width: '60px' }}>#</th>
                                        <th style={{ padding: '15px' }}>Question</th>
                                        <th style={{ padding: '15px', width: '140px' }}>Answer</th>
                                        <th style={{ padding: '15px', width: '120px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No questions linked to this test yet. Click "Link Questions from Bank" to assign questions.</td></tr>
                                    ) : (
                                        questions.map((q, i) => (
                                            <tr key={q._id || q.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '15px', color: '#64748b', fontSize: '0.9rem' }}>{i + 1}</td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontWeight: '500', marginBottom: '8px', fontSize: '0.95rem', color: 'white', lineHeight: '1.4' }}>
                                                        <LatexRenderer text={q.text} />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                                                        {q.options?.map(opt => (
                                                            <span key={opt.id} style={{ fontSize: '0.8rem', color: opt.id === q.correctOption ? '#10b981' : '#94a3b8', fontWeight: opt.id === q.correctOption ? 'bold' : 'normal' }}>
                                                                ({opt.id.toUpperCase()}) <LatexRenderer text={opt.text} />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                        Option {q.correctOption?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <button 
                                                        onClick={() => handleToggleLink(q, true)} 
                                                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', transition: 'all 0.2s' }}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                        <button 
                          onClick={() => setActiveSubMode('list')}
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          ← Back to Test Questions
                        </button>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#14b8a6' }}>
                            Link Questions from Central Bank to: <span style={{ color: 'white' }}>{test.title}</span>
                        </h3>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
                        {/* Quick Add by Question IDs */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: '10px', padding: '12px 16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1rem' }}>⚡</span>
                                <strong style={{ color: '#2dd4bf', fontSize: '0.85rem' }}>Prepare from Question IDs:</strong>
                            </div>
                            <input
                                type="text"
                                placeholder="Paste Question ID(s) e.g. 67a8..., 67a9... (comma/space separated)"
                                value={pastedIds}
                                onChange={e => setPastedIds(e.target.value)}
                                style={{ flex: 1, minWidth: '240px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '7px 12px', color: 'white', fontSize: '0.85rem' }}
                            />
                            <button
                                onClick={handleLinkPastedIds}
                                disabled={linkingPasted}
                                style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 16px', fontWeight: 'bold', fontSize: '0.85rem', cursor: linkingPasted ? 'not-allowed' : 'pointer' }}
                            >
                                {linkingPasted ? 'Linking...' : '➕ Link IDs to Test'}
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Search by text, ID, or chapter..."
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
                                {examSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <button 
                                onClick={fetchGlobalQuestions}
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}
                            >
                                🔄 Refresh Bank
                            </button>
                        </div>

                        {loadingGlobal ? (
                            <p style={{ color: '#94a3b8' }}>Loading Central Bank...</p>
                        ) : (
                            <div style={{ maxHeight: '550px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(() => {
                                    const filtered = globalQuestions.filter(q => {
                                        if (searchSubject !== 'ALL' && q.subject !== searchSubject) return false;
                                        if (searchTerm.trim()) {
                                            const term = searchTerm.toLowerCase();
                                            const matchesId = q._id?.toLowerCase().includes(term) || String(q.id).toLowerCase() === term;
                                            const matchesText = q.text?.toLowerCase().includes(term);
                                            const matchesChapter = q.chapter?.toLowerCase().includes(term);
                                            const matchesSubTopic = q.subTopic?.toLowerCase().includes(term) || q.subtopic?.toLowerCase().includes(term);
                                            if (!matchesId && !matchesText && !matchesChapter && !matchesSubTopic) return false;
                                        }
                                        return true;
                                    });

                                    if (filtered.length === 0) {
                                        return <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No matching questions found in Central Bank.</p>;
                                    }

                                    return filtered.map((q) => {
                                        const isLinked = questions.some(tq => tq._id === q._id);
                                        return (
                                            <div key={q._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 16px' }}>
                                                <div style={{ flex: 1, fontSize: '0.85rem' }}>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '6px', fontSize: '0.75rem', alignItems: 'center' }}>
                                                        <span style={{ color: '#94a3b8', fontWeight: 'bold' }}>#{q.id}</span>
                                                        <span 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                if (navigator.clipboard) {
                                                                    navigator.clipboard.writeText(q._id);
                                                                    alert('Copied Question ID: ' + q._id);
                                                                }
                                                            }} 
                                                            style={{ color: '#2dd4bf', background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)', padding: '1px 6px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.72rem' }}
                                                            title="Click to copy Question ID"
                                                        >
                                                            ID: {q._id} 📋
                                                        </span>
                                                        <span style={{ color: '#818cf8', background: 'rgba(129,140,248,0.15)', padding: '1px 6px', borderRadius: '4px' }}>{q.subject}</span>
                                                        {q.chapter && <span style={{ color: '#a5b4fc', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>{q.chapter}</span>}
                                                        {q.subTopic && <span style={{ color: '#cbd5e1', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px' }}>{q.subTopic}</span>}
                                                        <span style={{ color: q.type === 'SUBJECTIVE' ? '#f59e0b' : '#34d399', fontWeight: 'bold' }}>{q.type}</span>
                                                    </div>
                                                    <div style={{ color: 'white', lineHeight: '1.4', marginBottom: '8px' }}>
                                                        <LatexRenderer text={q.text} />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                                                        {q.options?.map(opt => (
                                                            <span key={opt.id} style={{ fontSize: '0.75rem', color: opt.id === q.correctOption ? '#10b981' : '#64748b', fontWeight: opt.id === q.correctOption ? 'bold' : 'normal' }}>
                                                                ({opt.id.toUpperCase()}) <LatexRenderer text={opt.text} />
                                                            </span>
                                                        ))}
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
                </>
            )}
        </div>
    );
}

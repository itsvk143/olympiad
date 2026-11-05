'use client';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '../../../components/Navbar';
import TestCard from '../../../components/TestCard';
import { olympiadTests } from '../../../data/exams/olympiad';
import { OLYMPIAD_CLASSES, OLYMPIAD_SUBJECTS } from '../../../data/exams/olympiadSyllabus';
import styles from './page.module.css';
import { Suspense, use, useEffect, useState, useMemo } from 'react';
import { Search, BookOpen, Layers, Award, Sparkles, Filter } from 'lucide-react';

function ExamPageContent({ params }) {
    const unwrappedParams = use(params);
    const { exam = 'olympiad' } = unwrappedParams;

    const searchParams = useSearchParams();
    const initialClass = searchParams.get('class');
    const initialSubject = searchParams.get('subject');

    const { data: session } = useSession();

    const [selectedClass, setSelectedClass] = useState(initialClass ? Number(initialClass) : 5);
    const [selectedSubject, setSelectedSubject] = useState(initialSubject ? initialSubject.toLowerCase() : 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [completedTestIds, setCompletedTestIds] = useState(new Set());

    // Fetch user completed test IDs
    useEffect(() => {
        const userEmail = session?.user?.email?.toLowerCase();
        if (!userEmail) {
            setCompletedTestIds(new Set());
            return;
        }

        const fetchCompleted = async () => {
            try {
                const res = await fetch('/api/test-results?lean=1');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const ids = data.map(r => (r.testId || '').trim().toLowerCase()).filter(Boolean);
                        setCompletedTestIds(new Set(ids));
                    }
                }
            } catch (err) {
                console.error('Failed to load user test results', err);
            }
        };

        fetchCompleted();
    }, [session?.user?.email]);

    // Filter tests by class, subject, and search query
    const filteredTests = useMemo(() => {
        return olympiadTests.filter(test => {
            if (Number(test.classGrade) !== Number(selectedClass)) return false;
            if (selectedSubject !== 'all' && test.subjectSlug !== selectedSubject) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchesTitle = test.title.toLowerCase().includes(q);
                const matchesSubject = test.subject.toLowerCase().includes(q);
                const matchesDesc = test.description.toLowerCase().includes(q);
                if (!matchesTitle && !matchesSubject && !matchesDesc) return false;
            }
            return true;
        });
    }, [selectedClass, selectedSubject, searchQuery]);

    const subjectsList = [
        { id: 'all', name: 'All Subjects', icon: '🌟' },
        { id: 'mathematics', name: 'Mathematics', icon: '📐' },
        { id: 'science', name: 'Science', icon: '🔬' },
        { id: 'english', name: 'English', icon: '📚' }
    ];

    return (
        <div className={styles.container}>
            <Navbar />

            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{
                        padding: '0.3rem 0.9rem',
                        borderRadius: '9999px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        fontSize: '0.85rem',
                        fontWeight: '700'
                    }}>
                        🏆 CLASS {selectedClass} OLYMPIAD SERIES
                    </span>
                </div>
                <h1 className={styles.title}>
                    Olympiad Examination Portal — Class {selectedClass}
                </h1>
                <p className={styles.subtitle}>
                    Official-pattern 10-paper series with KaTeX LaTeX formulas, visual diagrams, and instant performance analysis.
                </p>

                {/* Class Navigation Pills */}
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.4rem',
                    justifyContent: 'center',
                    marginTop: '1.5rem',
                    marginBottom: '1rem'
                }}>
                    {OLYMPIAD_CLASSES.map(cls => (
                        <button
                            key={cls}
                            onClick={() => setSelectedClass(cls)}
                            style={{
                                padding: '0.45rem 0.9rem',
                                borderRadius: '8px',
                                border: selectedClass === cls ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
                                background: selectedClass === cls ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                                color: selectedClass === cls ? '#ffffff' : '#94a3b8',
                                fontWeight: selectedClass === cls ? '700' : '500',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            Class {cls}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className={styles.controls} style={{ maxWidth: '1200px', margin: '0 auto 2rem auto', padding: '0 1rem' }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    background: 'rgba(30, 41, 59, 0.6)',
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.15)'
                }}>
                    {/* Subject Tabs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {subjectsList.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedSubject(s.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: selectedSubject === s.id ? '1px solid #38bdf8' : '1px solid transparent',
                                    background: selectedSubject === s.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(15, 23, 42, 0.4)',
                                    color: selectedSubject === s.id ? '#ffffff' : '#cbd5e1',
                                    fontWeight: selectedSubject === s.id ? '700' : '500',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <span>{s.icon}</span>
                                <span>{s.name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div style={{ position: 'relative', minWidth: '260px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search papers or topics..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.55rem 1rem 0.55rem 2.4rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                background: 'rgba(15, 23, 42, 0.7)',
                                color: '#ffffff',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Test Cards Grid */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem 4rem 1rem' }}>
                <div style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Showing <strong style={{ color: '#ffffff' }}>{filteredTests.length}</strong> examination papers for Class {selectedClass}
                    {selectedSubject !== 'all' ? ` in ${selectedSubject.charAt(0).toUpperCase() + selectedSubject.slice(1)}` : ''}:
                </div>

                {filteredTests.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: 'rgba(30, 41, 59, 0.4)',
                        borderRadius: '16px',
                        border: '1px dashed rgba(148, 163, 184, 0.2)',
                        color: '#94a3b8'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
                        <h3>No Olympiad papers found matching your criteria</h3>
                        <p style={{ marginTop: '0.5rem' }}>Try clearing the search query or selecting a different subject.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '1.25rem'
                    }}>
                        {filteredTests.map(test => (
                            <TestCard
                                key={test.id}
                                test={test}
                                exam="olympiad"
                                session={session}
                                isCompleted={completedTestIds.has((test.id || '').trim().toLowerCase())}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function ExamPage(props) {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                Loading Olympiad tests...
            </div>
        }>
            <ExamPageContent {...props} />
        </Suspense>
    );
}

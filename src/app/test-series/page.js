'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import styles from './page.module.css';
import { OLYMPIAD_CLASSES, OLYMPIAD_SUBJECTS } from '@/data/exams/olympiadSyllabus';

export default function TestSeriesHome() {
    const [selectedClass, setSelectedClass] = useState(5);

    const subjects = [
        {
            id: 'mathematics',
            title: 'Mathematics Olympiad',
            short: 'Maths',
            icon: '📐',
            desc: 'IMO, iOM & UIMO standard papers covering numerical logic, geometry, algebra, and high-order reasoning.',
            papersCount: 10,
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            badge: 'IMO / iOM'
        },
        {
            id: 'science',
            title: 'Science Olympiad',
            short: 'Science',
            icon: '🔬',
            desc: 'NSO, iOS & NSTSE standard questions featuring physics, chemistry, biology, diagrams, and experiments.',
            papersCount: 10,
            gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            badge: 'NSO / iOS'
        },
        {
            id: 'english',
            title: 'English Olympiad',
            short: 'English',
            icon: '📚',
            desc: 'IEO & iOEL standard tests covering grammar, reading comprehension, idioms, syntax, and verbal analogies.',
            papersCount: 10,
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            badge: 'IEO / iOEL'
        }
    ];

    return (
        <div className={styles.container}>
            <Navbar />
            <main className={styles.main}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <span style={{
                        display: 'inline-block',
                        padding: '0.35rem 1rem',
                        borderRadius: '9999px',
                        background: 'rgba(59, 130, 246, 0.12)',
                        color: '#60a5fa',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '1rem',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                        🏆 360 Full Tests • Classes 1–12 • LaTeX & Visual Engine
                    </span>
                    <h1 className={styles.heroTitle}>National & International Olympiad Platform</h1>
                    <p className={styles.heroSubtitle}>
                        Select your Class and Subject to access 10 official-pattern examination papers with full LaTeX solutions and visual explanations.
                    </p>
                </div>

                {/* Class Selector Bar */}
                <div style={{
                    marginBottom: '2.5rem',
                    background: 'rgba(30, 41, 59, 0.7)',
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.75rem' }}>
                        🎯 Select Student Grade / Class:
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        justifyContent: 'center'
                    }}>
                        {OLYMPIAD_CLASSES.map(cls => (
                            <button
                                key={cls}
                                onClick={() => setSelectedClass(cls)}
                                style={{
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '10px',
                                    border: selectedClass === cls ? '2px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
                                    background: selectedClass === cls ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'rgba(15, 23, 42, 0.6)',
                                    color: selectedClass === cls ? '#ffffff' : '#cbd5e1',
                                    fontWeight: selectedClass === cls ? '700' : '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: selectedClass === cls ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none'
                                }}
                            >
                                Class {cls}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subject Cards for Selected Class */}
                <div style={{ marginBottom: '1.5rem', color: '#e2e8f0', fontSize: '1.25rem', fontWeight: '700' }}>
                    Available Olympiads for <span style={{ color: '#38bdf8' }}>Class {selectedClass}</span>:
                </div>

                <div className={styles.grid}>
                    {subjects.map(subj => (
                        <Link
                            href={`/test-series/olympiad?class=${selectedClass}&subject=${subj.id}`}
                            key={subj.id}
                            className={styles.card}
                            style={{ background: subj.gradient, textDecoration: 'none' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '2.5rem' }}>{subj.icon}</span>
                                <span style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '9999px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    letterSpacing: '0.5px'
                                }}>
                                    {subj.badge}
                                </span>
                            </div>
                            <h2 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{subj.title}</h2>
                            <p style={{ opacity: 0.9, fontSize: '0.92rem', lineHeight: '1.5' }}>{subj.desc}</p>
                            
                            <div style={{
                                marginTop: '1.25rem',
                                paddingTop: '1rem',
                                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                    10 Full Papers • Class {selectedClass}
                                </span>
                                <div className={styles.arrow} style={{ marginLeft: 0 }}>→</div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Platform Features Grid */}
                <div style={{
                    marginTop: '4rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem'
                }}>
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.1)'
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡ KaTeX LaTeX Rendering</div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Every equation, chemical formula, fraction, and geometric relation renders cleanly on desktop, tablet, and mobile browsers.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.1)'
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📐 High-Accuracy Visuals</div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Programmatic SVG diagrams for circuits, optics, graphs, and anatomy, plus authentic photographs for real-world natural science.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(148, 163, 184, 0.1)'
                    }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊 10-Paper Series Progression</div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Graduated difficulty from Paper 01 (Foundation) through Paper 10 (Grand Finale Invitational) matching IMO, NSO, and IEO standards.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}

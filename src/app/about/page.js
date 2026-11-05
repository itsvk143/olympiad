'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import styles from './about.module.css';
import { SOCIAL_LINKS } from '@/lib/socialConfig';
import { normalizeToCanonicalExam, canonicalToExamSlug } from '@/lib/authorization';
import {
    Target,
    Layers,
    BookOpen,
    Radio,
    Clock,
    FileText,
    ShieldCheck,
    Award,
    CheckCircle2,
    ArrowRight,
    Phone,
    MessageCircle,
    ChevronRight,
    Send,
    Sparkles,
    BarChart3,
    Compass
} from 'lucide-react';

function InstagramIcon({ size = 18, color = "#e879f9" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    );
}

function FacebookIcon({ size = 18, color = "#60a5fa" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
    );
}

export default function AboutPage() {
    const { data: session } = useSession();
    const [userProfile, setUserProfile] = useState(null);
    const [seatsData, setSeatsData] = useState({
        filled: 104,
        total: 1000,
        remaining: 896,
        isAvailable: true
    });

    useEffect(() => {
        // Fetch user profile if logged in
        if (session?.user) {
            fetch('/api/user/profile')
                .then(res => res.json())
                .then(data => setUserProfile(data))
                .catch(() => {});
        }

        // Fetch dynamic launch seat counter
        fetch('/api/about/launch-seats')
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    setSeatsData(data);
                }
            })
            .catch(() => {});
    }, [session]);

    // Determine smart target exam slug for CTAs
    const userCanonicalExam = normalizeToCanonicalExam(userProfile?.exam || userProfile?.examPreparingFor);
    const targetExamSlug = userCanonicalExam ? canonicalToExamSlug(userCanonicalExam) : 'neet';

    const scrollToEcosystem = (e) => {
        e.preventDefault();
        const element = document.getElementById('ecosystem');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.ambientGlow} />
            <Navbar />

            <main className={styles.mainContainer}>
                {/* ==========================================================
                    1. HERO SECTION
                   ========================================================== */}
                <section className={styles.heroSection}>
                    <div className={styles.brandLabel}>
                        <Sparkles size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-1px' }} />
                        POLL TEST SERIES
                    </div>

                    <h1 className={styles.heroTagline}>
                        QUALITY TESTS. <span className={styles.highlightText}>QUALITY STUDENTS.</span>
                    </h1>

                    <h2 className={styles.heroSubHeadline}>
                        Test Smarter. Practise Deeper. Perform Better.
                    </h2>

                    <div className={styles.heroActions}>
                        <Link href={session ? "/dashboard" : "/test-series/neet"} className={styles.primaryCta} id="hero-start-testing">
                            START TESTING <ArrowRight size={18} />
                        </Link>
                        <a href="#ecosystem" onClick={scrollToEcosystem} className={styles.secondaryCta} id="hero-explore-types">
                            <Compass size={18} /> EXPLORE TEST TYPES
                        </a>
                    </div>
                </section>

                {/* ==========================================================
                    SPECIAL LAUNCH OFFER & SEAT COUNTER (TOP PLACEMENT)
                   ========================================================== */}
                <section className={styles.pricingSection} id="pricing" style={{ paddingTop: '1rem', paddingBottom: '2.5rem' }}>
                    <div className={styles.pricingBox}>
                        <div className={styles.pricingRibbon}>SAVE 80%</div>

                        <div className={styles.pricingHeaderLabel}>LIMITED INTRODUCTORY PRICING</div>
                        <h2 className={styles.pricingTitle}>SPECIAL LAUNCH OFFER</h2>

                        <div className={styles.priceDisplayContainer}>
                            <div className={styles.launchPriceBox}>
                                <div className={styles.launchPriceNumber}>₹1099</div>
                                <div className={styles.launchPriceLabel}>FIRST 1,000 STUDENTS</div>
                            </div>

                            <div className={styles.priceDivider} />

                            <div className={styles.regularPriceBox}>
                                <div className={styles.regularPriceLabel}>REGULAR PRICE</div>
                                <div className={styles.regularPriceNumber}>₹5,000</div>
                            </div>
                        </div>

                        {/* Dynamic Launch Seat Counter */}
                        <div className={styles.seatCounterContainer}>
                            {seatsData.isAvailable && seatsData.filled !== null ? (
                                <>
                                    <div className={styles.seatCounterText}>
                                        <span>Launch Offer Status:</span>
                                        <span className={styles.seatCountHighlight}>
                                            {seatsData.filled} / 1,000 Seats Filled
                                        </span>
                                    </div>
                                    <div className={styles.progressBarTrack}>
                                        <div
                                            className={styles.progressBarFill}
                                            style={{ width: `${Math.min(100, Math.max(5, (seatsData.filled / 1000) * 100))}%` }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'right' }}>
                                        {seatsData.remaining} seats remaining at ₹1099
                                    </div>
                                </>
                            ) : (
                                <div className={styles.seatCounterText} style={{ justifyContent: 'center' }}>
                                    <span>⚡ ₹1099 Introductory Rate Active for First 1,000 Seats</span>
                                </div>
                            )}
                        </div>

                        <Link href="/payment" className={styles.pricingButton} id="about-join-pricing-cta">
                            JOIN POLL TEST SERIES <ArrowRight size={20} />
                        </Link>

                        <p className={styles.pricingNote}>
                            Instant 732-day continuous access upon enrollment. Secure 256-bit encrypted Razorpay checkout.
                        </p>
                    </div>
                </section>

                {/* ==========================================================
                    REFUND PROMOTION (Marketing-only)
                   ========================================================== */}
                <section className={styles.refundSection} style={{ paddingTop: 0, paddingBottom: '3.5rem' }}>
                    <div className={styles.refundCard}>
                        <div className={styles.refundTrophy}>🏅</div>
                        <div className={styles.refundContent}>
                            <h3>PERFORM WELL. GET YOUR FEE BACK.</h3>
                            <p>
                                Students who achieve the qualifying top rank in the Poll Test Series can receive a refund of their test-series fee, subject to applicable eligibility conditions and official terms.
                            </p>
                            <p className={styles.refundSub}>
                                Prepare seriously. Perform strongly. Earn the opportunity to get your fee back.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ==========================================================
                    2. CORE IDEA & VISUAL PROGRESSION
                   ========================================================== */}
                <section className={styles.coreIdeaSection}>
                    <div className={styles.coreCard}>
                        <div className={styles.sectionHeader} style={{ marginBottom: '2rem' }}>
                            <div className={styles.sectionPill}>FOUNDATIONAL METHODOLOGY</div>
                            <h2 className={styles.sectionTitle}>
                                NOT JUST A TEST. A COMPLETE <span className={styles.highlightText}>TESTING SYSTEM.</span>
                            </h2>
                        </div>

                        <div className={styles.coreCopyGrid}>
                            <p className={styles.coreParagraph}>
                                Every student does not need the same kind of practice at every stage of preparation.
                            </p>
                            <p className={styles.coreParagraph}>
                                Sometimes you need to master one subtopic. Sometimes you need to test an entire chapter. Sometimes you need comprehensive subjectwise practice. Sometimes you need structured assignment practice. Sometimes you need to perform under a live environment. And sometimes you need a complete full examination.
                            </p>
                            <p className={styles.coreParagraph}>
                                Poll Test Series brings these different levels of testing together in one structured platform.
                            </p>
                        </div>

                        {/* Progression Visual Identity */}
                        <div className={styles.progressionFlow}>
                            <div className={styles.progressionStep}>
                                <span className={styles.stepIndex}>STAGE 01</span>
                                <span className={styles.stepLabel}>SUBTOPIC</span>
                            </div>
                            <span className={styles.progressionArrow}>&rarr;</span>

                            <div className={styles.progressionStep}>
                                <span className={styles.stepIndex}>STAGE 02</span>
                                <span className={styles.stepLabel}>CHAPTERWISE</span>
                            </div>
                            <span className={styles.progressionArrow}>&rarr;</span>

                            <div className={styles.progressionStep}>
                                <span className={styles.stepIndex}>STAGE 03</span>
                                <span className={styles.stepLabel}>SUBJECTWISE</span>
                            </div>
                            <span className={styles.progressionArrow}>&rarr;</span>

                            <div className={styles.progressionStep}>
                                <span className={styles.stepIndex}>STAGE 04</span>
                                <span className={styles.stepLabel} style={{ color: '#c084fc' }}>POLL TEST</span>
                            </div>
                            <span className={styles.progressionArrow}>&rarr;</span>

                            <div className={styles.progressionStep}>
                                <span className={styles.stepIndex}>STAGE 05</span>
                                <span className={styles.stepLabel}>LIVE TEST</span>
                            </div>
                            <span className={styles.progressionArrow}>&rarr;</span>

                            <div className={styles.progressionStep}>
                                <span className={styles.stepIndex}>STAGE 06</span>
                                <span className={styles.stepLabel}>FULL TEST</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ==========================================================
                    3. THE POLL TEST ECOSYSTEM (6 Cards)
                   ========================================================== */}
                <section className={styles.ecosystemSection} id="ecosystem">
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionPill}>STRUCTURED FRAMEWORK</div>
                        <h2 className={styles.sectionTitle}>
                            ONE PLATFORM. <span className={styles.highlightText}>MULTIPLE LEVELS OF TESTING.</span>
                        </h2>
                        <p className={styles.sectionSubtitle}>
                            Calibrate your preparation with tests engineered specifically for each stage of learning.
                        </p>
                    </div>

                    <div className={styles.cardsGrid}>
                        {/* 01 — SUBTOPIC TESTS */}
                        <div className={styles.ecosystemCard}>
                            <div className={styles.cardTopRow}>
                                <span className={styles.cardNumber}>01</span>
                                <div className={styles.cardIconBox}><Target size={22} /></div>
                            </div>
                            <h3 className={styles.cardTypeTitle}>SUBTOPIC TESTS</h3>
                            <h4 className={styles.cardHeadline}>Master the smallest concepts.</h4>
                            <p className={styles.cardDesc}>
                                Designed for focused practice on a specific subtopic before moving to complex problems.
                            </p>
                            <ul className={styles.benefitsList}>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Strengthen one concept</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Find conceptual gaps</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Practise a specific area</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Build confidence before moving forward</li>
                            </ul>
                            <Link href={`/test-series/${targetExamSlug}?tab=subtopic`} className={styles.cardCta}>
                                PRACTISE SUBTOPIC <ChevronRight size={16} />
                            </Link>
                        </div>

                        {/* 02 — CHAPTERWISE TESTS */}
                        <div className={styles.ecosystemCard}>
                            <div className={styles.cardTopRow}>
                                <span className={styles.cardNumber}>02</span>
                                <div className={styles.cardIconBox}><BookOpen size={22} /></div>
                            </div>
                            <h3 className={styles.cardTypeTitle}>CHAPTERWISE TESTS</h3>
                            <h4 className={styles.cardHeadline}>Test the complete chapter.</h4>
                            <p className={styles.cardDesc}>
                                A chapter-level test helps students determine whether they have actually understood the complete chapter.
                            </p>
                            <ul className={styles.benefitsList}>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Chapter completion assessment</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Systematic revision</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Performance measurement</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Pinpointing weak areas</li>
                            </ul>
                            <Link href={`/test-series/${targetExamSlug}?tab=chapter`} className={styles.cardCta}>
                                TEST CHAPTER <ChevronRight size={16} />
                            </Link>
                        </div>

                        {/* 03 — SUBJECTWISE TESTS */}
                        <div className={styles.ecosystemCard}>
                            <div className={styles.cardTopRow}>
                                <span className={styles.cardNumber}>03</span>
                                <div className={styles.cardIconBox}><Layers size={22} /></div>
                            </div>
                            <h3 className={styles.cardTypeTitle}>SUBJECTWISE TESTS</h3>
                            <h4 className={styles.cardHeadline}>Connect all chapters across a subject.</h4>
                            <p className={styles.cardDesc}>
                                Test multiple chapters together across entire subjects (Physics, Chemistry, Maths, Biology) for concept integration.
                            </p>
                            <ul className={styles.benefitsList}>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Complete subject integration</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Targeted multi-chapter revision</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Testing deeper understanding</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Identifying weaknesses within a subject</li>
                            </ul>
                            <Link href={`/test-series/${targetExamSlug}?tab=subject`} className={styles.cardCta}>
                                PRACTISE SUBJECT <ChevronRight size={16} />
                            </Link>
                        </div>

                        {/* 04 — POLL TESTS (Spotlight Card) */}
                        <div className={`${styles.ecosystemCard} ${styles.pollSpotlightCard}`}>
                            <div className={styles.cardTopRow}>
                                <span className={styles.cardNumber} style={{ color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.4)' }}>04</span>
                                <div className={styles.cardIconBox} style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#d8b4fe' }}><Clock size={22} /></div>
                            </div>
                            <div className={styles.pollBadge}>ASSIGNED &amp; TIME-BASED PRACTICE</div>
                            <h3 className={styles.cardTypeTitle}>POLL TESTS</h3>
                            <h4 className={styles.cardHeadline} style={{ color: '#e879f9' }}>POLL = PRACTICE ON PURPOSE</h4>
                            <p className={styles.cardDesc}>
                                Poll Tests are designed for structured practice through assignments, teacher-scheduled windows, and time-based challenges.
                            </p>
                            <ul className={styles.benefitsList}>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck} style={{ color: '#c084fc' }}>✓</span> Teacher-assigned test sessions</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck} style={{ color: '#c084fc' }}>✓</span> Defined time windows &amp; deadlines</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck} style={{ color: '#c084fc' }}>✓</span> Targeted student groups</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck} style={{ color: '#c084fc' }}>✓</span> Scheduled chapter practice</li>
                            </ul>
                            <Link href="/poll" className={styles.cardCta} style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', borderColor: 'rgba(192, 132, 252, 0.4)' }}>
                                EXPLORE POLL TESTS <ChevronRight size={16} />
                            </Link>
                        </div>

                        {/* 05 — LIVE TESTS */}
                        <div className={styles.ecosystemCard}>
                            <div className={styles.cardTopRow}>
                                <span className={styles.cardNumber}>05</span>
                                <div className={styles.cardIconBox}><Radio size={22} /></div>
                            </div>
                            <h3 className={styles.cardTypeTitle}>LIVE TESTS</h3>
                            <h4 className={styles.cardHeadline}>TEST TOGETHER. PERFORM UNDER PRESSURE.</h4>
                            <p className={styles.cardDesc}>
                                Scheduled, time-bound testing environment where students participate concurrently across India.
                            </p>
                            <ul className={styles.benefitsList}>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Scheduled live test slots</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Time-bound examination attempt</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Real-time participation</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Competitive testing &amp; rank comparison</li>
                            </ul>
                            <Link href={`/test-series/${targetExamSlug}?tab=live`} className={styles.cardCta}>
                                JOIN LIVE TEST <ChevronRight size={16} />
                            </Link>
                        </div>

                        {/* 06 — FULL TESTS */}
                        <div className={styles.ecosystemCard}>
                            <div className={styles.cardTopRow}>
                                <span className={styles.cardNumber}>06</span>
                                <div className={styles.cardIconBox}><FileText size={22} /></div>
                            </div>
                            <h3 className={styles.cardTypeTitle}>FULL TESTS</h3>
                            <h4 className={styles.cardHeadline}>THE FINAL TEST OF PREPARATION.</h4>
                            <p className={styles.cardDesc}>
                                Full-length mock tests designed to simulate the exact official exam timing, scoring pattern, and pressure.
                            </p>
                            <ul className={styles.benefitsList}>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Complete NTA-pattern exam simulation</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Exam time management &amp; pacing</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Strategy testing under negative marking</li>
                                <li className={styles.benefitItem}><span className={styles.benefitCheck}>✓</span> Full-syllabus readiness check</li>
                            </ul>
                            <Link href={`/test-series/${targetExamSlug}?tab=mock`} className={styles.cardCta}>
                                TAKE FULL TEST <ChevronRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ==========================================================
                    4. VISUAL TESTING JOURNEY (Timeline)
                   ========================================================== */}
                <section className={styles.journeySection}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionPill}>STEP-BY-STEP PROGRESSION</div>
                        <h2 className={styles.sectionTitle}>
                            FROM ONE CONCEPT TO THE <span className={styles.highlightText}>COMPLETE EXAM</span>
                        </h2>
                        <p className={styles.sectionSubtitle}>
                            A logical progression designed to eliminate guesswork and build examination stamina systematically.
                        </p>
                    </div>

                    <div className={styles.timelineContainer}>
                        <div className={styles.timelineLine} />

                        <div className={styles.timelineItem}>
                            <div className={styles.timelineDot}>🎯</div>
                            <div className={styles.timelineContent}>
                                <div className={styles.timelineStepTitle}>01 — SUBTOPIC TESTS</div>
                                <div className={styles.timelineStepDesc}>Master one isolated concept with zero ambiguity before advancing.</div>
                            </div>
                        </div>

                        <div className={styles.timelineItem}>
                            <div className={styles.timelineDot}>📖</div>
                            <div className={styles.timelineContent}>
                                <div className={styles.timelineStepTitle}>02 — CHAPTERWISE TESTS</div>
                                <div className={styles.timelineStepDesc}>Test complete chapters to verify comprehensive chapter-level mastery.</div>
                            </div>
                        </div>

                        <div className={styles.timelineItem}>
                            <div className={styles.timelineDot}>📚</div>
                            <div className={styles.timelineContent}>
                                <div className={styles.timelineStepTitle}>03 — SUBJECTWISE TESTS</div>
                                <div className={styles.timelineStepDesc}>Connect all chapters across a subject (Physics, Chemistry, Maths, Biology).</div>
                            </div>
                        </div>

                        <div className={styles.timelineItem}>
                            <div className={styles.timelineDot} style={{ borderColor: '#c084fc' }}>🗳️</div>
                            <div className={styles.timelineContent} style={{ borderColor: 'rgba(192, 132, 252, 0.3)' }}>
                                <div className={styles.timelineStepTitle} style={{ color: '#d8b4fe' }}>04 — POLL TESTS</div>
                                <div className={styles.timelineStepDesc}>Practise through structured assignments, deadlines, and time-based practice sessions.</div>
                            </div>
                        </div>

                        <div className={styles.timelineItem}>
                            <div className={styles.timelineDot}>⚡</div>
                            <div className={styles.timelineContent}>
                                <div className={styles.timelineStepTitle}>05 — LIVE TESTS</div>
                                <div className={styles.timelineStepDesc}>Perform under time pressure alongside peers in real-time nationwide slots.</div>
                            </div>
                        </div>

                        <div className={styles.timelineItem}>
                            <div className={styles.timelineDot}>🏆</div>
                            <div className={styles.timelineContent}>
                                <div className={styles.timelineStepTitle}>06 — FULL TESTS</div>
                                <div className={styles.timelineStepDesc}>Simulate the full examination with authentic 3-hour / 3-hour-20-min official patterns.</div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.journeyConclusion}>
                        <div className={styles.conclusionMain}>PRACTICE AT THE LEVEL YOU NEED.</div>
                        <div className={styles.conclusionSub}>TEST AT THE LEVEL YOU ARE PREPARING FOR.</div>
                    </div>
                </section>

                {/* ==========================================================
                    5. QUALITY-FIRST PHILOSOPHY & VERIFIED CONTENT
                   ========================================================== */}
                <section className={styles.qualitySection}>
                    <div className={styles.qualityGrid}>
                        {/* Quality over Quantity Card */}
                        <div className={styles.qualityCard}>
                            <div>
                                <div className={styles.sectionPill}>CORE PHILOSOPHY</div>
                                <h3 className={styles.qualityCardTitle}>QUALITY OVER QUANTITY</h3>
                                <p className={styles.qualityP}>
                                    A large question bank is not enough.
                                </p>
                                <p className={styles.qualityP}>
                                    Students need questions that are relevant, well-structured, and strictly aligned with the exact level of examination they are preparing for.
                                </p>
                            </div>
                            <div>
                                <div className={styles.qualityPillGroup}>
                                    <span className={styles.qualityPill}>Conceptual Quality</span>
                                    <span className={styles.qualityPill}>Exam Relevance</span>
                                    <span className={styles.qualityPill}>Appropriate Difficulty</span>
                                    <span className={styles.qualityPill}>Clear Question Construction</span>
                                    <span className={styles.qualityPill}>Structured Testing</span>
                                    <span className={styles.qualityPill}>Meaningful Practice</span>
                                    <span className={styles.qualityPill}>Performance-Oriented</span>
                                </div>
                            </div>
                        </div>

                        {/* Verified Academic Quality Card */}
                        <div className={styles.qualityCard}>
                            <div>
                                <div className={styles.sectionPill}>ACADEMIC RIGOR</div>
                                <h3 className={styles.qualityCardTitle}>BUILT FOR ACADEMIC QUALITY</h3>
                                <p className={styles.qualityP}>
                                    Questions and test content are created and verified by IITians and NITians with an academic focus on competitive examination preparation.
                                </p>
                                <p className={styles.qualityP}>
                                    Every question is mapped to NCERT and the latest NTA / exam agency syllabus with detailed analytical solutions.
                                </p>
                            </div>

                            <div className={styles.trustBanner}>
                                <div className={styles.trustShield}><ShieldCheck size={36} /></div>
                                <div className={styles.trustText}>
                                    <h4>100% VERIFIED CONTENT</h4>
                                    <p>Verified by IITians &amp; NITians for conceptual depth and scoring accuracy.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



                {/* ==========================================================
                    6. BUILT FOR SERIOUS STUDENTS
                   ========================================================== */}
                <section className={styles.seriousSection}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionPill}>ASPIRANT MINDSET</div>
                        <h2 className={styles.sectionTitle}>
                            BUILT FOR <span className={styles.highlightText}>SERIOUS STUDENTS</span>
                        </h2>
                        <p className={styles.sectionSubtitle}>
                            Poll Test Series is designed for students who do not want to simply complete tests — they want to understand where they stand.
                        </p>
                    </div>

                    <div className={styles.seriousGrid}>
                        <div className={styles.seriousCard}>
                            <span className={styles.seriousIcon}>🎯</span>
                            <span className={styles.seriousCardTitle}>PRACTISE WITH PURPOSE</span>
                        </div>
                        <div className={styles.seriousCard}>
                            <span className={styles.seriousIcon}>💡</span>
                            <span className={styles.seriousCardTitle}>TEST YOUR UNDERSTANDING</span>
                        </div>
                        <div className={styles.seriousCard}>
                            <span className={styles.seriousIcon}>🔍</span>
                            <span className={styles.seriousCardTitle}>IDENTIFY YOUR WEAKNESSES</span>
                        </div>
                        <div className={styles.seriousCard}>
                            <span className={styles.seriousIcon}>🔄</span>
                            <span className={styles.seriousCardTitle}>IMPROVE THROUGH REPETITION</span>
                        </div>
                        <div className={styles.seriousCard}>
                            <span className={styles.seriousIcon}>📊</span>
                            <span className={styles.seriousCardTitle}>MEASURE YOUR PREPARATION</span>
                        </div>
                    </div>
                </section>

                {/* ==========================================================
                    7. OLYMPIAD DISCIPLINES
                   ========================================================== */}
                <section className={styles.examsSection}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionPill}>NATIONAL &amp; INTERNATIONAL OLYMPIADS</div>
                        <h2 className={styles.sectionTitle}>
                            PREPARE FOR <span className={styles.highlightText}>OLYMPIAD EXCELLENCE</span>
                        </h2>
                        <p className={styles.sectionSubtitle}>
                            Exhaustive testing modules tailored strictly to Classes 1–12 with authentic LaTeX formulas, diagrams, and instant analytics.
                        </p>
                    </div>

                    <div className={styles.examsGrid}>
                        {/* MATHEMATICS OLYMPIAD */}
                        <div className={`${styles.examCard} ${styles.examCardNEET}`}>
                            <div>
                                <span className={`${styles.examBadge} ${styles.badgeNEET}`}>IMO / iOM / UIMO</span>
                                <h3 className={styles.examTitle}>MATHEMATICS OLYMPIAD</h3>
                                <p className={styles.examDesc}>
                                    Rigorous mathematical reasoning, geometry, number systems, algebra, and advanced problem-solving for Classes 1–12.
                                </p>
                                <ul className={styles.examFeatures}>
                                    <li className={styles.examFeatureItem}><CheckCircle2 size={15} color="#22c55e" /> 120 Official-Pattern Mock Papers</li>
                                    <li className={styles.examFeatureItem}><CheckCircle2 size={15} color="#22c55e" /> KaTeX Mathematical Proofs &amp; Derivations</li>
                                    <li className={styles.examFeatureItem}><CheckCircle2 size={15} color="#22c55e" /> High-Order Thinking (HOTS) Curriculum</li>
                                </ul>
                            </div>
                            <Link href="/test-series/olympiad" className={styles.cardCta}>
                                EXPLORE MATH OLYMPIAD <ChevronRight size={16} />
                            </Link>
                        </div>

                        {/* SCIENCE OLYMPIAD */}
                        <div className={`${styles.examCard} ${styles.examCardJEE}`}>
                            <div>
                                <span className={`${styles.examBadge} ${styles.badgeJEE}`}>NSO / iOS / NSTSE</span>
                                <h3 className={styles.examTitle}>SCIENCE OLYMPIAD</h3>
                                <p className={styles.examDesc}>
                                    Comprehensive physics, chemistry, biology, earth science, and experimental apparatus questions for Classes 1–12.
                                </p>
                                <ul className={styles.examFeatures}>
                                    <li className={styles.examFeatureItem}><CheckCircle2 size={15} color="#3b82f6" /> 120 Visual &amp; Concept-Rich Mock Papers</li>
                                    <li className={styles.examFeatureItem}><CheckCircle2 size={15} color="#3b82f6" /> Circuit &amp; Cellular SVG Diagrams</li>
                                    <li className={styles.examFeatureItem}><CheckCircle2 size={15} color="#3b82f6" /> Chemical Reactions &amp; Formula Explanations</li>
                                </ul>
                            </div>
                            <Link href="/test-series/olympiad" className={styles.cardCta}>
                                EXPLORE SCIENCE OLYMPIAD <ChevronRight size={16} />
                            </Link>
                        </div>

                        {/* ENGLISH OLYMPIAD */}
                        <div className={`${styles.examCard} ${styles.examCardBITSAT}`}>
                            <div>
                                <span className={`${styles.examBadge} ${styles.badgeBITSAT}`}>IEO / iOEL</span>
                                <h3 className={styles.examTitle}>ENGLISH OLYMPIAD</h3>
                                <p className={styles.examDesc}>
                                    Grammar mastery, lexical precision, reading comprehension, error spotting, and linguistic eloquence for Classes 1–12.
                                </p>
                                <ul className={styles.examFeatures}>
                                    <li className={styles.examFeatureItem}><CheckCircle2 size={15} color="#f59e0b" /> 120 Comprehensive Language Papers</li>
                                    <li className={styles.examFeatureItem}><CheckCircle2 size={15} color="#f59e0b" /> Lexical Nuance &amp; Verbal Reasoning</li>
                                    <li className={styles.examFeatureItem}><CheckCircle2 size={15} color="#f59e0b" /> Grammatical Error Diagnostics</li>
                                </ul>
                            </div>
                            <Link href="/test-series/olympiad" className={styles.cardCta}>
                                EXPLORE ENGLISH OLYMPIAD <ChevronRight size={16} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ==========================================================
                    HOW IT WORKS
                   ========================================================== */}
                <section className={styles.howItWorksSection}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionPill}>SIMPLE 4-STEP WORKFLOW</div>
                        <h2 className={styles.sectionTitle}>
                            HOW IT <span className={styles.highlightText}>WORKS</span>
                        </h2>
                        <p className={styles.sectionSubtitle}>
                            A clear, disciplined path from enrollment to exam-day excellence.
                        </p>
                    </div>

                    <div className={styles.stepsGrid}>
                        <div className={styles.stepCard}>
                            <div className={styles.stepNumber}>01</div>
                            <h3 className={styles.stepTitle}>CHOOSE YOUR EXAM</h3>
                            <p className={styles.stepDesc}>
                                Select the competitive examination available to you: NEET, JEE Main, or BITSAT.
                            </p>
                        </div>

                        <div className={styles.stepCard}>
                            <div className={styles.stepNumber}>02</div>
                            <h3 className={styles.stepTitle}>CHOOSE YOUR TEST</h3>
                            <p className={styles.stepDesc}>
                                Select Subtopic, Chapterwise, Subjectwise, Poll, Live, or Full Tests depending on your preparation stage.
                            </p>
                        </div>

                        <div className={styles.stepCard}>
                            <div className={styles.stepNumber}>03</div>
                            <h3 className={styles.stepTitle}>ATTEMPT THE TEST</h3>
                            <p className={styles.stepDesc}>
                                Solve high-yield questions under applicable testing conditions and authentic exam timing.
                            </p>
                        </div>

                        <div className={styles.stepCard}>
                            <div className={styles.stepNumber}>04</div>
                            <h3 className={styles.stepTitle}>ANALYSE &amp; IMPROVE</h3>
                            <p className={styles.stepDesc}>
                                Review performance, identify conceptual mistakes, and focus on specific areas requiring practice.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ==========================================================
                    11. CONTACT US SECTION
                   ========================================================== */}
                <section className={styles.contactSection} id="contact">
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionPill}>SUPPORT &amp; INQUIRIES</div>
                        <h2 className={styles.sectionTitle}>
                            CONTACT <span className={styles.highlightText}>US</span>
                        </h2>
                        <p className={styles.sectionSubtitle}>
                            Have questions about our test series or need enrollment assistance? Reach our student team directly.
                        </p>
                    </div>

                    <div className={styles.contactGrid}>
                        <div className={styles.contactCard}>
                            <div className={styles.contactIconBox}><Phone size={26} /></div>
                            <h3 className={styles.contactTitle}>CALL SUPPORT</h3>
                            <div className={styles.contactNumber}>{SOCIAL_LINKS.PHONE_NUMBER}</div>
                            <a href={SOCIAL_LINKS.PHONE_TEL} className={`${styles.contactBtn} ${styles.callBtn}`}>
                                <Phone size={18} /> CALL US
                            </a>
                        </div>

                        <div className={styles.contactCard}>
                            <div className={styles.contactIconBox} style={{ background: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
                                <MessageCircle size={26} />
                            </div>
                            <h3 className={styles.contactTitle}>WHATSAPP CHAT</h3>
                            <div className={styles.contactNumber} style={{ color: '#4ade80' }}>{SOCIAL_LINKS.PHONE_NUMBER}</div>
                            <a
                                href={SOCIAL_LINKS.WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${styles.contactBtn} ${styles.whatsappBtn}`}
                            >
                                <MessageCircle size={18} /> CHAT ON WHATSAPP
                            </a>
                        </div>
                    </div>
                </section>

                {/* ==========================================================
                    12. SOCIAL MEDIA SECTION
                   ========================================================== */}
                <section className={styles.socialSection}>
                    <div className={styles.sectionPill}>COMMUNITY CHANNELS</div>
                    <h2 className={styles.sectionTitle}>
                        FOLLOW <span className={styles.highlightText}>POLL TEST SERIES</span>
                    </h2>
                    <p className={styles.sectionSubtitle}>
                        Stay updated with exam announcements, test releases, and preparation tips.
                    </p>

                    <div className={styles.socialGrid}>
                        <a href={SOCIAL_LINKS.TELEGRAM_URL} className={styles.socialItem} target="_blank" rel="noopener noreferrer">
                            <Send size={18} color="#38bdf8" /> Telegram
                        </a>
                        <a href={SOCIAL_LINKS.INSTAGRAM_URL} className={styles.socialItem} target="_blank" rel="noopener noreferrer">
                            <InstagramIcon size={18} color="#e879f9" /> Instagram
                        </a>
                        <a href={SOCIAL_LINKS.FACEBOOK_URL} className={styles.socialItem} target="_blank" rel="noopener noreferrer">
                            <FacebookIcon size={18} color="#60a5fa" /> Facebook
                        </a>
                    </div>
                </section>

                {/* ==========================================================
                    13. FINAL CALL TO ACTION
                   ========================================================== */}
                <section className={styles.finalCtaSection}>
                    <div className={styles.finalCtaBox}>
                        <div className={styles.sectionPill}>READY TO BEGIN?</div>
                        <h2 className={styles.finalCtaTitle}>READY TO TEST YOUR PREPARATION?</h2>
                        <div className={styles.finalCtaProgression}>
                            From Subtopic to Chapterwise. From Chapterwise to Subjectwise.<br />
                            From Subjectwise to Poll. From Poll to Live. From Live to Full Test.
                        </div>
                        <Link href={session ? "/dashboard" : "/test-series/neet"} className={styles.primaryCta} style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
                            START TESTING &rarr;
                        </Link>
                    </div>
                </section>
            </main>

            {/* ==========================================================
                14. FOOTER
               ========================================================== */}
            <footer className={styles.footer}>
                <div className={styles.footerContainer}>
                    <div className={styles.footerTop}>
                        <div className={styles.footerBrand}>
                            <h3>Poll Test Series</h3>
                            <div className={styles.footerTagline}>Quality Tests. Quality Students.</div>
                            <p className={styles.footerDesc}>
                                A structured testing platform for subtopic practice, chapterwise drills, subjectwise tests, poll assignments, live tests and full-length examinations.
                            </p>
                            <div className={styles.footerContactText}>
                                <div><strong>Mobile:</strong> {SOCIAL_LINKS.PHONE_NUMBER}</div>
                                <div><strong>WhatsApp:</strong> {SOCIAL_LINKS.PHONE_NUMBER}</div>
                            </div>
                        </div>

                        <div className={styles.footerCol}>
                            <h4>Navigation</h4>
                            <ul className={styles.footerLinkList}>
                                <li className={styles.footerLinkItem}><Link href="/">Home</Link></li>
                                <li className={styles.footerLinkItem}><Link href="/dashboard">Tests</Link></li>
                                <li className={styles.footerLinkItem}><Link href="/about">About</Link></li>
                                <li className={styles.footerLinkItem}><Link href="/contact">Contact</Link></li>
                            </ul>
                        </div>

                        <div className={styles.footerCol}>
                            <h4>Legal &amp; Policy</h4>
                            <ul className={styles.footerLinkList}>
                                <li className={styles.footerLinkItem}><Link href="/privacy-policy">Privacy Policy</Link></li>
                                <li className={styles.footerLinkItem}><Link href="/terms-of-service">Terms &amp; Conditions</Link></li>
                                <li className={styles.footerLinkItem}><Link href="/payment">Enrollment</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className={styles.footerBottom}>
                        <p>&copy; {new Date().getFullYear()} Poll Test Series. All rights reserved. Quality Tests for Quality Students.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

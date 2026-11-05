import Link from 'next/link';
import Navbar from '../components/Navbar';
import styles from './page.module.css';
import { Target, LineChart, BookOpen, ShieldCheck, ChevronRight, CheckCircle2, Award, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.main}>
        {/* HERO SECTION */}
        <section className={styles.heroSection}>
          <div className={styles.heroBackground}></div>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeText}>New</span>
              Dedicated Olympiad Examination Platform • Classes 1–12
            </div>
            <h1 className={styles.title}>
              Master National & International <span className={styles.highlight}>Olympiads</span>
            </h1>
            <p className={styles.description}>
              Empowering students from Class 1 to Class 12 in Mathematics (IMO/iOM), Science (NSO/iOS), and English (IEO/iOEL) with 360 official-pattern examination papers, KaTeX LaTeX rendering, and high-accuracy visual questions.
            </p>
            <div className={styles.ctaGroup}>
              <Link href="/test-series" className={styles.primaryButton}>
                Explore Olympiad Papers <ChevronRight size={18} />
              </Link>
              <Link href="/about" className={styles.secondaryButton}>
                About Olympiads
              </Link>
            </div>
            
            <div className={styles.trustIndicators}>
              <div className={styles.trustItem}><CheckCircle2 size={16} className={styles.trustIcon} /> 10-Year Olympiad Research (2016–2025)</div>
              <div className={styles.trustItem}><CheckCircle2 size={16} className={styles.trustIcon} /> Rigorous LaTeX Equations</div>
              <div className={styles.trustItem}><CheckCircle2 size={16} className={styles.trustIcon} /> Authentic Diagrams & Photographs</div>
              <div className={styles.trustItem}><CheckCircle2 size={16} className={styles.trustIcon} /> Classes 1 to 12</div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3 className={styles.statNumber}>360</h3>
              <p className={styles.statLabel}>Full Olympiad Papers</p>
            </div>
            <div className={styles.statCard}>
              <h3 className={styles.statNumber}>13,800+</h3>
              <p className={styles.statLabel}>Curated Olympiad Questions</p>
            </div>
            <div className={styles.statCard}>
              <h3 className={styles.statNumber}>12</h3>
              <p className={styles.statLabel}>Classes Supported (1–12)</p>
            </div>
            <div className={styles.statCard}>
              <h3 className={styles.statNumber}>3</h3>
              <p className={styles.statLabel}>Core Subjects (Math, Sci, Eng)</p>
            </div>
          </div>
        </section>

        {/* THREE CORE OLYMPIAD DISCIPLINES */}
        <section style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc', marginBottom: '0.75rem' }}>
              Three Pillars of Academic Excellence
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
              Structured 10-paper series calibrated from foundational concept tests up to national-level invitationals.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(30, 41, 59, 0.5) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📐</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#60a5fa', marginBottom: '0.75rem' }}>
                Mathematics Olympiad
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Aligned with IMO, iOM, and UIMO. Develops number sense, arithmetic, geometry, algebra, combinatorics, and high-order spatial reasoning with clean KaTeX equations.
              </p>
              <Link href="/test-series?subject=mathematics" style={{ color: '#38bdf8', fontWeight: '700', textDecoration: 'none' }}>
                Explore Math Papers →
              </Link>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(30, 41, 59, 0.5) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔬</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#34d399', marginBottom: '0.75rem' }}>
                Science Olympiad
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Aligned with NSO, iOS, and NSTSE. Covers physics, chemistry, biology, environmental sciences, experimental apparatus, and vector circuit/cell diagrams.
              </p>
              <Link href="/test-series?subject=science" style={{ color: '#34d399', fontWeight: '700', textDecoration: 'none' }}>
                Explore Science Papers →
              </Link>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(30, 41, 59, 0.5) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚</div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#a78bfa', marginBottom: '0.75rem' }}>
                English Olympiad
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Aligned with IEO and iOEL. Sharpens grammar, advanced syntax, reading comprehension, idioms, verbal analogies, and contextual vocabulary for young learners and seniors alike.
              </p>
              <Link href="/test-series?subject=english" style={{ color: '#a78bfa', fontWeight: '700', textDecoration: 'none' }}>
                Explore English Papers →
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className={styles.featuresSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Why Choose PollTest.in Olympiad Platform?</h2>
            <p className={styles.sectionSubtitle}>
              Engineered specifically for school students from primary grades through senior secondary.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Target className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>LaTeX Mathematical Engine</h3>
              <p className={styles.featureDescription}>
                Mathematical and chemical notation rendered flawlessly with KaTeX, preventing broken symbols or illegible fractions.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <BookOpen className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Accurate Visual Questions</h3>
              <p className={styles.featureDescription}>
                Programmatic diagrams and real-world photographs integrated into questions where visual interpretation is the learning objective.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <LineChart className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Instant Performance Insights</h3>
              <p className={styles.featureDescription}>
                Subject-wise scoring, topic strengths, time allocation, and percentile benchmarking to guide focused preparation.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <ShieldCheck className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Age-Appropriate Examination UI</h3>
              <p className={styles.featureDescription}>
                Tailored question palette and friendly buttons for Classes 1–5, with full-rigor competition interfaces for Classes 6–12.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

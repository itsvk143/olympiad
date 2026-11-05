'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [userProfile, setUserProfile] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetchUserProfile();
        }
    }, [session]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchUserProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            const data = await res.json();
            setUserProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    Olympiad<span className={styles.highlight}>Platform</span>
                </Link>

                {/* Mobile Right Actions: Theme Toggle + Sign In + Hamburger */}
                <div className={styles.mobileRightActions}>
                    <ThemeToggle variant="compact" />

                    {!session && status !== 'loading' && (
                        <button
                            onClick={() => signIn()}
                            className={styles.mobileSignupBtn}
                            aria-label="Sign Up"
                        >
                            Sign In
                        </button>
                    )}

                    <button
                        className={styles.hamburger}
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={menuOpen}
                    >
                        <span className={`${styles.bar} ${menuOpen ? styles.bar1Open : ''}`} />
                        <span className={`${styles.bar} ${menuOpen ? styles.bar2Open : ''}`} />
                        <span className={`${styles.bar} ${menuOpen ? styles.bar3Open : ''}`} />
                    </button>
                </div>

                {/* Desktop Links */}
                <div className={styles.links}>
                    <Link
                        href="/test-series"
                        className={`${styles.link} ${pathname?.startsWith('/test-series') ? styles.activeLink : ''}`}
                    >
                        🏆 Olympiad
                    </Link>

                    {session && (
                        <>
                            <Link
                                href="/dashboard"
                                className={`${styles.link} ${pathname === '/dashboard' ? styles.activeLink : ''}`}
                            >
                                📊 Dashboard
                            </Link>
                            <Link
                                href="/poll"
                                className={styles.link}
                                style={{ color: '#c084fc', fontWeight: 'bold' }}
                            >
                                🗳️ Poll
                            </Link>
                        </>
                    )}

                    <Link
                        href="/about"
                        className={`${styles.link} ${pathname === '/about' ? styles.activeLink : ''}`}
                    >
                        About
                    </Link>

                    {/* Day / Night Theme Toggle */}
                    <ThemeToggle variant="segmented" />

                    {session ? (
                        <>
                            {session.user?.isAdmin && (
                                <Link
                                    href="/admin"
                                    className={styles.link}
                                    style={{ color: '#f59e0b', fontWeight: 'bold' }}
                                >
                                    ⚙️ Admin
                                </Link>
                            )}
                            <span className={styles.link} style={{ color: '#7dd3fc', fontWeight: 'normal' }}>
                                👤 {session.user?.name?.split(' ')[0] || 'Student'}
                            </span>
                            <button
                                onClick={() => signOut()}
                                className={styles.authBtn}
                                style={{ background: 'rgba(255,59,48,0.2)', border: '1px solid rgba(255,59,48,0.5)' }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => signIn()}
                            className={styles.authBtn}
                            style={{ background: 'rgba(52,199,89,0.2)', border: '1px solid rgba(52,199,89,0.5)' }}
                        >
                            Login
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`}>
                <div className={styles.mobileThemeSection}>
                    <span className={styles.mobileThemeLabel}>Theme</span>
                    <ThemeToggle variant="segmented" />
                </div>
                <Link
                    href="/test-series"
                    className={`${styles.mobileLink} ${pathname?.startsWith('/test-series') ? styles.activeMobileLink : ''}`}
                    onClick={closeMenu}
                >
                    🏆 Olympiad Tests
                </Link>
                {session && (
                    <>
                        <Link
                            href="/dashboard"
                            className={`${styles.mobileLink} ${pathname === '/dashboard' ? styles.activeMobileLink : ''}`}
                            onClick={closeMenu}
                            style={{ color: '#34c759' }}
                        >
                            📊 Dashboard
                        </Link>
                        <Link
                            href="/poll"
                            className={styles.mobileLink}
                            onClick={closeMenu}
                            style={{ color: '#c084fc', fontWeight: 'bold' }}
                        >
                            🗳️ Community Poll
                        </Link>
                    </>
                )}
                <Link
                    href="/about"
                    className={`${styles.mobileLink} ${pathname === '/about' ? styles.activeMobileLink : ''}`}
                    onClick={closeMenu}
                >
                    About
                </Link>
                <Link
                    href="/contact"
                    className={`${styles.mobileLink} ${pathname === '/contact' ? styles.activeMobileLink : ''}`}
                    onClick={closeMenu}
                >
                    Contact
                </Link>

                {session ? (
                    <>
                        {session.user?.isAdmin && (
                            <Link
                                href="/admin"
                                className={styles.mobileLink}
                                onClick={closeMenu}
                                style={{ color: '#f59e0b' }}
                            >
                                ⚙️ Admin Portal
                            </Link>
                        )}
                        <span className={styles.mobileLink} style={{ color: '#7dd3fc' }}>
                            👤 {session.user?.name}
                        </span>
                        <button
                            onClick={() => { signOut(); closeMenu(); }}
                            className={`${styles.authBtn} ${styles.mobileAuthBtn}`}
                            style={{ background: 'rgba(255,59,48,0.2)', border: '1px solid rgba(255,59,48,0.5)' }}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => { signIn(); closeMenu(); }}
                            className={`${styles.authBtn} ${styles.mobileAuthBtn}`}
                            style={{ background: 'rgba(52,199,89,0.2)', border: '1px solid rgba(52,199,89,0.5)', marginTop: '0.5rem' }}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { signIn(); closeMenu(); }}
                            className={`${styles.authBtn} ${styles.mobileAuthBtn}`}
                            style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.6)', marginTop: '0.5rem', fontWeight: '700' }}
                        >
                            🎓 Student Registration
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

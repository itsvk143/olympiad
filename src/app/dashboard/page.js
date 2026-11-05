'use client';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '../../components/Navbar';
import ProfileCompletion from '../../components/ProfileCompletion';
import { normalizeToCanonicalExam, getCanonicalExamDisplay, canonicalToExamSlug } from '@/lib/authorization';
// Fix #3 — lazy-load AdminUserList so it's NOT bundled for regular students
const AdminUserList = dynamic(() => import('../../components/AdminUserList'), {
    ssr: false,
    loading: () => <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading admin panel...</div>
});
const AdminReportedQuestions = dynamic(() => import('../../components/AdminReportedQuestions'), {
    ssr: false,
    loading: () => <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading reported questions...</div>
});
const AdminPaymentManager = dynamic(() => import('../../components/AdminPaymentManager'), {
    ssr: false,
    loading: () => <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading payment management...</div>
});
const AdminTestAudit = dynamic(() => import('../../components/AdminTestAudit'), {
    ssr: false,
    loading: () => <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading test audit...</div>
});
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, Cell
} from 'recharts';
import styles from './dashboard.module.css';
import AnalyticsDashboard from '../../components/analytics/AnalyticsDashboard';

// Fix #7 — moved outside component so it's not rebuilt on every render
const STATE_CITIES = {
    'Andhra Pradesh': ['Visakhapatnam','Vijayawada','Guntur','Nellore','Kurnool','Tirupati','Rajahmundry','Kakinada','Kadapa','Anantapur','Other'],
    'Arunachal Pradesh': ['Itanagar','Naharlagun','Pasighat','Other'],
    'Assam': ['Guwahati','Silchar','Dibrugarh','Jorhat','Nagaon','Tinsukia','Tezpur','Other'],
    'Bihar': ['Patna','Gaya','Bhagalpur','Muzaffarpur','Purnia','Darbhanga','Bihar Sharif','Arrah','Begusarai','Chhapra','Other'],
    'Chhattisgarh': ['Raipur','Bhilai','Bilaspur','Durg','Korba','Rajnandgaon','Jagdalpur','Other'],
    'Goa': ['Panaji','Margao','Vasco da Gama','Mapusa','Ponda','Other'],
    'Gujarat': ['Ahmedabad','Surat','Vadodara','Rajkot','Bhavnagar','Jamnagar','Gandhinagar','Junagadh','Anand','Nadiad','Other'],
    'Haryana': ['Gurugram','Faridabad','Panipat','Ambala','Yamunanagar','Rohtak','Hisar','Karnal','Sonipat','Panchkula','Other'],
    'Himachal Pradesh': ['Shimla','Manali','Dharamshala','Kangra','Mandi','Solan','Other'],
    'Jharkhand': ['Ranchi','Jamshedpur','Dhanbad','Bokaro','Deoghar','Hazaribagh','Other'],
    'Karnataka': ['Bengaluru','Mysuru','Hubballi','Mangaluru','Belagavi','Davanagere','Ballari','Vijayapura','Shivamogga','Tumakuru','Other'],
    'Kerala': ['Thiruvananthapuram','Kochi','Kozhikode','Thrissur','Kollam','Kannur','Alappuzha','Palakkad','Malappuram','Other'],
    'Madhya Pradesh': ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Dewas','Satna','Ratlam','Rewa','Other'],
    'Maharashtra': ['Mumbai','Pune','Nagpur','Nashik','Aurangabad','Solapur','Amravati','Kalyan','Mira-Bhayandar','Navi Mumbai','Thane','Kolhapur','Other'],
    'Manipur': ['Imphal','Thoubal','Churachandpur','Other'],
    'Meghalaya': ['Shillong','Tura','Jowai','Other'],
    'Mizoram': ['Aizawl','Lunglei','Champhai','Other'],
    'Nagaland': ['Kohima','Dimapur','Mokokchung','Other'],
    'Odisha': ['Bhubaneswar','Cuttack','Rourkela','Berhampur','Sambalpur','Puri','Balasore','Bhadrak','Other'],
    'Punjab': ['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Pathankot','Hoshiarpur','Other'],
    'Rajasthan': ['Jaipur','Jodhpur','Kota','Bikaner','Ajmer','Udaipur','Bharatpur','Alwar','Sikar','Sri Ganganagar','Other'],
    'Sikkim': ['Gangtok','Namchi','Jorethang','Other'],
    'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem','Tirunelveli','Vellore','Erode','Thoothukudi','Tiruppur','Other'],
    'Telangana': ['Hyderabad','Warangal','Nizamabad','Khammam','Karimnagar','Ramagundam','Nalgonda','Other'],
    'Tripura': ['Agartala','Udaipur','Dharmanagar','Other'],
    'Uttar Pradesh': ['Lucknow','Kanpur','Agra','Varanasi','Meerut','Prayagraj','Ghaziabad','Noida','Bareilly','Aligarh','Moradabad','Gorakhpur','Mathura','Firozabad','Other'],
    'Uttarakhand': ['Dehradun','Haridwar','Roorkee','Rishikesh','Haldwani','Nainital','Mussoorie','Other'],
    'West Bengal': ['Kolkata','Asansol','Siliguri','Durgapur','Bardhaman','Malda','Baharampur','Kharagpur','Other'],
    'Andaman and Nicobar Islands': ['Port Blair','Other'],
    'Chandigarh': ['Chandigarh','Other'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman','Diu','Silvassa','Other'],
    'Delhi': ['New Delhi','Dwarka','Rohini','Janakpuri','Laxmi Nagar','Karol Bagh','Preet Vihar','Saket','Other'],
    'Jammu and Kashmir': ['Srinagar','Jammu','Anantnag','Baramulla','Sopore','Other'],
    'Ladakh': ['Leh','Kargil','Other'],
    'Lakshadweep': ['Kavaratti','Other'],
    'Puducherry': ['Puducherry','Karaikal','Mahé','Yanam','Other'],
};
const STATES = Object.keys(STATE_CITIES).sort();

export default function Dashboard() {
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const { data: session, status } = useSession();
    const router = useRouter();
    const [testResults, setTestResults] = useState([]);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showProfileCompletion, setShowProfileCompletion] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editLoading, setEditLoading] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [adminView, setAdminView] = useState('users'); // 'users' (default for admin), 'student', 'payments', 'reports', or 'test-audit'
    const [unresolvedReportsCount, setUnresolvedReportsCount] = useState(0);
    const [adminPreviewExam, setAdminPreviewExam] = useState('NEET');
    const [stats, setStats] = useState({
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeTaken: 0,
        rank: 'N/A',
        liveRank: 'N/A'
    });
    const [graphData, setGraphData] = useState({
        history: [],
        subjects: []
    });
    const [pollStats, setPollStats] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    // Fetch unresolved reported questions count for admin badge
    useEffect(() => {
        if (session?.user?.isAdmin) {
            fetch('/api/admin/reports/badge')
                .then(res => res.json())
                .then(data => {
                    if (typeof data?.count === 'number') {
                        setUnresolvedReportsCount(data.count);
                    }
                })
                .catch(err => console.error('Error fetching reported questions badge:', err));
        }
    }, [session?.user?.isAdmin]);

    // Check URL search params on mount for admin view toggle (?view=users, ?view=student, ?view=payments, ?view=reports, or ?view=test-audit)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const v = params.get('view');
            if (v === 'users') setAdminView('users');
            else if (v === 'student') setAdminView('student');
            else if (v === 'payments') setAdminView('payments');
            else if (v === 'reports') setAdminView('reports');
            else if (v === 'test-audit' || v === 'audit') setAdminView('test-audit');
        }
    }, []);

    const [profileSkipped, setProfileSkipped] = useState(false);

    // Load skip state from localStorage on mount
    useEffect(() => {
        const skipped = localStorage.getItem('profileSkipped') === 'true';
        setProfileSkipped(skipped);
    }, []);

    const fetchPollStats = async () => {
        try {
            const res = await fetch('/api/poll/stats');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.stats) {
                    setPollStats(data.stats);
                }
            }
        } catch (error) {
            console.error('Error fetching poll stats:', error);
        }
    };

    useEffect(() => {
        if (session?.user) {
            // Fix #1 — run fetches in parallel, not sequentially
            Promise.all([fetchUserProfile(), fetchTestResults(), fetchPollStats()]);
        }
    }, [session]);

    const fetchUserProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.ok) {
                const data = await res.json();
                setUserProfile(data);
                if (data.profileCompleted) {
                    setEditForm({
                        name: data.name || '',
                        mobileNo: data.mobileNo || '',
                        schoolName: data.schoolName || '',
                        coachingName: data.coachingName || '',
                        city: data.city || '',
                        state: data.state || '',
                        examPreparingFor: data.examPreparingFor || '',
                        studentClass: data.studentClass || '',
                    });
                }
                const skipped = localStorage.getItem('profileSkipped') === 'true';
                if (!data.profileCompleted && !skipped && !session?.user?.isAdmin) {
                    setShowProfileCompletion(true);
                }
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    // Fix #1+2+4 — parallel fetches, lean mode to skip questions[], no duplicate rank call
    const fetchTestResults = async () => {
        setLoading(true);
        try {
            // lean=1 excludes the heavy questions[] snapshot (~90% payload reduction)
            const res = await fetch('/api/test-results?lean=1');
            const data = await res.json();
            setTestResults(data);

            if (data.length > 0) {
                const totalTests = data.length;
                const averageScore = Math.round(data.reduce((sum, r) => sum + r.score, 0) / totalTests);

                // Find best result among active attempts (comparing by percentage if max marks differ)
                const maxMarksSet = new Set(data.map(r => r.totalMarks || (r.score > 360 ? 720 : 360)));
                const uniformMaxMarks = maxMarksSet.size <= 1;

                let bestResult = null;
                let bestPct = -Infinity;
                let bestRaw = -Infinity;

                data.forEach(r => {
                    const s = r.score || 0;
                    const m = r.totalMarks || (s > 360 ? 720 : 360);
                    const p = m > 0 ? (s / m) * 100 : 0;
                    if (uniformMaxMarks) {
                        if (!bestResult || s > bestRaw) {
                            bestRaw = s;
                            bestResult = r;
                        }
                    } else {
                        if (!bestResult || p > bestPct || (p === bestPct && s > bestRaw)) {
                            bestPct = p;
                            bestRaw = s;
                            bestResult = r;
                        }
                    }
                });

                const bestScore = bestResult ? `${bestResult.score} / ${bestResult.totalMarks || (bestResult.score > 360 ? 720 : 360)}` : 'N/A';
                const bestTestId = bestResult?.testId;
                const bestTestExam = bestResult?.examType;
                const totalTimeTaken = data.reduce((sum, r) => sum + (r.timeTaken || 0), 0);

                // Latest result ordered by attemptedAt descending
                const latestResult = [...data].sort((a, b) => new Date(b.attemptedAt || 0) - new Date(a.attemptedAt || 0))[0];
                const latestScore = latestResult ? `${latestResult.score} / ${latestResult.totalMarks || (latestResult.score > 360 ? 720 : 360)}` : 'N/A';
                const latestTestTitle = latestResult?.testTitle || latestResult?.title || latestResult?.testId || '';

                // Best Rank (All Tests)
                let bestRankAttempt = null;
                data.forEach(r => {
                    const rawRank = r.rank ?? r.globalRank ?? r.liveRank;
                    let numRank = null;
                    if (typeof rawRank === 'number' && rawRank > 0) numRank = rawRank;
                    else if (typeof rawRank === 'string' && /^\d+$/.test(rawRank.trim())) {
                        const parsed = parseInt(rawRank.trim(), 10);
                        if (parsed > 0) numRank = parsed;
                    }

                    if (numRank !== null) {
                        const time = new Date(r.attemptedAt || 0).getTime();
                        const cohort = Number(r.totalStudents || r.totalGlobalStudents || 0);
                        if (!bestRankAttempt || numRank < bestRankAttempt.rank || (numRank === bestRankAttempt.rank && time > bestRankAttempt.timestamp)) {
                            bestRankAttempt = {
                                rank: numRank,
                                cohort,
                                testTitle: r.testTitle || r.title || r.testId,
                                timestamp: time
                            };
                        }
                    }
                });

                setStats({
                    totalTests,
                    averageScore,
                    bestScore,
                    latestScore,
                    latestTestTitle,
                    totalTimeTaken,
                    bestTestId,
                    bestTestExam,
                    bestRank: bestRankAttempt ? bestRankAttempt.rank : 'N/A',
                    bestRankCohort: bestRankAttempt ? bestRankAttempt.cohort : 0,
                    bestRankTestTitle: bestRankAttempt ? bestRankAttempt.testTitle : '',
                    rank: (bestResult?.rank && bestResult?.rank !== 'N/A') ? `${bestResult.rank} / ${bestResult.totalStudents}` : 'N/A'
                });

                const historyGraph = [...data].reverse().map(r => ({
                    name: r.testId,
                    score: r.score,
                    date: new Date(r.attemptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                }));

                const subjectAgg = {};
                data.forEach(r => {
                    if (r.subjectStats) {
                        const defaultPos = r.marksPerQuestion || 1;
                        Object.entries(r.subjectStats).forEach(([subj, stat]) => {
                            if (!subjectAgg[subj]) subjectAgg[subj] = { subject: subj, score: 0, total: 0 };
                            const statScore = stat.score || 0;
                            const statTotal = stat.maxMarks || (stat.total ? stat.total * defaultPos : 0);
                            subjectAgg[subj].score += statScore;
                            subjectAgg[subj].total += statTotal;
                        });
                    }
                });

                const subjectGraph = Object.values(subjectAgg).map(s => {
                    const rawPct = s.total > 0 ? (s.score / s.total) * 100 : 0;
                    return {
                        subject: s.subject,
                        score: s.score,
                        percentage: Math.max(0, Math.min(100, Math.round(rawPct)))
                    };
                });

                setGraphData({ history: historyGraph, subjects: subjectGraph });
            }
        } catch (error) {
            console.error('Error fetching results:', error);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    if (!session) return null;

    const userCanonicalExam = normalizeToCanonicalExam(userProfile?.exam || userProfile?.examPreparingFor);
    const activeExam = 'OLYMPIAD';
    const assignedExamDisplay = 'Olympiad';
    const assignedExamPath = 'olympiad';

    const availableCities = editForm.state ? (STATE_CITIES[editForm.state] || []) : [];

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        if (name === 'state') {
            setEditForm(prev => ({ ...prev, state: value, city: '' }));
        } else {
            setEditForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editForm.name || !editForm.mobileNo || !editForm.state || !editForm.city || !editForm.studentClass) {
            alert('Name, mobile, class, state and city are required.');
            return;
        }
        setEditLoading(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editForm,
                    exam: activeExam || editForm.exam,
                    examPreparingFor: assignedExamDisplay || editForm.examPreparingFor
                }),
            });
            const data = await res.json();
            if (res.ok) {
                sessionStorage.removeItem('userProfile');
                setShowEditProfile(false);
                fetchUserProfile();
            } else {
                alert(data.error || 'Failed to update profile.');
            }
        } catch {
            alert('An error occurred.');
        } finally {
            setEditLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'white',
        fontSize: '0.9rem', boxSizing: 'border-box',
    };
    const labelStyle = { display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '5px', fontWeight: '600' };

    return (
        <div className={styles.container}>
            <Navbar />

            {/* Admin View Mode Switcher */}
            {session?.user?.isAdmin && (
                <div style={{
                    maxWidth: '1200px',
                    margin: '16px auto 0 auto',
                    padding: '0 20px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                        border: '1px solid rgba(139, 92, 246, 0.35)',
                        borderRadius: '14px',
                        marginBottom: '16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: '#c4b5fd', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🛡️ Admin View:
                            </span>
                            <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.35)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap' }}>
                                <button
                                    onClick={() => setAdminView('users')}
                                    style={{
                                        padding: '7px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: adminView === 'users' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: adminView === 'users' ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none'
                                    }}
                                >
                                    👥 User Directory
                                </button>
                                <button
                                    onClick={() => setAdminView('student')}
                                    style={{
                                        padding: '7px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: adminView === 'student' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: adminView === 'student' ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none'
                                    }}
                                >
                                    📊 Student Dashboard
                                </button>
                                <button
                                    onClick={() => setAdminView('payments')}
                                    style={{
                                        padding: '7px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: adminView === 'payments' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: adminView === 'payments' ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <span>💳 Payment Management</span>
                                </button>
                                <button
                                    onClick={() => setAdminView('reports')}
                                    style={{
                                        padding: '7px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: adminView === 'reports' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: adminView === 'reports' ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <span>🚩 Reported Questions</span>
                                    {unresolvedReportsCount > 0 && (
                                        <span style={{
                                            background: '#ef4444',
                                            color: '#fff',
                                            fontSize: '0.72rem',
                                            fontWeight: '800',
                                            padding: '2px 7px',
                                            borderRadius: '10px',
                                            lineHeight: 1.2,
                                            boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
                                        }}>
                                            {unresolvedReportsCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setAdminView('test-audit')}
                                    style={{
                                        padding: '7px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: adminView === 'test-audit' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'transparent',
                                        color: 'white',
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: adminView === 'test-audit' ? '0 2px 8px rgba(124, 58, 237, 0.4)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <span>📋 Test Audit</span>
                                </button>
                            </div>
                        </div>

                        {adminView === 'student' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>Preview Exam:</span>
                                {[
                                    { key: 'NEET', label: 'NEET' },
                                    { key: 'JEE_MAIN', label: 'JEE MAIN' },
                                    { key: 'BITSAT', label: 'BITSAT' }
                                ].map(examItem => {
                                    const isSelected = activeExam === examItem.key;
                                    return (
                                        <button
                                            key={examItem.key}
                                            onClick={() => setAdminPreviewExam(examItem.key)}
                                            style={{
                                                padding: '5px 12px',
                                                borderRadius: '8px',
                                                border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.12)',
                                                background: isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)',
                                                color: isSelected ? '#38bdf8' : '#94a3b8',
                                                fontSize: '0.8rem',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {examItem.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {session?.user?.isAdmin && adminView === 'users' ? (
                <div className={styles.fullWrapper}>
                    <AdminUserList />
                </div>
            ) : session?.user?.isAdmin && adminView === 'payments' ? (
                <div className={styles.fullWrapper} style={{ padding: '16px 0' }}>
                    <AdminPaymentManager />
                </div>
            ) : session?.user?.isAdmin && adminView === 'reports' ? (
                <div className={styles.fullWrapper} style={{ padding: '16px 0' }}>
                    <AdminReportedQuestions onBadgeUpdate={(cnt) => setUnresolvedReportsCount(cnt)} />
                </div>
            ) : session?.user?.isAdmin && adminView === 'test-audit' ? (
                <div className={styles.fullWrapper} style={{ padding: '16px 0' }}>
                    <AdminTestAudit />
                </div>
            ) : (
                <>
                    {/* Profile Completion Modal */}
            {showProfileCompletion && !session?.user?.isAdmin && (
                <ProfileCompletion
                    user={session.user}
                    onComplete={() => {
                        setShowProfileCompletion(false);
                        setProfileSkipped(true);
                        localStorage.setItem('profileSkipped', 'true'); // Persist skip state
                        fetchUserProfile(); // Refresh profile data
                    }}
                />
            )}

            <div className={styles.wrapper}>
                {/* Unified Profile & Welcome Card */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px'
                }}>
                    {/* Welcome Header Part */}
                    <div style={{ marginBottom: (userProfile?.profileCompleted || session?.user?.isAdmin) ? '24px' : '0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 className={styles.welcomeText} style={{ margin: 0, fontSize: '1.8rem' }}>
                                Welcome back, <span style={{ color: '#818cf8' }}>{session.user.name?.split(' ')[0]}</span>! 👋
                            </h1>
                            <p className={styles.email} style={{ margin: '4px 0 0 0', opacity: 0.7 }}>{session.user.email}</p>
                        </div>
                        {session.user.studentCode && (
                            <div style={{
                                background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)',
                                padding: '8px 16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Student Code</span>
                                <span style={{ fontSize: '1.1rem', color: '#c4b5fd', fontWeight: '800', fontFamily: 'monospace' }}>{session.user.studentCode}</span>
                            </div>
                        )}
                    </div>

                    {/* Authorization Status Banner */}
                    {(() => {
                        if (session?.user?.isAdmin || userProfile?.role === 'admin') {
                            const bannerConfig = {
                                icon: '🛡️',
                                title: 'ADMINISTRATOR ACCESS: FULL EXEMPTION',
                                textColor: '#38bdf8',
                                bg: 'rgba(56, 189, 248, 0.12)',
                                border: '1px solid rgba(56, 189, 248, 0.4)',
                                message: `Administrator access active. All tests across all exams are fully accessible without expiry or payment restrictions. (Previewing student dashboard as ${assignedExamDisplay})`
                            };
                            return (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '12px 18px',
                                    background: bannerConfig.bg,
                                    border: bannerConfig.border,
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.25rem' }}>{bannerConfig.icon}</span>
                                        <div>
                                            <span style={{ display: 'block', color: bannerConfig.textColor, fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px' }}>
                                                {bannerConfig.title}
                                            </span>
                                            <span style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', marginTop: '2px' }}>
                                                {bannerConfig.message}
                                            </span>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        background: 'rgba(0,0,0,0.25)',
                                        color: bannerConfig.textColor,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Admin Exempt
                                    </span>
                                </div>
                            );
                        }

                        if (!userProfile) return null;
                        
                        const isPaidStudent = userProfile.paymentStatus === 'CONFIRMED' || userProfile.paymentStatus === 'PAID';
                        const isPaymentFailed = userProfile.paymentStatus === 'FAILED' || userProfile.paymentStatus === 'REJECTED';

                        let bannerConfig = {
                            icon: '✅',
                            title: 'PAYMENT SUCCESSFUL • TEST ACCESS ACTIVE',
                            textColor: '#34d399',
                            bg: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            message: `Your payment has been verified. Authorization valid until: ${userProfile.authorizationExpiryDate ? new Date(userProfile.authorizationExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '732-Day Full Term'} — ${userProfile.daysRemaining != null && userProfile.daysRemaining !== Infinity ? `${userProfile.daysRemaining} days remaining` : 'Full Access'}`,
                            badgeText: '732-Day License',
                            badgeBg: 'rgba(16, 185, 129, 0.2)',
                            ctaText: 'START TEST',
                            ctaLink: `/test-series/${assignedExamPath}`,
                            isClickable: true
                        };

                        if (userProfile.accountStatus === 'SUSPENDED') {
                            bannerConfig = {
                                icon: '🚫',
                                title: 'ACCOUNT SUSPENDED',
                                textColor: '#ef4444',
                                bg: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                message: 'Your account has been suspended. Please contact the administrator.',
                                badgeText: 'Suspended',
                                badgeBg: 'rgba(239, 68, 68, 0.25)',
                                ctaText: null,
                                ctaLink: null,
                                isClickable: false
                            };
                        } else if (isPaymentFailed) {
                            bannerConfig = {
                                icon: '❌',
                                title: 'PAYMENT FAILED',
                                textColor: '#f87171',
                                bg: 'rgba(239, 68, 68, 0.14)',
                                border: '1px solid rgba(239, 68, 68, 0.45)',
                                message: 'Your previous payment could not be completed. Click to complete your payment with Razorpay.',
                                badgeText: 'TRY AGAIN',
                                badgeBg: 'rgba(239, 68, 68, 0.3)',
                                ctaText: 'TRY AGAIN',
                                ctaLink: '/payment',
                                isClickable: true
                            };
                        } else if (!isPaidStudent) {
                            bannerConfig = {
                                icon: '💳',
                                title: 'PAYMENT REQUIRED',
                                textColor: '#fbbf24',
                                bg: 'rgba(245, 158, 11, 0.14)',
                                border: '1px solid rgba(245, 158, 11, 0.45)',
                                message: 'Complete your Razorpay payment to activate your test access immediately. Instant activation upon verified payment.',
                                badgeText: 'UNVERIFIED',
                                badgeBg: 'rgba(245, 158, 11, 0.25)',
                                ctaText: 'PAY NOW',
                                ctaLink: '/payment',
                                isClickable: true,
                                isPendingCard: true
                            };
                        } else if (userProfile.daysRemaining != null && userProfile.daysRemaining <= 0) {
                            bannerConfig = {
                                icon: '⚠️',
                                title: 'TEST ACCESS EXPIRED',
                                textColor: '#f87171',
                                bg: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                message: `Your 732-day test authorization has expired${userProfile.authorizationExpiryDate ? ` on ${new Date(userProfile.authorizationExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}. Please renew to regain test access.`,
                                badgeText: 'EXPIRED',
                                badgeBg: 'rgba(239, 68, 68, 0.25)',
                                ctaText: 'RENEW ACCESS',
                                ctaLink: '/payment',
                                isClickable: true
                            };
                        } else if (userProfile.daysRemaining != null && userProfile.daysRemaining <= 30) {
                            bannerConfig = {
                                icon: '⚠️',
                                title: 'AUTHORIZATION EXPIRING SOON',
                                textColor: '#fb923c',
                                bg: 'rgba(249, 115, 22, 0.12)',
                                border: '1px solid rgba(249, 115, 22, 0.35)',
                                message: `Authorization valid until: ${new Date(userProfile.authorizationExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} — ${userProfile.daysRemaining} days remaining.`,
                                badgeText: 'EXPIRING SOON',
                                badgeBg: 'rgba(249, 115, 22, 0.25)',
                                ctaText: 'EXTEND ACCESS',
                                ctaLink: '/payment',
                                isClickable: true
                            };
                        }

                        return (
                            <div
                                onClick={() => {
                                    if (bannerConfig.isClickable && bannerConfig.ctaLink) {
                                        router.push(bannerConfig.ctaLink);
                                    }
                                }}
                                style={{
                                    marginTop: '16px',
                                    padding: '14px 20px',
                                    background: bannerConfig.bg,
                                    border: bannerConfig.border,
                                    borderRadius: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '14px',
                                    cursor: bannerConfig.isClickable ? 'pointer' : 'default',
                                    transition: 'all 0.25s ease',
                                    boxShadow: bannerConfig.isPendingCard
                                        ? '0 0 16px rgba(245, 158, 11, 0.18)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.15)'
                                }}
                                onMouseEnter={(e) => {
                                    if (bannerConfig.isClickable) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = bannerConfig.isPendingCard
                                            ? '0 6px 24px rgba(245, 158, 11, 0.35)'
                                            : '0 6px 20px rgba(16, 185, 129, 0.25)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (bannerConfig.isClickable) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = bannerConfig.isPendingCard
                                            ? '0 0 16px rgba(245, 158, 11, 0.18)'
                                            : '0 4px 12px rgba(0, 0, 0, 0.15)';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
                                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{bannerConfig.icon}</span>
                                    <div>
                                        <div style={{
                                            color: bannerConfig.textColor,
                                            fontWeight: '800',
                                            fontSize: '0.88rem',
                                            letterSpacing: '0.5px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span>{bannerConfig.title}</span>
                                            {bannerConfig.isPendingCard && (
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    color: '#fbbf24',
                                                    background: 'rgba(245, 158, 11, 0.2)',
                                                    border: '1px solid rgba(245, 158, 11, 0.4)',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px'
                                                }}>
                                                    Click Anywhere to Pay
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: '#cbd5e1', fontSize: '0.84rem', marginTop: '3px', lineHeight: '1.4' }}>
                                            {bannerConfig.message}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        background: bannerConfig.badgeBg || 'rgba(0,0,0,0.25)',
                                        color: bannerConfig.textColor,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {bannerConfig.badgeText}
                                    </span>

                                    {bannerConfig.ctaText && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (bannerConfig.ctaLink) router.push(bannerConfig.ctaLink);
                                            }}
                                            style={{
                                                background: bannerConfig.isPendingCard
                                                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                                                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '6px 14px',
                                                fontWeight: '800',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            {bannerConfig.ctaText} &rarr;
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                            {/* Profile Details Part */}
                    {(userProfile?.profileCompleted || session?.user?.isAdmin) && (
                        <>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' }}></div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📋</span>
                                    <h2 style={{ margin: 0, color: '#a78bfa', fontSize: '18px', fontWeight: '600' }}>
                                        {session?.user?.isAdmin ? 'Student Profile (Admin Preview)' : 'Student Profile'}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowEditProfile(true)}
                                    style={{
                                        background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)',
                                        color: '#c4b5fd', padding: '7px 16px', borderRadius: '10px', cursor: 'pointer',
                                        fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    ✏️ Edit Profile
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                <div>
                                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Full Name</span>
                                    <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{userProfile?.name || session.user.name}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Mobile Number</span>
                                    <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{userProfile?.mobileNo || session.user.email}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EXAM</span>
                                    <span style={{
                                        color: '#c4b5fd',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        background: 'rgba(124, 58, 237, 0.25)',
                                        border: '1px solid rgba(124, 58, 237, 0.4)',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        display: 'inline-block',
                                        letterSpacing: '0.5px'
                                    }}>
                                        {assignedExamDisplay}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Class / Role</span>
                                    <span style={{ color: session?.user?.isAdmin ? '#38bdf8' : 'white', fontSize: '15px', fontWeight: '600' }}>
                                        {session?.user?.isAdmin ? 'Platform Administrator' : (userProfile?.studentClass || 'N/A')}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>School</span>
                                    <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{userProfile?.schoolName || (session?.user?.isAdmin ? 'PollTestSeries Admin Portal' : 'N/A')}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Coaching</span>
                                    <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{userProfile?.coachingName || (session?.user?.isAdmin ? 'N/A' : 'Self-study')}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Location</span>
                                    <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{userProfile?.city ? `${userProfile.city}, ${userProfile.state}` : 'India'}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Edit Profile Modal */}
                {showEditProfile && (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                    }}>
                        <div style={{
                            background: '#1e293b', borderRadius: '20px', padding: '32px',
                            width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
                            border: '1px solid rgba(255,255,255,0.1)', position: 'relative',
                        }}>
                            <button onClick={() => setShowEditProfile(false)} style={{
                                position: 'absolute', top: '16px', right: '16px',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>✕</button>
                            <h2 style={{ marginTop: 0, marginBottom: '24px', color: '#a78bfa' }}>✏️ Edit Profile</h2>
                            <form onSubmit={handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={labelStyle}>Full Name *</label>
                                    <input name="name" value={editForm.name} onChange={handleEditChange} style={inputStyle} placeholder="Full name" required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Mobile Number *</label>
                                    <input name="mobileNo" value={editForm.mobileNo} onChange={handleEditChange} style={inputStyle} placeholder="10-digit number" maxLength={10} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Assigned Exam</label>
                                    <div style={{
                                        ...inputStyle,
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'not-allowed'
                                    }}>
                                        <span style={{ fontWeight: '600', color: '#c4b5fd' }}>
                                            {userProfile?.examPreparingFor || userProfile?.exam || 'Not Set'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                                            🔒 Locked
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                                        Contact administrator to change your enrolled exam.
                                    </span>
                                </div>
                                <div>
                                    <label style={labelStyle}>Class *</label>
                                    <select name="studentClass" value={editForm.studentClass} onChange={handleEditChange} style={inputStyle} required>
                                        <option value="">Select your class</option>
                                        <option value="Class 11">Class 11</option>
                                        <option value="Class 12">Class 12</option>
                                        <option value="12 Passed">12 Passed</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>School Name (optional)</label>
                                    <input name="schoolName" value={editForm.schoolName} onChange={handleEditChange} style={inputStyle} placeholder="School name" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Coaching Name (optional)</label>
                                    <input name="coachingName" value={editForm.coachingName} onChange={handleEditChange} style={inputStyle} placeholder="Coaching institute" />
                                </div>
                                <div>
                                    <label style={labelStyle}>State *</label>
                                    <select name="state" value={editForm.state} onChange={handleEditChange} style={inputStyle} required>
                                        <option value="">Select state</option>
                                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>City *</label>
                                    <select name="city" value={editForm.city} onChange={handleEditChange}
                                        style={{ ...inputStyle, opacity: editForm.state ? 1 : 0.5 }}
                                        disabled={!editForm.state} required>
                                        <option value="">{editForm.state ? 'Select city' : 'Select state first'}</option>
                                        {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                                    <button type="submit" disabled={editLoading} style={{
                                        width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                                        border: 'none', borderRadius: '12px', color: 'white', fontSize: '1rem',
                                        fontWeight: '700', cursor: editLoading ? 'not-allowed' : 'pointer', opacity: editLoading ? 0.6 : 1,
                                    }}>
                                        {editLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Stats Overview — Exactly Four Summary Cards */}
                <div className={styles.statsGrid}>
                    <div
                        className={styles.statCard}
                        onClick={() => document.getElementById('test-history')?.scrollIntoView({ behavior: 'smooth' })}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className={styles.statIcon}>📝</div>
                        <div className={styles.statValue}>{stats.totalTests}</div>
                        <div className={styles.statLabel}>Tests Taken</div>
                    </div>
                    <div
                        className={styles.statCard}
                        onClick={() => {
                            if (stats.bestTestId) {
                                let examPath = 'olympiad';
                                router.push(`/test-series/${examPath}/${stats.bestTestId}`);
                            }
                        }}
                        style={{ cursor: stats.bestTestId ? 'pointer' : 'default' }}
                    >
                        <div className={styles.statIcon}>⭐</div>
                        <div className={styles.statValue}>{stats.bestScore}</div>
                        <div className={styles.statLabel}>Best Score</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🎯</div>
                        <div className={styles.statValue}>{stats.latestScore}</div>
                        <div className={styles.statLabel}>Latest Score</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>🏆</div>
                        <div className={styles.statValue} style={{ color: '#fbbf24' }}>
                            {stats.bestRank !== 'N/A' ? `#${stats.bestRank}` : 'N/A'}
                        </div>
                        <div className={styles.statLabel}>
                            {stats.bestRank !== 'N/A' ? 'Best Rank (All Tests)' : 'Best Rank (All Tests)'}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                    <h2>Quick Actions</h2>
                    <div className={styles.actionGrid}>
                        <a href={`/test-series/${assignedExamPath}?tab=live`} className={styles.actionCard}>
                            <span className={styles.actionIcon}>📡</span>
                            <span className={styles.actionTitle}>Live Tests</span>
                        </a>
                        <a href={`/test-series/${assignedExamPath}?tab=mock`} className={styles.actionCard}>
                            <span className={styles.actionIcon}>📝</span>
                            <span className={styles.actionTitle}>Full Tests</span>
                        </a>
                        <a href={`/test-series/${assignedExamPath}?tab=part`} className={styles.actionCard}>
                            <span className={styles.actionIcon}>📚</span>
                            <span className={styles.actionTitle}>Part Tests</span>
                        </a>
                        <a href={`/test-series/${assignedExamPath}?tab=subject`} className={styles.actionCard}>
                            <span className={styles.actionIcon}>📖</span>
                            <span className={styles.actionTitle}>Subjectwise Tests</span>
                        </a>
                        <a href={`/test-series/${assignedExamPath}?tab=chapter`} className={styles.actionCard}>
                            <span className={styles.actionIcon}>📑</span>
                            <span className={styles.actionTitle}>Chapterwise Tests</span>
                        </a>
                        <a href={`/test-series/${assignedExamPath}?tab=subtopic`} className={styles.actionCard}>
                            <span className={styles.actionIcon}>🔍</span>
                            <span className={styles.actionTitle}>Subtopic Tests</span>
                        </a>

                        {session.user.isAdmin && (
                            <a href="/admin" className={styles.actionCard + ' ' + styles.adminCard}>
                                <span className={styles.actionIcon}>⚙️</span>
                                <span className={styles.actionTitle}>Admin Panel</span>
                            </a>
                        )}
                    </div>
                </div>

                {/* POLL COMPLETED */}
                {pollStats && Object.keys(pollStats).length > 0 && (
                    <div className={styles.pollSection}>
                        <h2 className={styles.pollSectionTitle}>POLL COMPLETED</h2>
                        <div className={styles.pollList}>
                            {Object.entries(pollStats).map(([subject, count]) => (
                                <div key={subject} className={styles.pollRow}>
                                    <span className={styles.pollSubject}>{subject}</span>
                                    <span className={styles.pollCount}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Test History */}
                <div id="test-history" className={styles.historySection}>
                    <div className={styles.historyHeader}>
                        <div className={styles.historyHeaderTitle}>
                            <h2>Recent Test History</h2>
                            {testResults.length > 0 && (
                                <span className={styles.historyTotalBadge}>
                                    {isHistoryExpanded ? `${testResults.length} Tests` : `Showing ${Math.min(4, testResults.length)} of ${testResults.length} Tests`}
                                </span>
                            )}
                        </div>
                        {testResults.length > 4 && (
                            <button
                                type="button"
                                onClick={() => setIsHistoryExpanded(prev => !prev)}
                                className={styles.historyToggleBtn}
                                aria-expanded={isHistoryExpanded}
                            >
                                {isHistoryExpanded ? (
                                    <>
                                        <span>Collapse</span>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="18 15 12 9 6 15"></polyline>
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        <span>Expand All ({testResults.length})</span>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {testResults.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyIcon}>📚</p>
                            <p className={styles.emptyText}>No tests taken yet!</p>
                            <p className={styles.emptySubtext}>Start your journey by taking a practice test</p>
                            <a href={`/test-series/${assignedExamPath}`} className={styles.startBtn}>Browse Tests</a>
                        </div>
                    ) : (
                        <>
                            <div className={styles.historyList}>
                                {(isHistoryExpanded ? testResults : testResults.slice(0, 4)).map((result, index) => {
                                    const percentage = Math.round((result.score / result.totalMarks) * 100);
                                    const date = new Date(result.attemptedAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    });

                                    return (
                                        <div
                                            key={result._id || index}
                                            className={styles.historyItem}
                                            onClick={() => {
                                                let examPath = 'olympiad';
                                                router.push(`/test-series/${examPath}/${result.testId}`);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className={styles.historyLeft}>
                                                <div className={styles.historyExam}>{result.examType?.toUpperCase()}</div>
                                                <div className={styles.historyTest}>{result.testId}</div>
                                                <div className={styles.historyDate}>{date}</div>
                                            </div>
                                            <div className={styles.historyStats}>
                                                <div className={styles.historyStat}>
                                                    <span className={styles.historyStatLabel}>Global Rank</span>
                                                    <span className={styles.historyStatValue}>
                                                        #{result.globalRank || result.rank} <span style={{ fontSize: '0.8em', opacity: 0.7 }}>/ {result.totalGlobalStudents || result.totalStudents}</span>
                                                    </span>
                                                </div>
                                                {result.totalLiveStudents > 0 && (
                                                    <div className={styles.historyStat}>
                                                        <span className={styles.historyStatLabel} style={{ color: '#fbbf24' }}>Cumulative Rank</span>
                                                        <span className={styles.historyStatValue} style={{ color: '#fbbf24' }}>
                                                            #{result.liveRank} <span style={{ fontSize: '0.8em', opacity: 0.7 }}>/ {result.totalLiveStudents}</span>
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={styles.historyStat}>
                                                    <span className={styles.historyStatLabel}>Score</span>
                                                    <span className={styles.historyStatValue}>{result.score}/{result.totalMarks}</span>
                                                </div>
                                                <div className={styles.historyStat}>
                                                    <span className={styles.historyStatLabel} style={{ color: '#22c55e' }}>Correct</span>
                                                    <span className={styles.historyStatValue} style={{ color: '#22c55e' }}>{result.correctAnswers}</span>
                                                </div>
                                                <div className={styles.historyStat}>
                                                    <span className={styles.historyStatLabel} style={{ color: '#ef4444' }}>Wrong</span>
                                                    <span className={styles.historyStatValue} style={{ color: '#ef4444' }}>
                                                        {Object.keys(result.answers || {}).length - result.correctAnswers}
                                                    </span>
                                                </div>
                                                <div className={styles.historyStat}>
                                                    <span className={styles.historyStatLabel} style={{ color: '#94a3b8' }}>Unattempted</span>
                                                    <span className={styles.historyStatValue} style={{ color: '#94a3b8' }}>
                                                        {result.totalQuestions - Object.keys(result.answers || {}).length}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.historyRight}>
                                                <div className={`${styles.performanceBadge} ${percentage >= 75 ? styles.excellent : percentage >= 50 ? styles.good : styles.needsWork}`}>
                                                    {percentage >= 75 ? '🏆 Excellent' : percentage >= 50 ? '👍 Good' : '💪 Keep Practicing'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {testResults.length > 4 && (
                                <div className={styles.historyExpandWrapper}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isHistoryExpanded) {
                                                setIsHistoryExpanded(false);
                                                const el = document.getElementById('test-history');
                                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            } else {
                                                setIsHistoryExpanded(true);
                                            }
                                        }}
                                        className={styles.historyBigExpandBtn}
                                    >
                                        {isHistoryExpanded ? (
                                            <>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                </svg>
                                                <span>Show Less (Only Last 4 Tests)</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Expand Remaining Tests</span>
                                                <span className={styles.historyRemainingCount}>+{testResults.length - 4} more</span>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* PollTestSeries Comprehensive Student Performance Analytics */}
                {testResults.length > 0 && (
                    <AnalyticsDashboard
                        testResults={testResults}
                        userEmail={session?.user?.email}
                        studentExam={activeExam}
                        isAdmin={false}
                    />
                )}
                </div>
                </>
            )}
        </div>
    );
}

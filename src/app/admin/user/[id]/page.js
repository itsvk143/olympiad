'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Navbar from '@/components/Navbar';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import styles from '@/app/dashboard/dashboard.module.css';
import {
    normalizeToCanonicalExam,
    getCanonicalExamDisplay,
    CANONICAL_EXAMS
} from '@/lib/authorization';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default function AdminUserDetail({ params }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const unwrappedParams = use(params);
    const { id: userId } = unwrappedParams;

    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [stats, setStats] = useState({
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        totalTimeTaken: 0,
        rank: 'N/A'
    });
    const [graphData, setGraphData] = useState({
        history: [],
        subjects: []
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Controlled [Change Exam] state
    const [showChangeExamModal, setShowChangeExamModal] = useState(false);
    const [selectedNewExam, setSelectedNewExam] = useState('');
    const [changeExamReason, setChangeExamReason] = useState('');
    const [changingExam, setChangingExam] = useState(false);

    // Test Integrity Modal state
    const [integrityModalResult, setIntegrityModalResult] = useState(null);

    // Three-dot action menu state
    const [activeActionMenuId, setActiveActionMenuId] = useState(null);

    // Reset Test Attempt state
    const [resetModalAttempt, setResetModalAttempt] = useState(null);
    const [resetReason, setResetReason] = useState('Accidentally submitted before completing');
    const [isResetting, setIsResetting] = useState(false);

    // Delete Test Attempt state
    const [deleteModalAttempt, setDeleteModalAttempt] = useState(null);
    const [deleteReason, setDeleteReason] = useState('Unwanted test attempt removed by admin');
    const [isDeleting, setIsDeleting] = useState(false);

    // View Attempt Details Modal state
    const [detailsModalAttempt, setDetailsModalAttempt] = useState(null);

    // Delete Student Account state
    const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
    const [deletingStudent, setDeletingStudent] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState(null);

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4500);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('[data-action-menu]')) {
                setActiveActionMenuId(null);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status === 'authenticated' && !session?.user?.isAdmin) {
            router.push('/dashboard');
        }
    }, [status, session, router]);

    useEffect(() => {
        if (session?.user?.isAdmin && userId) {
            fetchUserData();
        }
    }, [session, userId]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            // Fetch User Profile specifically using Admin route
            const profileRes = await fetch(`/api/admin/users/${userId}`);
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setUserProfile(profileData);
            } else {
                // If profile not found in DB (e.g., mock users like 'Astro Vikash' without real DB records)
                console.warn(`Profile ${userId} not found.`);
                setUserProfile({ name: 'Unknown Data Record', email: 'N/A', role: 'student' });
            }

            // Fetch User Test Results specifically using Admin route
            const resultsRes = await fetch(`/api/admin/users/${userId}/test-results`);
            if (resultsRes.ok) {
                const data = await resultsRes.json();
                setTestResults(data);

                // Calculate stats strictly using active attempts (exclude RESET and DELETED)
                const activeData = data.filter(r => !r.isReset && !r.isDeleted && r.status !== 'RESET' && r.status !== 'DELETED');

                if (activeData.length > 0) {
                    const totalTests = activeData.length;
                    const averageScore = Math.round(activeData.reduce((sum, r) => sum + r.score, 0) / totalTests);

                    // Find best result among active attempts (comparing by percentage if max marks differ)
                    const maxMarksSet = new Set(activeData.map(r => r.totalMarks || (r.score > 360 ? 720 : 360)));
                    const uniformMaxMarks = maxMarksSet.size <= 1;

                    let bestResult = null;
                    let bestPct = -Infinity;
                    let bestRaw = -Infinity;

                    activeData.forEach(r => {
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
                    const totalTimeTaken = activeData.reduce((sum, r) => sum + (r.timeTaken || 0), 0);

                    // Latest result ordered by attemptedAt descending
                    const latestResult = [...activeData].sort((a, b) => new Date(b.attemptedAt || 0) - new Date(a.attemptedAt || 0))[0];
                    const latestScore = latestResult ? `${latestResult.score} / ${latestResult.totalMarks || (latestResult.score > 360 ? 720 : 360)}` : 'N/A';
                    const latestTestTitle = latestResult?.testTitle || latestResult?.title || latestResult?.testId || '';

                    // Best Rank (All Tests) across student's broader history
                    let bestRankAttempt = null;
                    activeData.forEach(r => {
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

                    // Prepare Graph Data for active attempts
                    const historyGraph = [...activeData].reverse().map(r => ({
                        name: r.testId,
                        score: r.score,
                        date: new Date(r.attemptedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    }));

                    const subjectAgg = {};
                    activeData.forEach(r => {
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

                    setGraphData({
                        history: historyGraph,
                        subjects: subjectGraph
                    });
                } else {
                    // Reset stats when no active attempts remain
                    setStats({
                        totalTests: 0,
                        averageScore: 0,
                        bestScore: 0,
                        totalTimeTaken: 0,
                        rank: 'N/A'
                    });
                    setGraphData({
                        history: [],
                        subjects: []
                    });
                }
            } else {
                 console.warn(`Test results for ${userId} not found.`);
            }
        } catch (error) {
            console.error('Error fetching admin user detail data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetAttempt = async () => {
        if (!resetModalAttempt) return;
        setIsResetting(true);
        try {
            const attemptId = resetModalAttempt._id;
            const res = await fetch(`/api/admin/students/${userId}/attempts/${attemptId}/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: resetReason })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('success', data.message || 'Test attempt reset successfully. The student can attempt the test again.');
                setResetModalAttempt(null);
                setResetReason('Accidentally submitted before completing');
                if (detailsModalAttempt?._id === attemptId) {
                    setDetailsModalAttempt(null);
                }
                setTestResults(prev => prev.filter(r => r._id !== attemptId));
                await fetchUserData();
            } else {
                showToast('error', data.error || 'Failed to reset test attempt.');
            }
        } catch (err) {
            console.error('Error resetting attempt:', err);
            showToast('error', 'An error occurred while resetting the test attempt.');
        } finally {
            setIsResetting(false);
        }
    };

    const handleDeleteAttempt = async () => {
        if (!deleteModalAttempt) return;
        setIsDeleting(true);
        try {
            const attemptId = deleteModalAttempt._id;
            const res = await fetch(`/api/admin/students/${userId}/attempts/${attemptId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: deleteReason })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('success', data.message || 'Test attempt deleted successfully.');
                setDeleteModalAttempt(null);
                setDeleteReason('Unwanted test attempt removed by admin');
                if (detailsModalAttempt?._id === attemptId) {
                    setDetailsModalAttempt(null);
                }
                setTestResults(prev => prev.filter(r => r._id !== attemptId));
                await fetchUserData();
            } else {
                showToast('error', data.error || 'Failed to delete test attempt.');
            }
        } catch (err) {
            console.error('Error deleting attempt:', err);
            showToast('error', 'An error occurred while deleting the test attempt.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteStudent = async () => {
        setDeletingStudent(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('success', data.message || 'Student and all associated data completely deleted from MongoDB database.');
                setShowDeleteStudentModal(false);
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1200);
            } else {
                showToast('error', data.error || 'Failed to delete student.');
            }
        } catch (err) {
            console.error('Error deleting student:', err);
            showToast('error', 'An error occurred while deleting the student.');
        } finally {
            setDeletingStudent(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading user details...</p>
            </div>
        );
    }

    if (!session?.user?.isAdmin || !userProfile) {
        return <div className={styles.error}>User not found or access denied.</div>;
    }

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hrs}h ${mins}m`;
    };

    const handleToggleApproval = async () => {
        if (!userProfile) return;
        
        setActionLoading(true);
        const newStatus = !userProfile.isApproved;
        
        try {
            const res = await fetch(`/api/admin/users/${userId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isApproved: newStatus })
            });
            
            if (res.ok) {
                // Update local state without full refetch
                setUserProfile(prev => ({ ...prev, isApproved: newStatus }));
            } else {
                alert('Failed to update user approval status');
            }
        } catch (error) {
            console.error('Error toggling approval:', error);
            alert('An error occurred while updating the status.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (res.ok) {
                setUserProfile(prev => ({ ...prev, ...editForm }));
                setEditMode(false);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save changes');
            }
        } catch (e) {
            alert('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangeExam = async (e) => {
        e.preventDefault();
        if (!selectedNewExam) {
            alert('Please select an exam (NEET, JEE MAIN, or BITSAT).');
            return;
        }
        setChangingExam(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}/change-exam`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newExam: selectedNewExam,
                    reason: changeExamReason
                })
            });
            const data = await res.json();
            if (res.ok) {
                setUserProfile(prev => ({
                    ...prev,
                    exam: data.exam,
                    examPreparingFor: data.examPreparingFor
                }));
                setShowChangeExamModal(false);
                setSelectedNewExam('');
                setChangeExamReason('');
                alert(`Student's exam successfully changed to ${data.examPreparingFor}.`);
            } else {
                alert(data.error || 'Failed to change student exam.');
            }
        } catch (err) {
            alert('An error occurred while changing exam.');
        } finally {
            setChangingExam(false);
        }
    };

    return (
        <div className={styles.container}>
            <Navbar />

            <div className={styles.wrapper}>
                
                <button 
                    onClick={() => router.push('/dashboard')}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem'
                    }}
                >
                    &larr; Back to Directory
                </button>

                <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px'
                }}>
                    <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: userProfile.image ? `url(${userProfile.image}) center/cover` : '#818cf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: 'white'
                        }}>
                            {!userProfile.image && (userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?')}
                        </div>
                        <div>
                            <h1 className={styles.welcomeText} style={{ margin: 0, fontSize: '1.8rem', color: 'white' }}>
                                {userProfile.name || 'Unknown User'}
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '800',
                                        marginLeft: '10px',
                                        background: userProfile.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                        color: userProfile.role === 'admin' ? '#a78bfa' : '#34d399',
                                        border: `1px solid ${userProfile.role === 'admin' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        verticalAlign: 'middle'
                                    }}
                                    title={userProfile.role === 'admin' ? 'Admin' : 'Student'}
                                >
                                    {userProfile.role === 'admin' ? 'A' : 'S'}
                                </span>
                            </h1>
                            <p className={styles.email} style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.7)' }}>{userProfile.email}</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                                Joined: {(() => {
                                    const d = new Date(userProfile.createdAt || userProfile.profileCompletedAt);
                                    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                })()}
                            </p>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                            <button 
                                onClick={handleToggleApproval}
                                disabled={actionLoading || userProfile.role === 'admin'}
                                style={{
                                    background: userProfile.isApproved ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                    color: userProfile.isApproved ? '#ef4444' : '#10b981',
                                    border: `1px solid ${userProfile.isApproved ? '#ef4444' : '#10b981'}`,
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: (actionLoading || userProfile.role === 'admin') ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    opacity: (actionLoading || userProfile.role === 'admin') ? 0.5 : 1,
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {actionLoading ? 'Updating...' : (userProfile.isApproved ? '🚫 Revoke Test Access' : '✅ Approve for Tests')}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedNewExam(normalizeToCanonicalExam(userProfile.exam || userProfile.examPreparingFor) || 'NEET');
                                    setShowChangeExamModal(true);
                                }}
                                disabled={actionLoading || userProfile.role === 'admin'}
                                style={{
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(245, 158, 11, 0.4)',
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: (actionLoading || userProfile.role === 'admin') ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                🔄 Change Exam
                            </button>
                            <button
                                onClick={() => {
                                    setEditForm({
                                        name: userProfile.name || '',
                                        mobileNo: userProfile.mobileNo || '',
                                        studentClass: userProfile.studentClass || '',
                                        schoolName: userProfile.schoolName || '',
                                        coachingName: userProfile.coachingName || '',
                                        city: userProfile.city || '',
                                        state: userProfile.state || '',
                                        paymentStatus: userProfile.paymentStatus || 'PENDING',
                                    });
                                    setEditMode(e => !e);
                                }}
                                style={{
                                    background: editMode ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.2)',
                                    color: editMode ? '#94a3b8' : '#818cf8',
                                    border: `1px solid ${editMode ? '#475569' : '#6366f1'}`,
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                }}
                            >
                                {editMode ? '✕ Cancel Edit' : '✏️ Edit Profile'}
                            </button>
                            {userProfile.role !== 'admin' && (
                                <button
                                    onClick={() => setShowDeleteStudentModal(true)}
                                    disabled={actionLoading || deletingStudent}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#f87171',
                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        cursor: (actionLoading || deletingStudent) ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        opacity: (actionLoading || deletingStudent) ? 0.6 : 1
                                    }}
                                    title="Permanently delete this student and all their data from MongoDB"
                                >
                                    🗑️ Delete Student
                                </button>
                            )}
                            {userProfile.role === 'admin' && <small style={{ display: 'block', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>Admins bypass approval</small>}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '20px 0' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '1.5rem' }}>📋</span>
                        <h2 style={{ margin: 0, color: '#a78bfa', fontSize: '18px', fontWeight: '600' }}>
                            Profile Data
                        </h2>
                    </div>

                    {editMode ? (
                        <div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                {[
                                    { label: 'Full Name', key: 'name', type: 'text' },
                                    { label: 'Mobile Number', key: 'mobileNo', type: 'text' },
                                    { label: 'School', key: 'schoolName', type: 'text' },
                                    { label: 'Coaching', key: 'coachingName', type: 'text' },
                                    { label: 'City', key: 'city', type: 'text' },
                                    { label: 'State', key: 'state', type: 'text' },
                                ].map(({ label, key }) => (
                                    <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{label}</span>
                                        <input
                                            value={editForm[key] || ''}
                                            onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                            style={{
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                borderRadius: '8px',
                                                padding: '8px 12px',
                                                color: 'white',
                                                fontSize: '14px',
                                                outline: 'none',
                                            }}
                                        />
                                    </label>
                                ))}
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Class</span>
                                    <select
                                        value={editForm.studentClass || ''}
                                        onChange={e => setEditForm(f => ({ ...f, studentClass: e.target.value }))}
                                        style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '14px' }}
                                    >
                                        <option value="">Select</option>
                                        <option>Class 9</option>
                                        <option>Class 10</option>
                                        <option>Class 11</option>
                                        <option>Class 12</option>
                                        <option>12 Passed</option>
                                    </select>
                                </label>
                                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Payment Status</span>
                                    <select
                                        value={(editForm.paymentStatus === 'CONFIRMED' || editForm.paymentStatus === 'PAID') ? 'CONFIRMED' : (editForm.paymentStatus === 'REJECTED' || editForm.paymentStatus === 'NOT PAID') ? 'REJECTED' : 'PENDING'}
                                        onChange={e => setEditForm(f => ({ ...f, paymentStatus: e.target.value }))}
                                        style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '14px' }}
                                    >
                                        <option value="CONFIRMED">PAID</option>
                                        <option value="PENDING">PENDING</option>
                                        <option value="REJECTED">NOT PAID</option>
                                    </select>
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Enrolled Exam</span>
                                    <div style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '8px 12px',
                                        color: '#c4b5fd',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span>{getCanonicalExamDisplay(normalizeToCanonicalExam(userProfile.exam || userProfile.examPreparingFor)) || 'Not Set'}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>🔒 Use [Change Exam]</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '10px 28px',
                                    fontWeight: '700',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    opacity: saving ? 0.7 : 1,
                                }}
                            >
                                {saving ? 'Saving...' : '💾 Save Changes'}
                            </button>
                        </div>
                    ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div>
                            <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Mobile Number</span>
                            <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{userProfile.mobileNo || 'N/A'}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Class</span>
                            <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600', background: 'rgba(251,191,36,0.1)', padding: '4px 10px', borderRadius: '6px', display: 'inline-block' }}>
                                {userProfile.studentClass || 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Exam</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                    {getCanonicalExamDisplay(normalizeToCanonicalExam(userProfile.exam || userProfile.examPreparingFor)) || 'NOT SET'}
                                </span>
                                <button
                                    onClick={() => {
                                        setSelectedNewExam(normalizeToCanonicalExam(userProfile.exam || userProfile.examPreparingFor) || 'NEET');
                                        setShowChangeExamModal(true);
                                    }}
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.15)',
                                        color: '#fbbf24',
                                        border: '1px solid rgba(245, 158, 11, 0.35)',
                                        borderRadius: '6px',
                                        padding: '4px 10px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🔄 Change
                                </button>
                            </div>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>School</span>
                            <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{userProfile.schoolName || 'N/A'}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Coaching</span>
                            <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{userProfile.coachingName || 'N/A'}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px' }}>Location</span>
                            <span style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>
                                {userProfile.city && userProfile.state ? `${userProfile.city}, ${userProfile.state}` : 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Status</span>
                            {userProfile.role === 'admin' ? (
                                <span style={{ color: '#818cf8', fontWeight: 'bold', fontSize: '14px' }}>Exempt (Admin)</span>
                            ) : (() => {
                                const isPaid = userProfile.paymentStatus === 'CONFIRMED' || userProfile.paymentStatus === 'PAID';
                                const isRejected = userProfile.paymentStatus === 'REJECTED' || userProfile.paymentStatus === 'NOT PAID';
                                return (
                                    <span style={{
                                        color: isPaid ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        background: isPaid ? 'rgba(16, 185, 129, 0.15)' : isRejected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                        border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.3)' : isRejected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        display: 'inline-block'
                                    }}>
                                        {isPaid ? 'PAID' : isRejected ? 'NOT PAID' : 'PENDING'}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                    )}
                </div>

                {/* Stats Overview — Exactly Four Summary Cards */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>📝</div>
                        <div className={styles.statValue}>{stats.totalTests}</div>
                        <div className={styles.statLabel}>Tests Taken</div>
                    </div>
                    <div className={styles.statCard}>
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

                {/* Test History */}
                <div className={styles.historySection} style={{ marginTop: '30px' }}>
                    <h2>Test History</h2>
                    {testResults.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyIcon}>📚</p>
                            <p className={styles.emptyText}>No tests taken yet by this user.</p>
                        </div>
                    ) : (
                        <div className={styles.historyList}>
                            {testResults.map((result, index) => {
                                const attemptStatus = result.status || (result.isReset ? 'RESET' : result.isDeleted ? 'DELETED' : (result.isAutoSubmitted ? 'AUTO_SUBMITTED' : 'SUBMITTED'));
                                const isReset = Boolean(result.isReset || attemptStatus === 'RESET');
                                const isDeleted = Boolean(result.isDeleted || attemptStatus === 'DELETED');
                                const isInactive = isReset || isDeleted;

                                const percentage = Math.round((result.score / (result.totalMarks || 720)) * 100);
                                const submissionDate = new Date(result.attemptedAt);
                                const formattedDate = isNaN(submissionDate.getTime()) ? 'N/A' : submissionDate.toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                });
                                const formattedTime = isNaN(submissionDate.getTime()) ? '' : submissionDate.toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                });

                                const answeredCount = Object.keys(result.answers || {}).length;
                                const totalQ = result.totalQuestions || (result.totalMarks === 720 ? 180 : (result.totalMarks === 300 ? 75 : 130));
                                const unattemptedCount = Math.max(0, totalQ - answeredCount);
                                const correctCount = result.correctAnswers ?? 0;
                                const wrongCount = Math.max(0, answeredCount - correctCount);
                                const durationFormatted = formatTime(result.timeTaken || 0);

                                const statusConfig = {
                                    RESET: { label: 'Reset', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.4)', icon: '🔄' },
                                    DELETED: { label: 'Deleted', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.4)', icon: '🗑️' },
                                    AUTO_SUBMITTED: { label: 'Auto-Submitted', bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)', icon: '⚡' },
                                    IN_PROGRESS: { label: 'In Progress', bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.4)', icon: '⏳' },
                                    SUBMITTED: { label: 'Submitted', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)', icon: '✅' },
                                }[attemptStatus] || { label: 'Submitted', bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.4)', icon: '✅' };

                                const itemKey = result._id || `attempt-${index}`;

                                return (
                                    <div
                                        key={itemKey}
                                        className={styles.historyItem}
                                        style={{
                                            opacity: isDeleted ? 0.6 : (isReset ? 0.8 : 1),
                                            borderLeft: isDeleted ? '4px solid #ef4444' : (isReset ? '4px solid #a855f7' : undefined),
                                            background: isDeleted ? 'rgba(30, 41, 59, 0.4)' : undefined,
                                            position: 'relative'
                                        }}
                                    >
                                        <div className={styles.historyLeft} style={{ minWidth: '190px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                                <span className={styles.historyExam}>{result.examType?.toUpperCase()}</span>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: '700',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    background: statusConfig.bg,
                                                    color: statusConfig.color,
                                                    border: `1px solid ${statusConfig.border}`,
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <span>{statusConfig.icon}</span>
                                                    <span>{statusConfig.label}</span>
                                                </span>
                                            </div>
                                            <div className={styles.historyTest} style={{ fontSize: '1.05rem', fontWeight: '700' }}>{result.testId}</div>
                                            <div className={styles.historyDate} style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                                📅 {formattedDate} {formattedTime ? `• ⏰ ${formattedTime}` : ''}
                                            </div>
                                            {isReset && (
                                                <div style={{ fontSize: '0.74rem', color: '#c084fc', marginTop: '4px' }}>
                                                    🔄 Reset{result.resetBy ? ` by ${result.resetBy}` : ''}
                                                </div>
                                            )}
                                            {isDeleted && (
                                                <div style={{ fontSize: '0.74rem', color: '#f87171', marginTop: '4px' }}>
                                                    🗑️ Deleted{result.deletedBy ? ` by ${result.deletedBy}` : ''}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.historyStats} style={{ flexWrap: 'wrap', gap: '14px' }}>
                                            <div className={styles.historyStat}>
                                                <span className={styles.historyStatLabel}>Rank</span>
                                                <span className={styles.historyStatValue}>
                                                    {isInactive ? (
                                                        <span style={{ fontSize: '0.85em', opacity: 0.6 }}>Excluded</span>
                                                    ) : (
                                                        <>#{result.rank} <span style={{ fontSize: '0.8em', opacity: 0.7 }}>/ {result.totalStudents}</span></>
                                                    )}
                                                </span>
                                            </div>
                                            <div className={styles.historyStat}>
                                                <span className={styles.historyStatLabel}>Score</span>
                                                <span className={styles.historyStatValue} style={{ textDecoration: isInactive ? 'line-through' : 'none' }}>
                                                    {result.score}/{result.totalMarks}
                                                </span>
                                            </div>
                                            <div className={styles.historyStat}>
                                                <span className={styles.historyStatLabel} style={{ color: '#22c55e' }}>Correct</span>
                                                <span className={styles.historyStatValue} style={{ color: '#22c55e' }}>{correctCount}</span>
                                            </div>
                                            <div className={styles.historyStat}>
                                                <span className={styles.historyStatLabel} style={{ color: '#ef4444' }}>Wrong</span>
                                                <span className={styles.historyStatValue} style={{ color: '#ef4444' }}>{wrongCount}</span>
                                            </div>
                                            <div className={styles.historyStat}>
                                                <span className={styles.historyStatLabel} style={{ color: '#94a3b8' }}>Unattempted</span>
                                                <span className={styles.historyStatValue} style={{ color: '#cbd5e1' }}>{unattemptedCount}</span>
                                            </div>
                                            <div className={styles.historyStat}>
                                                <span className={styles.historyStatLabel}>Duration</span>
                                                <span className={styles.historyStatValue}>{durationFormatted}</span>
                                            </div>
                                            <div
                                                className={styles.historyStat}
                                                onClick={() => setIntegrityModalResult(result)}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to view Test Integrity & Warnings log"
                                            >
                                                <span className={styles.historyStatLabel} style={{ color: (result.violationCount || 0) > 0 ? '#f59e0b' : '#94a3b8' }}>
                                                    Tab Warnings
                                                </span>
                                                <span className={styles.historyStatValue} style={{ color: (result.violationCount || 0) > 0 ? '#f59e0b' : '#cbd5e1' }}>
                                                    🛡️ {result.violationCount || 0}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.historyRight} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className={`${styles.performanceBadge} ${percentage >= 75 ? styles.excellent : percentage >= 50 ? styles.good : styles.needsWork}`}>
                                                    {percentage}%
                                                </div>

                                                {/* Three-dot Action Menu */}
                                                <div style={{ position: 'relative' }} data-action-menu>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveActionMenuId(activeActionMenuId === itemKey ? null : itemKey);
                                                        }}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.08)',
                                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                                            borderRadius: '8px',
                                                            color: 'white',
                                                            padding: '6px 12px',
                                                            fontSize: '0.85rem',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            whiteSpace: 'nowrap'
                                                        }}
                                                        title="Admin Actions"
                                                    >
                                                        <span>⋮ Actions</span>
                                                    </button>

                                                    {activeActionMenuId === itemKey && (
                                                        <div
                                                            style={{
                                                                position: 'absolute',
                                                                right: 0,
                                                                top: '100%',
                                                                marginTop: '6px',
                                                                background: '#0f172a',
                                                                border: '1px solid #334155',
                                                                borderRadius: '10px',
                                                                padding: '6px',
                                                                minWidth: '200px',
                                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
                                                                zIndex: 100,
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '2px'
                                                            }}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setActiveActionMenuId(null);
                                                                    setDetailsModalAttempt(result);
                                                                }}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: '#e2e8f0',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'left',
                                                                    fontSize: '0.85rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px'
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <span>👁️</span>
                                                                <span>View Attempt Details</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setActiveActionMenuId(null);
                                                                    if (!isReset && !isDeleted) {
                                                                        setResetModalAttempt(result);
                                                                        setResetReason('Accidentally submitted before completing');
                                                                    }
                                                                }}
                                                                disabled={isReset || isDeleted}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: (isReset || isDeleted) ? '#64748b' : '#c084fc',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '6px',
                                                                    cursor: (isReset || isDeleted) ? 'not-allowed' : 'pointer',
                                                                    textAlign: 'left',
                                                                    fontSize: '0.85rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    opacity: (isReset || isDeleted) ? 0.6 : 1
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isReset && !isDeleted) e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)';
                                                                }}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <span>🔄</span>
                                                                <span>{isReset ? 'Already Reset' : 'Reset Test Attempt'}</span>
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    setActiveActionMenuId(null);
                                                                    if (!isDeleted) {
                                                                        setDeleteModalAttempt(result);
                                                                        setDeleteReason('Unwanted test attempt removed by admin');
                                                                    }
                                                                }}
                                                                disabled={isDeleted}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: isDeleted ? '#64748b' : '#f87171',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '6px',
                                                                    cursor: isDeleted ? 'not-allowed' : 'pointer',
                                                                    textAlign: 'left',
                                                                    fontSize: '0.85rem',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px',
                                                                    opacity: isDeleted ? 0.6 : 1
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isDeleted) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                                                                }}
                                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                            >
                                                                <span>🗑️</span>
                                                                <span>{isDeleted ? 'Already Deleted' : 'Delete Test Attempt'}</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quick action buttons on card */}
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => setDetailsModalAttempt(result)}
                                                    style={{
                                                        fontSize: '0.74rem',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        color: '#cbd5e1',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="View detailed breakdown"
                                                >
                                                    👁️ Details
                                                </button>
                                                {!isReset && !isDeleted && (
                                                    <button
                                                        onClick={() => {
                                                            setResetModalAttempt(result);
                                                            setResetReason('Accidentally submitted before completing');
                                                        }}
                                                        style={{
                                                            fontSize: '0.74rem',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid rgba(168, 85, 247, 0.4)',
                                                            background: 'rgba(168, 85, 247, 0.12)',
                                                            color: '#c084fc',
                                                            cursor: 'pointer',
                                                            fontWeight: 600
                                                        }}
                                                        title="Reset this attempt so student can retake"
                                                    >
                                                        🔄 Reset
                                                    </button>
                                                )}
                                                {!isDeleted && (
                                                    <button
                                                        onClick={() => {
                                                            setDeleteModalAttempt(result);
                                                            setDeleteReason('Unwanted test attempt removed by admin');
                                                        }}
                                                        style={{
                                                            fontSize: '0.74rem',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid rgba(239, 68, 68, 0.4)',
                                                            background: 'rgba(239, 68, 68, 0.12)',
                                                            color: '#f87171',
                                                            cursor: 'pointer',
                                                            fontWeight: 600
                                                        }}
                                                        title="Delete this attempt from student's history"
                                                    >
                                                        🗑️ Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* PollTestSeries Comprehensive Analytics & Student Audit */}
                {testResults.length > 0 && (
                    <AnalyticsDashboard
                        testResults={testResults}
                        userId={userId}
                        userEmail={userProfile?.email}
                        studentExam={userProfile?.exam || userProfile?.examPreparingFor}
                        isAdmin={true}
                    />
                )}
            </div>

            {/* Controlled Admin [Change Exam] Modal */}
            {showChangeExamModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                }}>
                    <div style={{
                        background: '#1e293b', borderRadius: '18px', padding: '30px',
                        width: '100%', maxWidth: '520px', border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', position: 'relative'
                    }}>
                        <button
                            onClick={() => setShowChangeExamModal(false)}
                            style={{
                                position: 'absolute', top: '16px', right: '16px',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >✕</button>

                        <h2 style={{ marginTop: 0, marginBottom: '8px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.3rem' }}>
                            <span>⚠️</span> Change Student Exam
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
                            Student: <strong style={{ color: 'white' }}>{userProfile.name}</strong> ({userProfile.email})
                        </p>

                        <div style={{
                            background: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: '10px',
                            padding: '14px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ color: '#fbbf24', fontWeight: '700', fontSize: '0.9rem', marginBottom: '4px' }}>
                                Confirmation Warning
                            </div>
                            <div style={{ color: '#fef3c7', fontSize: '0.85rem', lineHeight: '1.5', fontStyle: 'italic' }}>
                                &ldquo;Changing the student&apos;s exam will change which test series this student can access.&rdquo;
                            </div>
                        </div>

                        <form onSubmit={handleChangeExam}>
                            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px' }}>
                                SELECT NEW EXAM (ONE EXAM ONLY):
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                                {[
                                    { id: 'NEET', label: 'NEET' },
                                    { id: 'JEE_MAIN', label: 'JEE MAIN' },
                                    { id: 'BITSAT', label: 'BITSAT' }
                                ].map(opt => {
                                    const isChecked = selectedNewExam === opt.id;
                                    return (
                                        <label
                                            key={opt.id}
                                            style={{
                                                border: `2px solid ${isChecked ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`,
                                                background: isChecked ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.03)',
                                                borderRadius: '10px',
                                                padding: '12px 10px',
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="newExamRadio"
                                                value={opt.id}
                                                checked={isChecked}
                                                onChange={() => setSelectedNewExam(opt.id)}
                                                style={{ accentColor: '#f59e0b', width: '16px', height: '16px' }}
                                            />
                                            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: isChecked ? '#fbbf24' : 'white' }}>
                                                {opt.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>

                            <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '6px' }}>
                                Reason for Change (Recorded in Admin Audit Log):
                            </label>
                            <input
                                type="text"
                                value={changeExamReason}
                                onChange={e => setChangeExamReason(e.target.value)}
                                placeholder="e.g. Student selected wrong exam during registration"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontSize: '0.85rem',
                                    marginBottom: '16px',
                                    boxSizing: 'border-box'
                                }}
                            />

                            <div style={{
                                fontSize: '0.75rem',
                                color: '#94a3b8',
                                lineHeight: '1.4',
                                marginBottom: '20px',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                paddingTop: '12px'
                            }}>
                                🔒 <strong>Preservation:</strong> Changing the exam will <strong>NOT</strong> delete test results, test attempts, or student history. Access boundary will immediately apply to the newly selected exam.
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowChangeExamModal(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        color: '#e2e8f0',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={changingExam || !selectedNewExam}
                                    style={{
                                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        color: '#0f172a',
                                        border: 'none',
                                        padding: '10px 22px',
                                        borderRadius: '8px',
                                        cursor: (changingExam || !selectedNewExam) ? 'not-allowed' : 'pointer',
                                        fontWeight: '800',
                                        fontSize: '0.85rem',
                                        opacity: (changingExam || !selectedNewExam) ? 0.6 : 1
                                    }}
                                >
                                    {changingExam ? 'Updating...' : 'Confirm & Change Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Test Integrity Modal (Section 19) */}
            {integrityModalResult && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                }}>
                    <div style={{
                        background: '#1e293b', borderRadius: '18px', padding: '28px',
                        width: '100%', maxWidth: '560px', border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)', position: 'relative',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}>
                        <button
                            onClick={() => setIntegrityModalResult(null)}
                            style={{
                                position: 'absolute', top: '16px', right: '16px',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >✕</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.3rem' }}>
                                Test Integrity
                            </h2>
                        </div>

                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '16px' }}>
                            Test: <strong style={{ color: 'white' }}>{integrityModalResult.testId}</strong> • Exam: <strong style={{ color: '#818cf8' }}>{integrityModalResult.examType?.toUpperCase()}</strong>
                        </p>

                        <div style={{
                            background: (integrityModalResult.violationCount || 0) > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            border: (integrityModalResult.violationCount || 0) > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                            borderRadius: '12px',
                            padding: '14px 18px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: '0.95rem' }}>
                                Tab/Window Warnings:
                            </span>
                            <span style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                color: (integrityModalResult.violationCount || 0) > 0 ? '#fbbf24' : '#34d399'
                            }}>
                                {integrityModalResult.violationCount || 0}
                            </span>
                        </div>

                        <h3 style={{ fontSize: '1rem', color: '#e2e8f0', marginBottom: '12px', fontWeight: 700 }}>
                            Incident Log Details
                        </h3>

                        {integrityModalResult.violations && integrityModalResult.violations.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {integrityModalResult.violations.map((v, idx) => {
                                    const start = v.startedAt ? new Date(v.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'N/A';
                                    const ret = v.returnedAt ? new Date(v.returnedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'Unrecorded';
                                    const dur = v.durationSeconds != null ? `${v.durationSeconds} seconds` : 'Ongoing';
                                    return (
                                        <div
                                            key={v.id || v._id || idx}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                borderRadius: '10px',
                                                padding: '14px 16px'
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '8px'
                                            }}>
                                                <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.95rem' }}>
                                                    Violation #{idx + 1}
                                                </span>
                                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                                                    {v.violationType || 'TEST_WINDOW_LEFT'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                                                <div><strong>Started:</strong> {start}</div>
                                                <div><strong>Returned:</strong> {ret}</div>
                                                <div><strong>Duration:</strong> <span style={{ color: '#38bdf8', fontWeight: 600 }}>{dur}</span></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                padding: '24px',
                                textAlign: 'center',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '10px',
                                color: '#94a3b8',
                                fontSize: '0.9rem'
                            }}>
                                {(integrityModalResult.violationCount || 0) > 0
                                    ? `${integrityModalResult.violationCount} warning(s) were recorded for this attempt.`
                                    : 'No tab switches or window departures detected for this attempt.'}
                            </div>
                        )}

                        <div style={{ marginTop: '24px', textAlign: 'right' }}>
                            <button
                                onClick={() => setIntegrityModalResult(null)}
                                style={{
                                    padding: '10px 20px',
                                    background: '#334155',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Test Attempt Confirmation Modal */}
            {resetModalAttempt && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1300,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                }}>
                    <div style={{
                        background: '#1e293b', borderRadius: '18px', padding: '28px',
                        width: '100%', maxWidth: '520px', border: '1px solid rgba(168, 85, 247, 0.4)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)', position: 'relative'
                    }}>
                        <button
                            onClick={() => !isResetting && setResetModalAttempt(null)}
                            disabled={isResetting}
                            style={{
                                position: 'absolute', top: '16px', right: '16px',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                width: '32px', height: '32px', borderRadius: '50%', cursor: isResetting ? 'not-allowed' : 'pointer',
                                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >✕</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.6rem' }}>🔄</span>
                            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.35rem', fontWeight: 700 }}>
                                Reset Test Attempt
                            </h2>
                        </div>

                        <div style={{
                            background: 'rgba(168, 85, 247, 0.12)',
                            border: '1px solid rgba(168, 85, 247, 0.35)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginBottom: '16px'
                        }}>
                            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '4px' }}>
                                <strong>Test:</strong> {resetModalAttempt.testId} ({resetModalAttempt.examType?.toUpperCase()})
                            </div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                                <strong>Score to Invalidate:</strong> {resetModalAttempt.score} / {resetModalAttempt.totalMarks}
                            </div>
                        </div>

                        <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '18px' }}>
                            This action will reset the selected test attempt for this student. The previous submission and score will no longer count as the active attempt. The student will be allowed to take the test again according to their existing test access permissions. Continue?
                        </p>

                        <div style={{ marginBottom: '22px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>
                                Reason for Reset (recorded in audit trail):
                            </label>
                            <input
                                type="text"
                                value={resetReason}
                                onChange={(e) => setResetReason(e.target.value)}
                                placeholder="e.g. Accidentally submitted before completing"
                                disabled={isResetting}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setResetModalAttempt(null)}
                                disabled={isResetting}
                                style={{
                                    padding: '10px 18px',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '8px',
                                    color: '#e2e8f0',
                                    fontWeight: 600,
                                    cursor: isResetting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleResetAttempt}
                                disabled={isResetting}
                                style={{
                                    padding: '10px 22px',
                                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 700,
                                    cursor: isResetting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: isResetting ? 0.6 : 1
                                }}
                            >
                                {isResetting ? 'Resetting Attempt...' : 'Confirm Reset'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Test Attempt Confirmation Modal */}
            {deleteModalAttempt && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1300,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                }}>
                    <div style={{
                        background: '#1e293b', borderRadius: '18px', padding: '28px',
                        width: '100%', maxWidth: '520px', border: '1px solid rgba(239, 68, 68, 0.4)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)', position: 'relative'
                    }}>
                        <button
                            onClick={() => !isDeleting && setDeleteModalAttempt(null)}
                            disabled={isDeleting}
                            style={{
                                position: 'absolute', top: '16px', right: '16px',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                width: '32px', height: '32px', borderRadius: '50%', cursor: isDeleting ? 'not-allowed' : 'pointer',
                                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >✕</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '1.6rem' }}>🗑️</span>
                            <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.35rem', fontWeight: 700 }}>
                                Delete Test Attempt
                            </h2>
                        </div>

                        <div style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginBottom: '16px'
                        }}>
                            <div style={{ color: '#e2e8f0', fontSize: '0.9rem', marginBottom: '4px' }}>
                                <strong>Test:</strong> {deleteModalAttempt.testId} ({deleteModalAttempt.examType?.toUpperCase()})
                            </div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                                <strong>Score to Remove:</strong> {deleteModalAttempt.score} / {deleteModalAttempt.totalMarks}
                            </div>
                        </div>

                        <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '18px' }}>
                            Are you sure you want to delete this test attempt from the student&apos;s test history? This action will remove the selected attempt from the student&apos;s active history and analytics. This cannot be undone through the normal admin interface.
                        </p>

                        <div style={{ marginBottom: '22px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', color: '#94a3b8', marginBottom: '6px' }}>
                                Reason for Deletion (recorded in audit trail):
                            </label>
                            <input
                                type="text"
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                placeholder="e.g. Unwanted test attempt removed by admin"
                                disabled={isDeleting}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setDeleteModalAttempt(null)}
                                disabled={isDeleting}
                                style={{
                                    padding: '10px 18px',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '8px',
                                    color: '#e2e8f0',
                                    fontWeight: 600,
                                    cursor: isDeleting ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAttempt}
                                disabled={isDeleting}
                                style={{
                                    padding: '10px 22px',
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 700,
                                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: isDeleting ? 0.6 : 1
                                }}
                            >
                                {isDeleting ? 'Deleting Attempt...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Attempt Details Modal */}
            {detailsModalAttempt && (() => {
                const percentage = Math.round((detailsModalAttempt.score / (detailsModalAttempt.totalMarks || 720)) * 100);
                const subDate = new Date(detailsModalAttempt.attemptedAt);
                const formattedDate = isNaN(subDate.getTime()) ? 'N/A' : subDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
                const formattedTime = isNaN(subDate.getTime()) ? '' : subDate.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });

                const answeredCount = Object.keys(detailsModalAttempt.answers || {}).length;
                const totalQ = detailsModalAttempt.totalQuestions || (detailsModalAttempt.totalMarks === 720 ? 180 : (detailsModalAttempt.totalMarks === 300 ? 75 : 130));
                const unattemptedCount = Math.max(0, totalQ - answeredCount);
                const correctCount = detailsModalAttempt.correctAnswers ?? 0;
                const wrongCount = Math.max(0, answeredCount - correctCount);
                const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

                const attemptStatus = detailsModalAttempt.status || (detailsModalAttempt.isReset ? 'RESET' : detailsModalAttempt.isDeleted ? 'DELETED' : (detailsModalAttempt.isAutoSubmitted ? 'AUTO_SUBMITTED' : 'SUBMITTED'));
                const isReset = Boolean(detailsModalAttempt.isReset || attemptStatus === 'RESET');
                const isDeleted = Boolean(detailsModalAttempt.isDeleted || attemptStatus === 'DELETED');

                return (
                    <div style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1300,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                    }}>
                        <div style={{
                            background: '#1e293b', borderRadius: '18px', padding: '28px',
                            width: '100%', maxWidth: '680px', border: '1px solid rgba(255,255,255,0.15)',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.85)', position: 'relative',
                            maxHeight: '90vh', overflowY: 'auto'
                        }}>
                            <button
                                onClick={() => setDetailsModalAttempt(null)}
                                style={{
                                    position: 'absolute', top: '16px', right: '16px',
                                    background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                    width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                                    fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >✕</button>

                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: '0.78rem',
                                    fontWeight: '800',
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(124, 58, 237, 0.25)',
                                    color: '#c4b5fd',
                                    border: '1px solid rgba(124, 58, 237, 0.4)'
                                }}>
                                    {detailsModalAttempt.examType?.toUpperCase()}
                                </span>
                                <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.35rem', fontWeight: 800 }}>
                                    {detailsModalAttempt.testId}
                                </h2>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    background: isDeleted ? 'rgba(239, 68, 68, 0.2)' : (isReset ? 'rgba(168, 85, 247, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
                                    color: isDeleted ? '#f87171' : (isReset ? '#c084fc' : '#34d399'),
                                    border: `1px solid ${isDeleted ? 'rgba(239, 68, 68, 0.4)' : (isReset ? 'rgba(168, 85, 247, 0.4)' : 'rgba(16, 185, 129, 0.4)')}`
                                }}>
                                    {isDeleted ? '🗑️ Deleted Attempt' : (isReset ? '🔄 Reset Attempt' : '✅ Active Submission')}
                                </span>
                            </div>

                            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '18px' }}>
                                Attempt ID: <code style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px' }}>{detailsModalAttempt.testAttemptId || detailsModalAttempt._id}</code>
                                &nbsp;• Submitted: 📅 {formattedDate} {formattedTime ? `⏰ ${formattedTime}` : ''}
                            </p>

                            {/* Reset or Deleted Banner */}
                            {isReset && (
                                <div style={{
                                    background: 'rgba(168, 85, 247, 0.12)',
                                    border: '1px solid rgba(168, 85, 247, 0.35)',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    marginBottom: '18px'
                                }}>
                                    <div style={{ color: '#c084fc', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                                        🔄 This attempt was reset by Admin
                                    </div>
                                    <div style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>
                                        Reset by: <strong>{detailsModalAttempt.resetBy || 'Admin'}</strong>
                                        {detailsModalAttempt.resetAt && ` on ${new Date(detailsModalAttempt.resetAt).toLocaleString('en-IN')}`}
                                    </div>
                                    {detailsModalAttempt.resetReason && (
                                        <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginTop: '4px' }}>
                                            Reason: <em>&ldquo;{detailsModalAttempt.resetReason}&rdquo;</em>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isDeleted && (
                                <div style={{
                                    background: 'rgba(239, 68, 68, 0.12)',
                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                    borderRadius: '10px',
                                    padding: '12px 16px',
                                    marginBottom: '18px'
                                }}>
                                    <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                                        🗑️ This attempt was deleted from student active history
                                    </div>
                                    <div style={{ color: '#e2e8f0', fontSize: '0.82rem' }}>
                                        Deleted by: <strong>{detailsModalAttempt.deletedBy || 'Admin'}</strong>
                                        {detailsModalAttempt.deletedAt && ` on ${new Date(detailsModalAttempt.deletedAt).toLocaleString('en-IN')}`}
                                    </div>
                                    {detailsModalAttempt.deletionReason && (
                                        <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginTop: '4px' }}>
                                            Reason: <em>&ldquo;{detailsModalAttempt.deletionReason}&rdquo;</em>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 4 Summary Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Score</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginTop: '4px' }}>
                                        {detailsModalAttempt.score} / {detailsModalAttempt.totalMarks}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '2px' }}>{percentage}%</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Rank</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginTop: '4px' }}>
                                        {(isReset || isDeleted) ? 'N/A' : `#${detailsModalAttempt.rank || 'N/A'}`}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                        {(isReset || isDeleted) ? 'Excluded' : `of ${detailsModalAttempt.totalStudents || 1}`}
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Time Taken</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginTop: '4px' }}>
                                        {formatTime(detailsModalAttempt.timeTaken || 0)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Duration</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Warnings</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: (detailsModalAttempt.violationCount || 0) > 0 ? '#fbbf24' : '#34d399', marginTop: '4px' }}>
                                        🛡️ {detailsModalAttempt.violationCount || 0}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Tab Departures</div>
                                </div>
                            </div>

                            {/* Questions Breakdown */}
                            <h3 style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Question & Accuracy Metrics
                            </h3>
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px',
                                padding: '14px 18px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '12px',
                                textAlign: 'center',
                                marginBottom: '20px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Qs</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginTop: '4px' }}>{totalQ}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Correct (+4)</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e', marginTop: '4px' }}>{correctCount}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Wrong (-1)</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>{wrongCount}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Unattempted</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#cbd5e1', marginTop: '4px' }}>{unattemptedCount}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Accuracy</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', marginTop: '4px' }}>{accuracy}%</div>
                                </div>
                            </div>

                            {/* Subject Performance Breakdown */}
                            {detailsModalAttempt.subjectStats && Object.keys(detailsModalAttempt.subjectStats).length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Subject Breakdown
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                                        {Object.entries(detailsModalAttempt.subjectStats).map(([subj, data]) => {
                                            const subTotal = (data.total || 0) * 4;
                                            const subPct = subTotal > 0 ? Math.round((data.score / subTotal) * 100) : 0;
                                            return (
                                                <div key={subj} style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c4b5fd' }}>{subj}</div>
                                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white', marginTop: '4px' }}>
                                                        {data.score} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>/ {subTotal}</span>
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '2px' }}>{subPct}%</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Integrity incident warnings */}
                            {detailsModalAttempt.violations && detailsModalAttempt.violations.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '0.95rem', color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>🛡️</span> Integrity Incident Log ({detailsModalAttempt.violations.length})
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                                        {detailsModalAttempt.violations.map((v, i) => (
                                            <div key={i} style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '6px', padding: '8px 12px', fontSize: '0.82rem', color: '#fef3c7' }}>
                                                <strong>Violation #{i + 1}:</strong> {v.violationType || 'TEST_WINDOW_LEFT'} • Duration: {v.durationSeconds != null ? `${v.durationSeconds}s` : 'Departed'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer Actions */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {!isReset && !isDeleted && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setResetModalAttempt(detailsModalAttempt);
                                                setResetReason('Accidentally submitted before completing');
                                            }}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'rgba(168, 85, 247, 0.15)',
                                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                                borderRadius: '8px',
                                                color: '#c084fc',
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🔄 Reset Attempt
                                        </button>
                                    )}
                                    {!isDeleted && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeleteModalAttempt(detailsModalAttempt);
                                                setDeleteReason('Unwanted test attempt removed by admin');
                                            }}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'rgba(239, 68, 68, 0.15)',
                                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                                borderRadius: '8px',
                                                color: '#f87171',
                                                fontWeight: 700,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🗑️ Delete Attempt
                                        </button>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setDetailsModalAttempt(null)}
                                    style={{
                                        padding: '8px 20px',
                                        background: '#334155',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Delete Student Account Confirmation Modal */}
            {showDeleteStudentModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1400,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
                }}>
                    <div style={{
                        background: '#1e293b', borderRadius: '18px', padding: '28px',
                        width: '100%', maxWidth: '520px', border: '1px solid rgba(239, 68, 68, 0.5)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.9)', position: 'relative'
                    }}>
                        <button
                            onClick={() => !deletingStudent && setShowDeleteStudentModal(false)}
                            disabled={deletingStudent}
                            style={{
                                position: 'absolute', top: '16px', right: '16px',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
                                width: '32px', height: '32px', borderRadius: '50%', cursor: deletingStudent ? 'not-allowed' : 'pointer',
                                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >✕</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                            <span style={{ fontSize: '1.6rem' }}>⚠️</span>
                            <h2 style={{ margin: 0, color: '#ef4444', fontSize: '1.35rem', fontWeight: 700 }}>
                                Permanently Delete Student
                            </h2>
                        </div>

                        <div style={{
                            background: 'rgba(239, 68, 68, 0.12)',
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            borderRadius: '10px',
                            padding: '12px 16px',
                            marginBottom: '16px'
                        }}>
                            <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.95rem' }}>
                                {userProfile.name}
                            </div>
                            <div style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '2px' }}>
                                {userProfile.email}
                            </div>
                        </div>

                        <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '16px' }}>
                            Are you sure you want to completely delete this student? All data for this student—including their account profile, test results, active sessions, integrity violations, and payment records—will be completely removed from the MongoDB database <strong>for this student only</strong>.
                        </p>

                        <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '22px' }}>
                            🔒 Central question banks, test series blueprints, and other students&apos; records will remain completely unaffected. This action <strong>CANNOT</strong> be undone.
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                type="button"
                                onClick={() => setShowDeleteStudentModal(false)}
                                disabled={deletingStudent}
                                style={{
                                    padding: '10px 18px',
                                    background: 'rgba(255,255,255,0.08)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: '8px',
                                    color: '#e2e8f0',
                                    fontWeight: 600,
                                    cursor: deletingStudent ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteStudent}
                                disabled={deletingStudent}
                                style={{
                                    padding: '10px 22px',
                                    background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 700,
                                    cursor: deletingStudent ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    opacity: deletingStudent ? 0.6 : 1
                                }}
                            >
                                {deletingStudent ? 'Deleting Student Data...' : 'Confirm Permanent Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    zIndex: 9999,
                    background: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
                    color: '#ecfdf5',
                    border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
                    padding: '14px 20px',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    maxWidth: '450px',
                    boxSizing: 'border-box'
                }}>
                    <span style={{ fontSize: '1.25rem' }}>{toast.type === 'success' ? '✅' : '⚠️'}</span>
                    <span>{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '2px 6px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
}

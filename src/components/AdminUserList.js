'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './AdminUserList.module.css';
import { normalizeToCanonicalExam, getCanonicalExamDisplay } from '@/lib/authorization';
import EmailLogsModal from './EmailLogsModal';

const DEFAULT_APPROVALS = { live: false, mock: true, subject: false, chapter: false, subtopic: false };

const TEST_TYPES = [
    { key: 'live',    label: 'Live',        icon: '🔴' },
    { key: 'mock',    label: 'Full',        icon: '📝' },
    { key: 'subject', label: 'Subjectwise', icon: '🔬' },
    { key: 'chapter', label: 'Chapterwise', icon: '📖' },
    { key: 'subtopic', label: 'Subtopic',   icon: '🔍' },
];


export default function AdminUserList() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [updatingUser, setUpdatingUser] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
    const [showFilters, setShowFilters] = useState(false);
    const [restoreModalOpen, setRestoreModalOpen] = useState(false);
    const [restoreIdentifier, setRestoreIdentifier] = useState('');
    const [restoring, setRestoring] = useState(false);
    const [restoreError, setRestoreError] = useState('');
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [emailModalStudent, setEmailModalStudent] = useState('');

    const openStudentEmailLogs = (studentEmail = '') => {
        setEmailModalStudent(studentEmail);
        setEmailModalOpen(true);
    };
    const [filters, setFilters] = useState({
        exam: '',
        paymentStatus: '',
        yearJoined: '',
        role: '',
        state: '',
        city: '',
        school: '',
        coaching: '',
        approvalStatus: '',
        liveApproval: '',
        subjectApproval: '',
        chapterApproval: '',
        mockApproval: '',
        subtopicApproval: '',
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/admin/users');
                if (!response.ok) throw new Error(await response.text());
                const data = await response.json();
                // Ensure every user has full approvals with defaults
                const normalized = data.map(u => ({
                    ...u,
                    approvals: { ...DEFAULT_APPROVALS, ...(u.approvals || {}) }
                }));
                setUsers(normalized);
            } catch (err) {
                setError(err.message || 'Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
        setSortConfig({ key, direction });
    };

    const saveApprovals = async (userId, newApprovals) => {
        setUpdatingUser(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvals: newApprovals })
            });
            if (!res.ok) throw new Error('Failed to update');
            showToast('Permissions updated successfully.');
        } catch (error) {
            console.error('Error saving approvals:', error);
            showToast('Failed to update permissions. Reverting...', 'error');
            // Revert
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            setUsers(data.map(u => ({ ...u, approvals: { ...DEFAULT_APPROVALS, ...(u.approvals || {}) } })));
        } finally {
            setUpdatingUser(null);
        }
    };

    const handlePaymentStatusChange = async (userId, newStatus) => {
        setUpdatingUser(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentStatus: newStatus })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to update payment status');
            }
            setUsers(prev => prev.map(u => u._id === userId ? {
                ...u,
                paymentStatus: newStatus,
                ...(newStatus === 'CONFIRMED' || newStatus === 'PAID' ? { accountStatus: 'ACTIVE' } : {})
            } : u));
            const labelMap = { CONFIRMED: 'PAID', PAID: 'PAID', REJECTED: 'NOT PAID', 'NOT PAID': 'NOT PAID', PENDING: 'PENDING' };
            showToast(`Payment status updated to ${labelMap[newStatus] || newStatus}.`);
        } catch (error) {
            console.error('Error updating payment status:', error);
            showToast(error.message || 'Failed to update payment status.', 'error');
        } finally {
            setUpdatingUser(null);
        }
    };

    const handleTypeToggle = (e, userId, typeKey, currentApprovals) => {
        e.stopPropagation();
        const newApprovals = { ...currentApprovals, [typeKey]: !currentApprovals[typeKey] };
        // Optimistic update
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, approvals: newApprovals } : u));
        saveApprovals(userId, newApprovals);
    };

    const handleApproveAll = (e, userId) => {
        e.stopPropagation();
        const all = { live: true, mock: true, subject: true, chapter: true, subtopic: true };
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, approvals: all } : u));
        saveApprovals(userId, all);
    };

    const handleRevokeAll = (e, userId) => {
        e.stopPropagation();
        const none = { live: false, mock: false, subject: false, chapter: false, subtopic: false };
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, approvals: none } : u));
        saveApprovals(userId, none);
    };

    const handleDeleteUser = async (e, userId, userName) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to permanently delete "${userName || 'this student'}"?\nAll MongoDB records for this student (profile, test results, sessions, violations, and payments) will be completely removed for this student only. This cannot be undone.`)) return;

        setDeletingUser(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) {
                showToast(data.error || 'Failed to delete student.', 'error');
                return;
            }
            showToast(data.message || 'Student and all associated records deleted completely.');
            // Remove from local state
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            console.error('Delete failed:', err);
            showToast('An error occurred while deleting the user.', 'error');
        } finally {
            setDeletingUser(null);
        }
    };

    const handleRestoreStudent = async () => {
        if (!restoreIdentifier.trim()) {
            setRestoreError('Please enter an email, student code, or order/payment ID.');
            return;
        }
        setRestoring(true);
        setRestoreError('');
        try {
            const res = await fetch('/api/admin/users/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: restoreIdentifier.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to restore student');
            showToast(data.message || 'Student account restored successfully!');
            setRestoreModalOpen(false);
            setRestoreIdentifier('');
            // Refresh users list
            const refreshRes = await fetch('/api/admin/users');
            const refreshData = await refreshRes.json();
            setUsers(refreshData.map(u => ({ ...u, approvals: { ...DEFAULT_APPROVALS, ...(u.approvals || {}) } })));
        } catch (err) {
            setRestoreError(err.message || 'Error restoring student');
        } finally {
            setRestoring(false);
        }
    };
 
    const handleBulkApprove = async (mode = 'full') => {
        const studentIds = filteredAndSortedUsers
            .filter(u => !(u.isAdmin || u.role === 'admin'))
            .map(u => u._id);
 
        if (studentIds.length === 0) {
            alert('No students found in the filtered list to approve.');
            return;
        }
 
        let confirmMsg = `Are you sure you want to approve all ${studentIds.length} students in the current filtered list for FULL access?`;
        let payload = { userIds: studentIds, approvals: DEFAULT_APPROVALS };
 
        if (mode !== 'full') {
            confirmMsg = `Are you sure you want to approve ${mode.toUpperCase()} access for all ${studentIds.length} filtered students?`;
            payload = { userIds: studentIds, category: mode };
        }
 
        if (!confirm(confirmMsg)) return;
 
        setBulkUpdating(true);
        try {
            const res = await fetch('/api/admin/users/bulk-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
 
            if (!res.ok) throw new Error('Bulk update failed');
 
            // Optimistic update of local state
            setUsers(prev => prev.map(u => {
                if (!studentIds.includes(u._id)) return u;
                
                const newApprovals = mode === 'full' 
                    ? { ...DEFAULT_APPROVALS } 
                    : { ...u.approvals, [mode]: true };
                
                const isApproved = Object.values(newApprovals).every(v => v === true);
                return { ...u, approvals: newApprovals, isApproved };
            }));
            
            showToast(`Successfully updated ${studentIds.length} students.`);
        } catch (err) {
            console.error('Bulk approval failed:', err);
            showToast('Failed to perform bulk approval.', 'error');
        } finally {
            setBulkUpdating(false);
        }
    };

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

    const filteredAndSortedUsers = useMemo(() => {
        if (!users.length) return [];
        let filtered = users.filter((user) => {
            // Text search
            const s = searchTerm.toLowerCase();
            if (s && 
                !user.name?.toLowerCase().includes(s) && 
                !user.email?.toLowerCase().includes(s) &&
                !user.mobileNo?.toLowerCase().includes(s) &&
                !user.studentCode?.toLowerCase().includes(s)
            ) return false;

            // Exam filter
            if (filters.exam) {
                const userCanonical = normalizeToCanonicalExam(user.exam || user.examPreparingFor);
                if (userCanonical !== filters.exam) return false;
            }

            // Role filter
            if (filters.role) {
                const isAdmin = user.isAdmin || user.role === 'admin';
                if (filters.role === 'admin' && !isAdmin) return false;
                if (filters.role === 'student' && isAdmin) return false;
            }

            // Payment Status filter
            if (filters.paymentStatus) {
                const isAdmin = user.isAdmin || user.role === 'admin';
                const rawStatus = isAdmin ? 'CONFIRMED' : (user.paymentStatus || 'PENDING');
                const pStatus = (rawStatus === 'PAID' || rawStatus === 'CONFIRMED') ? 'CONFIRMED' : (rawStatus === 'NOT PAID' || rawStatus === 'REJECTED') ? 'REJECTED' : 'PENDING';
                if (pStatus !== filters.paymentStatus) return false;
            }

            // Year joined filter
            if (filters.yearJoined) {
                const dateVal = user.createdAt || user.profileCompletedAt;
                const year = dateVal ? new Date(dateVal).getFullYear().toString() : '';
                if (year !== filters.yearJoined) return false;
            }

            // State filter
            if (filters.state && !user.state?.toLowerCase().includes(filters.state.toLowerCase())) return false;

            // City filter
            if (filters.city && !user.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;

            // School filter
            if (filters.school && !user.schoolName?.toLowerCase().includes(filters.school.toLowerCase())) return false;

            // Coaching filter
            if (filters.coaching && !user.coachingName?.toLowerCase().includes(filters.coaching.toLowerCase())) return false;

            // Approval Status filter (Overall)
            if (filters.approvalStatus) {
                const isAdmin = user.isAdmin || user.role === 'admin';
                if (isAdmin) {
                    if (filters.approvalStatus === 'not_approved') return false;
                } else {
                    const approvals = user.approvals || DEFAULT_APPROVALS;
                    const approvedCount = TEST_TYPES.filter(t => !!approvals[t.key]).length;
                    const totalCount = TEST_TYPES.length;

                    if (filters.approvalStatus === 'approved' && approvedCount < totalCount) return false;
                    if (filters.approvalStatus === 'partial' && (approvedCount === 0 || approvedCount === totalCount)) return false;
                    if (filters.approvalStatus === 'not_approved' && approvedCount > 0) return false;
                }
            }

            // Granular Approval Filters
            const approvals = user.approvals || DEFAULT_APPROVALS;
            const isAdmin = user.isAdmin || user.role === 'admin';

            if (filters.liveApproval) {
                const hasLive = isAdmin || !!approvals.live;
                if (filters.liveApproval === 'yes' && !hasLive) return false;
                if (filters.liveApproval === 'no' && hasLive) return false;
            }

            if (filters.subjectApproval) {
                const hasSubject = isAdmin || !!approvals.subject;
                if (filters.subjectApproval === 'yes' && !hasSubject) return false;
                if (filters.subjectApproval === 'no' && hasSubject) return false;
            }

            if (filters.chapterApproval) {
                const hasChapter = isAdmin || !!approvals.chapter;
                if (filters.chapterApproval === 'yes' && !hasChapter) return false;
                if (filters.chapterApproval === 'no' && hasChapter) return false;
            }

            if (filters.mockApproval) {
                const hasMock = isAdmin || !!approvals.mock;
                if (filters.mockApproval === 'yes' && !hasMock) return false;
                if (filters.mockApproval === 'no' && hasMock) return false;
            }

            if (filters.subtopicApproval) {
                const hasSubtopic = isAdmin || !!approvals.subtopic;
                if (filters.subtopicApproval === 'yes' && !hasSubtopic) return false;
                if (filters.subtopicApproval === 'no' && hasSubtopic) return false;
            }

            return true;
        });

        filtered.sort((a, b) => {
            const aIsAdmin = a.isAdmin || a.role === 'admin';
            const bIsAdmin = b.isAdmin || b.role === 'admin';

            // Always keep admins at the bottom of the list
            if (aIsAdmin && !bIsAdmin) return 1;
            if (!aIsAdmin && bIsAdmin) return -1;

            let valA = a[sortConfig.key] ?? '';
            let valB = b[sortConfig.key] ?? '';
            if (sortConfig.key === 'createdAt') {
                valA = new Date(valA).getTime() || 0;
                valB = new Date(valB).getTime() || 0;
                return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            }
            if (typeof valA === 'number') return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [users, searchTerm, sortConfig, filters]);

    if (loading) return <div className={styles.loading}>Loading Platform Users...</div>;
    if (error) return <div className={styles.error}>Error: {error}</div>;

    const formatDate = (dateString, fallback) => {
        const d = new Date(dateString || fallback);
        if (!dateString && !fallback) return 'N/A';
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Build unique option lists for dropdowns
    const SUPPORTED_EXAMS = [
        'NEET', 'JEE Mains', 'BITSAT'
    ];
    const uniqueExams  = [...new Set([...SUPPORTED_EXAMS, ...users.map(u => u.examPreparingFor).filter(Boolean)])].sort();
    const uniqueStates = [...new Set(users.map(u => u.state).filter(Boolean))].sort();
    const uniqueCities = [...new Set(users.map(u => u.city).filter(Boolean))].sort();
    const uniqueYears  = [...new Set(users.map(u => {
        const d = u.createdAt || u.profileCompletedAt;
        return d ? new Date(d).getFullYear().toString() : null;
    }).filter(Boolean))].sort().reverse();

    const setFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
    const resetFilters = () => setFilters({ 
        exam: '', paymentStatus: '', yearJoined: '', role: '', state: '', city: '', school: '', coaching: '', 
        approvalStatus: '', liveApproval: '', subjectApproval: '', chapterApproval: '',
        mockApproval: '', subtopicApproval: ''
    });

    const selStyle = {
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'white', borderRadius: '10px', padding: '8px 12px', fontSize: '0.85rem', minWidth: '130px',
    };
    const txtStyle = {
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'white', borderRadius: '10px', padding: '8px 12px', fontSize: '0.85rem', minWidth: '130px',
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>User Directory</h2>
                    <p className={styles.subtitle}>
                        {filteredAndSortedUsers.length} of {users.length} account{users.length !== 1 ? 's' : ''}
                        {(searchTerm || activeFilterCount > 0) ? ' (filtered)' : ' registered'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search name, email or code..."
                        className={styles.search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        style={{
                            padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700',
                            fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.2)',
                            background: showFilters ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)',
                            color: showFilters ? '#c4b5fd' : '#94a3b8', transition: 'all 0.2s',
                            position: 'relative',
                        }}
                    >
                        🔍 Filters {activeFilterCount > 0 && (
                            <span style={{
                                position: 'absolute', top: '-8px', right: '-8px', background: '#7c3aed',
                                color: 'white', borderRadius: '50%', width: '18px', height: '18px',
                                fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800',
                            }}>{activeFilterCount}</span>
                         )}
                     </button>
                     <button
                         onClick={() => { setRestoreModalOpen(true); setRestoreError(''); setRestoreIdentifier(''); }}
                         style={{
                             padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700',
                             fontSize: '0.85rem', border: '1px solid rgba(99,102,241,0.4)',
                             background: 'rgba(99,102,241,0.15)', color: '#818cf8', transition: 'all 0.2s',
                             display: 'flex', alignItems: 'center', gap: '6px'
                         }}
                         title="Restore deleted student account or reconnect payment"
                     >
                         🔄 Restore Student
                     </button>
                     <button
                         onClick={() => openStudentEmailLogs('')}
                         style={{
                             padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700',
                             fontSize: '0.85rem', border: '1px solid rgba(56, 189, 248, 0.4)',
                             background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', transition: 'all 0.2s',
                             display: 'flex', alignItems: 'center', gap: '6px'
                         }}
                         title="View automated email delivery logs and Resend free-tier quota"
                     >
                         📧 Email Logs & Quota
                     </button>
                     {filteredAndSortedUsers.length > 0 && (
                         <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                             <button
                                 onClick={() => handleBulkApprove('full')}
                                 disabled={bulkUpdating}
                                 style={{
                                     padding: '9px 16px', borderRadius: '10px', cursor: bulkUpdating ? 'not-allowed' : 'pointer', 
                                     fontWeight: '700', fontSize: '0.85rem', border: '1px solid rgba(16,185,129,0.4)',
                                     background: 'rgba(16,185,129,0.15)', color: '#10b981', transition: 'all 0.2s',
                                     opacity: bulkUpdating ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px'
                                 }}
                             >
                                 {bulkUpdating ? '⌛...' : '✅ Full Approve'}
                             </button>
 
                             <select 
                                 onChange={(e) => {
                                     if (e.target.value) {
                                         handleBulkApprove(e.target.value);
                                         e.target.value = '';
                                     }
                                 }}
                                 disabled={bulkUpdating}
                                 style={{
                                     padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
                                     background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                                     color: 'white', fontSize: '0.85rem', fontWeight: '600'
                                 }}
                             >
                                 <option value="">Bulk Category...</option>
                                 <option value="live">🔴 Approve Live</option>
                                 <option value="mock">📝 Approve Full</option>
                                 <option value="subject">🔬 Approve Subjectwise</option>
                                 <option value="chapter">📖 Approve Chapterwise</option>
                                 <option value="subtopic">🔍 Approve Subtopic</option>
                             </select>
                         </div>
                     )}
                 </div>
             </div>

            {/* Advanced Filter Panel */}
            {showFilters && (
                <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px', padding: '20px 24px', marginBottom: '16px',
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
                        {/* Exam */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>EXAM</label>
                            <select value={filters.exam} onChange={e => setFilter('exam', e.target.value)} style={selStyle}>
                                <option value="">ALL</option>
                                <option value="NEET">NEET</option>
                                <option value="JEE_MAIN">JEE MAIN</option>
                                <option value="BITSAT">BITSAT</option>
                            </select>
                        </div>
                        {/* Payment Status Filter */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>PAYMENT</label>
                            <select value={filters.paymentStatus} onChange={e => setFilter('paymentStatus', e.target.value)} style={selStyle}>
                                <option value="">ALL</option>
                                <option value="CONFIRMED">PAID</option>
                                <option value="PENDING">PENDING</option>
                                <option value="REJECTED">NOT PAID</option>
                            </select>
                        </div>
                        {/* Role */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>ROLE</label>
                            <select value={filters.role} onChange={e => setFilter('role', e.target.value)} style={selStyle}>
                                <option value="">ALL</option>
                                <option value="admin">A (Admin)</option>
                                <option value="student">S (Student)</option>
                            </select>
                        </div>
                        {/* Year Joined */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>YEAR JOINED</label>
                            <select value={filters.yearJoined} onChange={e => setFilter('yearJoined', e.target.value)} style={selStyle}>
                                <option value="">All</option>
                                {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        {/* State */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>STATE</label>
                            <select value={filters.state} onChange={e => setFilter('state', e.target.value)} style={selStyle}>
                                <option value="">All</option>
                                {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {/* City */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>CITY</label>
                            <select value={filters.city} onChange={e => setFilter('city', e.target.value)} style={selStyle}>
                                <option value="">All</option>
                                {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        {/* School */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>SCHOOL</label>
                            <input
                                type="text" value={filters.school} placeholder="School name..."
                                onChange={e => setFilter('school', e.target.value)} style={txtStyle}
                            />
                        </div>
                        {/* Overall Approval */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>OVERALL APP.</label>
                            <select value={filters.approvalStatus} onChange={e => setFilter('approvalStatus', e.target.value)} style={selStyle}>
                                <option value="">All</option>
                                <option value="approved">Full Access</option>
                                <option value="partial">Partial</option>
                                <option value="not_approved">No Access</option>
                            </select>
                        </div>
                        {/* Live Approval */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>LIVE</label>
                            <select value={filters.liveApproval} onChange={e => setFilter('liveApproval', e.target.value)} style={selStyle}>
                                <option value="">All</option>
                                <option value="yes">Approved</option>
                                <option value="no">Pending</option>
                            </select>
                        </div>
                        {/* Subject Approval */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>SUBJECTWISE</label>
                            <select value={filters.subjectApproval} onChange={e => setFilter('subjectApproval', e.target.value)} style={selStyle}>
                                <option value="">All</option>
                                <option value="yes">Approved</option>
                                <option value="no">Pending</option>
                            </select>
                        </div>
                        {/* Chapter Approval */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>CHAPTERWISE</label>
                            <select value={filters.chapterApproval} onChange={e => setFilter('chapterApproval', e.target.value)} style={selStyle}>
                                <option value="">All</option>
                                <option value="yes">Approved</option>
                                <option value="no">Pending</option>
                            </select>
                        </div>
                        {/* Mock Approval */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>FULL</label>
                            <select value={filters.mockApproval} onChange={e => setFilter('mockApproval', e.target.value)} style={selStyle}>
                                <option value="">All</option>
                                <option value="yes">Approved</option>
                                <option value="no">Pending</option>
                            </select>
                        </div>
                        {/* Subtopic Approval */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>SUBTOPIC</label>
                            <select value={filters.subtopicApproval} onChange={e => setFilter('subtopicApproval', e.target.value)} style={selStyle}>
                                <option value="">All</option>
                                <option value="yes">Approved</option>
                                <option value="no">Pending</option>
                            </select>
                        </div>
                        {/* Coaching */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '700' }}>COACHING</label>
                            <input
                                type="text" value={filters.coaching} placeholder="Coaching name..."
                                onChange={e => setFilter('coaching', e.target.value)} style={txtStyle}
                            />
                        </div>
                        {/* Reset */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={resetFilters}
                                style={{
                                    padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                                    color: '#ef4444', fontWeight: '700', fontSize: '0.85rem', alignSelf: 'flex-end',
                                }}
                            >
                                ✕ Reset Filters
                            </button>
                        )}
                    </div>
                </div>
            )}

            {filteredAndSortedUsers.length === 0 ? (
                <div className={styles.empty}>No users found.</div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')}>
                                    User {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('role')}>
                                    Role {sortConfig.key === 'role' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('examPreparingFor')}>
                                    Exam {sortConfig.key === 'examPreparingFor' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('paymentStatus')}>
                                    Payment {sortConfig.key === 'paymentStatus' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('testsTaken')}>
                                    Tests {sortConfig.key === 'testsTaken' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th style={{ minWidth: '380px' }}>
                                    Test Access Permissions
                                </th>
                                <th onClick={() => handleSort('createdAt')}>
                                    Joined {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th>Remaining</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedUsers.map((user) => {
                                const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';
                                const isAdmin = user.role === 'admin' || user.isAdmin;
                                const approvals = user.approvals || DEFAULT_APPROVALS;
                                const allApproved = TEST_TYPES.every(t => !!approvals[t.key]);
                                const isUpdating = updatingUser === user._id;
                                const isDeleting = deletingUser === user._id;

                                return (
                                    <tr
                                        key={user._id}
                                        onClick={() => router.push(`/admin/user/${user._id}`)}
                                        style={{ cursor: 'pointer', opacity: (isUpdating || isDeleting) ? 0.6 : 1, transition: 'opacity 0.2s' }}
                                    >
                                        <td>
                                            <div className={styles.userCell}>
                                                <div className={styles.avatar}>
                                                    {user.image ? <img src={user.image} alt="User Avatar" className={styles.avatarImg} /> : initial}
                                                </div>
                                                <div className={styles.userDetails}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className={styles.userName}>{user.name || 'Unknown'}</span>
                                                        {user.studentCode && (
                                                            <span style={{ fontSize: '0.65rem', background: 'rgba(124, 58, 237, 0.2)', color: '#c4b5fd', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.3)', fontWeight: 'bold' }}>
                                                                {user.studentCode}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={styles.userEmail}>{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span
                                                className={`${styles.badge} ${isAdmin ? styles.badgeAdmin : styles.badgeUser}`}
                                                title={isAdmin ? 'Admin' : 'Student'}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: '26px',
                                                    height: '26px',
                                                    borderRadius: '50%',
                                                    fontWeight: '800',
                                                    fontSize: '0.85rem',
                                                    padding: 0,
                                                    boxShadow: isAdmin ? '0 0 8px rgba(139, 92, 246, 0.25)' : '0 0 8px rgba(16, 185, 129, 0.25)',
                                                }}
                                            >
                                                {isAdmin ? 'A' : 'S'}
                                            </span>
                                        </td>
                                        <td>
                                            {(() => {
                                                const canonical = normalizeToCanonicalExam(user.exam || user.examPreparingFor);
                                                const display = getCanonicalExamDisplay(canonical);
                                                return display ? (
                                                    <span style={{
                                                        background: 'rgba(139, 92, 246, 0.15)',
                                                        color: '#c4b5fd',
                                                        padding: '4px 10px',
                                                        borderRadius: '8px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '700',
                                                        border: '1px solid rgba(139,92,246,0.3)',
                                                        whiteSpace: 'nowrap',
                                                    }}>{display}</span>
                                                ) : (
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>—</span>
                                                );
                                            })()}
                                        </td>
                                        <td>
                                            {isAdmin ? (
                                                <span style={{ color: '#818cf8', fontWeight: 'bold', fontSize: '0.8rem' }}>Exempt</span>
                                            ) : (
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <select
                                                        value={(user.paymentStatus === 'CONFIRMED' || user.paymentStatus === 'PAID') ? 'CONFIRMED' : (user.paymentStatus === 'REJECTED' || user.paymentStatus === 'NOT PAID') ? 'REJECTED' : 'PENDING'}
                                                        onChange={(e) => handlePaymentStatusChange(user._id, e.target.value)}
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: '700',
                                                            padding: '4px 8px',
                                                            borderRadius: '8px',
                                                            border: (user.paymentStatus === 'CONFIRMED' || user.paymentStatus === 'PAID')
                                                                ? '1px solid rgba(16, 185, 129, 0.4)'
                                                                : (user.paymentStatus === 'REJECTED' || user.paymentStatus === 'NOT PAID')
                                                                ? '1px solid rgba(239, 68, 68, 0.4)'
                                                                : '1px solid rgba(245, 158, 11, 0.4)',
                                                            background: (user.paymentStatus === 'CONFIRMED' || user.paymentStatus === 'PAID')
                                                                ? 'rgba(16, 185, 129, 0.15)'
                                                                : (user.paymentStatus === 'REJECTED' || user.paymentStatus === 'NOT PAID')
                                                                ? 'rgba(239, 68, 68, 0.15)'
                                                                : 'rgba(245, 158, 11, 0.15)',
                                                            color: (user.paymentStatus === 'CONFIRMED' || user.paymentStatus === 'PAID')
                                                                ? '#10b981'
                                                                : (user.paymentStatus === 'REJECTED' || user.paymentStatus === 'NOT PAID')
                                                                ? '#ef4444'
                                                                : '#f59e0b',
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        <option value="CONFIRMED" style={{ background: '#1e293b', color: '#10b981' }}>PAID</option>
                                                        <option value="PENDING" style={{ background: '#1e293b', color: '#f59e0b' }}>PENDING</option>
                                                        <option value="REJECTED" style={{ background: '#1e293b', color: '#ef4444' }}>NOT PAID</option>
                                                    </select>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={styles.statPill}>{user.testsTaken || 0}</span>
                                        </td>
                                        <td>
                                            {isAdmin ? (
                                                <span style={{ color: '#818cf8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                                    Full access (Admin)
                                                </span>
                                            ) : (
                                                <div
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                                                >
                                                    {/* Per-type checkboxes */}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                                        {TEST_TYPES.map(({ key, label, icon }) => (
                                                            <label
                                                                key={key}
                                                                onClick={(e) => handleTypeToggle(e, user._id, key, approvals)}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '20px',
                                                                    background: approvals[key] ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                                                                    border: `1px solid ${approvals[key] ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s',
                                                                    userSelect: 'none',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: '600',
                                                                    color: approvals[key] ? '#10b981' : '#ef4444',
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!approvals[key]}
                                                                    readOnly
                                                                    style={{ accentColor: approvals[key] ? '#10b981' : '#ef4444', cursor: 'pointer', width: '13px', height: '13px' }}
                                                                />
                                                                {icon} {label}
                                                            </label>
                                                        ))}
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button
                                                            onClick={(e) => handleApproveAll(e, user._id)}
                                                            disabled={allApproved || isUpdating}
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '3px 10px',
                                                                borderRadius: '12px',
                                                                border: '1px solid rgba(16,185,129,0.4)',
                                                                background: 'rgba(16,185,129,0.1)',
                                                                color: '#10b981',
                                                                cursor: allApproved ? 'not-allowed' : 'pointer',
                                                                opacity: allApproved ? 0.5 : 1,
                                                                transition: 'all 0.2s',
                                                                fontWeight: '600',
                                                            }}
                                                        >
                                                            ✅ Approve All
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleRevokeAll(e, user._id)}
                                                            disabled={isUpdating}
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '3px 10px',
                                                                borderRadius: '12px',
                                                                border: '1px solid rgba(239,68,68,0.4)',
                                                                background: 'rgba(239,68,68,0.1)',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                fontWeight: '600',
                                                            }}
                                                        >
                                                            🚫 Revoke All
                                                        </button>
                                                        {user.latestEmailNotification && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); openStudentEmailLogs(user.email); }}
                                                                style={{
                                                                    fontSize: '0.72rem',
                                                                    padding: '3px 8px',
                                                                    borderRadius: '12px',
                                                                    border: user.latestEmailNotification.status === 'SENT' ? '1px solid rgba(16,185,129,0.4)' :
                                                                            user.latestEmailNotification.status === 'PENDING' ? '1px solid rgba(245,158,11,0.4)' :
                                                                            user.latestEmailNotification.status === 'QUOTA_EXCEEDED' ? '1px solid rgba(249,115,22,0.4)' :
                                                                            '1px solid rgba(239,68,68,0.4)',
                                                                    background: user.latestEmailNotification.status === 'SENT' ? 'rgba(16,185,129,0.1)' :
                                                                                user.latestEmailNotification.status === 'PENDING' ? 'rgba(245,158,11,0.1)' :
                                                                                user.latestEmailNotification.status === 'QUOTA_EXCEEDED' ? 'rgba(249,115,22,0.1)' :
                                                                                'rgba(239,68,68,0.1)',
                                                                    color: user.latestEmailNotification.status === 'SENT' ? '#10b981' :
                                                                           user.latestEmailNotification.status === 'PENDING' ? '#f59e0b' :
                                                                           user.latestEmailNotification.status === 'QUOTA_EXCEEDED' ? '#fb923c' :
                                                                           '#ef4444',
                                                                    cursor: 'pointer',
                                                                    fontWeight: '700',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px'
                                                                }}
                                                                title={`Email Status: ${user.latestEmailNotification.status}. Click to view logs.`}
                                                            >
                                                                {user.latestEmailNotification.status === 'SENT' && '📧 Sent'}
                                                                {user.latestEmailNotification.status === 'PENDING' && '⏳ Pending'}
                                                                {user.latestEmailNotification.status === 'FAILED' && '⚠️ Failed'}
                                                                {user.latestEmailNotification.status === 'QUOTA_EXCEEDED' && '🛑 Quota'}
                                                            </button>
                                                        )}
                                                        {isUpdating && (
                                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', alignSelf: 'center' }}>Saving...</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td>{formatDate(user.createdAt, user.profileCompletedAt)}</td>
                                        <td>
                                            {(() => {
                                                if (isAdmin) return <span style={{ color: '#818cf8', fontWeight: 'bold' }}>Exempt</span>;
                                                const d = user.createdAt || user.profileCompletedAt;
                                                if (!d) return <span style={{ color: '#64748b' }}>N/A</span>;
                                                
                                                const daysPassed = Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
                                                const remaining = Math.max(0, 800 - daysPassed);
                                                
                                                let color = '#22c55e'; // Green
                                                if (remaining < 30) color = '#ef4444'; // Red
                                                else if (remaining < 100) color = '#f59e0b'; // Amber
                                                
                                                return <span style={{ color, fontWeight: 'bold' }}>{remaining} days</span>;
                                            })()}
                                        </td>
                                        <td onClick={(e) => e.stopPropagation()}>
                                            {!isAdmin && (
                                                <button
                                                    onClick={(e) => handleDeleteUser(e, user._id, user.name)}
                                                    disabled={isDeleting}
                                                    title="Delete student"
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239,68,68,0.4)',
                                                        color: '#ef4444',
                                                        padding: '5px 10px',
                                                        borderRadius: '8px',
                                                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                                                        fontSize: '1rem',
                                                        opacity: isDeleting ? 0.5 : 1,
                                                        transition: 'all 0.2s',
                                                    }}
                                                >
                                                    {isDeleting ? '...' : '🗑️'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Restore Student Modal */}
            {restoreModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '16px',
                        padding: '28px',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        color: 'white'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🔄 Restore / Reconnect Student
                            </h3>
                            <button
                                onClick={() => setRestoreModalOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                ×
                            </button>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.5', marginBottom: '20px' }}>
                            Restore a deleted student account or reconnect existing payments. Enter the student&apos;s Google email, student code, Razorpay order ID, or payment ID. Their full 732-day test access will be reconnected without charging again.
                        </p>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>
                                EMAIL OR PAYMENT / ORDER ID
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. student@gmail.com or order_Tfq..."
                                value={restoreIdentifier}
                                onChange={(e) => setRestoreIdentifier(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRestoreStudent(); }}
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'white',
                                    fontSize: '0.95rem',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {restoreError && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#fca5a5',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                marginBottom: '16px'
                            }}>
                                ⚠️ {restoreError}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setRestoreModalOpen(false)}
                                disabled={restoring}
                                style={{
                                    padding: '9px 18px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'transparent',
                                    color: '#cbd5e1',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRestoreStudent}
                                disabled={restoring}
                                style={{
                                    padding: '9px 20px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    color: 'white',
                                    cursor: restoring ? 'not-allowed' : 'pointer',
                                    fontWeight: '700',
                                    opacity: restoring ? 0.6 : 1
                                }}
                            >
                                {restoring ? 'Restoring...' : 'Restore & Activate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Notifications Management Modal */}
            <EmailLogsModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                initialStudentEmail={emailModalStudent}
                onToast={showToast}
            />

            {/* Premium Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(124, 58, 237, 0.9)',
                    backdropFilter: 'blur(12px)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '14px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    zIndex: 10000,
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'toastIn 0.3s ease-out'
                }}>
                    <span>{toast.type === 'error' ? '❌' : '✅'}</span>
                    {toast.message}
                    <style>{`
                        @keyframes toastIn {
                            from { bottom: 0; opacity: 0; }
                            to { bottom: 30px; opacity: 1; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}

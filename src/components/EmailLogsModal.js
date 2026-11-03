'use client';

import { useState, useEffect, useCallback } from 'react';

export default function EmailLogsModal({ isOpen, onClose, initialStudentEmail = '', onToast }) {
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState(initialStudentEmail);
    const [retryingId, setRetryingId] = useState(null);

    const fetchNotifications = useCallback(async (email = '', status = 'ALL') => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (email) params.set('studentEmail', email.trim());
            if (status && status !== 'ALL') params.set('status', status);
            params.set('limit', '100');

            const res = await fetch(`/api/admin/notifications?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load notifications');
            const data = await res.json();
            setNotifications(data.notifications || []);
            setStats(data.stats || null);
        } catch (err) {
            console.error('Error fetching email notifications:', err);
            onToast?.('Failed to load email logs.', 'error');
        } finally {
            setLoading(false);
        }
    }, [onToast]);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm(initialStudentEmail || '');
            fetchNotifications(initialStudentEmail || '', statusFilter);
        }
    }, [isOpen, initialStudentEmail, statusFilter, fetchNotifications]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchNotifications(searchTerm, statusFilter);
    };

    const handleFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        fetchNotifications(searchTerm, newStatus);
    };

    const handleRetry = async (notificationId) => {
        setRetryingId(notificationId);
        try {
            const res = await fetch(`/api/admin/notifications/${notificationId}/retry`, {
                method: 'POST'
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Retry failed');
            }
            onToast?.(`Notification ${notificationId} re-queued for delivery!`, 'success');
            // Refresh list
            await fetchNotifications(searchTerm, statusFilter);
        } catch (err) {
            console.error('Retry error:', err);
            onToast?.(err.message || 'Failed to retry email.', 'error');
        } finally {
            setRetryingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(2, 6, 23, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
        }}>
            <div style={{
                background: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '960px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                overflow: 'hidden'
            }}>
                {/* Modal Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(99, 102, 241, 0.2)',
                            border: '1px solid rgba(99, 102, 241, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem'
                        }}>
                            📧
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: '700' }}>
                                Automatic Email Notifications
                            </h3>
                            <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>
                                Resend Transactional Queue • Activation Confirmatory Logs
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Quota & Status Stats Bar */}
                {stats && (
                    <div style={{
                        padding: '14px 24px',
                        background: '#090d16',
                        borderBottom: '1px solid #1e293b',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px'
                    }}>
                        <div style={{ background: '#131c31', padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                                Daily Free Limit (Resend)
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span style={{ color: stats.todaySent >= stats.dailyLimit ? '#ef4444' : '#10b981', fontWeight: '800', fontSize: '1.1rem' }}>
                                    {stats.todaySent} / {stats.dailyLimit}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Today</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.min(100, (stats.todaySent / stats.dailyLimit) * 100)}%`,
                                    height: '100%',
                                    background: stats.todaySent >= stats.dailyLimit ? '#ef4444' : '#10b981',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>

                        <div style={{ background: '#131c31', padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                                Monthly Free Limit
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                <span style={{ color: '#38bdf8', fontWeight: '800', fontSize: '1.1rem' }}>
                                    {stats.monthSent} / {stats.monthlyLimit}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>This Month</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.min(100, (stats.monthSent / stats.monthlyLimit) * 100)}%`,
                                    height: '100%',
                                    background: '#38bdf8',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>

                        <div style={{ background: '#131c31', padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                                Queue Delivery Status
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                                <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                    Sent: {stats.sentCount}
                                </span>
                                <span style={{ fontSize: '0.75rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                    Pending: {stats.pendingCount}
                                </span>
                                <span style={{ fontSize: '0.75rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                    Failed: {stats.failedCount}
                                </span>
                            </div>
                        </div>

                        <div style={{ background: '#131c31', padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>
                                Provider Status
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: stats.resendConfigured ? '#10b981' : '#f59e0b'
                                }} />
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: stats.resendConfigured ? '#10b981' : '#f59e0b' }}>
                                    {stats.resendConfigured ? 'Resend API Active' : 'Config Pending in Railway'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter and Search Controls */}
                <div style={{
                    padding: '12px 24px',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px' }}>
                        <input
                            type="text"
                            placeholder="Filter by student email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '8px 14px',
                                background: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '0.85rem'
                            }}
                        />
                        <button
                            type="submit"
                            style={{
                                padding: '8px 14px',
                                background: 'rgba(99,102,241,0.2)',
                                border: '1px solid rgba(99,102,241,0.4)',
                                borderRadius: '8px',
                                color: '#818cf8',
                                fontWeight: '700',
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                            }}
                        >
                            Filter
                        </button>
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => { setSearchTerm(''); fetchNotifications('', statusFilter); }}
                                style={{
                                    padding: '8px 12px',
                                    background: 'transparent',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    fontSize: '0.82rem'
                                }}
                            >
                                Reset
                            </button>
                        )}
                    </form>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {['ALL', 'SENT', 'PENDING', 'FAILED', 'QUOTA_EXCEEDED'].map((st) => (
                            <button
                                key={st}
                                onClick={() => handleFilterChange(st)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.75rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    border: statusFilter === st ? '1px solid #818cf8' : '1px solid transparent',
                                    background: statusFilter === st ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)',
                                    color: statusFilter === st ? '#c4b5fd' : '#94a3b8'
                                }}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications Log Table */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            Loading email notification logs...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#64748b' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                            <div style={{ fontWeight: '600', color: '#94a3b8' }}>No email notification records found</div>
                            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                                Approval events will automatically queue emails here whenever test categories are activated.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {notifications.map((notif) => {
                                const statusColors = {
                                    SENT: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', text: '#10b981' },
                                    PENDING: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#f59e0b' },
                                    FAILED: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#ef4444' },
                                    QUOTA_EXCEEDED: { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', text: '#fb923c' }
                                };
                                const color = statusColors[notif.status] || { bg: '#1e293b', border: '#334155', text: '#cbd5e1' };

                                return (
                                    <div
                                        key={notif._id || notif.notificationId}
                                        style={{
                                            background: '#131c31',
                                            border: '1px solid #1e293b',
                                            borderRadius: '12px',
                                            padding: '14px 18px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: '800',
                                                    padding: '3px 10px',
                                                    borderRadius: '6px',
                                                    background: color.bg,
                                                    border: `1px solid ${color.border}`,
                                                    color: color.text,
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {notif.status}
                                                </span>
                                                <span style={{ color: '#ffffff', fontWeight: '700', fontSize: '0.92rem' }}>
                                                    {notif.studentName || 'Student'}
                                                </span>
                                                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                                                    ({notif.studentEmail})
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                                    {new Date(notif.createdAt).toLocaleString('en-IN', {
                                                        day: '2-digit', month: 'short', year: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                                {(notif.status === 'FAILED' || notif.status === 'QUOTA_EXCEEDED' || notif.status === 'PENDING') && (
                                                    <button
                                                        onClick={() => handleRetry(notif.notificationId)}
                                                        disabled={retryingId === notif.notificationId}
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: '700',
                                                            padding: '4px 12px',
                                                            borderRadius: '8px',
                                                            border: '1px solid rgba(99,102,241,0.5)',
                                                            background: 'rgba(99,102,241,0.2)',
                                                            color: '#c4b5fd',
                                                            cursor: retryingId === notif.notificationId ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        {retryingId === notif.notificationId ? 'Retrying...' : '🔄 Resend Email'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                                                    Activated:
                                                </span>
                                                {notif.activatedCategories?.map((cat) => (
                                                    <span
                                                        key={cat}
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            fontWeight: '700',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            background: 'rgba(16,185,129,0.1)',
                                                            border: '1px solid rgba(16,185,129,0.3)',
                                                            color: '#10b981'
                                                        }}
                                                    >
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: '#64748b' }}>
                                                <span>Source: <strong style={{ color: '#cbd5e1' }}>{notif.triggerSource || 'ADMIN'}</strong></span>
                                                <span>Admin: <strong style={{ color: '#cbd5e1' }}>{notif.triggeredBy || 'Admin'}</strong></span>
                                                {notif.providerMessageId && (
                                                    <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                                                        ID: {notif.providerMessageId.slice(0, 12)}...
                                                    </span>
                                                )}
                                                {notif.retryCount > 0 && (
                                                    <span style={{ color: '#f59e0b' }}>
                                                        Retries: {notif.retryCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {notif.errorMessage && (
                                            <div style={{
                                                fontSize: '0.75rem',
                                                background: 'rgba(239,68,68,0.1)',
                                                border: '1px solid rgba(239,68,68,0.3)',
                                                borderRadius: '6px',
                                                padding: '6px 10px',
                                                color: '#f87171'
                                            }}>
                                                ⚠️ Error: {notif.errorMessage}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div style={{
                    padding: '14px 24px',
                    borderTop: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#090d16'
                }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Showing up to 100 recent automated email notifications.
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 20px',
                            background: '#1e293b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#cbd5e1',
                            fontWeight: '600',
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
}

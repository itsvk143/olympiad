'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MANDATORY_CHECK_KEYS, MANDATORY_CHECK_LABELS } from '@/lib/testAuditConstants';
import styles from './AdminTestAudit.module.css';

const LatexRenderer = dynamic(() => import('@/components/LatexRenderer'), { ssr: false });

export default function AdminTestAudit() {
    // 1. Data State
    const [tests, setTests] = useState([]);
    const [kpis, setKpis] = useState({
        totalTests: 0,
        testsWithSavedReports: 0,
        testsWithAiErrors: 0,
        testsAwaitingManualAudit: 0,
        testsManuallyPassed: 0,
        testsApprovedByAdmin: 0
    });
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 25, totalMatches: 0, totalPages: 1 });

    // 2. Filter & Search State
    const [search, setSearch] = useState('');
    const [examFilter, setExamFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [subjectFilter, setSubjectFilter] = useState('ALL');
    const [auditStatusFilter, setAuditStatusFilter] = useState('ALL');
    const [approvalFilter, setApprovalFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('testId');
    const [sortOrder, setSortOrder] = useState('asc');

    // 3. Expanded Report Inline State
    const [expandedTestId, setExpandedTestId] = useState(null);
    const [loadedReport, setLoadedReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [expandedQuestionId, setExpandedQuestionId] = useState(null);

    // 4. Modals State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importJsonText, setImportJsonText] = useState('');
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState(null);
    const [importSuccess, setImportSuccess] = useState(null);

    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyTestId, setHistoryTestId] = useState(null);
    const [historyList, setHistoryList] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // { testId, reportId, reportVersion }
    const [deleteMode, setDeleteMode] = useState('SELECTED'); // 'SELECTED' | 'ALL'
    const [deleting, setDeleting] = useState(false);

    // 5. Manual Checkbox Pending State (for saving indicator)
    const [savingQuestionId, setSavingQuestionId] = useState(null);
    const [approving, setApproving] = useState(false);

    // 6. Fetch Tests Directory
    const fetchTests = useCallback(async (pageOverride) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search,
                exam: examFilter,
                type: typeFilter,
                subject: subjectFilter,
                auditStatus: auditStatusFilter,
                approval: approvalFilter,
                page: String(pageOverride || pagination.page),
                limit: String(pagination.limit),
                sortBy,
                sortOrder
            });

            const res = await fetch(`/api/admin/test-audit/tests?${params.toString()}`);
            const data = await res.json();

            if (res.ok && data.success) {
                setTests(data.tests || []);
                setKpis(data.kpis || kpis);
                setPagination(data.pagination || pagination);
            }
        } catch (err) {
            console.error('Failed to fetch tests:', err);
        } finally {
            setLoading(false);
        }
    }, [search, examFilter, typeFilter, subjectFilter, auditStatusFilter, approvalFilter, pagination.page, pagination.limit, sortBy, sortOrder]);

    useEffect(() => {
        fetchTests();
    }, [fetchTests]);

    // 7. Load Complete Report when a test row is expanded
    const handleToggleExpand = async (testId, specificReportId = null) => {
        if (expandedTestId === testId && !specificReportId) {
            setExpandedTestId(null);
            setLoadedReport(null);
            return;
        }

        setExpandedTestId(testId);
        setReportLoading(true);
        setLoadedReport(null);

        try {
            const url = specificReportId
                ? `/api/admin/test-audit/reports?testId=${encodeURIComponent(testId)}&reportId=${encodeURIComponent(specificReportId)}`
                : `/api/admin/test-audit/reports?testId=${encodeURIComponent(testId)}`;

            const res = await fetch(url);
            const data = await res.json();

            if (res.ok && data.success) {
                setLoadedReport(data.report);
                // Expand first question by default
                if (data.report?.questions?.[0]) {
                    setExpandedQuestionId(data.report.questions[0].questionId);
                }
            } else {
                setLoadedReport(null);
            }
        } catch (err) {
            console.error('Error loading report:', err);
            setLoadedReport(null);
        } finally {
            setReportLoading(false);
        }
    };

    // 8. Handle Manual Passed Checkbox toggle
    const handleTogglePassed = async (questionId, currentVal) => {
        if (!expandedTestId) return;
        const newVal = !currentVal;
        setSavingQuestionId(questionId);

        try {
            const res = await fetch('/api/admin/test-audit/manual-pass', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: expandedTestId,
                    questionId,
                    passed: newVal
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                // Update in local report state
                setLoadedReport(prev => {
                    if (!prev) return prev;
                    const updatedQuestions = (prev.questions || []).map(q => {
                        if (String(q.questionId) === String(questionId)) {
                            return { ...q, isManuallyPassed: newVal };
                        }
                        return q;
                    });
                    return {
                        ...prev,
                        questions: updatedQuestions,
                        adminApproval: {
                            ...prev.adminApproval,
                            isApproved: data.isApproved
                        }
                    };
                });

                // Update in table directory state
                setTests(prev => prev.map(t => {
                    if (t.testId === expandedTestId) {
                        return {
                            ...t,
                            manualPassed: data.manualPassedCount,
                            manualPending: data.manualPendingCount,
                            auditProgress: data.auditProgress,
                            isApproved: data.isApproved,
                            adminApproval: data.isApproved ? 'Approved' : 'Not Approved'
                        };
                    }
                    return t;
                }));
            }
        } catch (err) {
            console.error('Error updating manual passed status:', err);
        } finally {
            setSavingQuestionId(null);
        }
    };

    // 9. Handle Admin Approval Toggle
    const handleToggleAdminApproval = async (currentVal) => {
        if (!expandedTestId) return;
        const newVal = !currentVal;
        setApproving(true);

        try {
            const res = await fetch('/api/admin/test-audit/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: expandedTestId,
                    isApproved: newVal
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setLoadedReport(prev => prev ? ({ ...prev, adminApproval: data.adminApproval }) : prev);
                setTests(prev => prev.map(t => {
                    if (t.testId === expandedTestId) {
                        return {
                            ...t,
                            isApproved: newVal,
                            adminApproval: newVal ? 'Approved' : 'Not Approved',
                            adminApprovalDetails: data.adminApproval
                        };
                    }
                    return t;
                }));
                setKpis(prev => ({
                    ...prev,
                    testsApprovedByAdmin: newVal ? prev.testsApprovedByAdmin + 1 : Math.max(0, prev.testsApprovedByAdmin - 1)
                }));
            } else {
                alert(data.error || 'Failed to update Admin Approval.');
            }
        } catch (err) {
            console.error('Error toggling approval:', err);
            alert('An error occurred while updating Admin Approval.');
        } finally {
            setApproving(false);
        }
    };

    // 10. Handle Report Import
    const handleImportSubmit = async (e) => {
        e.preventDefault();
        setImportError(null);
        setImportSuccess(null);

        if (!importJsonText.trim()) {
            setImportError('Please paste an Antigravity JSON report to import.');
            return;
        }

        let parsed;
        try {
            parsed = JSON.parse(importJsonText);
        } catch (parseErr) {
            setImportError(`Invalid JSON format: ${parseErr.message}`);
            return;
        }

        setImporting(true);
        try {
            const res = await fetch('/api/admin/test-audit/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed)
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setImportSuccess(`Success! ${data.message}`);
                setImportJsonText('');
                // Refresh list and reload active report if expanded
                fetchTests();
                if (expandedTestId === parsed.testId) {
                    handleToggleExpand(parsed.testId, data.reportId);
                }
            } else {
                const errDetail = data.validationErrors ? `\n• ${data.validationErrors.join('\n• ')}` : '';
                setImportError((data.error || 'Failed to import report.') + errDetail);
            }
        } catch (err) {
            console.error('Import error:', err);
            setImportError('Network error while importing audit report.');
        } finally {
            setImporting(false);
        }
    };

    // 11. Handle View History Modal
    const handleOpenHistory = async (testId) => {
        setHistoryTestId(testId);
        setShowHistoryModal(true);
        setHistoryLoading(true);
        setHistoryList([]);

        try {
            const res = await fetch(`/api/admin/test-audit/reports?testId=${encodeURIComponent(testId)}&history=true`);
            const data = await res.json();
            if (res.ok && data.success) {
                setHistoryList(data.history || []);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    // 12. Handle Delete Report Modal
    const handleOpenDelete = (testId, reportId, reportVersion) => {
        setDeleteTarget({ testId, reportId, reportVersion });
        setDeleteMode('SELECTED');
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);

        try {
            const res = await fetch('/api/admin/test-audit/reports', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: deleteTarget.testId,
                    reportId: deleteTarget.reportId,
                    mode: deleteMode
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setShowDeleteModal(false);
                setDeleteTarget(null);
                fetchTests();
                if (expandedTestId === deleteTarget.testId) {
                    if (deleteMode === 'ALL') {
                        setExpandedTestId(null);
                        setLoadedReport(null);
                    } else {
                        handleToggleExpand(deleteTarget.testId);
                    }
                }
            } else {
                alert(data.error || 'Failed to delete audit report.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('An error occurred while deleting the report.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.headerSection}>
                <div className={styles.titleArea}>
                    <h1 className={styles.title}>
                        <span>📋</span>
                        <span>Test Audit & Question Verification</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Manage Antigravity external AI audit reports, 9-point question validations, manual verification, and Admin Approval.
                    </p>
                </div>

                <button
                    onClick={() => {
                        setShowImportModal(true);
                        setImportError(null);
                        setImportSuccess(null);
                    }}
                    className={styles.importBtn}
                >
                    <span>📥</span>
                    <span>Import Audit Report</span>
                </button>
            </div>

            {/* Section 5.1: 6 Summary KPI Cards */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Total Tests</span>
                        <span className={styles.kpiIcon}>📚</span>
                    </div>
                    <div className={styles.kpiValue}>{kpis.totalTests}</div>
                    <span className={styles.kpiSub}>In database catalog</span>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Saved Reports</span>
                        <span className={styles.kpiIcon}>💾</span>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#818cf8' }}>{kpis.testsWithSavedReports}</div>
                    <span className={styles.kpiSub}>Audited tests</span>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>AI Errors</span>
                        <span className={styles.kpiIcon}>❌</span>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#ef4444' }}>{kpis.testsWithAiErrors}</div>
                    <span className={styles.kpiSub}>Tests with issues</span>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Awaiting Manual</span>
                        <span className={styles.kpiIcon}>⏳</span>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#f59e0b' }}>{kpis.testsAwaitingManualAudit}</div>
                    <span className={styles.kpiSub}>Pending admin review</span>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Manually Passed</span>
                        <span className={styles.kpiIcon}>✅</span>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#10b981' }}>{kpis.testsManuallyPassed}</div>
                    <span className={styles.kpiSub}>100% verified</span>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Admin Approved</span>
                        <span className={styles.kpiIcon}>🛡️</span>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#38bdf8' }}>{kpis.testsApprovedByAdmin}</div>
                    <span className={styles.kpiSub}>Officially approved</span>
                </div>
            </div>

            {/* Section 5.3: Filter & Search Bar */}
            <div className={styles.filterBar}>
                <div className={styles.filterRow}>
                    <input
                        type="text"
                        placeholder="Search by Test Name, Test ID, Question ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.searchInput}
                    />

                    <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)} className={styles.selectInput}>
                        <option value="ALL">All Exams</option>
                        <option value="olympiad">Olympiad</option>
                    </select>

                    <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className={styles.selectInput}>
                        <option value="ALL">All Subjects</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="English">English</option>
                    </select>

                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={styles.selectInput}>
                        <option value="ALL">All Test Types</option>
                        <option value="Full Test">Full Test</option>
                        <option value="Part Test">Part Test</option>
                        <option value="Chapterwise">Chapterwise</option>
                        <option value="Topicwise">Topicwise</option>
                        <option value="Subjectwise">Subjectwise</option>
                        <option value="PYQ">PYQ</option>
                        <option value="Live Test">Live Test</option>
                    </select>

                    <select value={auditStatusFilter} onChange={(e) => setAuditStatusFilter(e.target.value)} className={styles.selectInput}>
                        <option value="ALL">All Audit Statuses</option>
                        <option value="Saved">With Saved Report</option>
                        <option value="Completed">Completed (Passed)</option>
                        <option value="Issues Found">Issues Found</option>
                        <option value="Partial">Partial</option>
                        <option value="Not Audited">No Audit Report Available</option>
                    </select>

                    <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)} className={styles.selectInput}>
                        <option value="ALL">All Approvals</option>
                        <option value="Approved">Admin Approved</option>
                        <option value="Not Approved">Not Approved</option>
                    </select>

                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={styles.selectInput}>
                        <option value="testId">Sort by: Test ID</option>
                        <option value="title">Sort by: Test Name</option>
                        <option value="totalQuestions">Sort by: Questions</option>
                        <option value="aiErrors">Sort by: AI Errors</option>
                        <option value="auditProgress">Sort by: Manual Progress</option>
                    </select>

                    <button
                        onClick={() => {
                            setSearch('');
                            setExamFilter('ALL');
                            setTypeFilter('ALL');
                            setSubjectFilter('ALL');
                            setAuditStatusFilter('ALL');
                            setApprovalFilter('ALL');
                            setSortBy('testId');
                            setSortOrder('asc');
                        }}
                        className={styles.resetBtn}
                    >
                        ↺ Reset
                    </button>
                </div>
            </div>

            {/* Section 5.2: Test Directory Table */}
            <div className={styles.tableCard}>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Test Name & ID</th>
                                <th>Exam</th>
                                <th>Type</th>
                                <th>Subject</th>
                                <th>Total Qs</th>
                                <th>Latest Audit</th>
                                <th>AI Audit Status</th>
                                <th>AI Errors</th>
                                <th>Manual Verified</th>
                                <th>Progress</th>
                                <th>Admin Approval</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tests.map((test) => {
                                const isExpanded = expandedTestId === test.testId;

                                return (
                                    <React.Fragment key={test.testId}>
                                        <tr>
                                            <td>
                                                <div style={{ fontWeight: 700, color: '#f8fafc' }}>{test.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{test.testId}</div>
                                            </td>
                                            <td><span style={{ fontWeight: 600 }}>{test.exam}</span></td>
                                            <td>{test.testType}</td>
                                            <td>{test.subject}</td>
                                            <td style={{ fontWeight: 600 }}>{test.totalQuestions}</td>
                                            <td>
                                                {test.latestAuditDate ? (
                                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                        {new Date(test.latestAuditDate).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                {test.hasReport ? (
                                                    test.aiAuditStatus === 'Completed' ? (
                                                        <span className={styles.badgeCompleted}>Completed</span>
                                                    ) : test.aiAuditStatus === 'Issues Found' ? (
                                                        <span className={styles.badgeIssues}>Issues Found</span>
                                                    ) : (
                                                        <span className={styles.badgePartial}>{test.aiAuditStatus}</span>
                                                    )
                                                ) : (
                                                    <span className={styles.badgeNotAudited}>No Audit Report Available</span>
                                                )}
                                            </td>
                                            <td>
                                                {test.aiErrors > 0 ? (
                                                    <span style={{ color: '#ef4444', fontWeight: 700 }}>{test.aiErrors} error{test.aiErrors > 1 ? 's' : ''}</span>
                                                ) : test.hasReport ? (
                                                    <span style={{ color: '#10b981', fontWeight: 600 }}>0 errors</span>
                                                ) : (
                                                    <span style={{ color: '#64748b' }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                {test.hasReport ? (
                                                    <span>{test.manualPassed} / {test.totalQuestions}</span>
                                                ) : (
                                                    <span style={{ color: '#64748b' }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                {test.hasReport ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <div style={{ width: '48px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${test.auditProgress}%`, height: '100%', background: test.auditProgress === 100 ? '#10b981' : '#6366f1' }} />
                                                        </div>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{test.auditProgress}%</span>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#64748b' }}>—</span>
                                                )}
                                            </td>
                                            <td>
                                                {test.isApproved ? (
                                                    <span className={styles.badgeApproved}>🛡️ Approved</span>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Not Approved</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    {test.hasReport ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleToggleExpand(test.testId)}
                                                                className={`${styles.actionBtn} ${isExpanded ? styles.actionBtnPrimary : ''}`}
                                                                title="View complete question findings inline"
                                                            >
                                                                {isExpanded ? '▲ Hide Report' : '👁️ View Report'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenHistory(test.testId)}
                                                                className={styles.actionBtn}
                                                                title="View historical audit reports"
                                                            >
                                                                📜 History
                                                            </button>
                                                            <button
                                                                onClick={() => handleOpenDelete(test.testId, test.latestReportId, test.reportVersion)}
                                                                className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                                                title="Delete audit report"
                                                            >
                                                                🗑️ Delete
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setImportJsonText(`{\n  "testId": "${test.testId}",\n  "auditDate": "${new Date().toISOString()}",\n  "questions": []\n}`);
                                                                setShowImportModal(true);
                                                            }}
                                                            className={styles.actionBtn}
                                                            title="Import an Antigravity audit report for this test"
                                                        >
                                                            📥 Import Report
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Section 8: Inline Expanded Complete Report */}
                                        {isExpanded && (
                                            <tr className={styles.expandedRow}>
                                                <td colSpan={12} style={{ padding: 0 }}>
                                                    <div className={styles.expandedContent}>
                                                        {reportLoading ? (
                                                            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                                                Loading complete question-level findings...
                                                            </div>
                                                        ) : loadedReport ? (
                                                            <div>
                                                                {/* Report Header Card */}
                                                                <div className={styles.reportHeaderCard}>
                                                                    <div className={styles.reportHeaderMeta}>
                                                                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                                                                            {loadedReport.testTitle} ({loadedReport.testId})
                                                                        </div>
                                                                        <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                                                            Report Version: <strong>v{loadedReport.reportVersion}</strong> •
                                                                            Audited by Antigravity: <strong>{new Date(loadedReport.auditDate).toLocaleString()}</strong> •
                                                                            Imported: <strong>{new Date(loadedReport.importedAt).toLocaleString()}</strong> by {loadedReport.importedBy}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.84rem', color: '#cbd5e1', marginTop: '6px' }}>
                                                                            <strong>Overall Findings:</strong> {loadedReport.summary?.overallFindings}
                                                                        </div>
                                                                    </div>

                                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                        <div style={{ textAlign: 'center', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155' }}>
                                                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>QUESTIONS PROCESSED</div>
                                                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                                                                                {loadedReport.summary?.totalQuestionsProcessed} / {loadedReport.summary?.totalQuestionsExpected}
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ textAlign: 'center', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #10b981' }}>
                                                                            <div style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>AI PASSES</div>
                                                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                                                                                {loadedReport.summary?.aiPasses || 0}
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ textAlign: 'center', background: '#0f172a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ef4444' }}>
                                                                            <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>AI FAILURES</div>
                                                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>
                                                                                {loadedReport.summary?.aiFailures || 0}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Section 12: Separate Admin Approval Checkbox */}
                                                                <div className={styles.approvalSection}>
                                                                    <label className={styles.approvalCheckboxLabel}>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={Boolean(loadedReport.adminApproval?.isApproved)}
                                                                            disabled={approving || test.auditProgress < 100}
                                                                            onChange={() => handleToggleAdminApproval(loadedReport.adminApproval?.isApproved)}
                                                                            className={styles.approvalCheckbox}
                                                                        />
                                                                        <span>
                                                                            Admin Approval — I confirm that every question in this test has been manually reviewed and approved.
                                                                        </span>
                                                                    </label>

                                                                    <div>
                                                                        {loadedReport.adminApproval?.isApproved ? (
                                                                            <span style={{ fontSize: '0.82rem', color: '#a5b4fc', fontWeight: 600 }}>
                                                                                ✅ Approved by {loadedReport.adminApproval.approvedBy} on {new Date(loadedReport.adminApproval.approvedAt).toLocaleDateString()}
                                                                            </span>
                                                                        ) : test.auditProgress < 100 ? (
                                                                            <span style={{ fontSize: '0.82rem', color: '#f59e0b' }}>
                                                                                ⚠️ Locked until all {test.totalQuestions} questions are manually marked as Passed ({test.manualPassed}/{test.totalQuestions} verified)
                                                                            </span>
                                                                        ) : (
                                                                            <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
                                                                                Ready for Admin Approval
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Section 8.2: Question Details List */}
                                                                <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
                                                                        Audited Questions ({loadedReport.questions?.length || 0})
                                                                    </h3>
                                                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                                        Click any question card to expand all 9 check findings
                                                                    </span>
                                                                </div>

                                                                <div>
                                                                    {(loadedReport.questions || []).map((q) => {
                                                                        const isQExpanded = expandedQuestionId === q.questionId;
                                                                        const isSavingThisQ = savingQuestionId === q.questionId;

                                                                        return (
                                                                            <div key={q.questionId} className={styles.questionCard}>
                                                                                {/* Question Header Accordion */}
                                                                                <div
                                                                                    className={`${styles.questionCardHeader} ${isQExpanded ? styles.questionCardHeaderExpanded : ''}`}
                                                                                    onClick={() => setExpandedQuestionId(isQExpanded ? null : q.questionId)}
                                                                                >
                                                                                    <div className={styles.questionTitleGroup}>
                                                                                        <span style={{ fontWeight: 800, color: '#f8fafc', minWidth: '40px' }}>#{q.qNum}</span>
                                                                                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {q.questionId}</span>
                                                                                        {q.aiResult === 'Pass' ? (
                                                                                            <span className={styles.badgeCompleted}>AI: Pass</span>
                                                                                        ) : q.aiResult === 'Fail' ? (
                                                                                            <span className={styles.badgeIssues}>AI: Fail</span>
                                                                                        ) : (
                                                                                            <span className={styles.badgePartial}>AI: {q.aiResult}</span>
                                                                                        )}
                                                                                        {q.isStale && (
                                                                                            <span style={{ background: '#78350f', color: '#fef3c7', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                                                                ⚠️ Content Modified Since Audit
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Section 10: Manual Passed Checkbox */}
                                                                                    <div
                                                                                        className={styles.manualPassGroup}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    >
                                                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, color: q.isManuallyPassed ? '#34d399' : '#cbd5e1' }}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={Boolean(q.isManuallyPassed)}
                                                                                                disabled={isSavingThisQ}
                                                                                                onChange={() => handleTogglePassed(q.questionId, q.isManuallyPassed)}
                                                                                                className={styles.manualPassCheckbox}
                                                                                            />
                                                                                            <span>{isSavingThisQ ? 'Saving...' : 'Manual Passed'}</span>
                                                                                        </label>
                                                                                        <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '8px' }}>
                                                                                            {isQExpanded ? '▲' : '▼'}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Question Body with 9 Checks */}
                                                                                {isQExpanded && (
                                                                                    <div className={styles.questionBody}>
                                                                                        {/* Statement with KaTeX */}
                                                                                        <div style={{ background: '#0f172a', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
                                                                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>
                                                                                                QUESTION STATEMENT:
                                                                                            </div>
                                                                                            <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                                                                                                <LatexRenderer text={q.questionText} />
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Section 7: Individual Option Audit Details */}
                                                                                        <div>
                                                                                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
                                                                                                OPTION-LEVEL VALIDATION:
                                                                                            </div>
                                                                                            <table className={styles.table} style={{ background: '#0f172a', borderRadius: '8px' }}>
                                                                                                <thead>
                                                                                                    <tr>
                                                                                                        <th style={{ width: '80px' }}>Option</th>
                                                                                                        <th style={{ width: '120px' }}>Available?</th>
                                                                                                        <th style={{ width: '130px' }}>Valid?</th>
                                                                                                        <th>Saved AI Finding</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody>
                                                                                                    {['A', 'B', 'C', 'D'].map(optKey => {
                                                                                                        const optFinding = q.optionChecks?.[optKey] || { available: true, valid: 'Not Recorded', finding: 'Not recorded in this report.' };
                                                                                                        const rawOpt = Array.isArray(q.options)
                                                                                                            ? q.options[optKey.charCodeAt(0) - 65]
                                                                                                            : null;
                                                                                                        const optText = typeof rawOpt === 'string' ? rawOpt : (rawOpt?.text || rawOpt?.value || '');

                                                                                                        return (
                                                                                                            <tr key={optKey}>
                                                                                                                <td style={{ fontWeight: 800, color: '#f8fafc' }}>
                                                                                                                    Option {optKey}
                                                                                                                </td>
                                                                                                                <td>
                                                                                                                    {optFinding.available !== false ? (
                                                                                                                        <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Yes</span>
                                                                                                                    ) : (
                                                                                                                        <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ Missing</span>
                                                                                                                    )}
                                                                                                                </td>
                                                                                                                <td>
                                                                                                                    {optFinding.valid === 'Pass' ? (
                                                                                                                        <span className={styles.badgeCompleted}>Pass</span>
                                                                                                                    ) : optFinding.valid === 'Fail' ? (
                                                                                                                        <span className={styles.badgeIssues}>Fail</span>
                                                                                                                    ) : (
                                                                                                                        <span className={styles.badgeNotAudited}>{optFinding.valid}</span>
                                                                                                                    )}
                                                                                                                </td>
                                                                                                                <td>
                                                                                                                    <div style={{ fontSize: '0.82rem' }}>
                                                                                                                        {optText && (
                                                                                                                            <div style={{ marginBottom: '4px', color: '#cbd5e1' }}>
                                                                                                                                <LatexRenderer text={optText} />
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                        <div style={{ color: '#94a3b8' }}>{optFinding.finding}</div>
                                                                                                                    </div>
                                                                                                                </td>
                                                                                                            </tr>
                                                                                                        );
                                                                                                    })}
                                                                                                </tbody>
                                                                                            </table>
                                                                                        </div>

                                                                                        {/* Answer & Explanation Section */}
                                                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                                                                                            <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                                                                                                <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>STORED ANSWER KEY:</div>
                                                                                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                                                                                                    {String(q.storedAnswer).toUpperCase() || 'N/A'}
                                                                                                </div>
                                                                                                {q.derivedAnswer && (
                                                                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                                                                                                        Independently Derived: <strong>{String(q.derivedAnswer).toUpperCase()}</strong>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>

                                                                                            <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', border: '1px solid #334155' }}>
                                                                                                <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700 }}>STORED EXPLANATION:</div>
                                                                                                <div style={{ fontSize: '0.88rem', color: '#e2e8f0', marginTop: '4px', lineHeight: 1.5 }}>
                                                                                                    {q.storedExplanation ? (
                                                                                                        <LatexRenderer text={q.storedExplanation} />
                                                                                                    ) : (
                                                                                                        <span style={{ color: '#ef4444' }}>Missing explanation</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Section 6: The 9 Mandatory Question Checks Grid */}
                                                                                        <div>
                                                                                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
                                                                                                MANDATORY NINE-POINT QUESTION AUDIT CHECKLIST:
                                                                                            </div>

                                                                                            <div className={styles.checksGrid}>
                                                                                                {MANDATORY_CHECK_KEYS.map(checkKey => {
                                                                                                    const check = q.checks?.[checkKey] || { status: 'Not Recorded', finding: 'Not recorded in this report.' };
                                                                                                    const label = MANDATORY_CHECK_LABELS[checkKey];

                                                                                                    return (
                                                                                                        <div key={checkKey} className={styles.checkItemCard}>
                                                                                                            <div className={styles.checkItemHeader}>
                                                                                                                <span>{label}</span>
                                                                                                                {check.status === 'Pass' ? (
                                                                                                                    <span className={styles.badgeCompleted}>Pass</span>
                                                                                                                ) : check.status === 'Fail' ? (
                                                                                                                    <span className={styles.badgeIssues}>Fail</span>
                                                                                                                ) : (
                                                                                                                    <span className={styles.badgeNotAudited}>{check.status}</span>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <div className={styles.checkItemFinding}>
                                                                                                                {check.finding || 'No additional comments.'}
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Detailed Findings & Suggested Corrections */}
                                                                                        {(q.detailedFindings || q.suggestedCorrections) && (
                                                                                            <div style={{ background: '#172033', padding: '16px', borderRadius: '10px', border: '1px solid #475569' }}>
                                                                                                {q.detailedFindings && (
                                                                                                    <div style={{ marginBottom: q.suggestedCorrections ? '10px' : 0 }}>
                                                                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>DETAILED AI FINDINGS:</div>
                                                                                                        <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '2px' }}>{q.detailedFindings}</div>
                                                                                                    </div>
                                                                                                )}
                                                                                                {q.suggestedCorrections && (
                                                                                                    <div>
                                                                                                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>SUGGESTED CORRECTIONS:</div>
                                                                                                        <div style={{ fontSize: '0.85rem', color: '#fde68a', marginTop: '2px' }}>{q.suggestedCorrections}</div>
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                                                No audit findings recorded for this test.
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}

                            {tests.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        No tests found matching the current search & filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className={styles.paginationBar}>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                        Showing {tests.length} of {pagination.totalMatches} tests (Page {pagination.page} of {pagination.totalPages})
                    </span>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => {
                                const newP = pagination.page - 1;
                                setPagination(prev => ({ ...prev, page: newP }));
                                fetchTests(newP);
                            }}
                            disabled={pagination.page <= 1}
                            className={styles.pageBtn}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => {
                                const newP = pagination.page + 1;
                                setPagination(prev => ({ ...prev, page: newP }));
                                fetchTests(newP);
                            }}
                            disabled={pagination.page >= pagination.totalPages}
                            className={styles.pageBtn}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 4: Import Audit Report Modal */}
            {showImportModal && (
                <div className={styles.modalBackdrop} onClick={() => setShowImportModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowImportModal(false)}>✕</button>

                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                            📥 Import Antigravity Audit Report
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '14px' }}>
                            Paste the structured JSON audit report generated externally by Antigravity. The report will be strictly validated against the database.
                        </p>

                        {importError && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px', whiteSpace: 'pre-wrap' }}>
                                ⚠️ {importError}
                            </div>
                        )}

                        {importSuccess && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
                                ✅ {importSuccess}
                            </div>
                        )}

                        <form onSubmit={handleImportSubmit}>
                            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase' }}>
                                Audit Report JSON:
                            </label>
                            <textarea
                                value={importJsonText}
                                onChange={(e) => setImportJsonText(e.target.value)}
                                placeholder="Paste Antigravity JSON report here..."
                                className={styles.jsonTextarea}
                            />

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className={styles.actionBtn}
                                    style={{ padding: '8px 16px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={importing}
                                    className={styles.importBtn}
                                    style={{ padding: '8px 18px' }}
                                >
                                    {importing ? 'Validating & Importing...' : 'Validate & Import Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Section 9: Audit History Modal */}
            {showHistoryModal && (
                <div className={styles.modalBackdrop} onClick={() => setShowHistoryModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowHistoryModal(false)}>✕</button>

                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                            📜 Audit History — {historyTestId}
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
                            Persistent audit history. Inspect any previously imported report version.
                        </p>

                        {historyLoading ? (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Loading history...</div>
                        ) : historyList.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {historyList.map(h => (
                                    <div
                                        key={h._id}
                                        style={{
                                            background: '#0f172a',
                                            border: h.isLatest ? '1px solid #6366f1' : '1px solid #334155',
                                            borderRadius: '10px',
                                            padding: '14px 16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '12px'
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 800, color: '#f8fafc' }}>Version {h.reportVersion}</span>
                                                {h.isLatest && (
                                                    <span style={{ background: 'rgba(99, 102, 241, 0.25)', color: '#818cf8', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                                        Current Latest
                                                    </span>
                                                )}
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Status: {h.auditStatus}</span>
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                                                Audited: {new Date(h.auditDate).toLocaleDateString()} •
                                                Imported: {new Date(h.importedAt).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                                                Passes: {h.summary?.aiPasses || 0} • Failures: {h.summary?.aiFailures || 0} • Warnings: {h.summary?.aiWarnings || 0}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setShowHistoryModal(false);
                                                handleToggleExpand(historyTestId, h._id);
                                            }}
                                            className={styles.actionBtnPrimary}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        >
                                            Inspect This Version
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                No historical reports found.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Section 13: Delete Audit Report Confirmation Modal */}
            {showDeleteModal && deleteTarget && (
                <div className={styles.modalBackdrop} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowDeleteModal(false)}>✕</button>

                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444', marginBottom: '6px' }}>
                            🗑️ Delete Audit Report
                        </h2>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '16px' }}>
                            Choose the deletion scope for test <strong>{deleteTarget.testId}</strong>.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#0f172a', padding: '14px', borderRadius: '10px', border: deleteMode === 'SELECTED' ? '1px solid #ef4444' : '1px solid #334155', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="deleteMode"
                                    value="SELECTED"
                                    checked={deleteMode === 'SELECTED'}
                                    onChange={() => setDeleteMode('SELECTED')}
                                    style={{ marginTop: '3px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                                        Option A: Delete Selected AI Audit Report (v{deleteTarget.reportVersion})
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                        Deletes only this report version. Preserves other historical reports and manual audit records.
                                    </div>
                                </div>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#0f172a', padding: '14px', borderRadius: '10px', border: deleteMode === 'ALL' ? '1px solid #ef4444' : '1px solid #334155', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="deleteMode"
                                    value="ALL"
                                    checked={deleteMode === 'ALL'}
                                    onChange={() => setDeleteMode('ALL')}
                                    style={{ marginTop: '3px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.92rem' }}>
                                        Option B: Delete All Audit Reports for This Test
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                                        Deletes all audit reports and resets manual verification progress and Admin Approval for this test.
                                    </div>
                                </div>
                            </label>
                        </div>

                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', color: '#fca5a5', marginBottom: '20px' }}>
                            🛡️ <strong>Safety Guarantee:</strong> This operation deletes ONLY audit findings. It will NEVER delete tests, question bank questions, student attempts, marks, or payments.
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className={styles.actionBtn}
                                style={{ padding: '8px 16px' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleConfirmDelete}
                                className={styles.actionBtnDanger}
                                style={{ padding: '8px 18px', fontWeight: 700 }}
                            >
                                {deleting ? 'Deleting...' : 'Confirm Deletion'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

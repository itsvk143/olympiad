'use client';
import { useState, useEffect, use, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '../../../../components/Navbar';
import { getTestById, getQuestionsForTest } from '../../../../data/testService';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
import TestIntegrityWarning from '../../../../components/TestIntegrityWarning';
import QuestionReportModal from '../../../../components/QuestionReportModal';
import LeaveTestModal from '@/components/LeaveTestModal';
const LatexRenderer = dynamic(() => import('../../../../components/LatexRenderer'), {
  ssr: false,
  loading: () => <span style={{ opacity: 0.5 }}>Loading format...</span>
});
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    normalizeToCanonicalExam,
    getCanonicalExamDisplay,
    extractTestExam,
    canonicalToExamSlug
} from '@/lib/authorization';
import { formatQuestionToLegacy } from '@/lib/questionFormatter';

export default function TestPage({ params }) {
    const unwrappedParams = use(params);
    const { exam, testId } = unwrappedParams;

    const { data: session, status } = useSession();
    const router = useRouter();

    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [markedForReview, setMarkedForReview] = useState({});
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [expandedPalette, setExpandedPalette] = useState({});
    const [paletteOpen, setPaletteOpen] = useState(false); // mobile sidebar toggle
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewMode, setViewMode] = useState('TEST'); // TEST, ANALYSIS, REVIEW
    const [hasStarted, setHasStarted] = useState(false);
    const [timeSpent, setTimeSpent] = useState({}); // { questionId: seconds }
    const [rank, setRank] = useState('N/A');
    const [totalRankStudents, setTotalRankStudents] = useState(0);
    const [liveRank, setLiveRank] = useState('N/A');
    const [totalLiveStudents, setTotalLiveStudents] = useState(0);
    const [isLiveAttempt, setIsLiveAttempt] = useState(false);
    const [testAttemptId] = useState(() => {
        if (typeof window !== 'undefined') {
            const key = `test_attempt_${testId}`;
            const stored = sessionStorage.getItem(key);
            if (stored) return stored;
            const newId = `attempt_${testId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            sessionStorage.setItem(key, newId);
            return newId;
        }
        return `attempt_${testId}_${Date.now()}`;
    });
    const [violationCount, setViolationCount] = useState(0);
    const [violations, setViolations] = useState([]);
    const startTimeRef = useRef(null);

    // Test Protection, Navigation Interception & Autosave State
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [isLeaveSubmitting, setIsLeaveSubmitting] = useState(false);
    const [leaveErrorMessage, setLeaveErrorMessage] = useState('');
    const [pendingNavUrl, setPendingNavUrl] = useState(null);
    const [saveStatus, setSaveStatus] = useState('IDLE'); // 'IDLE', 'SAVING', 'SAVED', 'ERROR'
    const [isSubmittingTest, setIsSubmittingTest] = useState(false);
    const isSubmittingRef = useRef(false);
    const autosaveTimerRef = useRef(null);
    const retryTimerRef = useRef(null);
    const answersRef = useRef(answers);
    answersRef.current = answers;
    const markedRef = useRef(markedForReview);
    markedRef.current = markedForReview;
    const qIndexRef = useRef(currentQuestionIndex);
    qIndexRef.current = currentQuestionIndex;
    const timeLeftRef = useRef(timeLeft);
    timeLeftRef.current = timeLeft;
    const timeSpentRef = useRef(timeSpent);
    timeSpentRef.current = timeSpent;

    // Question Reporting System state
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [userReports, setUserReports] = useState({}); // { [questionId]: reportObj }

    // Fetch student's reports for this test
    useEffect(() => {
        if (!session?.user?.email || !testId) return;
        let isMounted = true;
        const fetchReports = async () => {
            try {
                const res = await fetch(`/api/reports?testId=${encodeURIComponent(testId)}`);
                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (data.reports) {
                        const map = {};
                        data.reports.forEach(r => {
                            if (r.questionId) {
                                map[String(r.questionId)] = r;
                            }
                        });
                        setUserReports(map);
                    }
                }
            } catch (err) {
                console.error('Failed to load user reports:', err);
            }
        };
        fetchReports();
        return () => { isMounted = false; };
    }, [session?.user?.email, testId]);

    const handleReportSubmitted = (newReport) => {
        if (!newReport || !currentQuestion) return;
        const qKey = String(currentQuestion.id || currentQuestion._id || '');
        setUserReports(prev => ({
            ...prev,
            [qKey]: newReport
        }));
    };

    // Fullscreen helpers
    const enterFullscreen = () => {
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
    };

    const exitFullscreen = () => {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    };

    const toggleFullscreen = () => {
        isFullscreen ? exitFullscreen() : enterFullscreen();
    };

    // Track fullscreen changes (user presses Esc etc.)
    useEffect(() => {
        const onFSChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFSChange);
        document.addEventListener('webkitfullscreenchange', onFSChange);
        return () => {
            document.removeEventListener('fullscreenchange', onFSChange);
            document.removeEventListener('webkitfullscreenchange', onFSChange);
        };
    }, []);

    // Authentication check - redirect if not logged in or if admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname));
        }
        // Admins should see the admin test view, not take the test
        if (status === 'authenticated' && session?.user?.isAdmin) {
            router.push(`/admin/test-preview?testId=${testId}&exam=${exam}`);
        }
    }, [status, session, router, testId, exam]);

    // Check profile completion and load existing result
    useEffect(() => {
        const checkProfileAndResult = async () => {
            if (status === 'authenticated') {
                try {
                    // Fetch fresh profile from API to ensure real-time admin permissions
                    let data;
                    try {
                        const res = await fetch('/api/user/profile');
                        data = await res.json();
                        sessionStorage.setItem('userProfile', JSON.stringify(data));
                    } catch (err) {
                        const cached = sessionStorage.getItem('userProfile');
                        if (cached) data = JSON.parse(cached);
                    }

                    let isAdmin = data?.isAdmin || data?.role === 'admin' || session?.user?.isAdmin;

                    // If they are an Admin, skip profile checks and permission blocks entirely.
                    if (isAdmin) {
                         return; // The other useEffect handles the Admin redirect to test-preview.
                    }

                    if (!isAdmin && !data?.profileCompleted) {
                        alert('Please complete your profile first to start the test.');
                        localStorage.removeItem('profileSkipped');
                        router.push('/dashboard');
                        return;
                    }

                    // Strict Single-Exam Verification: STUDENT EXAM must equal TEST EXAM
                    if (!isAdmin) {
                        const studentExam = normalizeToCanonicalExam(data?.exam || data?.examPreparingFor);
                        const testExam = extractTestExam(testId, null, exam);

                        if (studentExam && testExam && studentExam !== testExam) {
                            const studentLabel = getCanonicalExamDisplay(studentExam);
                            const testLabel = getCanonicalExamDisplay(testExam);
                            alert(`ACCESS DENIED: Your account is registered for ${studentLabel}. You cannot access ${testLabel} tests.`);
                            router.push(`/test-series/${canonicalToExamSlug(studentExam)}`);
                            return;
                        }
                    }

                    // Payment Verification: Paid test series entitlement required
                    if (!isAdmin) {
                        const isPaid = data?.paymentStatus === 'CONFIRMED' || data?.paymentStatus === 'PAID';
                        if (!isPaid) {
                            alert('This test is part of a premium test series. Please complete your Razorpay payment to unlock test access.');
                            router.push('/payment');
                            return;
                        }
                    }

                    // Granular per-type access check (unless user is admin)
                    if (!isAdmin) {
                        const defaultApprovals = { mock: true, live: false, pyq: true, subject: false, chapter: false, subtopic: false };
                        let approvals = data?.approvals || defaultApprovals;

                        // Determine test type from testId pattern
                        const testIdUpper = testId.toUpperCase();
                        let requiredKey = null;
                        if (testIdUpper.includes('-PART-'))          requiredKey = 'part';
                        else if (testIdUpper.includes('-LIVE-'))     requiredKey = 'live';
                        else if (testIdUpper.includes('-PYQ-'))      requiredKey = 'pyq';
                        else if (testIdUpper.includes('-CHAPTER-'))  requiredKey = 'chapter';
                        else if (testIdUpper.includes('-SUBJECT-'))  requiredKey = 'subject';
                        else if (testIdUpper.includes('-SUBTOPIC-')) requiredKey = 'subtopic';
                        else if (testIdUpper.includes('-MOCK-'))     requiredKey = 'mock';

                        const checkApproval = (appr) => {
                            if (!appr || !requiredKey) return true;
                            if (requiredKey === 'part') {
                                return appr.part !== undefined ? !!appr.part : (!!appr.mock || !!appr.live);
                            }
                            return !!appr[requiredKey];
                        };

                        // If requiredKey appears unapproved, re-fetch fresh from DB to prevent false positives
                        if (requiredKey && !checkApproval(approvals)) {
                            try {
                                const freshRes = await fetch('/api/user/profile');
                                const freshData = await freshRes.json();
                                if (freshData?.approvals) {
                                    data = freshData;
                                    approvals = freshData.approvals;
                                    sessionStorage.setItem('userProfile', JSON.stringify(freshData));
                                }
                            } catch (e) {
                                console.error('Error refreshing approvals:', e);
                            }
                        }

                        if (requiredKey && !checkApproval(approvals)) {
                            const typeLabels = { mock: 'Full Tests', part: 'Part Tests', live: 'Cumulative Tests', pyq: 'PYQ Tests', subject: 'Subject-wise Tests', chapter: 'Chapter-wise Tests', subtopic: 'Topic-wise Tests' };
                            alert(`You do not have access to ${typeLabels[requiredKey]} / ${requiredKey.toUpperCase()}. Please contact your administrator.`);
                            router.push('/dashboard');
                            return;
                        }
                    }

                    // Check for existing test result
                    const resultRes = await fetch(`/api/test-results?testId=${testId}`);
                    const resultData = await resultRes.json();
                    if (resultData && resultData.length > 0) {
                        const lastAttempt = resultData[0];
                        console.log("Found existing attempt:", lastAttempt);

                        // CRITICAL: Normalize questions snapshot so all fields (text, options with id/text, explanation) are guaranteed
                        const rawAttemptQuestions = (Array.isArray(lastAttempt.questions) && lastAttempt.questions.length > 0)
                            ? lastAttempt.questions
                            : (getQuestionsForTest(testId) || []);
                        const attemptQuestions = rawAttemptQuestions.map((q, idx) => formatQuestionToLegacy(q, idx + 1));

                        const calculatedScore = typeof lastAttempt.score === 'number'
                            ? lastAttempt.score
                            : (typeof lastAttempt.marksObtained === 'number' ? lastAttempt.marksObtained : 0);

                        // Update State with Snapshot Data
                        setQuestions(attemptQuestions); // Override default load
                        setAnswers(lastAttempt.answers || {});
                        setScore(calculatedScore);
                        setTimeSpent(lastAttempt.timeSpent || {});
                        setSubmitted(true);
                        setHasStarted(true);
                        setIsLiveAttempt(lastAttempt.isLiveAttempt || false);
                        setViewMode('ANALYSIS');

                        // Fetch Rank with re-calculated score
                        try {
                            const rankRes = await fetch('/api/rank', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ testId: testId, score: calculatedScore })
                            });
                            if (rankRes.ok) {
                                const rankData = await rankRes.json();
                                setRank(rankData.globalRank || rankData.rank);
                                setTotalRankStudents(rankData.totalGlobalStudents || rankData.totalStudents);
                                setLiveRank(rankData.liveRank);
                                setTotalLiveStudents(rankData.totalLiveStudents);
                            }
                        } catch (e) {
                            console.error("Error fetching rank:", e);
                        }
                    } else {
                        // Recover in-progress session if test was interrupted or reloaded
                        try {
                            let activeSession = null;
                            const sessionRes = await fetch(`/api/test-session?testId=${testId}`);
                            if (sessionRes.ok) {
                                const sData = await sessionRes.json();
                                if (sData?.session && sData.session.status === 'IN_PROGRESS') {
                                    activeSession = sData.session;
                                }
                            }

                            if (!activeSession && typeof window !== 'undefined') {
                                const local = localStorage.getItem(`test_session_${testId}`);
                                if (local) {
                                    try { activeSession = JSON.parse(local); } catch (e) {}
                                }
                            }

                            if (activeSession) {
                                const savedTime = activeSession.updatedAt ? new Date(activeSession.updatedAt).getTime() : (activeSession.timestamp || Date.now());
                                const elapsedSec = Math.max(0, Math.floor((Date.now() - savedTime) / 1000));
                                const recoveredTimeLeft = Math.max(0, (activeSession.timeLeft || 0) - elapsedSec);

                                setAnswers(activeSession.answers || {});
                                setMarkedForReview(activeSession.markedForReview || {});
                                if (typeof activeSession.currentQuestionIndex === 'number') {
                                    setCurrentQuestionIndex(activeSession.currentQuestionIndex);
                                }
                                if (activeSession.timeSpent) {
                                    setTimeSpent(activeSession.timeSpent);
                                }

                                if (recoveredTimeLeft <= 1) {
                                    setTimeLeft(0);
                                    setHasStarted(true);
                                    setTimeout(() => {
                                        handleSubmitRef.current?.();
                                    }, 800);
                                } else {
                                    setTimeLeft(recoveredTimeLeft);
                                    setHasStarted(true);
                                    setSaveStatus('SAVED');
                                }
                            }
                        } catch (recErr) {
                            console.warn('Session recovery failed:', recErr);
                        }
                    }
                } catch (error) {
                    console.error('Error checking profile or result:', error);
                }
            }
        };

        if (status === 'authenticated') {
            checkProfileAndResult();
        }
    }, [status, router, testId]);

    // Merged test metadata + questions loading
    useEffect(() => {
        let testData = getTestById(testId);
        if (!testData && testId) {
            const isSubtopic = testId.includes('SUBTOPIC');
            const isChapter = testId.includes('CHAPTER');
            const isSubject = testId.includes('SUBJECT');
            const isBitsatTest = testId.startsWith('bitsat') || exam?.toLowerCase() === 'bitsat';
            
            let duration = 180;
            let totalMarks = 300;
            let questionsCount = 90;

            if (isBitsatTest) {
                if (isSubtopic) {
                    duration = 30;
                    totalMarks = 60;
                    questionsCount = 20;
                } else if (isChapter) {
                    duration = 45;
                    totalMarks = 60;
                    questionsCount = 20;
                } else if (isSubject) {
                    duration = 60;
                    totalMarks = 90;
                    questionsCount = 30;
                } else {
                    duration = 180;
                    totalMarks = 390;
                    questionsCount = 130;
                }
            } else if (exam?.toUpperCase() === 'NEET' || testId.startsWith('neet')) {
                duration = (isSubtopic || isChapter || isSubject) ? 60 : 180;
                totalMarks = (isSubtopic || isChapter || isSubject) ? 180 : 720;
                questionsCount = (isSubtopic || isChapter || isSubject) ? 45 : 180;
            } else {
                duration = (isSubtopic || isChapter || isSubject) ? 60 : 180;
                totalMarks = (isSubtopic || isChapter || isSubject) ? 100 : 300;
                questionsCount = (isSubtopic || isChapter || isSubject) ? 25 : 75;
            }

            const cleanTitle = testId.replace(/^neet-|^jee-mains-|^jee-advance-|^bitsat-/i, '').replace(/[-_]/g, ' ');
            testData = {
                id: testId,
                title: cleanTitle,
                category: exam || (isBitsatTest ? 'bitsat' : (testId.startsWith('neet') ? 'neet' : 'jee-mains')),
                duration,
                totalMarks,
                questionsCount
            };
        }
        if (testData) {
            setTest(testData);
            setTimeLeft(prev => (prev > 0 ? prev : testData.duration * 60));
        }
        
        // Fetch questions from DB, fallback to local testService generator if not found
        const loadQuestions = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/questions?testId=${testId}`);
                if (res.ok) {
                    const dbData = await res.json();
                    if (Array.isArray(dbData) && dbData.length > 0) {
                        const formatted = dbData.map((q, idx) => formatQuestionToLegacy(q, idx + 1));
                        setQuestions(formatted);
                        setExpandedPalette({ [formatted[0]?.subject || 'General']: true });
                        setIsLoading(false);
                        return; // Successfully loaded from DB
                    }
                }
            } catch (err) {
                console.error("Failed to fetch questions from DB:", err);
            }
            
            // Fallback
            const questionsData = getQuestionsForTest(testId);
            const formatted = (questionsData || []).map((q, idx) => formatQuestionToLegacy(q, idx + 1));
            setQuestions(formatted);
            if (formatted.length > 0) {
                setExpandedPalette({ [formatted[0]?.subject || 'General']: true });
            }
            setIsLoading(false);
        };
        
        loadQuestions();
    }, [testId, exam]);

    // Fix #2 — timer no longer depends on timeLeft, so interval is created only ONCE
    // Using a ref to call handleSubmit avoids stale closure
    const handleSubmitRef = useRef(null);
    useEffect(() => { handleSubmitRef.current = handleSubmit; });

    useEffect(() => {
        if (!hasStarted || submitted) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [hasStarted, submitted]); // ← removed timeLeft dependency

    // Track time per question
    useEffect(() => {
        if (!hasStarted || submitted) return;

        startTimeRef.current = Date.now();

        return () => {
            if (startTimeRef.current) {
                const end = Date.now();
                const diff = (end - startTimeRef.current) / 1000;
                const qId = questions[currentQuestionIndex]?.id;
                if (qId) {
                    setTimeSpent(prev => ({
                        ...prev,
                        [qId]: (prev[qId] || 0) + diff
                    }));
                }
            }
        };
    }, [currentQuestionIndex, hasStarted, submitted, questions]);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const togglePalette = (subject) => {
        setExpandedPalette(prev => ({
            ...prev,
            [subject]: !prev[subject]
        }));
    };

    const handleOptionSelect = (questionId, optionId) => {
        if (submitted) return; // Don't allow changes after submission
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    // Immediate LocalStorage Session Backup
    const saveSessionLocal = (cAnswers, cMarked, cIndex, cSpent, cLeft) => {
        if (typeof window === 'undefined') return;
        try {
            const payload = {
                testId,
                testAttemptId,
                answers: cAnswers !== undefined ? cAnswers : answersRef.current,
                markedForReview: cMarked !== undefined ? cMarked : markedRef.current,
                currentQuestionIndex: typeof cIndex === 'number' ? cIndex : qIndexRef.current,
                timeSpent: cSpent !== undefined ? cSpent : timeSpentRef.current,
                timeLeft: typeof cLeft === 'number' ? cLeft : timeLeftRef.current,
                timestamp: Date.now()
            };
            localStorage.setItem(`test_session_${testId}`, JSON.stringify(payload));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }
    };

    // Server-side Autosave
    const saveSessionServer = async (overrideState = {}) => {
        if (!hasStarted || submitted || viewMode !== 'TEST') return;

        setSaveStatus('SAVING');
        try {
            const curAnswers = overrideState.answers !== undefined ? overrideState.answers : answersRef.current;
            const curMarked = overrideState.markedForReview !== undefined ? overrideState.markedForReview : markedRef.current;
            const curIndex = typeof overrideState.currentQuestionIndex === 'number' ? overrideState.currentQuestionIndex : qIndexRef.current;
            const curLeft = typeof overrideState.timeLeft === 'number' ? overrideState.timeLeft : timeLeftRef.current;
            const curSpent = overrideState.timeSpent !== undefined ? overrideState.timeSpent : timeSpentRef.current;

            saveSessionLocal(curAnswers, curMarked, curIndex, curSpent, curLeft);

            const res = await fetch('/api/test-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId,
                    testAttemptId,
                    answers: curAnswers,
                    markedForReview: curMarked,
                    currentQuestionIndex: curIndex,
                    timeLeft: curLeft,
                    timeSpent: curSpent,
                    status: 'IN_PROGRESS'
                })
            });

            if (!res.ok) {
                throw new Error(`Server returned status ${res.status}`);
            }

            setSaveStatus('SAVED');
        } catch (err) {
            console.warn('Autosave error, will retry:', err);
            setSaveStatus('ERROR');
            clearTimeout(retryTimerRef.current);
            retryTimerRef.current = setTimeout(() => {
                if (hasStarted && !submitted && viewMode === 'TEST') {
                    saveSessionServer();
                }
            }, 3000);
        }
    };

    // Autosave triggers on answers, markedForReview, currentQuestionIndex changes
    useEffect(() => {
        if (!hasStarted || submitted || viewMode !== 'TEST') return;

        saveSessionLocal(answers, markedForReview, currentQuestionIndex, timeSpent, timeLeft);

        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = setTimeout(() => {
            saveSessionServer({ answers, markedForReview, currentQuestionIndex, timeSpent, timeLeft });
        }, 500);

        return () => clearTimeout(autosaveTimerRef.current);
    }, [answers, markedForReview, currentQuestionIndex, hasStarted, submitted, viewMode]);

    // Periodic heartbeat autosave every 15s to sync timeLeft and timeSpent
    useEffect(() => {
        if (!hasStarted || submitted || viewMode !== 'TEST') return;
        const interval = setInterval(() => {
            saveSessionServer();
        }, 15000);
        return () => clearInterval(interval);
    }, [hasStarted, submitted, viewMode]);

    // 1. Browser Back Button Protection
    useEffect(() => {
        if (!hasStarted || submitted || viewMode !== 'TEST') return;

        if (typeof window !== 'undefined' && !window.history.state?.testActive) {
            window.history.pushState({ testActive: true }, '', window.location.href);
        }

        const handlePopState = () => {
            window.history.pushState({ testActive: true }, '', window.location.href);
            setPendingNavUrl('BACK');
            setIsLeaveModalOpen(true);
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [hasStarted, submitted, viewMode]);

    // 2. Page Refresh & Tab Close Protection (beforeunload)
    useEffect(() => {
        if (!hasStarted || submitted || viewMode !== 'TEST') return;

        const handleBeforeUnload = (e) => {
            saveSessionLocal(answersRef.current, markedRef.current, qIndexRef.current, timeSpentRef.current, timeLeftRef.current);
            e.preventDefault();
            e.returnValue = 'You are currently taking a test. If you leave this page, your test will be submitted with your answers recorded so far. You may not be able to resume this test.';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasStarted, submitted, viewMode]);

    // 3. Intercept Internal Application Navigation
    useEffect(() => {
        if (!hasStarted || submitted || viewMode !== 'TEST') return;

        const handleAnchorClick = (e) => {
            const anchor = e.target.closest('a');
            if (!anchor) return;
            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

            e.preventDefault();
            e.stopPropagation();
            setPendingNavUrl(href);
            setIsLeaveModalOpen(true);
        };

        document.addEventListener('click', handleAnchorClick, true);
        return () => {
            document.removeEventListener('click', handleAnchorClick, true);
        };
    }, [hasStarted, submitted, viewMode]);

    const handleStayOnTest = () => {
        setIsLeaveModalOpen(false);
        setLeaveErrorMessage('');
        setPendingNavUrl(null);
    };

    const executeSubmission = async () => {
        if (isSubmittingRef.current || submitted) {
            return { success: true };
        }
        isSubmittingRef.current = true;
        setIsSubmittingTest(true);

        try {
            // Calculate final time for current question before processing results
            let finalTimeSpent = { ...timeSpentRef.current };
            if (startTimeRef.current) {
                const end = Date.now();
                const diff = (end - startTimeRef.current) / 1000;
                const qId = questions[currentQuestionIndex]?.id;
                if (qId) {
                    finalTimeSpent[qId] = (finalTimeSpent[qId] || 0) + diff;
                }
            }
            setTimeSpent(finalTimeSpent);

            let calculatedScore = 0;
            let correctCount = 0;
            let incorrectCount = 0;
            let unattemptedCount = 0;

            const isBitsat = exam?.toLowerCase() === 'bitsat' || testId.toLowerCase().includes('bitsat');
            questions.forEach(q => {
                const posMarks = q.marks ?? (isBitsat ? 3 : 4);
                const negMarks = q.negativeMarks ?? 1;
                if (q.type === 'SUBJECTIVE') {
                    if (!answers[q.id]) unattemptedCount++;
                    else correctCount++;
                } else {
                    if (!answers[q.id]) {
                        unattemptedCount++;
                    } else if (answers[q.id] === q.correctOption) {
                        calculatedScore += posMarks;
                        correctCount++;
                    } else {
                        calculatedScore -= negMarks;
                        incorrectCount++;
                    }
                }
            });

            // Calculate subject-wise stats
            const subjectStats = {};
            questions.forEach(q => {
                const posMarks = q.marks ?? (isBitsat ? 3 : 4);
                const negMarks = q.negativeMarks ?? 1;
                if (!subjectStats[q.subject]) subjectStats[q.subject] = { subject: q.subject, total: 0, attempted: 0, correct: 0, score: 0, time: 0 };
                const s = subjectStats[q.subject];
                s.total++;
                s.time += (finalTimeSpent[q.id] || 0);
                if (answers[q.id]) {
                    s.attempted++;
                    if (q.type !== 'SUBJECTIVE') {
                        if (answers[q.id] === q.correctOption) {
                            s.correct++;
                            s.score += posMarks;
                        } else {
                            s.score -= negMarks;
                        }
                    } else {
                        s.correct++;
                    }
                }
            });

            let finalIsLiveAttempt = false;
            if (test.type === 'LIVE') {
                const now = new Date();
                const start = new Date(test.liveStart);
                const end = new Date(test.liveEnd);
                finalIsLiveAttempt = now >= start && now <= end;
            }
            setIsLiveAttempt(finalIsLiveAttempt);

            const initialTime = (test.duration || 180) * 60;
            const timeTaken = Math.max(0, initialTime - timeLeftRef.current);

            const submitRes = await fetch('/api/test-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    testId: testId,
                    testAttemptId: testAttemptId,
                    examType: exam,
                    score: calculatedScore,
                    totalMarks: test.totalMarks,
                    answers: answers,
                    questions: questions,
                    timeTaken: timeTaken,
                    subjectStats: subjectStats,
                    timeSpent: finalTimeSpent,
                    isLiveAttempt: finalIsLiveAttempt,
                    violationCount: violationCount,
                    violations: violations
                })
            });

            if (!submitRes.ok) {
                const errData = await submitRes.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || 'Submission failed');
            }

            const submitData = await submitRes.json();
            const serverScore = typeof submitData.verifiedScore === 'number' ? submitData.verifiedScore : calculatedScore;

            setScore(serverScore);
            setSubmitted(true);
            setViewMode('ANALYSIS');

            // Clean up localStorage session backup
            if (typeof window !== 'undefined') {
                localStorage.removeItem(`test_session_${testId}`);
            }

            // Fetch rank
            try {
                const rankRes = await fetch('/api/rank', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ testId: testId, score: serverScore })
                });
                if (rankRes.ok) {
                    const rankData = await rankRes.json();
                    setRank(rankData.globalRank || rankData.rank);
                    setTotalRankStudents(rankData.totalGlobalStudents || rankData.totalStudents);
                    setLiveRank(rankData.liveRank);
                    setTotalLiveStudents(rankData.totalLiveStudents);
                }
            } catch (e) {
                console.error("Error fetching rank:", e);
            }

            return { success: true };
        } catch (error) {
            console.error('Error submitting test:', error);
            return { success: false, error: error.message || 'Failed to submit test. Please check network connection.' };
        } finally {
            setIsSubmittingTest(false);
            isSubmittingRef.current = false;
        }
    };

    const handleSubmit = async () => {
        const res = await executeSubmission();
        if (!res.success) {
            alert('Submission error: ' + (res.error || 'Please check your connection and try again.'));
        }
    };

    const handleSubmitAndLeave = async () => {
        if (isLeaveSubmitting) return;
        setIsLeaveSubmitting(true);
        setLeaveErrorMessage('');

        const res = await executeSubmission();
        if (res.success) {
            setIsLeaveModalOpen(false);
            if (pendingNavUrl && pendingNavUrl !== 'BACK') {
                router.push(pendingNavUrl);
            } else {
                router.push(`/test-series/${exam}`);
            }
        } else {
            setLeaveErrorMessage(res.error || 'Failed to submit test. Please stay on the test and try submitting again.');
        }
        setIsLeaveSubmitting(false);
    };

    // ... existing formatTime

    if (isLoading) return <div className={styles.loading}>Loading Test...</div>;

    if (!test || questions.length === 0) {
        return (
            <div className={styles.loading} style={{ textAlign: 'center', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.75rem', color: '#f3f4f6' }}>Test Unavailable</h2>
                <p style={{ color: '#9ca3af', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                    No questions are currently available for this test paper.
                </p>
                <button 
                    onClick={() => router.back()} 
                    style={{ 
                        padding: '0.65rem 1.4rem', 
                        borderRadius: '8px', 
                        background: '#3b82f6', 
                        color: '#fff', 
                        border: 'none', 
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.95rem'
                    }}
                >
                    Return to Test Series
                </button>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <InstructionView
                exam={exam}
                onStart={() => {
                    setHasStarted(true);
                    enterFullscreen();
                    if (typeof window !== 'undefined') {
                        window.history.pushState({ testActive: true }, '', window.location.href);
                    }
                }}
                onBack={() => router.back()}
                test={test}
            />
        );
    }

    if (viewMode === 'ANALYSIS') {
        const totalQuestions = questions.length;
        const attempted = Object.keys(answers).length;
        const isCorrect = (q) => {
            if (!answers[q.id]) return false;
            if (q.type === 'NUMERICAL') {
                return String(answers[q.id]).trim().toLowerCase() === String(q.correctOption).trim().toLowerCase();
            }
            return answers[q.id] === q.correctOption;
        };
        const accuracy = attempted > 0 ? Math.round((questions.filter(q => isCorrect(q)).length / attempted) * 100) : 0;

        // Calculate subject-wise analysis
        const subjectStats = {};
        const isBitsat = exam?.toLowerCase() === 'bitsat' || testId.toLowerCase().includes('bitsat');
        questions.forEach(q => {
            const posMarks = q.marks ?? (isBitsat ? 3 : 4);
            const negMarks = q.negativeMarks ?? 1;
            if (!subjectStats[q.subject]) {
                subjectStats[q.subject] = {
                    subject: q.subject,
                    total: 0,
                    attempted: 0,
                    correct: 0,
                    score: 0,
                    time: 0,
                    correctTime: 0,
                    incorrectTime: 0
                };
            }
            const s = subjectStats[q.subject];
            const t = timeSpent[q.id] || 0;
            s.total++;
            s.time += t;
            if (answers[q.id]) {
                s.attempted++;
                if (isCorrect(q)) {
                    s.correct++;
                    s.score += posMarks;
                    s.correctTime += t;
                } else {
                    s.score -= negMarks;
                    s.incorrectTime += t;
                }
            }
        });

        // Calculate chapter and topic-wise breakdown
        const chapterStats = {};
        questions.forEach(q => {
            const chap = q.chapter || 'General / Uncategorized';
            const sub = q.subject || 'Other';
            const key = `${sub} › ${chap}`;
            if (!chapterStats[key]) {
                chapterStats[key] = {
                    subject: sub,
                    chapter: chap,
                    total: 0,
                    attempted: 0,
                    correct: 0,
                    score: 0,
                    time: 0
                };
            }
            const c = chapterStats[key];
            const t = timeSpent[q.id] || 0;
            const posMarks = q.marks ?? (isBitsat ? 3 : 4);
            const negMarks = q.negativeMarks ?? 1;
            c.total++;
            c.time += t;
            if (answers[q.id]) {
                c.attempted++;
                if (isCorrect(q)) {
                    c.correct++;
                    c.score += posMarks;
                } else {
                    c.score -= negMarks;
                }
            }
        });

        // Prepare Graph Data
        const subjectGraphData = Object.values(subjectStats).map(s => {
            const totalMarks = s.total * (isBitsat ? 3 : 4);
            return {
                subject: s.subject,
                score: s.score,
                totalMarks: totalMarks,
                fullMarkObj: s
            };
        });

        return (
            <div className={styles.container} style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
                <h1 className={styles.title} style={{ textAlign: 'center', marginBottom: '1rem' }}>Test Analysis</h1>
                
                {test.type === 'LIVE' && !isLiveAttempt && (
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid #ef4444', 
                        color: '#ef4444', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        textAlign: 'center',
                        marginBottom: '2rem'
                    }}>
                        <strong>Note:</strong> You missed the official cumulative performance window. This result is for your practice.
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                    <div className={styles.card} style={{ textAlign: 'center', padding: '1.5rem', background: '#1e293b', borderRadius: '12px' }}>
                        <h3 style={{ color: '#aaa', fontSize: '0.9rem' }}>SCORE</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb' }}>{score} <span style={{ fontSize: '1rem', color: '#aaa' }}>/ {test.totalMarks}</span></div>
                    </div>
                    <div className={styles.card} style={{ textAlign: 'center', padding: '1.5rem', background: '#1e293b', borderRadius: '12px' }}>
                        <h3 style={{ color: '#aaa', fontSize: '0.9rem' }}>ACCURACY</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#22c55e' }}>{accuracy}%</div>
                    </div>
                    <div className={styles.card} style={{ textAlign: 'center', padding: '1.5rem', background: '#1e293b', borderRadius: '12px' }}>
                        <h3 style={{ color: '#aaa', fontSize: '0.9rem' }}>ATTEMPTED</h3>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{attempted} <span style={{ fontSize: '1rem', color: '#aaa' }}>/ {totalQuestions}</span></div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '2rem' }}>
                    {/* Rank Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                        padding: '24px',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)'
                    }}>
                        <h3 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', marginBottom: '10px' }}>Your Ranking</h3>
                        <div style={{ display: 'flex', gap: '40px', textAlign: 'center' }}>
                            <div>
                                <div style={{ fontSize: '3rem', fontWeight: '800', color: '#fff' }}>
                                    {rank} <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', fontWeight: '400' }}>/ {totalRankStudents}</span>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Global Rank</p>
                            </div>
                            {totalLiveStudents > 0 && (
                                <div>
                                    <div style={{ fontSize: '3rem', fontWeight: '800', color: '#fbbf24' }}>
                                        {liveRank} <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.6)', fontWeight: '400' }}>/ {totalLiveStudents}</span>
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Cumulative Window Rank</p>
                                </div>
                            )}
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '15px', textAlign: 'center', fontSize: '0.85rem' }}>
                            {totalLiveStudents > 0 ? "Cumulative Rank is calculated against original window participants only." : "Global Rank includes all students who took this test."}
                        </p>
                    </div>

                    {/* Subject Graph */}
                    <div style={{ background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid #334155' }}>
                        <h3 style={{ marginBottom: '20px', color: '#94a3b8', fontSize: '1.1rem' }}>Subject Performance (Score)</h3>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectGraphData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="subject" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div style={{ background: '#0f172a', border: '1px solid #334155', padding: '10px', borderRadius: '4px', color: '#fff' }}>
                                                        <p style={{ fontWeight: 'bold' }}>{label}</p>
                                                        <p>Score: <span style={{ color: data.score > 0 ? '#10b981' : '#ef4444' }}>{data.score}</span> / {data.totalMarks}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="score" fill="#94a3b8" radius={[4, 4, 0, 0]}>
                                        {subjectGraphData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.score > 0 ? '#10b981' : entry.score < 0 ? '#ef4444' : '#94a3b8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>Subject-wise Performance</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '10px' }}>Subject</th>
                                    <th style={{ padding: '10px' }}>Score</th>
                                    <th style={{ padding: '10px' }}>Attempted</th>
                                    <th style={{ padding: '10px' }}>Correct</th>
                                    <th style={{ padding: '10px' }}>Incorrect</th>
                                    <th style={{ padding: '10px' }}>Unattempted</th>
                                    <th style={{ padding: '10px' }}>Accuracy</th>
                                    <th style={{ padding: '10px' }}>Time Taken</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(subjectStats).map(([subj, items]) => (
                                    <tr key={subj} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '15px 10px' }}>{subj}</td>
                                        <td style={{ padding: '15px 10px', fontWeight: 'bold', color: items.score > 0 ? '#22c55e' : (items.score < 0 ? '#ef4444' : '#fff') }}>{items.score}</td>
                                        <td style={{ padding: '15px 10px' }}>{items.attempted} / {items.total}</td>
                                        <td style={{ padding: '15px 10px', color: '#22c55e' }}>{items.correct}</td>
                                        <td style={{ padding: '15px 10px', color: '#ef4444' }}>{items.attempted - items.correct}</td>
                                        <td style={{ padding: '15px 10px', color: '#94a3b8' }}>{items.total - items.attempted}</td>
                                        <td style={{ padding: '15px 10px' }}>{items.attempted > 0 ? Math.round((items.correct / items.attempted) * 100) : 0}%</td>
                                        <td style={{ padding: '15px 10px' }}>{formatTime(Math.round(items.time || 0))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chapter & Topic-wise Diagnostic Breakdown */}
                <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                        <h3 style={{ margin: 0 }}>Chapter & Topic Diagnostic Breakdown</h3>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Pinpoint strengths & areas needing improvement</span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.85rem' }}>
                                    <th style={{ padding: '10px' }}>Subject & Chapter</th>
                                    <th style={{ padding: '10px' }}>Score</th>
                                    <th style={{ padding: '10px' }}>Questions</th>
                                    <th style={{ padding: '10px' }}>Correct</th>
                                    <th style={{ padding: '10px' }}>Incorrect</th>
                                    <th style={{ padding: '10px' }}>Accuracy</th>
                                    <th style={{ padding: '10px' }}>Avg Time/Q</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(chapterStats).map(([key, item]) => {
                                    const accuracy = item.attempted > 0 ? Math.round((item.correct / item.attempted) * 100) : 0;
                                    const avgTimeSec = item.attempted > 0 ? Math.round(item.time / item.attempted) : 0;
                                    return (
                                        <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                                            <td style={{ padding: '12px 10px' }}>
                                                <span style={{ color: '#818cf8', fontWeight: 600 }}>{item.subject}</span>
                                                <span style={{ color: '#64748b', margin: '0 6px' }}>›</span>
                                                <span style={{ color: '#e2e8f0' }}>{item.chapter}</span>
                                            </td>
                                            <td style={{ padding: '12px 10px', fontWeight: 'bold', color: item.score > 0 ? '#22c55e' : (item.score < 0 ? '#ef4444' : '#fff') }}>
                                                {item.score}
                                            </td>
                                            <td style={{ padding: '12px 10px' }}>{item.attempted} / {item.total}</td>
                                            <td style={{ padding: '12px 10px', color: '#22c55e' }}>{item.correct}</td>
                                            <td style={{ padding: '12px 10px', color: '#ef4444' }}>{item.attempted - item.correct}</td>
                                            <td style={{ padding: '12px 10px' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700,
                                                    background: accuracy >= 75 ? 'rgba(34,197,94,0.15)' : accuracy >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: accuracy >= 75 ? '#4ade80' : accuracy >= 40 ? '#fcd34d' : '#f87171'
                                                }}>
                                                    {accuracy}%
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 10px', color: '#94a3b8' }}>{formatTime(avgTimeSec)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Time Analysis Table */}
                <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>Time Analysis</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '10px' }}>Type</th>
                                    <th style={{ padding: '10px' }}>Questions</th>
                                    <th style={{ padding: '10px' }}>Total Time</th>
                                    <th style={{ padding: '10px' }}>Avg Time/Q</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    let correctTime = 0, incorrectTime = 0, unattemptedTime = 0;
                                    let correctCount = 0, incorrectCount = 0, unattemptedCount = 0;

                                    questions.forEach(q => {
                                        const t = timeSpent[q.id] || 0;
                                        if (!answers[q.id]) {
                                            unattemptedCount++;
                                            unattemptedTime += t;
                                        } else if (answers[q.id] === q.correctOption) {
                                            correctCount++;
                                            correctTime += t;
                                        } else {
                                            incorrectCount++;
                                            incorrectTime += t;
                                        }
                                    });

                                    const rows = [
                                        { label: 'Correct', count: correctCount, time: correctTime, color: '#22c55e' },
                                        { label: 'Incorrect', count: incorrectCount, time: incorrectTime, color: '#ef4444' },
                                        { label: 'Unattempted', count: unattemptedCount, time: unattemptedTime, color: '#94a3b8' }
                                    ];

                                    return rows.map(row => (
                                        <tr key={row.label} style={{ borderBottom: '1px solid #334155' }}>
                                            <td style={{ padding: '15px 10px', color: row.color, fontWeight: 'bold' }}>{row.label}</td>
                                            <td style={{ padding: '15px 10px' }}>{row.count}</td>
                                            <td style={{ padding: '15px 10px' }}>{formatTime(Math.round(row.time))}</td>
                                            <td style={{ padding: '15px 10px' }}>{row.count > 0 ? formatTime(Math.round(row.time / row.count)) : '00:00:00'}</td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Subject-wise Time Analysis Table */}
                <div style={{ background: '#1e293b', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>Subject-wise Time Analysis</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '10px' }}>Subject</th>
                                    <th style={{ padding: '10px' }}>Total Time</th>
                                    <th style={{ padding: '10px' }}>Time on Correct</th>
                                    <th style={{ padding: '10px' }}>Time on Incorrect</th>
                                    <th style={{ padding: '10px' }}>Avg Time/Q</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(subjectStats).map(([subj, items]) => (
                                    <tr key={subj} style={{ borderBottom: '1px solid #334155' }}>
                                        <td style={{ padding: '15px 10px' }}>{subj}</td>
                                        <td style={{ padding: '15px 10px' }}>{formatTime(Math.round(items.time || 0))}</td>
                                        <td style={{ padding: '15px 10px', color: '#22c55e' }}>{formatTime(Math.round(items.correctTime || 0))}</td>
                                        <td style={{ padding: '15px 10px', color: '#ef4444' }}>{formatTime(Math.round(items.incorrectTime || 0))}</td>
                                        <td style={{ padding: '15px 10px' }}>{items.attempted > 0 ? formatTime(Math.round(items.time / items.attempted)) : '00:00:00'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                    <button
                        onClick={() => setViewMode('REVIEW')}
                        className={styles.submitBtn}
                        style={{ background: '#2563eb' }}
                    >
                        Review Solutions
                    </button>
                    <button
                        onClick={() => window.location.href = `/test-series/${exam}`}
                        className={styles.submitBtn}
                        style={{ background: '#334155' }}
                    >
                        Back to Test Series
                    </button>
                </div>
            </div>
        );
    }

    // Check profile completion status


    // Show loading while checking authentication
    if (status === 'loading') {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', color: 'var(--foreground)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
                    <div style={{ fontSize: '1.2rem' }}>Checking authentication...</div>
                </div>
            </div>
        );
    }


    const currentQuestion = questions[currentQuestionIndex] || questions[0] || {};

    return (
        <div className={styles.container}>
            <div className={styles.testHeader}>
                {/* Hamburger — left side, mobile only */}
                <button
                    className={styles.paletteToggle}
                    onClick={() => setPaletteOpen(o => !o)}
                    aria-label="Toggle question palette"
                >
                    <span className={`${styles.hbar} ${paletteOpen ? styles.hbar1Open : ''}`} />
                    <span className={`${styles.hbar} ${paletteOpen ? styles.hbar2Open : ''}`} />
                    <span className={`${styles.hbar} ${paletteOpen ? styles.hbar3Open : ''}`} />
                </button>
                <div>
                    <h2>{test.title} {viewMode === 'REVIEW' && <span style={{ fontSize: '0.8em', color: '#fbbf24' }}>(Review Mode)</span>}</h2>
                    <span className={styles.examTag}>{exam.toUpperCase()}</span>
                </div>
                {!submitted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div className={styles.timer}>Time Left: {formatTime(timeLeft)}</div>
                        {/* Autosave Status Indicator */}
                        <div
                            id="autosave-status-badge"
                            title={saveStatus === 'SAVING' ? 'Saving answers to server...' : saveStatus === 'ERROR' ? 'Retrying server save...' : 'All changes saved to cloud'}
                            style={{
                                fontSize: '0.8rem',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                                background: saveStatus === 'SAVING' 
                                    ? 'rgba(245, 158, 11, 0.15)' 
                                    : saveStatus === 'ERROR' 
                                        ? 'rgba(239, 68, 68, 0.15)' 
                                        : 'rgba(34, 197, 94, 0.15)',
                                border: saveStatus === 'SAVING'
                                    ? '1px solid rgba(245, 158, 11, 0.4)'
                                    : saveStatus === 'ERROR'
                                        ? '1px solid rgba(239, 68, 68, 0.4)'
                                        : '1px solid rgba(34, 197, 94, 0.4)',
                                color: saveStatus === 'SAVING'
                                    ? '#fbbf24'
                                    : saveStatus === 'ERROR'
                                        ? '#f87171'
                                        : '#4ade80'
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: saveStatus === 'SAVING' ? '#fbbf24' : saveStatus === 'ERROR' ? '#f87171' : '#4ade80'
                                }}
                            />
                            <span>
                                {saveStatus === 'SAVING' && 'Saving...'}
                                {saveStatus === 'ERROR' && 'Unable to save — retrying'}
                                {(saveStatus === 'SAVED' || saveStatus === 'IDLE') && 'All changes saved'}
                            </span>
                        </div>
                        {violationCount > 0 && (
                            <div
                                title={`${violationCount} window/tab departure warnings recorded`}
                                style={{
                                    fontSize: '0.8rem',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(245, 158, 11, 0.15)',
                                    border: '1px solid rgba(245, 158, 11, 0.35)',
                                    color: '#fbbf24',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span>⚠️</span> Warnings: {violationCount}
                            </div>
                        )}
                    </div>
                )}
                {submitted && viewMode === 'REVIEW' && (
                    <button
                        onClick={() => setViewMode('ANALYSIS')}
                        style={{ padding: '5px 10px', background: '#334155', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}
                    >
                        Back to Analysis
                    </button>
                )}
                {/* Fullscreen toggle */}
                <button
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        color: 'white',
                        padding: '6px 10px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        flexShrink: 0
                    }}
                >
                    {isFullscreen ? '⊡' : '⛶'}
                </button>
            </div>

            <div className={styles.content}>
                {/* Mobile overlay backdrop */}
                {paletteOpen && (
                    <div className={styles.paletteBackdrop} onClick={() => setPaletteOpen(false)} />
                )}
                <div className={`${styles.sidebar} ${paletteOpen ? styles.sidebarOpen : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <h3>Question Palette</h3>
                        <button className={styles.closePalette} onClick={() => setPaletteOpen(false)}>✕</button>
                    </div>
                    <div className={styles.paletteContainer}>
                        {[...new Set(questions.map(q => q.subject || 'General'))].map(subject => {
                            const subjectQuestions = questions.filter(q => (q.subject || 'General') === subject);
                            const isOpen = expandedPalette[subject];

                            return (
                                <div key={subject} style={{ marginBottom: '10px' }}>
                                    <div
                                        onClick={() => togglePalette(subject)}
                                        style={{
                                            padding: '8px',
                                            background: 'rgba(255,255,255,0.05)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            borderRadius: '4px',
                                            marginBottom: '5px'
                                        }}
                                    >
                                        <strong>{subject}</strong>
                                        <span>{isOpen ? '▲' : '▼'}</span>
                                    </div>

                                    {isOpen && (
                                        <div className={styles.paletteGrid}>
                                            {subjectQuestions.map((q) => {
                                                const globalIndex = questions.findIndex(quest => (quest.id || quest._id) === (q.id || q._id));
                                                const qKey = q.id || q._id;
                                                const studentAns = answers[qKey] ?? answers[String(q.id)] ?? '';
                                                const isAns = studentAns !== undefined && studentAns !== '';
                                                const isRight = isAns && (
                                                    q.type === 'NUMERICAL'
                                                        ? Math.abs(parseFloat(studentAns) - parseFloat(q.correctOption)) < 0.001
                                                        : String(studentAns).toLowerCase() === String(q.correctOption || '').toLowerCase()
                                                );

                                                return (
                                                    <button
                                                        key={qKey}
                                                        onClick={() => { setCurrentQuestionIndex(globalIndex); setPaletteOpen(false); }}
                                                        className={`${styles.paletteBtn} ${currentQuestionIndex === globalIndex ? styles.active : ''}`}
                                                        style={{
                                                            backgroundColor: submitted
                                                                ? (isRight ? '#22c55e' : (isAns ? '#ef4444' : 'rgba(255,255,255,0.12)'))
                                                                : (
                                                                    currentQuestionIndex === globalIndex ? '#2563eb' :
                                                                        (markedForReview[q.id] ? '#7c3aed' : (isAns ? '#22c55e' : 'rgba(255,255,255,0.1)'))
                                                                ),
                                                            position: 'relative',
                                                            border: currentQuestionIndex === globalIndex ? '2px solid white' : 'none'
                                                        }}
                                                    >
                                                        {globalIndex + 1}
                                                        {markedForReview[q.id] && isAns && (
                                                            <span style={{
                                                                position: 'absolute', bottom: '2px', right: '2px', width: '6px', height: '6px',
                                                                borderRadius: '50%', background: '#22c55e', border: '1px solid white'
                                                            }} />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {!submitted && (
                        <button 
                            className={styles.submitBtn} 
                            onClick={handleSubmit}
                            disabled={isSubmittingTest}
                            style={{
                                opacity: isSubmittingTest ? 0.7 : 1,
                                cursor: isSubmittingTest ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isSubmittingTest ? 'Submitting Test...' : 'Submit Test'}
                        </button>
                    )}
                    {submitted && (
                        <button className={styles.submitBtn} onClick={() => window.location.href = `/test-series/${exam}`}>Back to List</button>
                    )}
                </div>

                <div className={styles.questionArea}>
                    <div className={styles.questionHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Question {currentQuestionIndex + 1} of {questions.length}</span>
                            <span className={styles.subjectTag}>{currentQuestion.subject || 'General'}</span>
                            {currentQuestion.chapter && (
                                <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: '#cbd5e1' }}>
                                    {currentQuestion.chapter}
                                </span>
                            )}
                            {submitted && viewMode === 'REVIEW' && (() => {
                                const qKey = currentQuestion.id || currentQuestion._id;
                                const studentAns = answers[qKey] ?? answers[String(currentQuestion.id)] ?? '';
                                const isNumerical = currentQuestion.type === 'NUMERICAL';
                                const correctOpt = String(currentQuestion.correctOption || '').toLowerCase();
                                const isBitsat = exam?.toLowerCase() === 'bitsat' || testId.toLowerCase().includes('bitsat');
                                const posMarks = currentQuestion.marks ?? (isBitsat ? 3 : 4);
                                const negMarks = currentQuestion.negativeMarks ?? 1;

                                if (studentAns === undefined || studentAns === '') {
                                    return (
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
                                            ⚪ Unattempted (0 Marks)
                                        </span>
                                    );
                                }
                                const isCorrect = isNumerical
                                    ? Math.abs(parseFloat(studentAns) - parseFloat(correctOpt)) < 0.001
                                    : String(studentAns).toLowerCase() === correctOpt;
                                if (isCorrect) {
                                    return (
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                            ✓ Correct (+{posMarks} Marks)
                                        </span>
                                    );
                                }
                                return (
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                        ✕ Incorrect (-{negMarks} Mark)
                                    </span>
                                );
                            })()}
                        </div>
                        {/* Question Report Flag Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {(() => {
                                const qKey = String(currentQuestion.id || currentQuestion._id || '');
                                const existing = userReports[qKey];
                                return (
                                    <button
                                        type="button"
                                        id={`report-question-btn-${currentQuestion.id || currentQuestionIndex}`}
                                        onClick={() => setIsReportModalOpen(true)}
                                        title={existing ? `Reported (${existing.status}) — Click to view/update details` : "Report an issue in this question"}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '5px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            border: existing 
                                                ? '1px solid rgba(245, 158, 11, 0.5)' 
                                                : '1px solid rgba(139, 92, 246, 0.35)',
                                            background: existing
                                                ? 'rgba(245, 158, 11, 0.12)'
                                                : 'rgba(99, 102, 241, 0.12)',
                                            color: existing
                                                ? '#fbbf24'
                                                : '#c7d2fe',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = existing
                                                ? 'rgba(245, 158, 11, 0.2)'
                                                : 'rgba(99, 102, 241, 0.25)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = existing
                                                ? 'rgba(245, 158, 11, 0.12)'
                                                : 'rgba(99, 102, 241, 0.12)';
                                        }}
                                    >
                                        <span>🚩</span>
                                        <span>{existing ? 'Reported' : 'Report'}</span>
                                        {existing && (
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '1px 6px',
                                                borderRadius: '4px',
                                                background: 'rgba(245, 158, 11, 0.25)',
                                                color: '#fef3c7',
                                                textTransform: 'uppercase'
                                            }}>
                                                {existing.status?.replace('_', ' ')}
                                            </span>
                                        )}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>

                    <div className={styles.questionText}>
                        <LatexRenderer text={currentQuestion.text || currentQuestion.question || ''} />
                        {currentQuestion.image && <img src={currentQuestion.image} alt="Question Diagram" style={{ maxWidth: '100%', marginTop: '1rem', borderRadius: '8px' }} />}
                    </div>

                    {currentQuestion.type === 'NUMERICAL' && !(exam?.toLowerCase() === 'neet' || testId?.toLowerCase()?.startsWith('neet')) ? (
                        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ color: '#818cf8', marginBottom: '12px', fontSize: '0.95rem' }}>Numerical Answer Input:</h4>
                            <input 
                                type="text" 
                                disabled={submitted}
                                style={{ width: '100%', maxWidth: '350px', background: 'rgba(15,23,42,0.8)', border: '1px solid #6366f1', borderRadius: '8px', color: '#fff', padding: '12px 16px', fontSize: '1.1rem', outline: 'none' }}
                                placeholder="Type your numerical value here..."
                                value={answers[currentQuestion.id] ?? answers[String(currentQuestion.id)] ?? ''}
                                onChange={(e) => handleOptionSelect(currentQuestion.id, e.target.value)}
                            />
                            {submitted && (
                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.95rem' }}>
                                    <div style={{ color: '#94a3b8' }}>
                                        Your Input: <strong style={{ color: answers[currentQuestion.id] ? '#e2e8f0' : '#f87171' }}>{answers[currentQuestion.id] || 'Unattempted'}</strong>
                                    </div>
                                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                                        Correct Answer: {currentQuestion.correctOption}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.options}>
                            {Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
                                currentQuestion.options.map((rawOpt, optIdx) => {
                                    const opt = (typeof rawOpt === 'object' && rawOpt !== null)
                                        ? rawOpt
                                        : { id: String.fromCharCode(97 + optIdx), text: String(rawOpt || ''), image: '' };
                                    const optId = (opt.id || opt.key || String.fromCharCode(97 + optIdx)).toLowerCase();
                                    const optText = opt.text || (typeof rawOpt === 'string' ? rawOpt : '');
                                    const qKey = currentQuestion.id || currentQuestion._id;
                                    const studentAns = String(answers[qKey] ?? answers[String(currentQuestion.id)] ?? '').toLowerCase();
                                    const isSelected = studentAns === optId;
                                    const correctOpt = String(currentQuestion.correctOption || '').toLowerCase();
                                    const isCorrect = optId === correctOpt;
                                    const isWrong = submitted && isSelected && !isCorrect;

                                    return (
                                        <div
                                            key={optId}
                                            className={`${styles.option} 
                                                ${isSelected ? styles.selected : ''}
                                                ${submitted && isCorrect ? styles.correctOption : ''}
                                                ${isWrong ? styles.wrongOption : ''}
                                            `}
                                            style={{
                                                cursor: submitted ? 'default' : 'pointer',
                                                borderColor: submitted
                                                    ? (isCorrect ? '#22c55e' : (isWrong ? '#ef4444' : undefined))
                                                    : undefined
                                            }}
                                            onClick={() => !submitted && handleOptionSelect(qKey, optId)}
                                        >
                                            <span className={styles.optionKey}>{optId.toUpperCase()}</span>
                                            <div style={{ width: '100%' }}>
                                                <span><LatexRenderer text={optText} /></span>
                                                {opt.image && <img src={opt.image} alt="Option" style={{ maxWidth: '100px', display: 'block', marginTop: '0.5rem', borderRadius: '4px' }} />}
                                            </div>
                                            {submitted && (
                                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                                                    {isCorrect && (
                                                        <span style={{ color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                                                            ✓ Correct Answer
                                                        </span>
                                                    )}
                                                    {isWrong && (
                                                        <span style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                                            ✕ Your Choice
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic', padding: '10px 0' }}>No options available for this question.</p>
                            )}
                        </div>
                    )}

                    {submitted && (
                        <div className={styles.explanation} style={{ marginTop: '1.5rem', padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h4 style={{ color: '#60a5fa', marginBottom: '8px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>💡</span> Explanation &amp; Solution:
                            </h4>
                            {currentQuestion.explanation && currentQuestion.explanation.trim() ? (
                                <div style={{ lineHeight: '1.6', color: '#e2e8f0' }}>
                                    <LatexRenderer text={currentQuestion.explanation} />
                                </div>
                            ) : (
                                <p style={{ fontStyle: 'italic', color: '#94a3b8', margin: 0 }}>
                                    Solution not available for this question.
                                </p>
                            )}
                        </div>
                    )}

                    <div className={styles.navigation} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
                        <button
                            className={`${styles.navBtn} ${styles.secondary}`}
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(curr => Math.max(0, curr - 1))}
                            style={{
                                background: 'transparent',
                                border: '1px solid #ddd',
                                color: '#fff',
                                opacity: currentQuestionIndex === 0 ? 0.5 : 1,
                                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ← Previous
                        </button>

                        {!submitted ? (
                            <>
                                {currentQuestionIndex === questions.length - 1 ? (
                                    <button
                                        className={styles.navBtn}
                                        style={{
                                            background: '#16a34a',
                                            color: '#ffffff',
                                            flex: 1,
                                            fontWeight: '700',
                                            boxShadow: '0 2px 10px rgba(22, 163, 74, 0.4)',
                                            opacity: isSubmittingTest ? 0.7 : 1,
                                            cursor: isSubmittingTest ? 'not-allowed' : 'pointer'
                                        }}
                                        disabled={isSubmittingTest}
                                        onClick={handleSubmit}
                                    >
                                        {isSubmittingTest ? 'Submitting Test...' : 'Submit Test'}
                                    </button>
                                ) : (
                                    <button
                                        className={styles.navBtn}
                                        style={{ background: '#2563eb', flex: 1 }}
                                        onClick={() => {
                                            if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(curr => curr + 1);
                                        }}
                                    >
                                        Save &amp; Next →
                                    </button>
                                )}
                                <button
                                    className={`${styles.navBtn} ${styles.secondary}`}
                                    onClick={() => {
                                        const qId = currentQuestion.id;
                                        const newAnswers = { ...answers };
                                        delete newAnswers[qId];
                                        setAnswers(newAnswers);
                                    }}
                                    style={{ background: 'transparent', border: '1px solid #ddd', color: '#fff' }}
                                >
                                    Clear Response
                                </button>
                                <button
                                    className={styles.navBtn}
                                    onClick={() => {
                                        const qId = currentQuestion.id;
                                        setMarkedForReview(prev => {
                                            const next = { ...prev };
                                            if (next[qId]) delete next[qId];
                                            else next[qId] = true;
                                            return next;
                                        });
                                        if (currentQuestionIndex < questions.length - 1) setCurrentQuestionIndex(curr => curr + 1);
                                    }}
                                    style={{ background: '#7c3aed', color: 'white' }}
                                >
                                    {currentQuestionIndex === questions.length - 1 ? 'Mark for Review' : 'Mark for Review & Next'}
                                </button>
                            </>
                        ) : (
                            <>
                                {currentQuestionIndex < questions.length - 1 ? (
                                    <button
                                        className={styles.navBtn}
                                        style={{ background: '#2563eb', flex: 1 }}
                                        onClick={() => setCurrentQuestionIndex(curr => curr + 1)}
                                    >
                                        Next Question →
                                    </button>
                                ) : (
                                    <button
                                        className={styles.navBtn}
                                        style={{ background: '#10b981', flex: 1, fontWeight: '700' }}
                                        onClick={() => setViewMode('ANALYSIS')}
                                    >
                                        ✓ Back to Test Analysis
                                    </button>
                                )}
                                <button
                                    className={styles.navBtn}
                                    style={{ background: '#334155', color: '#fff' }}
                                    onClick={() => setViewMode('ANALYSIS')}
                                >
                                    📊 Analysis
                                </button>
                                <button
                                    className={styles.navBtn}
                                    style={{ background: '#1e293b', border: '1px solid #475569', color: '#cbd5e1' }}
                                    onClick={() => window.location.href = `/test-series/${exam}`}
                                >
                                    Back to Test Series
                                </button>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* Test Integrity Anti-Tab Switch / Window-Leave Warning System */}
            <TestIntegrityWarning
                isActive={status === 'authenticated' && hasStarted && !submitted && timeLeft > 0}
                testId={testId}
                testAttemptId={testAttemptId}
                onViolationCountChange={setViolationCount}
                onViolationsChange={setViolations}
            />

            {/* Question Report Modal */}
            {currentQuestion && (
                <QuestionReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    question={currentQuestion}
                    testId={testId}
                    testTitle={test?.title || testId}
                    attemptId={testAttemptId}
                    exam={exam}
                    isReview={submitted}
                    existingReport={userReports[String(currentQuestion.id || currentQuestion._id || '')]}
                    onReportSubmitted={handleReportSubmitted}
                />
            )}

            {/* Leave Test Protection Modal */}
            <LeaveTestModal
                isOpen={isLeaveModalOpen}
                onStay={handleStayOnTest}
                onSubmitAndLeave={handleSubmitAndLeave}
                isSubmitting={isLeaveSubmitting}
                errorMessage={leaveErrorMessage}
            />
        </div>
    );
}

const InstructionView = ({ exam, onStart, onBack, test }) => {
    const isNeet = exam.toLowerCase().includes('neet');
    const isJeeMains = exam.toLowerCase().includes('jee-mains');
    const isJeeAdv = exam.toLowerCase().includes('jee-advance');
    const isBitsat = exam.toLowerCase().includes('bitsat');

    return (
        <div className={`${styles.container} ${styles.instructionsWrapper}`}>
            <div className={styles.instructionsHeader}>
                <button onClick={onBack} className={styles.backBtn}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" width="18" height="18">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back
                </button>
                <button
                    onClick={onStart}
                    className={styles.startBtnSmall}
                >
                    Start Test
                </button>
            </div>

            <h1 className={styles.title} style={{ marginBottom: '0.5rem', color: 'var(--foreground)', fontSize: '2rem' }}>General Instructions</h1>
            <h3 style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontWeight: '500' }}>{test.title}</h3>

            <div className={styles.instructionsCard}>
                <p><strong>Total Duration:</strong> {test.duration} Minutes</p>
                <p><strong>Total Questions:</strong> {test.questionsCount}</p>
                <p><strong>Total Marks:</strong> {test.totalMarks}</p>

                {/* Show Syllabus for Part Tests */}
                {test.syllabus && (
                    <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--accent)' }}>Syllabus Covered:</h4>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {Object.entries(test.syllabus).map(([subject, chapters]) => (
                                <div key={subject} style={{ marginBottom: '0.75rem' }}>
                                    <strong style={{ color: 'var(--primary)' }}>{subject}:</strong> <span style={{ color: 'var(--foreground)' }}>{chapters.join(', ')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isNeet && (
                    <>
                        <h4>NEET Exam Instructions:</h4>
                        <ul style={{ paddingLeft: '20px', listStyle: 'disc' }}>
                            <li>The test contains {test.questionsCount} questions{test.questionsCount === 180 ? ': Physics (45), Chemistry (45), Botany (45), Zoology (45)' : ''}.</li>
                            <li>Each question carries 4 marks.</li>
                            <li>For each incorrect answer, 1 mark will be deducted.</li>
                            <li>Unattempted questions will be awarded 0 marks.</li>
                            <li>You can navigate to any question using the Question Palette.</li>
                        </ul>
                    </>
                )}

                {isJeeMains && (
                    <>
                        <h4>JEE Mains Exam Instructions:</h4>
                        <ul style={{ paddingLeft: '20px', listStyle: 'disc' }}>
                            <li>The test contains {test.questionsCount} questions{test.questionsCount === 75 ? ': Physics (25), Chemistry (25), Mathematics (25)' : ''}.</li>
                            <li>Each subject has two sections: Section A (MCQ) and Section B (Numerical).</li>
                            <li>Section A carries 4 marks for correct answer and -1 for wrong answer.</li>
                            <li>Section B usually has no negative marking (check specific paper rules).</li>
                            <li>Use the palette to switch between questions.</li>
                        </ul>
                    </>
                )}

                {isJeeAdv && (
                    <>
                        <h4>JEE Advanced Exam Instructions:</h4>
                        <ul style={{ paddingLeft: '20px', listStyle: 'disc' }}>
                            <li>The paper pattern changes every year. Please check specific question instructions carefully.</li>
                            <li>Marking scheme may include partial marking, negative marking, or zero negative marking.</li>
                            <li>Subjects: Physics, Chemistry, Mathematics.</li>
                            <li>Ensure you save your answer before moving to the next question.</li>
                        </ul>
                    </>
                )}

                {isBitsat && (test.type === 'SUBTOPIC' || test.id?.includes('SUBTOPIC')) && (
                    <>
                        <h4>BITSAT Subtopic Practice Instructions:</h4>
                        <ul style={{ paddingLeft: '20px', listStyle: 'disc' }}>
                            <li>This is a focused BITSAT Subtopic Test containing {test.questionsCount} Single-Correct Multiple Choice Questions.</li>
                            <li>Total Duration: {test.duration} Minutes • Maximum Marks: {test.totalMarks} Marks.</li>
                            <li>Each correct response carries +3 marks.</li>
                            <li>Each incorrect response carries -1 mark penalty.</li>
                            <li>Unattempted questions are awarded 0 marks.</li>
                            <li>Use the Question Palette to navigate. Click &apos;Submit Test&apos; when completed.</li>
                        </ul>
                    </>
                )}

                {isBitsat && !(test.type === 'SUBTOPIC' || test.id?.includes('SUBTOPIC')) && (
                    <>
                        <h4>BITSAT Exam Instructions (Official 2027 Pattern):</h4>
                        <ul style={{ paddingLeft: '20px', listStyle: 'disc' }}>
                            <li>The test contains {test.questionsCount} questions across 5 sections: Physics (30), Chemistry (30), English Proficiency (10), Logical Reasoning (20), and {(test.subjectMode === 'biology' || testId.toLowerCase().includes('bio')) ? 'Biology (40)' : 'Mathematics (40)'}.</li>
                            <li>Total Duration: {test.duration} Minutes • Maximum Marks: {test.totalMarks} Marks.</li>
                            <li>Each correct response carries +3 marks.</li>
                            <li>Each incorrect response carries -1 mark penalty.</li>
                            <li>Unattempted questions are awarded 0 marks.</li>
                            <li>You can freely navigate between sections and questions at any time using the Question Palette.</li>
                        </ul>
                    </>
                )}

                {!isNeet && !isJeeMains && !isJeeAdv && !isBitsat && (
                    <>
                        <h4>General Instructions:</h4>
                        <ul style={{ paddingLeft: '20px', listStyle: 'disc' }}>
                            <li>All questions are compulsory unless specified otherwise.</li>
                            <li>Use the question palette on the right to navigate.</li>
                            <li>Click &apos;Submit Test&apos; only when you have finished completely.</li>
                        </ul>
                    </>
                )}

                <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderLeft: '4px solid #fbbf24', borderRadius: '4px' }}>
                    <p style={{ color: '#fbbf24', margin: 0 }}><strong>Note:</strong> Once you click &quot;Start Test&quot;, the timer will begin immediately.</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <button
                    onClick={onStart}
                    className={styles.startBtnLarge}
                >
                    I have read the instructions. Start Test
                </button>
            </div>
        </div>
    );
};

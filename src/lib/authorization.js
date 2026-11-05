/**
 * Central Authorization & Access Control Service
 * Dedicated Olympiad Examination Platform (Classes 1 to 12).
 * Enforces strict 732-day authorization period upon payment confirmation.
 */

export const AUTHORIZATION_DAYS = 732;
export const CANONICAL_EXAMS = ['OLYMPIAD'];

/**
 * Validates and converts any exam identifier to strict canonical enum:
 * 'OLYMPIAD'. Preserves backward compatibility for legacy strings.
 */
export function normalizeToCanonicalExam(exam) {
    if (!exam || Array.isArray(exam)) return 'OLYMPIAD';
    const str = String(exam).trim().toUpperCase();
    if (str.includes('OLYMPIAD')) return 'OLYMPIAD';
    // Map legacy representations to OLYMPIAD
    if (str === 'NEET' || str.includes('JEE') || str.includes('BITSAT')) return 'OLYMPIAD';
    return 'OLYMPIAD';
}

export function canonicalToExamSlug(canonicalExam) {
    return 'olympiad';
}

export function examSlugToCanonical(slug) {
    return 'OLYMPIAD';
}

export function getCanonicalExamDisplay(canonicalExam) {
    return 'Olympiad';
}

/**
 * Calculates exact calendar expiry timestamp 732 days from given start date.
 */
export function calculate732DayExpiry(startDate = new Date()) {
    const start = new Date(startDate);
    return new Date(start.getTime() + AUTHORIZATION_DAYS * 24 * 60 * 60 * 1000);
}

export function extractTestExam(testId = '', testObject = null, examSlug = '') {
    return 'OLYMPIAD';
}

/**
 * Normalizes exam names for access checking.
 */
export function normalizeExam(exam) {
    return 'olympiad';
}

/**
 * Checks overall student authorization status.
 * Evaluates paymentStatus, accountStatus, and 732-day calendar expiry.
 * Admins are permanently exempt.
 */
export function checkStudentAuthorization(user) {
    if (!user) {
        return {
            authorized: false,
            reason: 'UNAUTHENTICATED',
            status: 'UNAUTHENTICATED',
            message: 'You must be signed in to access test papers.'
        };
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);

    const isAdmin = user.role === 'admin' ||
        user.isAdmin === true ||
        (user.email && adminEmails.includes(user.email.toLowerCase()));

    if (isAdmin) {
        return {
            authorized: true,
            isAdmin: true,
            status: 'ACTIVE',
            daysRemaining: Infinity,
            message: 'Admin access granted.'
        };
    }

    // Check account suspension
    if (user.accountStatus === 'SUSPENDED') {
        return {
            authorized: false,
            reason: 'SUSPENDED',
            status: 'SUSPENDED',
            message: 'Your account has been suspended. Please contact the administrator.'
        };
    }

    // Check payment status
    const isPaid = user.paymentStatus === 'CONFIRMED' || user.paymentStatus === 'PAID';
    if (!isPaid) {
        const isRejected = user.paymentStatus === 'REJECTED' || user.paymentStatus === 'NOT PAID';
        return {
            authorized: false,
            reason: isRejected ? 'PAYMENT_REJECTED' : 'PAYMENT_PENDING',
            status: isRejected ? 'REJECTED' : 'PENDING_APPROVAL',
            message: isRejected
                ? 'Your payment was unsuccessful. Please complete payment to activate test access.'
                : 'Payment required. Complete your Razorpay payment to activate test access.'
        };
    }

    // Check admin approval and authorization dates
    if (user.accountStatus === 'PENDING_APPROVAL' || !user.authorizationExpiryDate) {
        return {
            authorized: false,
            reason: 'APPROVAL_PENDING',
            status: 'PENDING_APPROVAL',
            message: 'Your account is awaiting administrator authorization.'
        };
    }

    // Check actual calendar 732-day expiry against server time
    const now = Date.now();
    const expiryTime = new Date(user.authorizationExpiryDate).getTime();

    if (isNaN(expiryTime) || now > expiryTime) {
        return {
            authorized: false,
            reason: 'EXPIRED',
            status: 'EXPIRED',
            daysRemaining: 0,
            authorizationStartDate: user.authorizationStartDate,
            authorizationExpiryDate: user.authorizationExpiryDate,
            message: 'Your 732-day test authorization has expired. Please complete renewal/payment to regain test access.'
        };
    }

    const msRemaining = expiryTime - now;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
    const isExpiringSoon = daysRemaining <= 30;

    return {
        authorized: true,
        isAdmin: false,
        status: isExpiringSoon ? 'EXPIRING_SOON' : 'ACTIVE',
        daysRemaining,
        authorizationStartDate: user.authorizationStartDate,
        authorizationExpiryDate: user.authorizationExpiryDate,
        message: 'Test access authorized.'
    };
}

/**
 * Checks test access for a specific Olympiad test.
 */
export function checkTestAccess(user, testIdOrTest, examHint = '') {
    const authStatus = checkStudentAuthorization(user);
    if (!authStatus.authorized) {
        return authStatus;
    }

    // Admins have unrestricted access to all tests
    if (authStatus.isAdmin) {
        return { allowed: true, isAdmin: true };
    }

    // Authorized paid students have full access to Olympiad tests
    return {
        allowed: true,
        daysRemaining: authStatus.daysRemaining,
        authorizationExpiryDate: authStatus.authorizationExpiryDate
    };
}

/**
 * Records an audit log entry in the database.
 */
export async function logAdminAudit(db, { action, studentId, adminId, prevStatus = null, newStatus = null, details = {} }) {
    try {
        await db.collection('auditLogs').insertOne({
            action,
            studentId: studentId?.toString() || null,
            adminId: adminId?.toString() || null,
            prevStatus,
            newStatus,
            details,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Failed to write audit log:', err);
    }
}

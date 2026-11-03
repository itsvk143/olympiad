import { Resend } from 'resend';

// Resend free tier limits
export const RESEND_DAILY_LIMIT = parseInt(process.env.RESEND_DAILY_LIMIT || '100', 10);
export const RESEND_MONTHLY_LIMIT = parseInt(process.env.RESEND_MONTHLY_LIMIT || '3000', 10);

/**
 * Returns a configured Resend client or null if API key is not present.
 */
export function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !apiKey.startsWith('re_')) {
        return null;
    }
    return new Resend(apiKey);
}

/**
 * Check if the email service has configuration.
 */
export function isResendConfigured() {
    const apiKey = process.env.RESEND_API_KEY;
    return Boolean(apiKey && apiKey.startsWith('re_'));
}

/**
 * Friendly label for category keys
 */
export const CATEGORY_LABELS = {
    live: 'Live Tests',
    mock: 'Full Tests',
    full: 'Full Tests',
    subject: 'Subjectwise Tests',
    subjectwise: 'Subjectwise Tests',
    chapter: 'Chapterwise Tests',
    chapterwise: 'Chapterwise Tests',
    subtopic: 'Subtopicwise Tests',
    subtopicwise: 'Subtopicwise Tests',
};

/**
 * Generates the responsive HTML email template for activated test access.
 */
export function renderActivationEmailHtml({ studentName, studentEmail, activatedCategories, appUrl }) {
    const baseUrl = (appUrl || process.env.APP_URL || 'https://polltest.in').replace(/\/$/, '');
    const loginUrl = `${baseUrl}/auth/signin`;

    const categoryBadgesHtml = activatedCategories.map(cat => {
        const label = CATEGORY_LABELS[cat.toLowerCase()] || cat;
        return `
            <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #ffffff; font-weight: 600; font-size: 14px;">${label}</span>
                <span style="background: #10b981; color: #022c22; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px;">ACTIVE</span>
            </div>
        `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your PollTestSeries Test Access Is Now Active!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" style="max-width: 580px; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #1e1b4b 0%, #172554 100%); border-bottom: 1px solid #1e293b; text-align: center;">
                            <div style="display: inline-block; background: #6366f1; color: #ffffff; font-weight: 800; font-size: 18px; padding: 6px 14px; border-radius: 8px; margin-bottom: 12px; letter-spacing: 0.5px;">
                                PollTestSeries
                            </div>
                            <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3;">
                                Test Access Activated!
                            </h1>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <p style="margin: 0 0 16px 0; font-size: 15px; color: #cbd5e1;">
                                Dear <strong style="color: #ffffff;">${studentName || 'Student'}</strong>,
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8;">
                                Your test access has been successfully activated by the <strong style="color: #cbd5e1;">PollTestSeries</strong> administration team.
                            </p>

                            <!-- Activated Categories Card -->
                            <div style="margin-bottom: 28px;">
                                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #818cf8; margin-bottom: 12px;">
                                    Your Activated Test Categories
                                </div>
                                ${categoryBadgesHtml}
                            </div>

                            <p style="margin: 0 0 24px 0; font-size: 14px; color: #cbd5e1;">
                                You can now log in to your PollTestSeries account and access all available tests in these categories.
                            </p>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${loginUrl}" target="_blank" style="display: inline-block; background: #4f46e5; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                                    Log In & Start Tests &rarr;
                                </a>
                            </div>

                            <!-- Account Details Box -->
                            <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
                                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; margin-bottom: 8px;">
                                    Account Details
                                </div>
                                <div style="font-size: 13px; color: #94a3b8; margin-bottom: 4px;">
                                    <strong style="color: #cbd5e1;">Registered Email:</strong> ${studentEmail}
                                </div>
                                <div style="font-size: 13px; color: #94a3b8;">
                                    <strong style="color: #cbd5e1;">Website:</strong> <a href="${baseUrl}" style="color: #818cf8; text-decoration: none;">${baseUrl}</a>
                                </div>
                            </div>

                            <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;">
                                Start attempting your tests and regularly analyse your performance to improve your preparation.
                            </p>
                            <p style="margin: 16px 0 0 0; font-size: 13px; color: #cbd5e1; font-weight: 600;">
                                Best wishes,<br>
                                <span style="color: #818cf8;">Team PollTestSeries</span>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 32px; background: #0f172a; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
                            &copy; ${new Date().getFullYear()} PollTestSeries • <a href="${baseUrl}" style="color: #64748b; text-decoration: underline;">polltest.in</a><br>
                            This is an automated notification regarding your test access.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Plain-text fallback for email clients that do not render HTML.
 */
export function renderActivationEmailText({ studentName, studentEmail, activatedCategories, appUrl }) {
    const baseUrl = (appUrl || process.env.APP_URL || 'https://polltest.in').replace(/\/$/, '');
    const categoriesText = activatedCategories.map(cat => {
        const label = CATEGORY_LABELS[cat.toLowerCase()] || cat;
        return `- ${label} — ACTIVE`;
    }).join('\n');

    return `Dear ${studentName || 'Student'},

Your test access has been successfully activated by the PollTestSeries administration team.

Your Activated Test Categories:
${categoriesText}

You can now log in to your PollTestSeries account and access the available tests.

Account Details:
Registered Email: ${studentEmail}
Website: ${baseUrl}
Login URL: ${baseUrl}/auth/signin

Start attempting your tests and regularly analyse your performance to improve your preparation.

Best wishes!
Team PollTestSeries
${baseUrl}
`;
}

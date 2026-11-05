export async function generateMetadata({ params }) {
    const { exam } = await params;
    const isOlympiad = !exam || exam.toLowerCase().includes('olympiad');

    return {
        title: `National & International Olympiad Test Series | Classes 1–12`,
        description: `Access official-pattern Olympiad mock tests for Classes 1 to 12 in Mathematics (IMO), Science (NSO), and English (IEO) with KaTeX LaTeX rendering and visual solutions.`,
        openGraph: {
            title: `Olympiad Examination Platform — Mathematics, Science & English`,
            description: `Master Olympiad competitions with 360 full tests, authentic diagrams, and performance analytics.`,
        }
    };
}

export default function ExamLayout({ children }) {
    return <>{children}</>;
}

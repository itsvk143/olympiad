import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
// katex global CSS must live here (layout.js) — NOT inside client components
import "katex/dist/katex.min.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Olympiad Examination Platform — Mathematics, Science & English (Classes 1–12)",
  description: "Dedicated national and international Olympiad examination platform for Classes 1 to 12 in Mathematics, Science, and English with 360 test papers, KaTeX LaTeX rendering, and visual solutions.",
};

import AuthProvider from "../components/AuthProvider";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('polltest_theme');
                  var theme = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

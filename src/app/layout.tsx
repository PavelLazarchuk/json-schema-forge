import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';

import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'JSON Schema Forge — JSON to TypeScript + Zod',
    description:
        'Convert JSON into TypeScript interfaces and Zod schemas, entirely in your browser.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" className={`dark ${inter.variable}`} suppressHydrationWarning>
            <body className="h-full bg-white font-sans text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-100">
                {children}
                <SpeedInsights />
            </body>
        </html>
    );
}

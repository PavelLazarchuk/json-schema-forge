import type { ReactNode } from 'react';

export function StatusScreen({
    code,
    message,
    children,
}: {
    code: string;
    message: string;
    children?: ReactNode;
}) {
    return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center">
            <div
                aria-hidden
                className="flex h-12 w-12 select-none items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-violet-600 font-mono text-xl font-bold text-white shadow-sm"
            >
                {'{}'}
            </div>
            <h1 className="text-5xl font-semibold tracking-tight">{code}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
            {children}
        </div>
    );
}

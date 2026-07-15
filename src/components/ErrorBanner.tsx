import { JsonParseError } from '@/lib/parse';

export function ErrorBanner({ error }: { error: JsonParseError }) {
    return (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <span className="font-semibold">Invalid JSON:</span> {error.message}
            {error.line !== undefined && (
                <span className="ml-2 text-red-500 dark:text-red-400">
                    (line {error.line}
                    {error.column !== undefined && `, column ${error.column}`})
                </span>
            )}
        </div>
    );
}

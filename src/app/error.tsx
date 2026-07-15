'use client';

import { StatusScreen } from '@/components/StatusScreen';
import { toolbarButton } from '@/components/ui';

export default function Error({
    error,
    unstable_retry,
}: {
    error: Error & { digest?: string };
    unstable_retry: () => void;
}) {
    return (
        <StatusScreen code="500" message="Something went wrong.">
            <button type="button" onClick={() => unstable_retry()} className={toolbarButton}>
                Try again
            </button>
            {error.digest && (
                <p className="font-mono text-xs text-neutral-400 dark:text-neutral-600">
                    {error.digest}
                </p>
            )}
        </StatusScreen>
    );
}

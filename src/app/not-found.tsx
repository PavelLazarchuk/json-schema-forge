import type { Metadata } from 'next';
import Link from 'next/link';

import { StatusScreen } from '@/components/StatusScreen';
import { toolbarButton } from '@/components/ui';

export const metadata: Metadata = {
    title: 'Page not found — JSON Schema Forge',
};

export default function NotFound() {
    return (
        <StatusScreen code="404" message="This page could not be found.">
            <Link href="/" className={toolbarButton}>
                Back to Home
            </Link>
        </StatusScreen>
    );
}

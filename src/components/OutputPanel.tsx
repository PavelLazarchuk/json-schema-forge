'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Monaco } from '@monaco-editor/react';

import { GenerationSettings } from '@/lib/settings';
import { panelToolbar, toolbarButton } from './ui';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Tab = 'ts' | 'zod' | 'jsonSchema';

interface Props {
    tsCode: string;
    zodCode: string;
    jsonSchemaCode: string;
    settings: GenerationSettings;
    dark: boolean;
}

const tabButton = (active: boolean) =>
    `cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active
            ? 'bg-indigo-100/70 text-indigo-700 shadow-sm ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:shadow-none dark:ring-indigo-500/30'
            : 'text-neutral-500 hover:bg-indigo-50 hover:text-indigo-700 dark:text-neutral-400 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300'
    }`;

const copiedButton =
    'cursor-pointer rounded-md border border-emerald-400 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 shadow-sm ' +
    'dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:shadow-none';

const disableSemanticValidation = (monaco: Monaco) => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: false,
    });
};

export function OutputPanel({ tsCode, zodCode, jsonSchemaCode, settings, dark }: Props) {
    const tabs: { id: Tab; label: string }[] = [
        ...(settings.emitTs ? [{ id: 'ts' as const, label: 'TypeScript' }] : []),
        ...(settings.emitZod ? [{ id: 'zod' as const, label: 'Zod' }] : []),
        ...(settings.emitJsonSchema ? [{ id: 'jsonSchema' as const, label: 'JSON Schema' }] : []),
    ];

    const [tab, setTab] = useState<Tab>('ts');
    const active = tabs.some(t => t.id === tab) ? tab : tabs[0]?.id;
    const code = active === 'ts' ? tsCode : active === 'zod' ? zodCode : jsonSchemaCode;

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const id = setTimeout(() => setCopied(false), 1500);

        return () => clearTimeout(id);
    }, [copied]);

    if (tabs.length === 0) {
        return (
            <section className="flex items-center justify-center p-8 text-sm text-neutral-500 dark:text-neutral-400">
                Enable TypeScript, Zod, or JSON Schema output in settings.
            </section>
        );
    }

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
        } catch {
            // empty
        }
    };

    const download = () => {
        const isJson = active === 'jsonSchema';
        const blob = new Blob([code], { type: isJson ? 'application/json' : 'text/typescript' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        anchor.href = url;
        anchor.download = isJson ? 'schema.json' : active === 'ts' ? 'types.ts' : 'schemas.ts';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    return (
        <section className="flex min-h-0 flex-col">
            <div className={`${panelToolbar} gap-1`}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                            setTab(t.id);
                            setCopied(false);
                        }}
                        className={tabButton(t.id === active)}
                    >
                        {t.label}
                    </button>
                ))}
                <div className="ml-auto flex gap-2">
                    <button
                        type="button"
                        onClick={copy}
                        disabled={!code}
                        className={copied ? copiedButton : toolbarButton}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        type="button"
                        onClick={download}
                        disabled={!code}
                        className={toolbarButton}
                    >
                        Download
                    </button>
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <MonacoEditor
                    height="100%"
                    language={active === 'jsonSchema' ? 'json' : 'typescript'}
                    theme={dark ? 'vs-dark' : 'light'}
                    value={code}
                    beforeMount={disableSemanticValidation}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 13,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                    }}
                />
            </div>
        </section>
    );
}

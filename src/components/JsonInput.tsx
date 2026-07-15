'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';

import { panelToolbar, toolbarButton } from './ui';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface Props {
    value: string;
    onChange: (value: string) => void;
    dark: boolean;
}

export function JsonInput({ value, onChange, dark }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File | undefined) => {
        if (!file) return;

        try {
            onChange(await file.text());
        } catch {
            // empty
        }

        if (fileRef.current) fileRef.current.value = '';
    };

    const formatInput = () => {
        try {
            onChange(JSON.stringify(JSON.parse(value), null, 2) + '\n');
        } catch {
            // empty
        }
    };

    return (
        <section className="flex min-h-0 flex-col border-b border-neutral-200 md:border-b-0 md:border-r dark:border-neutral-800">
            <div className={panelToolbar}>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    JSON input
                </span>
                <div className="ml-auto flex gap-2">
                    <button type="button" onClick={formatInput} className={toolbarButton}>
                        Format
                    </button>
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className={toolbarButton}
                    >
                        Upload .json
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={e => handleFile(e.target.files?.[0])}
                    />
                </div>
            </div>
            <div className="min-h-0 flex-1">
                <MonacoEditor
                    height="100%"
                    language="json"
                    theme={dark ? 'vs-dark' : 'light'}
                    value={value}
                    onChange={next => onChange(next ?? '')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        tabSize: 2,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: 'on',
                    }}
                />
            </div>
        </section>
    );
}

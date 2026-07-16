'use client';

import { useEffect, useMemo, useState } from 'react';

import { ErrorBanner } from '@/components/ErrorBanner';
import { JsonInput } from '@/components/JsonInput';
import { OutputPanel } from '@/components/OutputPanel';
import { SettingsBar } from '@/components/SettingsBar';
import { toolbarButton } from '@/components/ui';
import { formatTsCode } from '@/lib/format';
import { generateJsonSchema } from '@/lib/generate-json-schema';
import { generateTs } from '@/lib/generate-ts';
import { generateZod } from '@/lib/generate-zod';
import { inferIR } from '@/lib/infer';
import { assignNames, IRNode } from '@/lib/ir';
import { JsonParseError, parseJson } from '@/lib/parse';
import { SAMPLE_JSON } from '@/lib/sample';
import { DEFAULT_SETTINGS, GenerationSettings, nameOptions } from '@/lib/settings';

const LARGE_INPUT_CHARS = 500_000;

function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delayMs);

        return () => clearTimeout(id);
    }, [value, delayMs]);

    return debounced;
}

interface Analyzed {
    ir: IRNode | null;
    error: JsonParseError | null;
    empty: boolean;
}

interface Generated {
    ts: string;
    zod: string;
    jsonSchema: string;
    error: JsonParseError | null;
}

export default function Home() {
    const [dark, setDark] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
    const [jsonText, setJsonText] = useState(SAMPLE_JSON);
    const debouncedText = useDebouncedValue(jsonText, 300);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', dark);
    }, [dark]);

    const analyzed = useMemo<Analyzed>(() => {
        if (debouncedText.trim() === '') return { ir: null, error: null, empty: true };

        const parsed = parseJson(debouncedText);

        if (!parsed.ok) return { ir: null, error: parsed.error, empty: false };

        return {
            ir: inferIR(parsed.value, {
                literals: settings.useConst,
                enums: settings.inferEnums,
            }),
            error: null,
            empty: false,
        };
    }, [debouncedText, settings.useConst, settings.inferEnums]);

    const generated = useMemo<Generated>(() => {
        if (!analyzed.ir) return { ts: '', zod: '', jsonSchema: '', error: null };

        try {
            assignNames(analyzed.ir, settings.rootName, nameOptions(settings));

            return {
                ts: settings.emitTs ? generateTs(analyzed.ir, settings) : '',
                zod: settings.emitZod ? generateZod(analyzed.ir, settings) : '',
                jsonSchema: settings.emitJsonSchema
                    ? generateJsonSchema(analyzed.ir, settings)
                    : '',
                error: null,
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Generation failed.';

            return { ts: '', zod: '', jsonSchema: '', error: { message } };
        }
    }, [analyzed, settings]);

    const error = analyzed.error ?? generated.error;

    const [output, setOutput] = useState({ ts: '', zod: '', jsonSchema: '' });

    useEffect(() => {
        if (analyzed.empty || error) return;

        let cancelled = false;

        Promise.all([formatTsCode(generated.ts), formatTsCode(generated.zod)]).then(([ts, zod]) => {
            if (!cancelled) setOutput({ ts, zod, jsonSchema: generated.jsonSchema });
        });

        return () => {
            cancelled = true;
        };
    }, [analyzed.empty, error, generated]);

    const tsCode = analyzed.empty ? '' : output.ts;
    const zodCode = analyzed.empty ? '' : output.zod;
    const jsonSchemaCode = analyzed.empty ? '' : output.jsonSchema;

    return (
        <div className="flex h-screen flex-col">
            <header className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-2.5 dark:border-neutral-800">
                <div
                    aria-hidden
                    className="flex h-7 w-7 select-none items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-violet-600 font-mono text-[13px] font-bold text-white shadow-sm"
                >
                    {'{}'}
                </div>
                <h1 className="text-sm font-semibold tracking-tight">
                    JSON Schema Forge
                    <span className="ml-2 hidden font-normal text-neutral-500 sm:inline dark:text-neutral-400">
                        JSON → TypeScript + Zod + JSON Schema
                    </span>
                </h1>
                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSettingsOpen(open => !open)}
                        aria-pressed={settingsOpen}
                        className={`${toolbarButton} ${settingsOpen ? 'ring-2 ring-indigo-400/40' : ''}`}
                    >
                        {settingsOpen ? 'Hide settings' : 'Settings'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setDark(value => !value)}
                        className={toolbarButton}
                    >
                        {dark ? 'Light' : 'Dark'}
                    </button>
                </div>
            </header>

            {settingsOpen && <SettingsBar settings={settings} onChange={setSettings} />}

            {analyzed.empty ? (
                <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
                    Paste JSON or upload a .json file to generate types.
                </div>
            ) : (
                error && <ErrorBanner error={error} />
            )}

            {jsonText.length > LARGE_INPUT_CHARS && (
                <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                    Large input — generation may take a moment.
                </div>
            )}

            <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
                <JsonInput value={jsonText} onChange={setJsonText} dark={dark} />
                <OutputPanel
                    tsCode={tsCode}
                    zodCode={zodCode}
                    jsonSchemaCode={jsonSchemaCode}
                    settings={settings}
                    dark={dark}
                />
            </main>
        </div>
    );
}

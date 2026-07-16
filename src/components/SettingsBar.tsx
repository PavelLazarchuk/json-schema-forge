'use client';

import { GenerationSettings } from '@/lib/settings';
import { checkboxLabel, fieldLabel, selectInput } from './ui';

interface Props {
    settings: GenerationSettings;
    onChange: (settings: GenerationSettings) => void;
}

export function SettingsBar({ settings, onChange }: Props) {
    const set = <K extends keyof GenerationSettings>(key: K, value: GenerationSettings[K]) =>
        onChange({ ...settings, [key]: value });

    const checkbox = (key: keyof GenerationSettings & string, label: string) => (
        <label className={checkboxLabel}>
            <input
                type="checkbox"
                checked={settings[key] as boolean}
                onChange={e => set(key, e.target.checked as GenerationSettings[typeof key])}
                className="accent-indigo-500"
            />
            {label}
        </label>
    );

    return (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/60">
            <label className={fieldLabel}>
                Root type name
                <input
                    type="text"
                    value={settings.rootName}
                    onChange={e => set('rootName', e.target.value)}
                    placeholder="Root"
                    className={`${selectInput} w-32`}
                />
            </label>

            <label className={fieldLabel}>
                Type prefix
                <input
                    type="text"
                    value={settings.typePrefix}
                    onChange={e => set('typePrefix', e.target.value)}
                    placeholder="I"
                    className={`${selectInput} w-16`}
                />
            </label>

            <label className={fieldLabel}>
                Type suffix
                <input
                    type="text"
                    value={settings.typeSuffix}
                    onChange={e => set('typeSuffix', e.target.value)}
                    placeholder="Dto"
                    className={`${selectInput} w-16`}
                />
            </label>

            <label className={fieldLabel}>
                TS construct
                <select
                    value={settings.tsConstruct}
                    onChange={e =>
                        set('tsConstruct', e.target.value as GenerationSettings['tsConstruct'])
                    }
                    className={selectInput}
                >
                    <option value="interface">interface</option>
                    <option value="type">type</option>
                </select>
            </label>

            <label className={fieldLabel}>
                Optional style
                <select
                    value={settings.optionalStyle}
                    onChange={e =>
                        set('optionalStyle', e.target.value as GenerationSettings['optionalStyle'])
                    }
                    className={selectInput}
                >
                    <option value="question">key?: T</option>
                    <option value="union-undefined">key: T | undefined</option>
                </select>
            </label>

            <label className={fieldLabel}>
                Empty arrays
                <select
                    value={settings.arrayEmpty}
                    onChange={e =>
                        set('arrayEmpty', e.target.value as GenerationSettings['arrayEmpty'])
                    }
                    className={selectInput}
                >
                    <option value="unknown">unknown[]</option>
                    <option value="any">any[]</option>
                </select>
            </label>

            <label className={fieldLabel}>
                Date strings
                <select
                    value={settings.dateFormat}
                    onChange={e =>
                        set('dateFormat', e.target.value as GenerationSettings['dateFormat'])
                    }
                    className={selectInput}
                >
                    <option value="off">plain string</option>
                    <option value="iso-string">z.string().datetime()</option>
                    <option value="date">Date (z.coerce.date())</option>
                </select>
            </label>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-0.5">
                {checkbox('emitTs', 'TypeScript')}
                {checkbox('emitZod', 'Zod')}
                {checkbox('emitJsonSchema', 'JSON Schema')}
                {checkbox('zodInferType', 'z.infer types')}
                {checkbox('readonly', 'readonly')}
                {checkbox('useConst', 'literal types')}
                {checkbox('inferIntegers', 'integer types')}
                {checkbox('inferEnums', 'enum detection')}
            </div>
        </div>
    );
}

import type { NameOptions } from './ir';

export interface GenerationSettings {
    tsConstruct: 'interface' | 'type'; // default: "interface"
    emitTs: boolean; // default: true
    emitZod: boolean; // default: true
    emitJsonSchema: boolean; // default: true
    rootName: string; // default: "Root"
    typePrefix: string; // e.g. "I" → IUser
    typeSuffix: string; // e.g. "Dto" → UserDto
    optionalStyle: 'question' | 'union-undefined'; // key?: T  vs  key: T | undefined
    arrayEmpty: 'unknown' | 'any'; // default: "unknown"
    zodInferType: boolean; // add z.infer export
    readonly: boolean; // readonly fields + readonly arrays (TS and Zod)
    useConst: boolean; // literal inference toggle
}

export const DEFAULT_SETTINGS: GenerationSettings = {
    tsConstruct: 'interface',
    emitTs: true,
    emitZod: true,
    emitJsonSchema: true,
    rootName: 'Root',
    typePrefix: '',
    typeSuffix: '',
    optionalStyle: 'question',
    arrayEmpty: 'unknown',
    zodInferType: true,
    readonly: false,
    useConst: false,
};

export function nameOptions(settings: GenerationSettings): NameOptions {
    return { prefix: settings.typePrefix, suffix: settings.typeSuffix };
}

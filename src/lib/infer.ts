import { IRField, IRNode, IRPrimitive, IRStringFormat, MAX_ENUM_VALUES, mergeUnion } from './ir';

export interface InferOptions {
    literals: boolean;
    enums: boolean;
}

const MAX_DEPTH = 64;

const DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function stringFormat(value: string): IRStringFormat | undefined {
    const format = DATE_TIME_RE.test(value)
        ? 'date-time'
        : DATE_RE.test(value)
          ? 'date'
          : undefined;

    return format && !Number.isNaN(Date.parse(value)) ? format : undefined;
}

export function inferIR(value: unknown, options: InferOptions): IRNode {
    const root = inferValue(value, options, 0);

    return options.enums ? withEnums(root) : root;
}

function inferValue(value: unknown, options: InferOptions, depth: number): IRNode {
    if (depth > MAX_DEPTH) return { kind: 'unknown' };
    if (value === null) return { kind: 'null' };

    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
        if (options.literals && (type !== 'number' || Number.isFinite(value))) {
            return { kind: 'literal', value: value as string | number | boolean };
        }

        if (type === 'string') {
            const str = value as string;
            const node: IRPrimitive = { kind: 'primitive', type: 'string' };
            const format = stringFormat(str);

            if (format) node.format = format;
            if (options.enums) node.values = new Map([[str, 1]]);

            return node;
        }

        if (type === 'number' && Number.isSafeInteger(value)) {
            return { kind: 'primitive', type: 'number', int: true };
        }

        return { kind: 'primitive', type: type as IRPrimitive['type'] };
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { kind: 'array', element: { kind: 'unknown' } };
        }

        return {
            kind: 'array',
            element: mergeUnion(value.map(element => inferValue(element, options, depth + 1))),
        };
    }

    if (type === 'object') {
        const fields: IRField[] = Object.entries(value as Record<string, unknown>).map(
            ([key, fieldValue]) => ({
                key,
                node: inferValue(fieldValue, options, depth + 1),
                optional: false,
            })
        );

        return { kind: 'object', name: '', fields };
    }

    return { kind: 'unknown' };
}

function withEnums(node: IRNode): IRNode {
    switch (node.kind) {
        case 'primitive':
            if (
                node.type === 'string' &&
                !node.format &&
                node.values &&
                isEnumCandidate(node.values)
            ) {
                return { kind: 'enum', name: '', values: [...node.values.keys()] };
            }

            return node;
        case 'array':
            node.element = withEnums(node.element);

            return node;
        case 'object':
            for (const field of node.fields) field.node = withEnums(field.node);

            return node;
        case 'union':
            node.options = node.options.map(withEnums);

            return node;
        default:
            return node;
    }
}

function isEnumCandidate(values: Map<string, number>): boolean {
    if (values.size < 2 || values.size > MAX_ENUM_VALUES) return false;

    let total = 0;

    for (const count of values.values()) total += count;

    return total > values.size;
}

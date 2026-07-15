import { IRField, IRNode, IRPrimitiveType, mergeUnion } from './ir';

export interface InferOptions {
    literals: boolean;
}

const MAX_DEPTH = 64;

export function inferIR(value: unknown, options: InferOptions): IRNode {
    return inferValue(value, options, 0);
}

function inferValue(value: unknown, options: InferOptions, depth: number): IRNode {
    if (depth > MAX_DEPTH) return { kind: 'unknown' };
    if (value === null) return { kind: 'null' };

    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
        if (options.literals && (type !== 'number' || Number.isFinite(value))) {
            return { kind: 'literal', value: value as string | number | boolean };
        }

        return { kind: 'primitive', type: type as IRPrimitiveType };
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

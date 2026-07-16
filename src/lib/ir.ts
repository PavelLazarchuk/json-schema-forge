// Intermediate Representation (IR) shared by the TypeScript and Zod generators.

export type IRPrimitiveType = 'string' | 'number' | 'boolean';

export type IRStringFormat = 'date-time' | 'date';

export const MAX_ENUM_VALUES = 12;

export type IRNode =
    | {
          kind: 'primitive';
          type: IRPrimitiveType;
          format?: IRStringFormat;
          int?: boolean;
          values?: Map<string, number>;
      }
    | { kind: 'null' }
    | { kind: 'literal'; value: string | number | boolean }
    | { kind: 'array'; element: IRNode }
    | { kind: 'object'; name: string; fields: IRField[] }
    | { kind: 'enum'; name: string; values: string[] }
    | { kind: 'union'; options: IRNode[] }
    | { kind: 'unknown' };

export interface IRField {
    key: string;
    node: IRNode;
    optional: boolean;
}

export type IRPrimitive = Extract<IRNode, { kind: 'primitive' }>;
export type IRObject = Extract<IRNode, { kind: 'object' }>;
export type IRArray = Extract<IRNode, { kind: 'array' }>;
export type IRLiteral = Extract<IRNode, { kind: 'literal' }>;
export type IREnum = Extract<IRNode, { kind: 'enum' }>;

export function mergeUnion(nodes: IRNode[]): IRNode {
    const flat: IRNode[] = [];
    const flatten = (node: IRNode): void => {
        if (node.kind === 'union') node.options.forEach(flatten);
        else flat.push(node);
    };

    nodes.forEach(flatten);

    const primitives = new Map<IRPrimitiveType, IRPrimitive[]>();
    const literals = new Map<string, IRLiteral>();
    const objects: IRObject[] = [];
    const arrays: IRArray[] = [];
    const enums: IREnum[] = [];
    let hasNull = false;

    for (const node of flat) {
        switch (node.kind) {
            case 'primitive': {
                const bucket = primitives.get(node.type);

                if (bucket) bucket.push(node);
                else primitives.set(node.type, [node]);
                break;
            }
            case 'literal':
                literals.set(`${typeof node.value}:${JSON.stringify(node.value)}`, node);
                break;
            case 'object':
                objects.push(node);
                break;
            case 'array':
                arrays.push(node);
                break;
            case 'enum':
                enums.push(node);
                break;
            case 'null':
                hasNull = true;
                break;
            case 'unknown':
                break;
            case 'union':
                break;
        }
    }

    const members: IRNode[] = [];

    if (objects.length > 0) {
        members.push(objects.length === 1 ? objects[0] : mergeObjects(objects));
    }
    if (arrays.length > 0) {
        members.push({ kind: 'array', element: mergeUnion(arrays.map(a => a.element)) });
    }
    members.push(...enums);
    for (const [type, nodes] of primitives) {
        members.push(mergePrimitives(type, nodes));
    }
    for (const literal of literals.values()) {
        if (!primitives.has(typeof literal.value as IRPrimitiveType)) members.push(literal);
    }
    if (hasNull) members.push({ kind: 'null' });

    if (members.length === 0) return { kind: 'unknown' };
    if (members.length === 1) return members[0];

    return { kind: 'union', options: members };
}

function mergePrimitives(type: IRPrimitiveType, nodes: IRPrimitive[]): IRPrimitive {
    if (nodes.length === 1) return nodes[0];

    const merged: IRPrimitive = { kind: 'primitive', type };

    if (type === 'string') {
        const format = nodes[0].format;

        if (format && nodes.every(node => node.format === format)) merged.format = format;

        const values = new Map<string, number>();

        for (const node of nodes) {
            if (!node.values) return merged;

            for (const [value, count] of node.values) {
                values.set(value, (values.get(value) ?? 0) + count);
            }
        }

        if (values.size <= MAX_ENUM_VALUES) merged.values = values;
    } else if (type === 'number' && nodes.every(node => node.int)) {
        merged.int = true;
    }

    return merged;
}

function mergeObjects(objects: IRObject[]): IRObject {
    const keyOrder: string[] = [];
    const byKey = new Map<string, { nodes: IRNode[]; seen: number; optional: boolean }>();

    for (const obj of objects) {
        for (const field of obj.fields) {
            let entry = byKey.get(field.key);

            if (!entry) {
                entry = { nodes: [], seen: 0, optional: false };
                byKey.set(field.key, entry);
                keyOrder.push(field.key);
            }

            entry.nodes.push(field.node);
            entry.seen += 1;
            entry.optional ||= field.optional;
        }
    }

    const fields: IRField[] = keyOrder.map(key => {
        const entry = byKey.get(key)!;

        return {
            key,
            node: mergeUnion(entry.nodes),
            optional: entry.optional || entry.seen < objects.length,
        };
    });

    return { kind: 'object', name: '', fields };
}

export function collectObjects(root: IRNode): IRObject[] {
    const out: IRObject[] = [];
    const walk = (node: IRNode): void => {
        switch (node.kind) {
            case 'object':
                out.push(node);
                node.fields.forEach(field => walk(field.node));
                break;
            case 'array':
                walk(node.element);
                break;
            case 'union':
                node.options.forEach(walk);
                break;
            default:
                break;
        }
    };
    walk(root);
    return out;
}

export function collectEnums(root: IRNode): IREnum[] {
    const out: IREnum[] = [];

    const walk = (node: IRNode): void => {
        switch (node.kind) {
            case 'enum':
                out.push(node);
                break;
            case 'object':
                node.fields.forEach(field => walk(field.node));
                break;
            case 'array':
                walk(node.element);
                break;
            case 'union':
                node.options.forEach(walk);
                break;
            default:
                break;
        }
    };

    walk(root);

    return out;
}

const IDENTIFIER_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export function safePropertyKey(key: string): string {
    return IDENTIFIER_RE.test(key) ? key : JSON.stringify(key);
}

export function toPascalCase(input: string): string {
    const parts = input.split(/[^A-Za-z0-9]+/).filter(Boolean);
    let name = parts.map(part => part[0].toUpperCase() + part.slice(1)).join('');

    if (name === '') name = 'Type';
    if (/^[0-9]/.test(name)) name = 'N' + name;

    return name;
}

export interface NameOptions {
    prefix?: string;
    suffix?: string;
}

function sanitizeAffix(affix: string): string {
    return affix.replace(/[^A-Za-z0-9_$]/g, '');
}

function decorateName(base: string, options: NameOptions): string {
    const name = sanitizeAffix(options.prefix ?? '') + base + sanitizeAffix(options.suffix ?? '');

    return /^[0-9]/.test(name) ? 'N' + name : name;
}

function rootBaseName(rootName: string): string {
    return toPascalCase(rootName.trim() === '' ? 'Root' : rootName);
}

export function rootTypeName(rootName: string, options: NameOptions = {}): string {
    return decorateName(rootBaseName(rootName), options);
}

function singularize(name: string): string {
    if (/ies$/.test(name) && name.length > 3) return name.slice(0, -3) + 'y';
    if (/(sses|xes|ches|shes)$/.test(name)) return name.slice(0, -2);
    if (/s$/.test(name) && !/ss$/.test(name) && name.length > 1) return name.slice(0, -1);

    return name;
}

function elementBase(base: string): string {
    const singular = singularize(base);

    return singular !== base ? singular : base + 'Item';
}

export function assignNames(root: IRNode, rootName: string, options: NameOptions = {}): void {
    const used = new Set<string>();
    const unique = (base: string): string => {
        if (!used.has(base)) {
            used.add(base);
            return base;
        }

        let i = 2;

        while (used.has(base + i)) i++;

        used.add(base + i);

        return base + i;
    };

    const rootBase = rootBaseName(rootName);

    if (root.kind !== 'object' && root.kind !== 'enum') {
        used.add(rootBase);
    }

    const visit = (node: IRNode, base: string, childPrefix?: string): void => {
        switch (node.kind) {
            case 'object': {
                const raw = unique(base);

                node.name = decorateName(raw, options);

                const prefix = childPrefix ?? raw;

                for (const field of node.fields) {
                    visit(field.node, prefix + toPascalCase(field.key));
                }
                break;
            }
            case 'enum':
                node.name = decorateName(unique(base), options);
                break;
            case 'array':
                visit(node.element, elementBase(base));
                break;
            case 'union':
                node.options.forEach(option => visit(option, base));
                break;
            default:
                break;
        }
    };

    visit(root, rootBase, root.kind === 'object' ? '' : undefined);
}

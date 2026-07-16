import {
    collectEnums,
    collectObjects,
    IRNode,
    IRObject,
    rootTypeName,
    safePropertyKey,
} from './ir';
import { GenerationSettings, nameOptions } from './settings';

export function generateTs(root: IRNode, settings: GenerationSettings): string {
    const blocks: string[] = [];

    if (root.kind !== 'object' && root.kind !== 'enum') {
        blocks.push(
            `export type ${rootTypeName(settings.rootName, nameOptions(settings))} = ${renderType(root, settings)};`
        );
    }
    for (const obj of collectObjects(root)) {
        blocks.push(renderObject(obj, settings));
    }
    for (const en of collectEnums(root)) {
        const union = en.values.map(value => JSON.stringify(value)).join(' | ');

        blocks.push(`export type ${en.name} = ${union};`);
    }

    return blocks.join('\n\n') + '\n';
}

function renderObject(obj: IRObject, settings: GenerationSettings): string {
    const isInterface = settings.tsConstruct === 'interface';
    const open = isInterface ? `export interface ${obj.name} {` : `export type ${obj.name} = {`;
    const close = isInterface ? '}' : '};';

    const lines = obj.fields.map(field => {
        const readonly = settings.readonly ? 'readonly ' : '';
        const key = safePropertyKey(field.key);
        const type = renderType(field.node, settings);
        if (!field.optional) return `  ${readonly}${key}: ${type};`;
        return settings.optionalStyle === 'question'
            ? `  ${readonly}${key}?: ${type};`
            : `  ${readonly}${key}: ${type} | undefined;`;
    });

    return [open, ...lines, close].join('\n');
}

function renderType(node: IRNode, settings: GenerationSettings): string {
    switch (node.kind) {
        case 'primitive':
            if (node.type === 'string' && node.format && settings.dateFormat !== 'off') {
                return settings.dateFormat === 'date' ? 'Date' : `string /* ${node.format} */`;
            }

            return node.type;
        case 'null':
            return 'null';
        case 'unknown':
            return settings.arrayEmpty === 'any' ? 'any' : 'unknown';
        case 'literal':
            return JSON.stringify(node.value);
        case 'object':
        case 'enum':
            return node.name;
        case 'array': {
            const element = renderType(node.element, settings);
            const needsParens =
                node.element.kind === 'union' ||
                (settings.readonly && node.element.kind === 'array');
            const rendered = needsParens ? `(${element})[]` : `${element}[]`;

            return settings.readonly ? `readonly ${rendered}` : rendered;
        }
        case 'union':
            return node.options.map(option => renderType(option, settings)).join(' | ');
    }
}

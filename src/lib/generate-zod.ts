import {
    collectEnums,
    collectObjects,
    IRNode,
    literalSource,
    rootTypeName,
    safePropertyKey,
} from './ir';
import { GenerationSettings, nameOptions } from './settings';

export function generateZod(root: IRNode, settings: GenerationSettings): string {
    const blocks: string[] = [`import { z } from "zod";`];

    for (const en of collectEnums(root)) {
        const values = en.values.map(value => JSON.stringify(value)).join(', ');
        const lines = [`export const ${en.name}Schema = z.enum([${values}]);`];

        if (settings.zodInferType) {
            lines.push(`export type ${en.name} = z.infer<typeof ${en.name}Schema>;`);
        }

        blocks.push(lines.join('\n'));
    }

    for (const obj of collectObjects(root).reverse()) {
        const fields = obj.fields.map(field => {
            let expr = zodExpr(field.node, settings);
            if (field.optional) expr += '.optional()';
            return `  ${zodPropertyKey(field.key)}: ${expr},`;
        });
        const close = settings.readonly ? '}).readonly();' : '});';
        const lines = [`export const ${obj.name}Schema = z.object({`, ...fields, close];

        if (settings.zodInferType) {
            lines.push(`export type ${obj.name} = z.infer<typeof ${obj.name}Schema>;`);
        }

        blocks.push(lines.join('\n'));
    }

    if (root.kind !== 'object' && root.kind !== 'enum') {
        const rootName = rootTypeName(settings.rootName, nameOptions(settings));
        const lines = [`export const ${rootName}Schema = ${zodExpr(root, settings)};`];

        if (settings.zodInferType) {
            lines.push(`export type ${rootName} = z.infer<typeof ${rootName}Schema>;`);
        }

        blocks.push(lines.join('\n'));
    }

    return blocks.join('\n\n') + '\n';
}

function zodPropertyKey(key: string): string {
    if (key === '__proto__') return '["__proto__"]';

    return safePropertyKey(key);
}

function zodExpr(node: IRNode, settings: GenerationSettings): string {
    switch (node.kind) {
        case 'primitive':
            if (node.type === 'string' && node.format && settings.dateFormat !== 'off') {
                if (settings.dateFormat === 'date') return 'z.coerce.date()';

                return node.format === 'date-time'
                    ? 'z.string().datetime({ offset: true })'
                    : 'z.string().date()';
            }
            if (node.type === 'number' && node.int && settings.inferIntegers) {
                return 'z.number().int()';
            }

            return `z.${node.type}()`;
        case 'null':
            return 'z.null()';
        case 'unknown':
            return settings.arrayEmpty === 'any' ? 'z.any()' : 'z.unknown()';
        case 'literal':
            return `z.literal(${literalSource(node.value)})`;
        case 'object':
        case 'enum':
            return `${node.name}Schema`;
        case 'array': {
            const array = `z.array(${zodExpr(node.element, settings)})`;

            return settings.readonly ? `${array}.readonly()` : array;
        }
        case 'union': {
            const withoutNull = node.options.filter(option => option.kind !== 'null');
            const hasNull = withoutNull.length !== node.options.length;

            if (hasNull && withoutNull.length === 1) {
                return `${zodExpr(withoutNull[0], settings)}.nullable()`;
            }

            return `z.union([${node.options.map(option => zodExpr(option, settings)).join(', ')}])`;
        }
    }
}

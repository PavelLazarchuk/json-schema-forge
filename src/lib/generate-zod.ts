import { collectObjects, IRNode, rootTypeName, safePropertyKey } from './ir';
import { GenerationSettings, nameOptions } from './settings';

export function generateZod(root: IRNode, settings: GenerationSettings): string {
    const blocks: string[] = [`import { z } from "zod";`];

    for (const obj of collectObjects(root).reverse()) {
        const fields = obj.fields.map(field => {
            let expr = zodExpr(field.node, settings);
            if (field.optional) expr += '.optional()';
            return `  ${zodPropertyKey(field.key)}: ${expr},`;
        });
        const lines = [`export const ${obj.name}Schema = z.object({`, ...fields, `});`];

        if (settings.zodInferType) {
            lines.push(`export type ${obj.name} = z.infer<typeof ${obj.name}Schema>;`);
        }

        blocks.push(lines.join('\n'));
    }

    if (root.kind !== 'object') {
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
            return `z.${node.type}()`;
        case 'null':
            return 'z.null()';
        case 'unknown':
            return settings.arrayEmpty === 'any' ? 'z.any()' : 'z.unknown()';
        case 'literal':
            return `z.literal(${JSON.stringify(node.value)})`;
        case 'object':
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

import { collectEnums, collectObjects, IRNode, IRObject, rootTypeName } from './ir';
import { GenerationSettings, nameOptions } from './settings';

export function generateJsonSchema(root: IRNode, settings: GenerationSettings): string {
    const schema: Record<string, unknown> = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
    };

    if (root.kind === 'object' || root.kind === 'enum') {
        schema.$ref = `#/$defs/${root.name}`;
    } else {
        schema.title = rootTypeName(settings.rootName, nameOptions(settings));
        Object.assign(schema, schemaFor(root, settings));
    }

    const objects = collectObjects(root);
    const enums = collectEnums(root);

    if (objects.length > 0 || enums.length > 0) {
        const defs = Object.create(null) as Record<string, unknown>;
        for (const obj of objects) defs[obj.name] = objectSchema(obj, settings);
        for (const en of enums) defs[en.name] = { type: 'string', enum: en.values };
        schema.$defs = defs;
    }

    return JSON.stringify(schema, null, 2) + '\n';
}

function objectSchema(obj: IRObject, settings: GenerationSettings): Record<string, unknown> {
    const properties = Object.create(null) as Record<string, unknown>;
    const required: string[] = [];

    for (const field of obj.fields) {
        properties[field.key] = schemaFor(field.node, settings);
        if (!field.optional) required.push(field.key);
    }

    const schema: Record<string, unknown> = { type: 'object', properties };

    if (required.length > 0) schema.required = required;

    return schema;
}

function schemaFor(node: IRNode, settings: GenerationSettings): Record<string, unknown> {
    switch (node.kind) {
        case 'primitive':
            if (node.type === 'string' && node.format && settings.dateFormat !== 'off') {
                return { type: 'string', format: node.format };
            }
            if (node.type === 'number' && node.int && settings.inferIntegers) {
                return { type: 'integer' };
            }
            return { type: node.type };
        case 'null':
            return { type: 'null' };
        case 'unknown':
            return {};
        case 'literal':
            return { const: node.value };
        case 'object':
        case 'enum':
            return { $ref: `#/$defs/${node.name}` };
        case 'array': {
            if (node.element.kind === 'unknown') return { type: 'array' };

            return { type: 'array', items: schemaFor(node.element, settings) };
        }
        case 'union': {
            const hasFormattedString = node.options.some(
                o =>
                    o.kind === 'primitive' &&
                    o.type === 'string' &&
                    o.format &&
                    settings.dateFormat !== 'off'
            );

            if (
                !hasFormattedString &&
                node.options.every(o => o.kind === 'primitive' || o.kind === 'null')
            ) {
                return {
                    type: node.options.map(o => {
                        if (o.kind === 'null') return 'null';

                        return o.type === 'number' && o.int && settings.inferIntegers
                            ? 'integer'
                            : o.type;
                    }),
                };
            }

            return { anyOf: node.options.map(option => schemaFor(option, settings)) };
        }
    }
}

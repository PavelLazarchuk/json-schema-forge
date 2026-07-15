import { collectObjects, IRNode, IRObject, rootTypeName } from './ir';
import { GenerationSettings, nameOptions } from './settings';

export function generateJsonSchema(root: IRNode, settings: GenerationSettings): string {
    const schema: Record<string, unknown> = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
    };

    if (root.kind === 'object') {
        schema.$ref = `#/$defs/${root.name}`;
    } else {
        schema.title = rootTypeName(settings.rootName, nameOptions(settings));
        Object.assign(schema, schemaFor(root));
    }

    const objects = collectObjects(root);

    if (objects.length > 0) {
        const defs = Object.create(null) as Record<string, unknown>;
        for (const obj of objects) defs[obj.name] = objectSchema(obj);
        schema.$defs = defs;
    }

    return JSON.stringify(schema, null, 2) + '\n';
}

function objectSchema(obj: IRObject): Record<string, unknown> {
    const properties = Object.create(null) as Record<string, unknown>;
    const required: string[] = [];

    for (const field of obj.fields) {
        properties[field.key] = schemaFor(field.node);
        if (!field.optional) required.push(field.key);
    }

    const schema: Record<string, unknown> = { type: 'object', properties };

    if (required.length > 0) schema.required = required;

    return schema;
}

function schemaFor(node: IRNode): Record<string, unknown> {
    switch (node.kind) {
        case 'primitive':
            return { type: node.type };
        case 'null':
            return { type: 'null' };
        case 'unknown':
            return {};
        case 'literal':
            return { const: node.value };
        case 'object':
            return { $ref: `#/$defs/${node.name}` };
        case 'array': {
            if (node.element.kind === 'unknown') return { type: 'array' };

            return { type: 'array', items: schemaFor(node.element) };
        }
        case 'union': {
            if (node.options.every(o => o.kind === 'primitive' || o.kind === 'null')) {
                return { type: node.options.map(o => (o.kind === 'null' ? 'null' : o.type)) };
            }

            return { anyOf: node.options.map(schemaFor) };
        }
    }
}

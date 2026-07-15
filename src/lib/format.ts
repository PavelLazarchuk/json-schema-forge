import type { Plugin } from 'prettier';

export async function formatTsCode(code: string): Promise<string> {
    if (code.trim() === '') return code;

    try {
        const [standalone, tsPlugin, estreePlugin] = await Promise.all([
            import('prettier/standalone'),
            import('prettier/plugins/typescript'),
            import('prettier/plugins/estree'),
        ]);

        return await standalone.format(code, {
            parser: 'typescript',
            plugins: [
                tsPlugin.default ?? tsPlugin,
                estreePlugin.default ?? estreePlugin,
            ] as Plugin[],
        });
    } catch {
        return code;
    }
}

export interface JsonParseError {
    message: string;
    line?: number;
    column?: number;
}

export type ParseResult = { ok: true; value: unknown } | { ok: false; error: JsonParseError };

export function parseJson(text: string): ParseResult {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    try {
        return { ok: true, value: JSON.parse(text) };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        return { ok: false, error: describeError(message, text) };
    }
}

function describeError(message: string, text: string): JsonParseError {
    const lineCol = message.match(/line (\d+) column (\d+)/i);

    if (lineCol) {
        return { message, line: Number(lineCol[1]), column: Number(lineCol[2]) };
    }

    const pos = message.match(/position (\d+)/i);

    if (pos) {
        const offset = Math.min(Number(pos[1]), text.length);
        const before = text.slice(0, offset);
        const line = before.split('\n').length;
        const column = offset - before.lastIndexOf('\n');

        return { message, line, column };
    }

    return { message };
}

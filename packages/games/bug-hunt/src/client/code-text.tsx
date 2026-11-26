import type { HighlightToken } from './highlight';

/** Saca los primeros `n` caracteres (la sangría) del flujo de tokens, aunque crucen tokens. */
function dropPrefix(tokens: readonly HighlightToken[], n: number): HighlightToken[] {
  const out: HighlightToken[] = [];
  let left = n;
  for (const token of tokens) {
    if (left >= token.content.length) {
      left -= token.content.length;
      continue;
    }
    out.push(left > 0 ? { ...token, content: token.content.slice(left) } : token);
    left = 0;
  }
  return out;
}

/**
 * Una línea de código que nunca obliga a scrollear de costado: si no entra, salta de línea y la
 * continuación arranca alineada con el código de esa línea (la sangría queda fija a la izquierda).
 * El contenedor externo conserva `whitespace-pre` y su texto es la línea completa.
 */
export function CodeText({
  text,
  tokens,
}: {
  text: string;
  tokens?: readonly HighlightToken[] | undefined;
}) {
  const indent = text.slice(0, text.length - text.trimStart().length);
  const rest = tokens ? dropPrefix(tokens, indent.length) : null;
  return (
    <span className="flex min-w-0 flex-1 whitespace-pre">
      {indent ? <span className="flex-none">{indent}</span> : null}
      <span className="min-w-0 whitespace-pre-wrap wrap-anywhere">
        {rest
          ? rest.map((token, k) => (
              <span key={k} style={token.color ? { color: token.color } : undefined}>
                {token.content}
              </span>
            ))
          : text.slice(indent.length)}
      </span>
    </span>
  );
}

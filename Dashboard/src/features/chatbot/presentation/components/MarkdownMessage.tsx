import { Fragment } from 'react';

interface Props {
  content: string;
}

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'code'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'heading'; level: number; text: string };

function parseBlocks(raw: string): Block[] {
  const blocks: Block[] = [];
  const lines = raw.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      i++; // skip closing ```
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph: collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paraLines.join('\n') });
    }
  }

  return blocks;
}

// Tokenizes inline markdown: **bold**, *italic*, `code`, [text](url)
function renderInline(text: string): React.ReactNode {
  const tokens: React.ReactNode[] = [];
  // Tries bold first so ** is not consumed by single *
  const pattern =
    /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]+\))/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(<Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    const m = match[0];
    if (m.startsWith('**')) {
      tokens.push(<strong key={key++}>{m.slice(2, -2)}</strong>);
    } else if (m.startsWith('*')) {
      tokens.push(<em key={key++}>{m.slice(1, -1)}</em>);
    } else if (m.startsWith('`')) {
      tokens.push(
        <code
          key={key++}
          className="px-1 rounded text-xs font-mono"
          style={{ background: '#f0eded', color: '#00284D' }}
        >
          {m.slice(1, -1)}
        </code>,
      );
    } else {
      const lm = m.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) {
        tokens.push(
          <a
            key={key++}
            href={lm[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium"
            style={{ color: '#426088' }}
          >
            {lm[1]}
          </a>,
        );
      }
    }
    lastIndex = match.index + m.length;
  }

  if (lastIndex < text.length) {
    tokens.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }

  return tokens.length === 0 ? null : tokens.length === 1 ? tokens[0] : <>{tokens}</>;
}

export function MarkdownMessage({ content }: Props) {
  if (!content?.trim()) return null;

  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, bi) => {
        if (block.type === 'heading') {
          const sizeCls = block.level <= 2 ? 'text-base' : 'text-sm';
          return (
            <p
              key={bi}
              className={`font-semibold font-serif ${sizeCls}`}
              style={{ color: '#00132a' }}
            >
              {renderInline(block.text)}
            </p>
          );
        }

        if (block.type === 'code') {
          return (
            <pre
              key={bi}
              className="rounded-lg p-3 overflow-x-auto text-xs font-mono"
              style={{ background: '#1b1c1c', color: '#e4e2e1' }}
            >
              <code>{block.text}</code>
            </pre>
          );
        }

        if (block.type === 'ul') {
          return (
            <ul key={bi} className="list-disc pl-4 space-y-0.5">
              {block.items.map((item, ii) => (
                <li key={ii}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={bi} className="list-decimal pl-4 space-y-0.5">
              {block.items.map((item, ii) => (
                <li key={ii}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        // Paragraph
        return (
          <p key={bi}>
            {block.text.split('\n').map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {renderInline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

type MdNode = {
  type: string;
  value?: string;
  children?: MdNode[];
  position?: { start?: { offset?: number } };
  data?: Record<string, unknown>;
};

type VFileLike = { toString: () => string };

type Options = {
  memberNames?: readonly string[];
};

const SPOILER_RE = /\|\|([\s\S]+?)\|\|/;

function textNode(value: string): MdNode {
  return { type: 'text', value };
}

function spoilerNode(value: string): MdNode {
  return {
    type: 'messageSpoiler',
    data: { hName: 'x-spoiler' },
    children: [textNode(value)],
  };
}

function mentionNode(value: string): MdNode {
  return {
    type: 'messageMention',
    data: { hName: 'x-mention' },
    children: [textNode(value)],
  };
}

function splitMentions(value: string, names: readonly string[]): MdNode[] {
  const out: MdNode[] = [];
  let last = 0;
  let i = 0;
  while (i < value.length) {
    if (value[i] !== '@') {
      i += 1;
      continue;
    }
    const before = i === 0 ? '' : value[i - 1];
    if (before && /[\w@]/.test(before)) {
      i += 1;
      continue;
    }
    const rest = value.slice(i + 1);
    let matched: string | null = null;
    if (/^everyone(?!\w)/i.test(rest)) {
      matched = rest.slice(0, 'everyone'.length);
    } else {
      for (const name of names) {
        if (
          rest.length >= name.length &&
          rest.slice(0, name.length).toLowerCase() === name.toLowerCase()
        ) {
          const after = rest[name.length];
          if (!after || !/\w/.test(after)) {
            matched = rest.slice(0, name.length);
            break;
          }
        }
      }
    }
    if (!matched) {
      i += 1;
      continue;
    }
    if (last < i) out.push(textNode(value.slice(last, i)));
    out.push(mentionNode(`@${matched}`));
    i += 1 + matched.length;
    last = i;
  }
  if (last < value.length) out.push(textNode(value.slice(last)));
  return out;
}

function splitText(value: string, names: readonly string[]): MdNode[] {
  const out: MdNode[] = [];
  let rest = value;
  for (;;) {
    const match = SPOILER_RE.exec(rest);
    if (!match || match.index === undefined) break;
    const beforeText = rest.slice(0, match.index);
    if (beforeText) out.push(...splitMentions(beforeText, names));
    out.push(spoilerNode(match[1]));
    rest = rest.slice(match.index + match[0].length);
  }
  if (rest) out.push(...splitMentions(rest, names));
  return out;
}

function walk(node: MdNode, source: string, names: readonly string[]): void {
  if (!node.children) return;
  if (node.type === 'messageSpoiler' || node.type === 'messageMention') return;
  const next: MdNode[] = [];
  for (const child of node.children) {
    if (child.type === 'strong') {
      const offset = child.position?.start?.offset;
      if (offset !== undefined && source[offset] === '_') {
        child.data = { ...child.data, hName: 'u' };
      }
    }
    if (child.type === 'text' && typeof child.value === 'string') {
      next.push(...splitText(child.value, names));
      continue;
    }
    walk(child, source, names);
    next.push(child);
  }
  node.children = next;
}

export function remarkMessageExtras(options: Options = {}) {
  const names = [...(options.memberNames ?? [])].sort(
    (a, b) => b.length - a.length,
  );
  return (tree: unknown, file: VFileLike) => {
    walk(tree as MdNode, String(file), names);
  };
}

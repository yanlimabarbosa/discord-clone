import { memo, useMemo, useState, type ReactNode } from 'react';
import Markdown, { type Components, type Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { remarkMessageExtras } from '../lib/remark-message-extras';
import { isJumboEmoji } from '../lib/jumbo-emoji';
import './message-markdown.css';

type MessageMarkdownProps = {
  content: string;
  memberNames?: readonly string[];
};

type RemarkPlugins = NonNullable<Options['remarkPlugins']>;

function Spoiler({ children }: { children?: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  if (revealed) {
    return <span className="md-spoiler is-revealed">{children}</span>;
  }
  return (
    <button
      type="button"
      className="md-spoiler"
      aria-label="Reveal spoiler"
      onClick={() => setRevealed(true)}
    >
      {children}
    </button>
  );
}

function Mention({ children }: { children?: ReactNode }) {
  return <span className="md-mention">{children}</span>;
}

function ExternalLink({
  href,
  children,
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={href}
      className="md-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

const COMPONENTS = {
  a: ExternalLink,
  'x-spoiler': Spoiler,
  'x-mention': Mention,
} as Components;

const EMPTY_NAMES: readonly string[] = [];

export const MessageMarkdown = memo(function MessageMarkdown({
  content,
  memberNames = EMPTY_NAMES,
}: MessageMarkdownProps) {
  const plugins = useMemo<RemarkPlugins>(
    () => [remarkGfm, remarkBreaks, [remarkMessageExtras, { memberNames }]],
    [memberNames],
  );

  if (isJumboEmoji(content)) {
    return <span className="md-content md-jumbo">{content.trim()}</span>;
  }

  return (
    <div className="md-content">
      <Markdown remarkPlugins={plugins} components={COMPONENTS} skipHtml>
        {content}
      </Markdown>
    </div>
  );
});

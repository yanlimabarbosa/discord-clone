import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MessageMarkdown } from './message-markdown';

function render(content: string, memberNames?: string[]) {
  return renderToStaticMarkup(
    <MessageMarkdown content={content} memberNames={memberNames} />,
  );
}

describe('MessageMarkdown', () => {
  it('renders bold, italic and strikethrough', () => {
    const html = render('**bold** *italic* ~~gone~~');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<del>gone</del>');
  });

  it('renders __x__ as underline instead of bold', () => {
    const html = render('__under__ and **bold**');
    expect(html).toContain('<u>under</u>');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('renders inline code and code blocks', () => {
    expect(render('use `npm i`')).toContain('<code>npm i</code>');
    expect(render('```\nconst a = 1;\n```')).toContain('<pre>');
  });

  it('renders blockquotes', () => {
    expect(render('> quoted')).toContain('<blockquote>');
  });

  it('renders links opening in a new tab', () => {
    const html = render('see https://example.com/x');
    expect(html).toContain('href="https://example.com/x"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('does not render raw html', () => {
    const html = render('hi <script>alert(1)</script>');
    expect(html).not.toContain('<script>');
  });

  it('renders spoilers hidden behind a button', () => {
    const html = render('the killer is ||the butler||');
    expect(html).toContain('md-spoiler');
    expect(html).toContain('the butler');
    expect(html).toContain('<button');
  });

  it('renders mention pills for known members and @everyone', () => {
    const html = render('hey @Yan and @everyone', ['Yan']);
    expect(html.match(/md-mention/g)?.length).toBe(2);
    expect(render('mail me a@b.com', ['b'])).not.toContain('md-mention');
    expect(render('hey @Stranger', ['Yan'])).not.toContain('md-mention');
  });

  it('matches multi-word member names', () => {
    const html = render('ping @John Doe!', ['John Doe']);
    expect(html).toContain('md-mention');
    expect(html).toContain('@John Doe');
  });

  it('turns single newlines into line breaks', () => {
    expect(render('line one\nline two')).toContain('<br/>');
  });

  it('renders 1-3 emoji messages as jumbo', () => {
    expect(render('🔥🔥')).toContain('md-jumbo');
    expect(render('hot 🔥')).not.toContain('md-jumbo');
  });
});

import { Injectable, Logger } from '@nestjs/common';

export type WatchSearchResult = {
  id: string;
  title: string;
  channel: string;
  thumb: string;
};

@Injectable()
export class WatchService {
  private readonly logger = new Logger('WatchService');

  async search(query: string): Promise<WatchSearchResult[]> {
    const q = query.trim();
    if (!q) return [];
    const key = process.env.YOUTUBE_API_KEY;
    try {
      return key ? await this.searchOfficial(q, key) : await this.searchScrape(q);
    } catch (err) {
      this.logger.warn(`search failed: ${(err as Error).message}`);
      return [];
    }
  }

  private async searchOfficial(
    q: string,
    key: string,
  ): Promise<WatchSearchResult[]> {
    const url =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
      `&maxResults=10&q=${encodeURIComponent(q)}&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`data api ${res.status}`);
    const json = (await res.json()) as {
      items?: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails: { medium?: { url: string }; default?: { url: string } };
        };
      }>;
    };
    return (json.items ?? [])
      .filter((it) => it.id?.videoId)
      .map((it) => ({
        id: it.id.videoId,
        title: decodeEntities(it.snippet.title),
        channel: it.snippet.channelTitle,
        thumb:
          it.snippet.thumbnails.medium?.url ??
          it.snippet.thumbnails.default?.url ??
          `https://i.ytimg.com/vi/${it.id.videoId}/mqdefault.jpg`,
      }));
  }

  // Keyless fallback: parse the ytInitialData JSON from the results page.
  private async searchScrape(q: string): Promise<WatchSearchResult[]> {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      q,
    )}&hl=en&gl=US`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) throw new Error(`youtube ${res.status}`);
    const html = await res.text();
    const m =
      html.match(/var ytInitialData = (\{.*?\});<\/script>/s) ??
      html.match(/ytInitialData"?\]?\s*=\s*(\{.*?\});/s);
    if (!m) throw new Error('no ytInitialData');
    const data = JSON.parse(m[1]);

    const out: WatchSearchResult[] = [];
    const seen = new Set<string>();
    collectVideos(data, out, seen);
    return out.slice(0, 12);
  }
}

function collectVideos(
  node: unknown,
  out: WatchSearchResult[],
  seen: Set<string>,
): void {
  if (!node || typeof node !== 'object' || out.length >= 20) return;
  const obj = node as Record<string, unknown>;
  const vr = obj.videoRenderer as
    | {
        videoId?: string;
        title?: { runs?: { text: string }[]; simpleText?: string };
        ownerText?: { runs?: { text: string }[] };
        longBylineText?: { runs?: { text: string }[] };
      }
    | undefined;
  if (vr && vr.videoId && !seen.has(vr.videoId)) {
    const title = vr.title?.runs?.[0]?.text ?? vr.title?.simpleText ?? '';
    if (title) {
      seen.add(vr.videoId);
      out.push({
        id: vr.videoId,
        title,
        channel:
          vr.ownerText?.runs?.[0]?.text ??
          vr.longBylineText?.runs?.[0]?.text ??
          '',
        thumb: `https://i.ytimg.com/vi/${vr.videoId}/mqdefault.jpg`,
      });
    }
  }
  for (const k of Object.keys(obj)) collectVideos(obj[k], out, seen);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

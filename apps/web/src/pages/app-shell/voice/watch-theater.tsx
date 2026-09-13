import { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, Search, Plus, Trash2 } from 'lucide-react';
import { useWatchSession } from '../../../hooks/watch/use-watch-session';
import { useWatchSearch } from '../../../hooks/watch/use-watch-search';
import { resolveWatchTitle } from '../../../lib/resolve-watch-title';
import type { WatchSearchResult } from '../../../types/watch';
import './watch.css';

const SUGGESTIONS: WatchSearchResult[] = [
  { id: 'JGwWNGJdvx8', title: 'Ed Sheeran - Shape of You', channel: 'Ed Sheeran', thumb: thumb('JGwWNGJdvx8') },
  { id: '7wtfhZwyrcc', title: 'Imagine Dragons - Believer', channel: 'Imagine Dragons', thumb: thumb('7wtfhZwyrcc') },
  { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito', channel: 'Luis Fonsi', thumb: thumb('kJQP7kiw5Fk') },
  { id: '60ItHLz5WEA', title: 'Alan Walker - Faded', channel: 'Alan Walker', thumb: thumb('60ItHLz5WEA') },
];

function thumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
}

function parseYouTube(str: string): string | null {
  const s = str.trim();
  const m = s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(s)) return s;
  return null;
}

function fmt(t: number) {
  t = Math.max(0, Math.floor(t));
  const m = Math.floor(t / 60);
  return `${m}:${String(t % 60).padStart(2, '0')}`;
}

type WatchTheaterProps = { channelId: string };

export function WatchTheater({ channelId }: WatchTheaterProps) {
  const { hostRef, ready, state, controls, api } = useWatchSession(channelId);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [, setTick] = useState(0);
  const [needsSync, setNeedsSync] = useState(false);

  const parsedId = parseYouTube(query);
  const searchable = !parsedId && query.trim().length > 1;
  const { data: results, isFetching } = useWatchSearch(searchable ? debounced : '');

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setNeedsSync(state.currentIndex >= 0 && state.playing && !api.isPlaying());
    }, 500);
    return () => window.clearInterval(id);
  }, [api, state.playing, state.currentIndex]);

  const current = state.queue[state.currentIndex];
  const time = api.getTime();
  const duration = api.getDuration();
  const upNext = state.queue.slice(state.currentIndex + 1);

  function add(v: WatchSearchResult | { id: string; title: string }) {
    controls.addVideo({ id: v.id, title: v.title });
  }

  async function addByLink(id: string) {
    setQuery('');
    controls.addVideo({ id, title: await resolveWatchTitle(id) });
  }

  return (
    <div className="watch">
      <div className="watch-main">
        <div className="watch-player">
          <div className="watch-yt" ref={hostRef} />
          {!current && (
            <div className="watch-idle">
              <div className="watch-idle-logo">
                <Play size={26} />
              </div>
              <p>Nothing playing — search a song or paste a YouTube link.</p>
            </div>
          )}
          {needsSync && (
            <button className="watch-sync" onClick={controls.resync}>
              <Play size={18} /> Tap to sync playback
            </button>
          )}
        </div>
        <div className="watch-controls">
          <button
            className="watch-cbtn primary"
            onClick={controls.togglePlay}
            disabled={!current}
            title={state.playing ? 'Pause' : 'Play'}
          >
            {state.playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="watch-cbtn"
            onClick={controls.next}
            disabled={state.currentIndex >= state.queue.length - 1}
            title="Skip"
          >
            <SkipForward size={18} />
          </button>
          <div className="watch-now">
            <div className="watch-now-title">
              {current ? current.title : 'Add something to the queue'}
            </div>
            <div className="watch-seek">
              <div
                className="watch-bar"
                onClick={(e) => {
                  if (!duration) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  controls.seek(((e.clientX - r.left) / r.width) * duration);
                }}
              >
                <div
                  className="watch-fill"
                  style={{ width: duration ? `${(time / duration) * 100}%` : 0 }}
                />
              </div>
              <span className="watch-time">
                {fmt(time)} / {fmt(duration)}
              </span>
            </div>
          </div>
          {!ready && <span className="watch-loading">loading…</span>}
        </div>
      </div>

      <aside className="watch-side">
        <div className="watch-search">
          <Search size={16} className="watch-search-ic" />
          <input
            value={query}
            placeholder="Search YouTube or paste a link"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && parsedId) {
                addByLink(parsedId);
              }
            }}
          />
          {query && (
            <button className="watch-search-clear" onClick={() => setQuery('')}>
              ×
            </button>
          )}
        </div>

        <div className="watch-side-body">
          {query.trim() ? (
            <>
              {parsedId && (
                <ResultRow
                  item={{ id: parsedId, title: `Add this video`, channel: parsedId, thumb: thumb(parsedId) }}
                  onAdd={() => addByLink(parsedId)}
                />
              )}
              {searchable && (
                <>
                  <div className="watch-section">Results</div>
                  {isFetching && <div className="watch-hint">Searching…</div>}
                  {!isFetching && results && results.length === 0 && (
                    <div className="watch-hint">No results</div>
                  )}
                  {results?.map((r) => (
                    <ResultRow key={r.id} item={r} onAdd={() => add(r)} />
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {current && (
                <>
                  <div className="watch-section">Now Playing</div>
                  <div className="watch-now-card">
                    <img className="watch-thumb lg" src={thumb(current.id)} alt="" />
                    <div className="watch-row-title">{current.title}</div>
                  </div>
                </>
              )}
              <div className="watch-section spread">
                <span>Up Next — {upNext.length}</span>
                {state.queue.length > 0 && (
                  <button className="watch-clear" onClick={controls.clear} title="Clear queue">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              {upNext.length === 0 ? (
                <div className="watch-hint">Queue is empty — search to add</div>
              ) : (
                upNext.map((item, i) => {
                  const idx = state.currentIndex + 1 + i;
                  return (
                    <div className="watch-row watch-qrow" key={`${item.id}-${idx}`}>
                      <img className="watch-thumb" src={thumb(item.id)} alt="" />
                      <button className="watch-row-title watch-qplay" onClick={() => controls.playAt(idx)}>
                        {item.title}
                      </button>
                      <button className="watch-qremove" onClick={() => controls.remove(idx)} title="Remove">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
              {!current && (
                <>
                  <div className="watch-section">Suggestions</div>
                  {SUGGESTIONS.map((r) => (
                    <ResultRow key={r.id} item={r} onAdd={() => add(r)} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function ResultRow({
  item,
  onAdd,
}: {
  item: WatchSearchResult;
  onAdd: () => void;
}) {
  return (
    <button className="watch-row" onClick={onAdd}>
      <img className="watch-thumb" src={item.thumb} alt="" />
      <div className="watch-row-meta">
        <div className="watch-row-title">{item.title}</div>
        {item.channel && <div className="watch-row-ch">{item.channel}</div>}
      </div>
      <Plus size={16} className="watch-row-add" />
    </button>
  );
}

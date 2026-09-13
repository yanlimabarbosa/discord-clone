# Wave 2 — Agent D (chat anatomy) handoff

Status at handoff: **all mission items finished or deliberately skipped.** `npx tsc --noEmit` clean, `npx vitest run` 34/34 passing (5 files), `npx vite build --logLevel error` exit 0. Nothing committed.

## DONE (mission items 1-17)

1. **Markdown + links** — DONE.
   - `src/components/message-markdown.tsx` + `message-markdown.css`: react-markdown + remark-gfm + remark-breaks, `skipHtml`, custom `a` (target=_blank, rel=noopener noreferrer, `.md-link` blurple), code/pre/blockquote/table/heading styling, `||spoiler||` renders as a `<button class="md-spoiler">` with transparent text until clicked (per-spoiler useState).
   - `src/lib/remark-message-extras.ts`: custom remark plugin (no extra deps) that (a) splits text nodes on `||…||` → `x-spoiler` hast element, (b) matches `@Name` / `@everyone` → `x-mention`, (c) detects `__underline__` by checking the source marker char at the strong node's start offset and re-tags it as `<u>` (so `**bold**` stays bold, `__x__` underlines, Discord-style).
   - Single newlines = `<br>` via remark-breaks.
   - Covered by `src/components/message-markdown.test.tsx` (11 tests: bold/italic/strike, underline vs bold, code, blockquote, links, no raw HTML, spoiler, mention pills incl. multi-word names and non-matches, breaks, jumbo).
2. **Mention pills** — DONE. Member display names flow: `ChannelView` → `ChannelChat(serverId)` → `MessageList` (`useMembers(serverId)`, memoized `memberNames: string[]`) → `MessageItem` → `MessageRow` → `MessageMarkdown` → plugin. Multi-word names matched longest-first, case-insensitive, with word-boundary checks. Self/@everyone highlight: `mentionsUser()` in `src/lib/message-mentions.ts`; row gets `.is-mention` (yellow bg tint + 2px `#faa61a` left border, bleeds to list edges) — CSS in `src/components/message-row.css`.
3. **Author grouping** — DONE. `src/lib/chat-items.ts` `buildChatItems()`: compact when same author, <7 min apart, same calendar day, not a reply. Compact rows render a 40px left gutter with an HH:MM timestamp revealed on row hover (`.message-gutter-time`). Tested in `src/lib/chat-items.test.ts`.
4. **Date dividers** — DONE. `buildChatItems` emits `dayLabel` on calendar-day change; rendered via `src/components/message-day-divider.tsx` ("September 13, 2026" style, `Intl` long format) in both channel list and DM view.
5. **Relative timestamps** — DONE. `src/lib/message-time.ts`: module-level `Intl.DateTimeFormat` instances (no per-render construction); `formatFullTimestamp` → "Today at 4:32 PM" / "Yesterday at…" / "09/12/2026 4:32 PM"; memoized in `MessageRow` via `useMemo([compact, createdAt])`.
6. **Jump to present** — DONE (channel list only, as specced). `message-list.tsx`: `onScroll` with rAF flag, threshold 300px, floating `.jump-to-present` pill (blurple, centered, popIn animation) inside new `.message-scroll-region` relative wrapper; smooth-scrolls to `bottomRef`. Reset on channel switch.
7. **Clickable replies** — DONE. Rows carry `id={messageDomId(id)}` (`msg-<id>`); reply preview is now a `<button>` calling `jumpToMessage()` (`src/lib/jump-to-message.ts`) → smooth scroll block:center + `.is-flashing` class (1.8s bg-tint fade keyframe in message-row.css, reflow-restarted).
8. **Jumbo emoji** — DONE. `src/lib/jumbo-emoji.ts` (`isJumboEmoji`, Unicode property regex handling ZWJ sequences, skin tones, flags, VS16); MessageMarkdown short-circuits to `.md-jumbo` (2.5em) span.
9. **Composer emoji button** — DONE. `src/components/emoji-picker-button.tsx` + css: shared `EmojiPickerButton` (exports `QUICK_EMOJIS`) with outside-click + Escape close; used by message-item toolbar (reactions) and `message-composer.tsx` (Smile icon, `.emoji-picker-up` opens upward, inserts at cursor via `selectionStart/End` + restores caret with rAF).
10. **Performance** — DONE. `MessageItem` = `React.memo`; `useMe`/`useMembers`/`useRoles` hoisted to `MessageList`, primitives/memoized props passed down (`myId`, `myName`, `memberNames` useMemo, `authorColor`, stable `onReply` = setState fn). `groupReactions` memoized. Typing indicator extracted to `src/pages/app-shell/channel-view/typing-indicator.tsx` (leaf, owns `useTyping`). `buildChatItems` memoized on `messages`. `MessageMarkdown` is memo'd too.
11. **Escape coverage** — DONE. `EmojiPickerButton` closes on Escape (both call sites); `channel-chat.tsx` uses `useEscapeKey(useCallback(() => setReplyingTo(null), []))` for the reply banner. Note: Escape listeners are global/independent, so Escape with a picker open also cancels the reply banner — accepted tradeoff (no z-stack manager exists).
12. **Attachments** — DONE. `src/components/message-attachment.tsx` + css: `is-loading` wrapper with `min-height:160px` raised bg, img opacity 0→1 on `onLoad`, `onError` → dashed "Attachment failed to load" placeholder (ImageOff icon), `loading="lazy"` kept, image links out in new tab. Old attachment CSS removed from message-extras.css. Used by channel + DM rows.
13. **Toolbar + picker animation** — DONE in `message-extras.css` / `emoji-picker-button.css`: toolbar stays mounted (opacity+visibility transition, pointer-events none hidden, `:focus-within` keeps it open); `.emoji-picker` has `animation: popIn .12s ease`, `transform-origin: top right` (bottom right for `.emoji-picker-up`), `box-shadow: var(--elevation-high)`; `.reaction-pill:active { transform: scale(.96) }` + transform added to its transition.
14. **DM view unification** — DONE. Presentational row extracted to `src/components/message-row.tsx` + css (avatar/header or compact gutter, reply-preview/contentOverride/toolbar/footer slots, markdown, attachment, edited tag, mention highlight). `dm-view.tsx` rewritten on top of it: markdown, grouping, date dividers, relative timestamps, jumbo, attachment placeholder — no toolbar/reactions/replies (no DM backend for those). DM hooks untouched. `.dm-msg*` CSS in home.css is now dead (couldn't remove — home.css not owned by me).
15. **NEW unread divider** — **SKIPPED (data not there).** `types/unread.ts` store holds only `{ unread: boolean, mentions: number }` per channel — no last-read timestamp and no way to identify the first unread message before mark-read fires. Needs backend/store support first.
16. **Tooltips** — DONE. All `title=` in owned files replaced with `<Tooltip>` keeping aria-labels: message-item toolbar (Reply/Edit/Delete; reaction button via EmojiPickerButton), reply-banner close (channel-chat), member-list toggle (channel-view/index.tsx, side="bottom"). Composer already used Tooltip.
17. **Role colors on author names** — DONE. `MessageList` calls `useRoles(serverId)` (cached, 30s staleTime from wave 1) and builds `userId → color` from role `assignments`, sorted by `position` **descending** (assumed higher position = higher rank — client had no prior sorting to confirm; flip the sort in message-list.tsx if wrong). Passed as `authorColor` to `MessageRow` (inline color on `.message-author`).

## PARTIAL

None.

## NOT STARTED

None (15 intentionally skipped, see above).

## Deps installed (apps/web)

- `react-markdown@10.1.0` (dep)
- `remark-gfm@4.0.1` (dep)
- `remark-breaks@4.0.0` (dep)
- `@types/mdast`, `@types/unist` (devDeps — pinned explicitly; used loosely by the plugin's local types)

## Gotchas / integration notes

- **voice-stage.tsx** (not owned by me) renders `<ChannelChat channelId channelName />` without serverId → `serverId` is **optional** on ChannelChatProps (`string | undefined`, MessageList takes `string | null`). Voice-side chat therefore has no member-name mention pills or role colors (falls back gracefully). If someone owns voice-stage later, pass `voice.serverId` if available.
- `(edited)` tag flows inline via CSS: `.message-content .md-content` and `.md-content > p:last-child` are `display:inline` (message-markdown.css). Don't "fix" that to block without moving the tag.
- Old emoji-picker CSS moved from `message-extras.css` → `components/emoji-picker-button.css`; attachment CSS → `components/message-attachment.css`. Class names unchanged.
- The remark plugin runs **after** remark-breaks, so spoilers/mentions can't span a newline (text nodes already split). Known limitation, matches most real usage.
- `formatFullTimestamp` "Today/Yesterday" is computed at render; memoized per row on `createdAt`, so it can go stale across midnight until the row re-renders. Cosmetic.
- Row DOM ids are `msg-<messageId>` (see `src/lib/jump-to-message.ts`), used by reply-click flash. Keep unique if virtualizing later.
- Wave-1 pieces used: `Tooltip` (all hover labels), `useEscapeKey`, optimistic edit/delete hooks (unchanged call signatures `useEditMessage(channelId)` etc.). `userColor()` was NOT applied to author names (role colors only; default color otherwise) — deliberate, to avoid clashing with whatever member-list does.
- New test files: `src/lib/chat-items.test.ts`, `src/components/message-markdown.test.tsx` — keep them green.

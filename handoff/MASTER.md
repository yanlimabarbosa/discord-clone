# UX Overhaul — Master Handoff (2026-09-13)

Session hit context limit mid-execution. This file + `wave2-D-chat.md` + the memory file
`discord-clone-ux-audit` let a fresh session resume exactly where we stopped.

**Full audit report (all findings):** https://claude.ai/code/artifact/de4d64c1-6bf3-467d-9984-b61cb1aa586d

## Execution model used
Parallel subagent waves with strict file ownership (no two concurrent agents touch the same file).
Wave 1 and most of Wave 2 are DONE and verified (tsc clean, 19/19 vitest passing at each merge point).
Base commit before any of this work: `033f828`.

## State at handoff

### ✅ Wave 1 — DONE (3 agents, all verified)
**A (data/perf):** QueryClient defaults (staleTime 30s, refetchOnWindowFocus false, retry 1) in main.tsx;
`placeholderData: keepPreviousData` on use-messages/use-members/use-channels/use-dm-messages/use-dms;
use-typing.ts fixed (no re-render when idle, interval self-stops); `useSpeakingFor(userId)` selector added
in use-speaking.ts; use-toggle-reaction onSettled invalidate removed; use-presence-realtime debounced 500ms
+ refetchType active (API sends no serverId — can't scope tighter); use-edit-message/use-delete-message now
take channelId + optimistic w/ rollback; optimistic removals in use-accept-friend/use-remove-friend/
use-delete-channel/use-leave-server; use-dm-realtime surgical ['dms'] update; NEW components/connection-banner
(.tsx/.css) mounted in app-shell/index.tsx ("Reconnecting…" + invalidate active on reconnect);
use-app-shell persists lastChannelByServer (`nyx.lastChannelByServer`, TEXT channels only, validated) +
useCallback handlers; LiveKit onDisconnected only leaves voice on terminal DisconnectReasons.

**B (CSS foundation):** Inter variable font self-hosted at public/fonts/InterVariable.woff2 (344KB, rsms.me)
+ @font-face + preload in index.html; public/favicon.svg (blurple diamond) + link tag; token ladder fixed
(--rail #08090d, --input #1d2028, --raised #232730, --hover #252a34 now distinct; added --hover-overlay/
--active-overlay/--selected-tint/--text-hi/--sunken/--raised-hi — last three were used-but-undefined bugs);
--elevation-low/medium/high/modal tokens applied to menus/modals/toasts; modal overlay rgba(0,0,0,.7)+blur(6px);
header layered shadows; global :focus-visible ring (--iris-bright) + ::selection; scrollbar restyle (webkit
inset + Firefox thin); overscroll-behavior+scrollbar-gutter on all scroll panes; 12 missing hover transitions;
:active press states extended; menu popIn animations (vc-device-menu has local vcMenuPop keyframe to preserve
translateX centering); reduced-motion rewritten (spinners exempt); .server-pill::before height→scaleY;
message body 16px/1.5; label tracking .04em; gradient .server-divider; presence-dot hover ring fix.

**C (tooltip+identity):** components/tooltip.tsx+css (`<Tooltip label side?>`, portal, 80ms delay, z-index 2000,
measures anchor.firstElementChild); lib/user-color.ts (`userColor(seed)`, 8-color hash — seeded by NAME not id,
keep consistent); avatar.tsx per-user colors + onError fallback; server-rail Gem icon replaces ◇, colored
fallbacks, tooltips (side="right"); profile-card gradient banner from userColor(displayName), Message button
hidden when !onMessage (profile-card-extras.css un-inerts the btn); 22 title= swapped in 8 files.
"Member since" skipped — no createdAt on any user-facing type.

### ✅ Wave 2 — E and F DONE, D see wave2-D-chat.md
**E (sidebar/members/skeletons):** channel-sidebar decomposed → memoized sidebar/channel-row.tsx,
voice-occupant.tsx (useSpeakingFor + local mute/deafen reads), user-panel.tsx, pref-voice-toggles.tsx,
live-voice-toggles.tsx (mic live-wired via useLocalParticipant + applies persisted mute pref once per Room
via WeakSet), occupant-menu-host.tsx; sidebar.css; useMemo category sort/channelsByCategory/occupantsByChannel;
member-list MemberRow memo + useSpeakingFor + role COLORS via useRoles (highest-position non-default color);
skeleton-rows/skeleton-circles/skeletons.css for rail/sidebar/members/DM sidebar/friends; loading threaded
through use-app-shell (serversLoading/channelsLoading) + use-home (dmsLoading); empty states gated on loaded;
lib/voice-pref-store.ts + lib/dm-read-store.ts (DM unread = bold+dot when lastMessage text changed since last
open; DmSummary has no timestamps); home/dm-unread.css.
KNOWN LIMITATION: user-panel deafen is display-only in voice — useDeafen keeps state inside VoiceControls;
proper fix = lift deafen into a shared store (future task). Role GROUPING skipped — Role model has no hoist flag.

**F (voice+feedback):** participant-card React.memo + useConnectionQualityIndicator 3-bar indicator + LIVE badge
on screenshare tiles (voice-extras.css); tile-in-grid/voice-room stable onSelect callbacks + StripTile;
useConnectionState amber "Voice reconnecting…" overlay; watch-theater WatchProgress component isolates 500ms
tick (2Hz re-render confined to seek bar), Thumb onError fallback, tooltips; members-tab kick/ban two-click
confirm + success toasts + role-checkbox pending + skeletons; overview-tab form Enter-submit + toasts +
privacy pending; roles toasts; create-server/create-channel/edit-channel/explore/invite success toasts;
invite clipboard awaited + revert after 2s; explore per-row "Joining…".

### ✅ Wave 2 — D (chat anatomy): DONE (see handoff/wave2-D-chat.md for details)
All 17 items done except NEW-unread-divider (skipped: unread store has no last-read timestamp). Includes: markdown+links, mention pills, author grouping, date dividers, relative timestamps,
jump-to-present, clickable replies, jumbo emoji, composer emoji button, MessageItem memo+useMe hoist+typing
leaf, Escape coverage, attachment CLS/onError, toolbar/emoji-picker animation, DM renderer unification,
NEW unread divider (attempt), tooltips in chat files, role colors on authors (attempt).
Owned: channel-view/**, home/dm-view.tsx, types/message.ts, new lib/components. Only agent allowed npm install.

### ✅ Wave 3 — DONE (G1 code-split+routing: entry 1269kB→12kB, livekit deferred, URL routing; G2 user settings + PATCH /users/me; G3 friend.update + dm.activity events + OS notifications). Prompts below kept for reference:

**G1 — code splitting + URL routing** (own: main.tsx, app.tsx, app-shell/index.tsx, use-app-shell.ts,
shell-body.tsx routing wiring, vite.config.ts):
- React.lazy + Suspense: LiveKit/voice subtree (the LiveKitRoom + voice components + @livekit imports must
  leave the entry chunk — check app-shell/index.tsx imports), watch-theater, all dialogs, LandingPage vs AppShell.
- vite.config.ts build.rollupOptions.output.manualChunks: livekit vendor, react-query, react vendor.
- URL routing with react-router (already a dep? check): /channels/:serverId/:channelId, /home, /home/dm/:conversationId,
  keep current state logic in use-app-shell but sync bidirectionally with URL; refresh/back must restore context.
  CAREFUL: use-app-shell was reworked by waves 1+2 (lastChannelByServer persistence, loading flags, useCallback,
  selectChannel identity via ref) — preserve all of it.
- Verify chunk sizes with vite build; livekit must not be in the initial chunk.

**G2 — user settings** (own: NEW settings dialog components, sidebar/user-panel.tsx gear wiring,
apps/api/src/users/**, apps/api/src/auth read-only):
- API: PATCH /users/me — displayName; username+password change for non-guest (verify current password against
  passwordHash — check auth service for the hash lib (bcrypt/argon2) and reuse). Validate username unique.
  User model: username String? @unique, passwordHash String?, isGuest Boolean.
- Frontend: user-settings-dialog (tabs: Account [display name, username, password change], Profile [avatar
  reuses existing upload]); gear button in sidebar/user-panel.tsx opens it; useEscapeKey + role=dialog pattern
  (copy an existing dialog); success toasts; optimistic ['me'] update.
- API runs prisma db push on boot — no migration files needed.

**G3 — realtime gaps + notifications** (own: apps/api/src/gateway/chat.gateway.ts + friends service emits,
frontend: NEW hooks files under src/hooks/realtime or friends, mount in shell-body.tsx alongside existing
realtime hooks):
- Backend: emit socket events on friend request create/accept/remove to both users (follow the existing
  gateway emit patterns, e.g. how presence/dm.new are emitted; check how the gateway maps userId→socket room).
- Frontend: subscribe, surgical setQueryData on ['friends'] + toastStore.info('X sent you a friend request').
- Global dm.new: backend currently only emits to the open conversation room — check gateway; emit also to
  user room so the DM sidebar updates live for closed conversations (then update use-dm-realtime or new hook
  to bump ['dms'] + dm-read-store makes the unread dot appear).
- Browser Notifications API: request permission from a settings toggle or on first mention; show OS
  notification for mentions + DMs when document.hidden; click focuses the tab. New lib/notifications.ts.

### Then: verify + deploy runbook
1. `cd apps/web && npx tsc --noEmit && npx vitest run && npx vite build` — fix any cross-agent integration issues.
2. Local docker builds (NOTE contexts): `cd apps/api && docker build -t discord-api:latest .`
   (api context is apps/api, NOT repo root) and from repo root: `docker build -t discord-caddy:latest -f infra/caddy/Dockerfile .`
3. Ship: `docker save discord-api:latest discord-caddy:latest | gzip | ssh discord-poc 'gunzip | sudo docker load'`
4. `ssh discord-poc 'cd ~/discord-clone/infra && sudo docker compose up -d --no-build api caddy'`
   (api only needed if G2/G3 backend shipped; otherwise caddy alone)
5. Smoke: `curl -s -o /dev/null -w "%{http_code}" https://yanchat.duckdns.org` → 200; check /api health if api redeployed.
6. Commit + push main. NO Claude-Session/session-link footers in commits (user rule).

### Deferred by design (not in any wave — future work)
Message list virtualization + pagination (risky rewrite; memoization mitigates for now); presence
idle/DND/custom status (backend presence model); group DMs; link embeds/unfurls; role hoist flag +
member-list role sections; mute channel/server + per-channel notification levels; server banners; keybinds.

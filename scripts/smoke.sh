#!/usr/bin/env bash
# End-to-end API smoke test. Exercises auth, friends, DMs, servers,
# messages, unread/mentions, and kick/ban. Exits non-zero on failure.
#
# Usage: BASE=http://localhost:3000 ./scripts/smoke.sh
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
API="$BASE/api"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
PASS=0
FAIL=0

j() { python3 -c "import sys,json;print(json.load(sys.stdin)$1)"; }

check() { # check <label> <actual> <expected>
  if [ "$2" = "$3" ]; then
    echo "  ok   $1 ($2)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL $1: got '$2' expected '$3'"
    FAIL=$((FAIL + 1))
  fi
}

code() { # code METHOD PATH JAR [DATA]
  local m="$1" p="$2" jar="$3" data="${4:-}"
  if [ -n "$data" ]; then
    curl -s -o /dev/null -w '%{http_code}' -b "$jar" -c "$jar" -X "$m" \
      "$API$p" -H 'Content-Type: application/json' -d "$data"
  else
    curl -s -o /dev/null -w '%{http_code}' -b "$jar" -c "$jar" -X "$m" "$API$p"
  fi
}

body() { # body METHOD PATH JAR [DATA]
  local m="$1" p="$2" jar="$3" data="${4:-}"
  if [ -n "$data" ]; then
    curl -s -b "$jar" -c "$jar" -X "$m" "$API$p" \
      -H 'Content-Type: application/json' -d "$data"
  else
    curl -s -b "$jar" -c "$jar" -X "$m" "$API$p"
  fi
}

reg() { # reg USERNAME DISPLAY JAR  -> echoes user id
  body POST /auth/register "$3" \
    "{\"username\":\"$1\",\"password\":\"pass1234\",\"displayName\":\"$2\"}" \
    | j "['id']"
}

R=$RANDOM
A="alice_$R"; B="bob_$R"; C="carol_$R"

echo "== auth =="
AID="$(reg "$A" "Alice$R" "$TMP/a")"
BID="$(reg "$B" "Bob$R" "$TMP/b")"
CID_USER="$(reg "$C" "Carol$R" "$TMP/c")"
check "alice registered" "$([ -n "$AID" ] && echo yes)" yes
check "bob registered" "$([ -n "$BID" ] && echo yes)" yes
check "carol registered" "$([ -n "$CID_USER" ] && echo yes)" yes

echo "== friends =="
check "alice adds bob" "$(code POST /friends/requests "$TMP/a" "{\"username\":\"$B\"}")" 201
FID="$(body GET /friends "$TMP/b" | j "['incoming'][0]['friendshipId']")"
check "bob accepts" "$(code POST "/friends/requests/$FID/accept" "$TMP/b")" 201
check "alice has 1 friend" "$(body GET /friends "$TMP/a" | j "['friends'].__len__()")" 1

echo "== dms =="
CONV="$(body POST /dms "$TMP/a" "{\"userId\":\"$BID\"}")"
CONVID="$(echo "$CONV" | j "['id']")"
check "alice sends dm" "$(code POST "/dms/$CONVID/messages" "$TMP/a" '{"content":"hi bob"}')" 201
check "bob reads 1 dm" "$(body GET "/dms/$CONVID/messages" "$TMP/b" | j ".__len__()")" 1

echo "== servers + channels =="
SV="$(body POST /servers "$TMP/a" '{"name":"Smoke Guild"}')"
SID="$(echo "$SV" | j "['id']")"
GEN="$(echo "$SV" | python3 -c "import sys,json;d=json.load(sys.stdin);print([c['id'] for c in d['channels'] if c['type']=='TEXT'][0])")"
VC="$(echo "$SV" | python3 -c "import sys,json;d=json.load(sys.stdin);print([c['id'] for c in d['channels'] if c['type']=='VOICE'][0])")"
check "carol joins public server" "$(code POST "/servers/$SID/join" "$TMP/c")" 201

echo "== unread + mentions =="
check "alice marks read" "$(code POST "/channels/$GEN/read" "$TMP/a")" 201
check "carol posts @mention" "$(code POST "/channels/$GEN/messages" "$TMP/c" "{\"content\":\"hey @Alice$R look\"}")" 201
check "channel is unread" "$(body GET "/servers/$SID/unread" "$TMP/a" | j "['$GEN']['unread']")" True
check "mention counted" "$(body GET "/servers/$SID/unread" "$TMP/a" | j "['$GEN']['mentions']")" 1
check "alice re-reads" "$(code POST "/channels/$GEN/read" "$TMP/a")" 201
check "unread cleared" "$(body GET "/servers/$SID/unread" "$TMP/a" | j "['$GEN']['unread']")" False

echo "== categories + reorder =="
CAT="$(body POST "/servers/$SID/categories" "$TMP/a" '{"name":"Text Channels"}')"
CATID="$(echo "$CAT" | j "['id']")"
check "category created" "$([ -n "$CATID" ] && echo yes)" yes
check "category listed" "$(body GET "/servers/$SID/categories" "$TMP/a" | j ".__len__()")" 1
REORDER="$(body PATCH "/servers/$SID/channels/reorder" "$TMP/a" "{\"items\":[{\"id\":\"$GEN\",\"categoryId\":\"$CATID\",\"position\":0}]}")"
MOVED="$(echo "$REORDER" | python3 -c "import sys,json;d=json.load(sys.stdin);print([c['categoryId'] for c in d if c['id']=='$GEN'][0])")"
check "channel moved into category" "$MOVED" "$CATID"
check "rename category" "$(code PATCH "/categories/$CATID" "$TMP/a" '{"name":"Renamed Cat"}')" 200
check "delete category" "$(code DELETE "/categories/$CATID" "$TMP/a")" 200
UNCAT="$(body GET "/servers/$SID/channels" "$TMP/a" | python3 -c "import sys,json;d=json.load(sys.stdin);print([c['categoryId'] for c in d if c['id']=='$GEN'][0])")"
check "channel uncategorized after cat delete" "$UNCAT" "None"

echo "== roles + permissions =="
check "member starts with 0 perms" "$(body GET "/servers/$SID/permissions" "$TMP/c" | j "['permissions']")" 0
check "owner has all perms (255)" "$(body GET "/servers/$SID/permissions" "$TMP/a" | j "['permissions']")" 255
check "member blocked from rename (403)" "$(code PATCH "/servers/$SID" "$TMP/c" '{"name":"Nope"}')" 403
check "member cannot create role (403)" "$(code POST "/servers/$SID/roles" "$TMP/c" '{"name":"x"}')" 403
ROLE="$(body POST "/servers/$SID/roles" "$TMP/a" '{"name":"Mods","color":"#e91e63","permissions":2}')"
RID="$(echo "$ROLE" | j "['id']")"
check "role created" "$([ -n "$RID" ] && echo yes)" yes
check "assign role to member" "$(code POST "/roles/$RID/members/$CID_USER" "$TMP/a")" 201
check "member now has MANAGE_CHANNELS (2)" "$(body GET "/servers/$SID/permissions" "$TMP/c" | j "['permissions']")" 2
check "member can now create channel" "$(code POST "/servers/$SID/channels" "$TMP/c" '{"name":"mod-chan","type":"TEXT"}')" 201
check "member still cannot rename (403)" "$(code PATCH "/servers/$SID" "$TMP/c" '{"name":"Nope"}')" 403
check "unassign role" "$(code DELETE "/roles/$RID/members/$CID_USER" "$TMP/a")" 200
check "perms back to 0" "$(body GET "/servers/$SID/permissions" "$TMP/c" | j "['permissions']")" 0
check "delete role" "$(code DELETE "/roles/$RID" "$TMP/a")" 200

echo "== voice moderation =="
check "member cannot move others (403)" "$(code POST "/servers/$SID/voice/move" "$TMP/c" "{\"userId\":\"$CID_USER\",\"channelId\":\"$VC\"}")" 403
check "owner moves member (201)" "$(code POST "/servers/$SID/voice/move" "$TMP/a" "{\"userId\":\"$CID_USER\",\"channelId\":\"$VC\"}")" 201
check "owner cannot move to text channel (400)" "$(code POST "/servers/$SID/voice/move" "$TMP/a" "{\"userId\":\"$CID_USER\",\"channelId\":\"$GEN\"}")" 400
check "member cannot server-mute (403)" "$(code POST "/servers/$SID/voice/mute" "$TMP/c" "{\"userId\":\"$CID_USER\",\"muted\":true}")" 403
check "owner server-mutes member (201)" "$(code POST "/servers/$SID/voice/mute" "$TMP/a" "{\"userId\":\"$CID_USER\",\"muted\":true}")" 201
check "owner server-deafens member (201)" "$(code POST "/servers/$SID/voice/deafen" "$TMP/a" "{\"userId\":\"$CID_USER\",\"deafened\":true}")" 201

echo "== kick + ban =="
check "alice kicks carol" "$(code DELETE "/servers/$SID/members/$CID_USER" "$TMP/a")" 200
check "carol rejoins after kick" "$(code POST "/servers/$SID/join" "$TMP/c")" 201
check "alice bans carol" "$(code POST "/servers/$SID/bans/$CID_USER" "$TMP/a")" 201
check "banned carol cannot rejoin" "$(code POST "/servers/$SID/join" "$TMP/c")" 403

echo ""
echo "== RESULT: $PASS passed, $FAIL failed =="
[ "$FAIL" -eq 0 ]

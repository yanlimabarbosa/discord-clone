# Video POC (Discord-clone Phase 0)

A throwaway proof-of-concept: multi-party **camera + microphone + screenshare**
in the browser, using a **self-hosted [LiveKit](https://livekit.io) server**.
No login, no database, no channels — just "type a name + room, join, see faces,
share screen".

If this works reliably on the free Oracle box with a friend on another network,
the hard part of the project is proven and we move on to real specs.

## What's inside

```
discord-clone/
├── apps/
│   ├── token/     NestJS service — mints LiveKit join tokens (one endpoint)
│   └── web/       React + Vite + TS — join form + LiveKit VideoConference UI
└── infra/
    ├── docker-compose.yml   runs everything
    ├── livekit.yaml         LiveKit server config
    ├── Caddyfile            HTTPS reverse proxy (auto TLS via Let's Encrypt)
    └── .env.example         copy to .env and fill in
```

**How a call works:** the browser asks `token` for a join token → connects to
the `livekit` server over `wss://` (proxied by Caddy) → media flows peer↔server
over UDP 7882 (TCP 7881 fallback). Caddy terminates HTTPS so the browser allows
camera/screenshare.

---

## Part 1 — Test locally first (optional but smart)

Runs the whole stack on your machine. `localhost` counts as a secure context, so
camera/screenshare work even without a real domain.

```bash
cd infra
cp .env.example .env
# edit .env: set DOMAIN=localhost and a real LIVEKIT_API_SECRET
#   generate one with:  openssl rand -hex 32
docker compose up --build
```

Open **https://localhost** in two browser tabs (accept the self-signed cert
warning — it's fine for localhost). Join the same room name in both. You should
see two video tiles and be able to screenshare.

> Local test proves the *software* works. Part 2 proves the *self-hosted remote*
> path — which is the real question. Stop the local stack with `Ctrl+C` before
> deploying.

---

## Part 2 — Deploy to Oracle Cloud (free)

### Step 1 — Create the free VM

1. Sign up at <https://cloud.oracle.com> (needs a credit card to verify — it is
   **not** charged on the Always Free tier).
2. Menu → **Compute → Instances → Create Instance**.
3. **Image and shape:**
   - Image: **Ubuntu 22.04**
   - Shape: **Ampere (Arm) — VM.Standard.A1.Flex**. Give it **2 OCPU / 12 GB**
     (plenty for a POC; you can go up to 4/24 free).
   - If you get *"Out of host capacity"*, try a different Availability Domain or
     region, or retry later — this is the common Oracle free-tier annoyance.
4. **Add SSH key:** choose "Generate a key pair" and **download the private key**
   (or paste your own public key).
5. Create. When it's running, copy the **Public IP address**.

### Step 2 — Open the network ports (two firewalls!)

Oracle blocks ports in **two** places. You must open both.

**A) Cloud firewall (VCN Security List):**
1. Instance page → click the **Virtual Cloud Network** link → **Security Lists**
   → the default one.
2. **Add Ingress Rules** (Source CIDR `0.0.0.0/0` for each):

   | Protocol | Destination Port |
   |----------|------------------|
   | TCP      | 80               |
   | TCP      | 443              |
   | TCP      | 7881             |
   | UDP      | 7882             |

   (Port 22 for SSH is already open.)

**B) OS firewall (inside the VM):** SSH in first —
```bash
ssh -i /path/to/your-private-key ubuntu@YOUR_PUBLIC_IP
```
Then open the same ports at the OS level and save them:
```bash
sudo iptables -I INPUT 6 -p tcp --dport 80   -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443  -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 7881 -j ACCEPT
sudo iptables -I INPUT 6 -p udp --dport 7882 -j ACCEPT
sudo netfilter-persistent save
```
> Oracle's Ubuntu image has a default `REJECT` rule near the bottom of the INPUT
> chain. Inserting at position 6 puts these rules *above* it. If `netfilter-persistent`
> is missing: `sudo apt-get install -y netfilter-persistent && sudo netfilter-persistent save`.

### Step 3 — Point a free domain at the VM (DuckDNS)

1. Go to <https://www.duckdns.org>, sign in (Google/GitHub).
2. Create a subdomain, e.g. `yourname` → gives `yourname.duckdns.org`.
3. Set its **IP** to your VM's public IP, click **update**.

### Step 4 — Install Docker on the VM

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
# log out and back in so the group applies:
exit
ssh -i /path/to/your-private-key ubuntu@YOUR_PUBLIC_IP
docker version   # should work without sudo now
```

### Step 5 — Get the code onto the VM

Either `git clone` your repo, or copy from your laptop:
```bash
# from your laptop, in the discord-clone parent dir:
scp -i /path/to/your-private-key -r discord-clone ubuntu@YOUR_PUBLIC_IP:~/
```

### Step 6 — Configure and launch

On the VM:
```bash
cd ~/discord-clone/infra
cp .env.example .env
nano .env
```
Set:
```
DOMAIN=yourname.duckdns.org
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=<paste output of: openssl rand -hex 32>
```
Save (Ctrl+O, Enter, Ctrl+X). Then launch:
```bash
docker compose up -d --build
```
First run builds the images and Caddy fetches a real HTTPS certificate for your
DuckDNS domain (takes ~30 s). Check logs:
```bash
docker compose logs -f caddy      # look for "certificate obtained successfully"
docker compose logs -f livekit
```

### Step 7 — Test it

1. Open **https://yourname.duckdns.org** on your computer. Allow camera + mic.
2. Have a **friend on a different network** open the same URL, join the **same
   room name**.
3. You should see each other's cameras, hear audio, and be able to screenshare
   (the screen-share button is in the bottom control bar).

If yes on all three → **Phase 0 passed.** 🎉

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| Camera button does nothing / API undefined | Page isn't on HTTPS. Confirm the URL is `https://` and the cert loaded (`docker compose logs caddy`). |
| Caddy can't get a certificate | Port 80 not open (both firewalls), or DuckDNS IP doesn't match the VM. |
| You connect but see no one / no video from the other person | Media ports blocked. Recheck **UDP 7882** and **TCP 7881** in *both* the VCN Security List and OS iptables. |
| "Out of host capacity" at VM creation | Oracle free-tier scarcity. Try another Availability Domain/region or retry later. |
| `docker` needs sudo | You skipped the log-out/in after `usermod -aG docker`. |

## Useful commands

```bash
docker compose ps                 # what's running
docker compose logs -f <service>  # livekit | token | web | caddy
docker compose down               # stop everything
docker compose up -d --build      # rebuild + restart after code changes
```

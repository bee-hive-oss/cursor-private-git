# Setup checklist (short)

Full guide: **[SETUP.md](SETUP.md)**

## Order: Access before tunnel start

- [ ] Forgejo on `127.0.0.1:3000`
- [ ] `bash bridge/install-cloudflared-user.sh`; `cloudflared tunnel login` (do **not** run tunnel yet)
- [ ] Zero Trust enabled; team name = `<TEAM_NAME>`
- [ ] Service token created; client id + secret saved
- [ ] Access app (self-hosted) + **Service Auth** policy for that token
- [ ] **Application Audience (AUD) Tag** copied from **Additional settings** (64 hex chars)
- [ ] Tunnel create + DNS route (`CF_TUNNEL_NAME`, `FORGEJO_PUBLIC_HOST`)
- [ ] `bash bridge/write-cloudflared-config.sh`
- [ ] systemd user unit + start `cloudflared`
- [ ] curl: no headers → 403/401 Access page (not Forgejo JSON); with headers → 200
- [ ] Forgejo PAT (`read:user`, repo + issue scopes) + repo with README
- [ ] Six `FORGEJO_*` Cursor secrets
- [ ] Environment Build + new agent + MCP tools

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
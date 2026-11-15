# Architecture

```mermaid
flowchart LR
  subgraph laptop["Operator laptop"]
    FJ["Forgejo\n127.0.0.1:3000"]
    CF["cloudflared\n(user systemd)"]
    FJ --> CF
  end
  subgraph cloudflare["Cloudflare"]
    EDGE["Tunnel + Access\n(service token)"]
    CF --> EDGE
  end
  subgraph cursor["Cursor cloud agent VM"]
    SETUP["agent-git-setup.sh"]
    GIT["git push / clone"]
    MCP["forgejo-mcp"]
    SETUP --> GIT
    SETUP --> MCP
  end
  EDGE --> SETUP
  GIT --> EDGE
  MCP --> EDGE
  subgraph github["GitHub placeholder"]
    PH["Zakox/cursor-private-git\nlaunch + docs only"]
  end
  cursor -. "clone bootstrap" .-> PH
```

## Data flow

1. Developer runs Forgejo locally; tunnel exposes HTTPS hostname.
2. Cloudflare Access requires service token headers on every request.
3. Cursor agent VM receives secrets (`FORGEJO_*`, `FORGEJO_CF_ACCESS_*`).
4. Startup script configures git; MCP uses same URL, token, and Access headers.
5. GitHub repo supplies agent environment definition and documentation only.
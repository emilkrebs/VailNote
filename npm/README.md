# vailnote

Official VailNote CLI. Create, read, and delete end-to-end encrypted notes.

Content is encrypted with AES-256-GCM **locally** and decrypted **locally** — the server only ever stores ciphertext, so
secrets like API keys never touch your disk in plaintext.

```bash
npm install -g vailnote

# Create an encrypted note (content via stdin, so it never appears in argv/history)
echo "sk-1234..." | vailnote create --expires-in 30d

# Read (decrypt) a note
vailnote read "https://vailnote.com/<noteId>#auth=<authKey>"

# Delete a manual-deletion note
vailnote delete "<link>"

# Resolve every VailNote link in a .env file to its decrypted value
vailnote env
```

## Options

`-e/--expires-in` (10m, 1h, 6h, 12h, 24h, 3d, 7d, 30d, 90d, 180d), `-m/--manual-deletion`, `-p/--password` (or
`VAILNOTE_PASSWORD`), `-o/--origin` (default `https://vailnote.com`), `-j/--json`, `-h/--help`.

Requires Node 18+. Requires no Deno runtime. See the [VailNote repo](https://github.com/emilkrebs/VailNote) for the HTTP
API, encryption protocol, and `llm.txt` agent documentation.

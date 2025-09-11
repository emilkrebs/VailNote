<div id="logo" align="center">
  <a href="https://github.com/emilkrebs/VailNote" target="_blank" rel="noopener noreferrer">
   <img width="256" alt="VailNote Logo" src="./static/logo.png">
 </a>

[![Made with Fresh](https://fresh.deno.dev/fresh-badge-dark.svg)](https://fresh.deno.dev)

</div>

# About

VailNote is a simple, **open-source** note-sharing app designed for **maximum privacy**. All notes are encrypted using
modern encryption technology before being stored, ensuring that no one else can access them. The app is built with a
focus on user-friendliness and security.

🔗 See VailNote in action at [vailnote.com](https://vailnote.com).

## Features

- 🔒 **End-to-end encryption**
- 🗂️ **Self-destructing notes** - automatically deleted after viewing
- 🔑 **Optional password protection**
- ⏰ **Configurable expiration times** (10 minutes to 30 days)
- 🚫 **No tracking or analytics**
- 🛡️ **Privacy-preserving rate limiting** using Anonymous Rate-Limited Credentials (ARC)

## Tech Stack

- **Framework**: [Fresh](https://fresh.deno.dev) (Deno)
- **Runtime**: Deno
- **Database**: FoundationDB (Deno KV)
- **Encryption**: AES-GCM with PBKDF2 key derivation for content encryption, bcrypt for password storage
- **Frontend**: Tailwind CSS & Preact

> [!NOTE]
> Safety and transparency are our top priorities. VailNote is made to be as secure as possible while still being easy to
> use and compatible with most clients. I highly encourage you to look into the architecture to ensure your safety!

# How does VailNote work?

Take a look at the [architecture diagram](#architecture-diagram) for a better visual representation.

Every possible step where I think it might be insecure, given the possibility that the network, server, or database has
The system has been compromised and is marked with (!).

1. Before sending anything to the server, the content will be encrypted.
2. First, the password will be hashed with PBKDF2 for security
3. The original password (not the hash) will then be used to encrypt the content.

- If no password is provided, the client will generate a random phrase (auth key).

4. The client will send the encrypted content, PBKDF2 hashed password, and expiration time to the server.
5. If the document is valid, the server will generate a random note ID, hash the PBKDF2 password again using bcrypt for
   secure storage, and store the note in the database.
6. The server will send a successful response containing the new note ID.
7. The client will generate a valid link using the note ID and local auth key using the following structure:
   `https://vailnote.com/[noteId]#auth=[authKey]`

### Viewing the Note

1. When a note is accessed, the client fetches the encrypted note data from the server.
2. The client asks the user for confirmation before viewing (and destroying) the note.
3. If an auth key is present in the URL, the client uses it to decrypt the note. If a password is required, the client
   prompts for it and decrypts locally.
4. The client never sends the password or auth key to the server—decryption always happens in the browser.
5. After successful decryption, the client requests that the server delete the note.
6. If decryption fails, the note remains on the server until a valid decryption attempt is made or it expires.

## Known Issues

(None)

[Add Issue](https://github.com/emilkrebs/VailNote/issues/new)

## Installation & Development

### Prerequisites

- [Deno](https://deno.land/) v2.3 or later

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/emilkrebs/VailNote.git
   cd VailNote
   ```

2. Set up environment variables:

3. Start the development server:
   ```bash
   deno task start
   ```

4. Open [http://localhost:8000](http://localhost:8000) in your browser

### Environment Variables

- `DATABASE_URI` - Deno KV connection string

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

# Screenshots

![Home Page](https://github.com/user-attachments/assets/fe73890e-0cea-453f-bdcc-eb7e7bf418cb)

![Confirm Page](https://github.com/user-attachments/assets/f443744a-6a87-4a63-89e7-0cdf6e06d850)

![Password Protected](https://github.com/user-attachments/assets/287ca9c9-5213-4d8e-888f-6d8230abbb91)

![Content Page](https://github.com/user-attachments/assets/7007f54e-1e6b-4b82-b465-55920b9ac001)

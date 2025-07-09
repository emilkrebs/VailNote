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

VailNote is **non-JavaScript compatible**; however, JavaScript is highly recommended for maximizing security and
usability.

🔗 See VailNote in action at [vailnote.com](https://vailnote.com).

## Features

- 🔒 **End-to-end encryption** (JavaScript mode)
- 🗂️ **Self-destructing notes** - automatically deleted after viewing
- 🔑 **Optional password protection**
- ⏰ **Configurable expiration times** (10 minutes to 30 days)
- 🚫 **No tracking or analytics**
- 📱 **No-JavaScript fallback** for maximum compatibility
- 🛡️ **Privacy-preserving rate limiting** using Anonymous Rate-Limited Credentials (ARC)

## Tech Stack

- **Framework**: [Fresh](https://fresh.deno.dev) (Deno)
- **Runtime**: Deno
- **Database**: MongoDB
- **Encryption**: AES-GCM with SHA-256 key derivation
- **Frontend**: Tailwind CSS & Preact

> [!NOTE]
> Safety and transparency are our top priorities. VailNote is made to be as secure as possible while still being easy to
> use and compatible with most clients. I highly encourage you to look into the architecture to ensure your safety!

# How does VailNote work?

Since VailNote uses one JavaScript and one non-JavaScript approach, there are two different implementations listed
below. Take a look at the [architecture diagram](#architecture-diagram) for a better visual representation.

Every possible step where I think it might be insecure, given the possibility that the network, server, or database has
been compromised, has been marked with (!)

### JavaScript (Recommended)

1. Before sending anything to the server, the content will be encrypted.
2. First, the password will be hashed with SHA-256
3. The password hash will then be used to encrypt the content.

- If no password is provided, the client will generate a random phrase (auth key).

4. The client will send the encrypted content, hashed password, and expiration time to the server.
5. If the document is valid, the server will generate a random note ID, hash the password again using salted hashing
   (bcrypt), and store the note in the database.
6. The server will send a successful response containing the new note ID.
7. The client will generate a valid link using the note ID and local auth key using the following structure:
   `https://vailnote.com/[noteId]?auth=[authKey]`

### Non-JavaScript

1. The password and content will be sent to the server as plain text (!)
2. The server will hash the password with SHA-256 and encrypt the content using the password hash.

- If no password is provided, the server will use the unique noteID for encryption (!)

3. If the document is valid, the server will generate a random note ID, hash the password again using salted hashing
   (bcrypt), and store the note in the database.
4. The server will generate a random link using the following structure: `https://vailnote.com/[noteId]`

Note: SSL will handle the encryption. If disabled the sensitive data might be compromised.

### Viewing the Note

1. If no password is required, the server will ask for confirmation first.
2. When confirmed, the server will decrypt the note using the auth key (if provided) or note ID
3. If successful, the server will send the decrypted note to the client (!) and destroy the note.

4. If a password is required, the server will prompt a login form.
5. The password will be sent as plain text (!) to the server and hashed using SHA-256
6. The server will compare the password hash to the SHA-256 password.
7. The server will decrypt the content using the SHA-256 password and destroy the note.
8. If successful, the server will send the decrypted note to the client (!) and destroy the note.

## Known Issues

(None)

[Add Issue](https://github.com/emilkrebs/VailNote/issues/new)

## Installation & Development

### Prerequisites

- [Deno](https://deno.land/) v1.34 or later
- MongoDB instance

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

- `BASE_URI` - MongoDB connection string
- `TEST_BASE_URI` - MongoDB test database connection string

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

# Architecture Diagram

![Architecture Diagram](./static/images/architecture.png)

# Screenshots

![Home Page](https://github.com/user-attachments/assets/fe73890e-0cea-453f-bdcc-eb7e7bf418cb)

![Confirm Page](https://github.com/user-attachments/assets/f443744a-6a87-4a63-89e7-0cdf6e06d850)

![Password Protected](https://github.com/user-attachments/assets/287ca9c9-5213-4d8e-888f-6d8230abbb91)

![Content Page](https://github.com/user-attachments/assets/7007f54e-1e6b-4b82-b465-55920b9ac001)

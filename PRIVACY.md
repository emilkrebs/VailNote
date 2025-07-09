# Privacy Policy

_Last updated: July 7, 2025_

Your privacy and security are our top priorities. This Privacy Policy explains how VailNote (“we”, “us”, or “our”)
collects, uses, and protects your information when you use our secure note-sharing application.

## Data Protection at VailNote

- **End-to-End Encryption:**\
  Notes are encrypted in your browser before leaving your device (when JavaScript is enabled). Only you and your
  intended recipient can decrypt and read your notes.

- **Server-Side Encryption (No JavaScript):**\
  If JavaScript is disabled, encryption occurs on our servers. In this case, you must trust us to handle your data
  securely.

- **No Password or Key Storage:**\
  We never store your password or encryption key. Only you can decrypt your notes.

- **Automatic Deletion:**\
  Notes are deleted automatically after being viewed or after their expiration time.

- **No Trackers or Analytics:**\
  We do not use cookies, trackers, or analytics tools.

## Information We Collect

- **Notes Content:**\
  The encrypted content of your notes is temporarily stored on our servers until it is viewed or expires.

- **Rate Limiting Data (ARC System):**\
  We use Anonymous Rate-Limited Credentials (ARC) to prevent abuse. This system processes your IP address and browser
  headers to generate anonymous, daily-rotating tokens. Raw IP addresses are never stored - only hashed, anonymous
  tokens that cannot be reverse-engineered to reveal your identity.

- **Technical Headers:**\
  Standard HTTP headers (User-Agent, Accept headers) may be processed as fallback identifiers for rate limiting when IP
  addresses are unavailable.

## Use of Your Information

- **Service Delivery:**\
  Encrypted note data is used solely to deliver your notes to recipients.

- **Security:**\
  We use Anonymous Rate-Limited Credentials (ARC) to prevent abuse and attacks. This system creates anonymous tokens
  from your network identifier without storing your actual IP address. Rate limiting data is automatically deleted
  daily.

- **No Marketing or Profiling:**\
  We do not use your data for marketing, profiling, or advertising.

## Data Retention and Deletion

- Notes are deleted automatically after being viewed or after their set expiration time.
- Rate limiting tokens are automatically deleted daily and cannot be linked across days.
- You may delete a note at any time using the provided link before it expires.

## Zero-Knowledge Guarantee

VailNote is designed so that not even our team can access your note contents. All encryption and decryption happens on
your device (when JavaScript is enabled). We never have access to your passwords or encryption keys.

## JavaScript Usage

When JavaScript is enabled, your notes are encrypted in your browser before being sent to our servers.\
If you disable JavaScript, encryption happens on the server side, and you must trust us to handle your data securely.

## Anonymous Rate Limiting (ARC)

VailNote uses Anonymous Rate-Limited Credentials (ARC) to prevent abuse while protecting your privacy:

- **IP Processing**: Your IP address is processed to create anonymous tokens but is never stored
- **Daily Rotation**: Tokens automatically rotate daily, preventing long-term tracking
- **No Linkability**: Previous tokens cannot be linked to current tokens
- **Automatic Cleanup**: All rate limiting data is deleted automatically after 24 hours
- **Headers Included**: Rate limit information is provided in response headers for transparency

## Cookies and Tracking

We do **not** use cookies, trackers, or third-party analytics.

## Third-Party Services

VailNote does not share your data with any third parties.

## Security

We use industry-standard security measures, including HTTPS and encryption, to protect your data. Notes are encrypted
using AES-GCM encryption with SHA-256 key derivation, and passwords are securely hashed using bcrypt with unique salts
for storage.

## Disclaimer and Limitation of Liability

**Use at Your Own Risk:** VailNote is provided "as is" without any warranties, express or implied. While we implement
industry-standard security measures, no system is 100% secure.

**Content Responsibility:** You are solely responsible for the content you share through VailNote. We do not monitor,
review, or control user content and are not responsible for any content shared through our service.

**Sharing Responsibility:** Once a note is shared, it is your responsibility to ensure it reaches the correct recipient.
VailNote is not responsible for any actions, consequences, or damages occurring after a note has been shared or
accessed.

**Service Availability:** We strive to maintain service availability but do not guarantee uninterrupted access. VailNote
may be temporarily unavailable due to maintenance, updates, or technical issues.

**Data Loss:** While we implement automatic deletion features, you should not rely solely on VailNote for important data
storage. Always keep backup copies of important information.

**Legal Compliance:** Users are responsible for ensuring their use of VailNote complies with applicable laws and
regulations in their jurisdiction.

**Limitation of Liability:** To the maximum extent permitted by law, VailNote and its developers shall not be liable for
any direct, indirect, incidental, consequential, or punitive damages arising from your use of the service, including but
not limited to data loss, security breaches, or unauthorized access to shared content.

## Changes to This Policy

We may update this policy in the future. Please check back periodically for changes. Significant changes will be
announced on our website.

## Contact

If you have questions about privacy, contact us at:\
[https://emilkrebs.dev/imprint](https://emilkrebs.dev/imprint)

## Source Code

The source code for VailNote is open-source and available on [GitHub](https://github.com/emilkrebs/VailNote).

© 2025 VailNote. All rights reserved.

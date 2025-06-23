export class AESEncryption {
	private _cryptoKey?: CryptoKey;
	private _key?: string;
	private _encoder = new TextEncoder();
	private _decoder = new TextDecoder();

	async setup(key: string) {
		this._cryptoKey = await getAESEncryptionKey(key);
		this._key = key;
	}

	// check if encryption is setup and contains a key and iv
	isSetup(): boolean {
		return !!this._cryptoKey;
	}

	// get the encryption key and iv
	getEncryptionKey(): string {
		this.checkSetup();
		return this._key!;
	}

	/**
	 * Encrypt a string using the provided encryption key and iv
	 */
	async encrypt(data: string, iv: string): Promise<string> {
		this.checkSetup();
		const dataBytes = this._encoder.encode(data);
		const encryptedData = await crypto.subtle.encrypt(
			{
				name: "AES-GCM",
				iv: getAESEncryptionIV(iv),
			},
			this._cryptoKey!,
			dataBytes,
		);
		return uint8ArrayToBase64(new Uint8Array(encryptedData));
	}

	/**
	 * Decrypt a string using the provided encryption key and iv
	 */
	async decrypt(data: string, iv: string): Promise<string> {
		this.checkSetup();
		const decryptedData = await crypto.subtle.decrypt(
			{
				name: "AES-GCM",
				iv: getAESEncryptionIV(iv),
			},
			this._cryptoKey!,
			base64ToUint8Array(data),
		);
		return this._decoder.decode(new Uint8Array(decryptedData));
	}

	private checkSetup() {
		if (!this.isSetup()) {
			throw new Error("Encryption not setup");
		}
	}
}

export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
	const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
	return btoa(binaryString);
}

// Convert a Base64-encoded string back to a Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const uint8Array = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		uint8Array[i] = binaryString.charCodeAt(i);
	}
	return uint8Array;
}

export function compressURIComponent(str: string): string {
	// compress the string
	return uint8ArrayToBase64(new TextEncoder().encode(str));
}

export function decompressURIComponent(str: string): string {
	// decompress the string
	return new TextDecoder().decode(base64ToUint8Array(str));
}

// generate a random AES key for encryption
export function generateEncryptionKey(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(32));
}

// generate a random AES iv for encryption
export function generateEncryptionIv(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(12));
}

export function getAESEncryptionKey(key: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"raw",
		base64ToUint8Array(key),
		"AES-GCM",
		true,
		["encrypt", "decrypt"],
	);
}

export function getAESEncryptionIV(iv: string): Uint8Array {
	return base64ToUint8Array(iv);
}

/**
	 * Encrypt note content using a password
	 * @param content The note content
	 * @param password The password
	 * @returns { encrypted: string, iv: string }
	 */
	export async function encryptNoteContent(content: string, password: string): Promise<{ encrypted: string, iv: string }> {
        // Hash the password to get a 32-byte key (SHA-256)
        const keyBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
        const keyBase64 = uint8ArrayToBase64(new Uint8Array(keyBuffer));

        // Generate a random IV
        const ivBytes = generateEncryptionIv();
        const ivBase64 = uint8ArrayToBase64(ivBytes);

        // Encrypt the content
        const aes = new AESEncryption();
        await aes.setup(keyBase64);
        const encrypted = await aes.encrypt(content, ivBase64);

        return { encrypted, iv: ivBase64 };
    }

	/** * Decrypt note content using a password
	 * @param encrypted The encrypted note content
	 * @param iv The initialization vector used during encryption
	 * @param password The password used for encryption
	 * @return The decrypted note content
	 */
	export async function decryptNoteContent(encrypted: string, iv: string, password: string): Promise<string> {
		// Hash the password to get a 32-byte key (SHA-256)
		const keyBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
		const keyBase64 = uint8ArrayToBase64(new Uint8Array(keyBuffer));

		// Decrypt the content
		const aes = new AESEncryption();
		await aes.setup(keyBase64);
		return await aes.decrypt(encrypted, iv);
	}
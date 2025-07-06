// deno-lint-ignore-file no-explicit-any
let isLoggingEnabled = false;

export function enableLogging() {
	isLoggingEnabled = true;
}

export function log(...data: any[]) {
	if (isLoggingEnabled) {
		console.log(...data);
	}
}

export class Logger {
	constructor() {
		this.log = (...messages) => {
			log(TerminalColors.format(`&3[Server]&r ${messages.join(' ')}&r`));
		};
		this.error = (...messages) => {
			log(TerminalColors.format(`&1[Server]&r ${messages.join(' ')}&r`));
		};
		this.warn = (...messages) => {
			log(TerminalColors.format(`&4[Server]&r ${messages.join(' ')}&r`));
		};
	}

	log: (...messages: any[]) => void;
	error: (...messages: any[]) => void;
	warn: (...messages: any[]) => void;
}

// color codes used on the server side
export class TerminalColors {
	static readonly Codes = {
		Reset: '\x1b[0m',
		Bright: '\x1b[1m',
		Dim: '\x1b[2m',
		Underscore: '\x1b[4m',
		Blink: '\x1b[5m',
		Reverse: '\x1b[7m',

		FgBlack: '\x1b[30m',
		FgRed: '\x1b[31m',
		FgGreen: '\x1b[32m',
		FgYellow: '\x1b[33m',
		FgBlue: '\x1b[34m',
		FgMagenta: '\x1b[35m',
		FgCyan: '\x1b[36m',
		FgWhite: '\x1b[37m',
		FgGray: '\x1b[90m',

		BgBlack: '\x1b[40m',
		BgRed: '\x1b[41m',
		BgGreen: '\x1b[42m',
		BgYellow: '\x1b[43m',
		BgBlue: '\x1b[44m',
		BgMagenta: '\x1b[45m',
		BgCyan: '\x1b[46m',
		BgWhite: '\x1b[47m',
	};

	static readonly ColorCodes: { [key: string]: string } = {
		'0': TerminalColors.Codes.FgBlack,
		'1': TerminalColors.Codes.FgRed,
		'2': TerminalColors.Codes.FgGreen,
		'3': TerminalColors.Codes.FgYellow,
		'4': TerminalColors.Codes.FgBlue,
		'5': TerminalColors.Codes.FgMagenta,
		'6': TerminalColors.Codes.FgCyan,
		'7': TerminalColors.Codes.FgWhite,
		'8': TerminalColors.Codes.FgGray,

		'r': TerminalColors.Codes.Reset,
		'b': TerminalColors.Codes.Bright,
		'd': TerminalColors.Codes.Dim,
		'u': TerminalColors.Codes.Underscore,
		'l': TerminalColors.Codes.Blink,
		'v': TerminalColors.Codes.Reverse,
	};

	/**
	 * Formats a string with color codes
	 * @param message The message to format
	 * @returns The formatted message
	 * @colorCodes
	 */
	static format(message: string): string {
		const regex = /&([0-9a-zA-Z])/g;
		return message.replace(regex, (_match, p1) => {
			return TerminalColors.ColorCodes[p1];
		});
	}
}

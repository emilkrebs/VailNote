import { log, Logger, TerminalColors } from '../logging.ts';

export class DatabaseLogger extends Logger {
    constructor() {
        super();

        this.log = (...messages) => {
            log(TerminalColors.format(`&3[Database]&r ${messages.join(' ')}&r`));
        };

        this.error = (...messages) => {
            log(TerminalColors.format(`&1[Database]&r ${messages.join(' ')}&r`));
        };

        this.warn = (...messages) => {
            log(TerminalColors.format(`&4[Database]&r ${messages.join(' ')}&r`));
        };
    }
}

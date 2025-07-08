import { FreshContext } from "$fresh/server.ts";
import { NoteDatabase } from '../database/note-database.ts';
import { TEST_MODE } from '../fresh.config.ts';
import { ArcRateLimiter } from '../utils/rate-limiting/arc-rate-limiter.ts';

export interface State {
    context: Context;
}

export interface ContextOptions {
    testMode: boolean;
    databaseUri: string;
    testDatabaseUri: string;
}

export class Context {
    private static context: Context;
    private noteDatabase: NoteDatabase | undefined;
    private rateLimiter: ArcRateLimiter | undefined;

    public constructor() {
        // only called during initialization
    }


    public static async init(options: ContextOptions) {
        if (Context.context) {
            Context.context.cleanup();
        }
        Context.context = new Context();
        await Context.context.initializeResources(options);
    }

    private async initializeResources(options: ContextOptions) {
        try {
            const uri = options.testMode ? options.testDatabaseUri : options.databaseUri;
            if (!uri) {
                throw new Error('Database URI must be provided in options');
            }
            this.noteDatabase = new NoteDatabase(uri);
            this.rateLimiter = this.getDefaultArcRateLimiter(options.testMode);
            await this.noteDatabase.init();
        } catch (error) {
            throw new Error(`Failed to initialize context: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private getBaseUri(testMode: boolean): string {
        const uri = testMode ? Deno.env.get('TEST_BASE_URI') : Deno.env.get('BASE_URI');
        if (!uri && testMode) {
            throw new Error('TEST_BASE_URI environment variable is not set in test mode');
        }
        if (!uri) {
            throw new Error('BASE_URI environment variable is not set');
        }
        return uri;
    }

    private getDefaultArcRateLimiter(testMode: boolean = false): ArcRateLimiter {
        if (this.rateLimiter) {
            return this.rateLimiter; // Return existing instance if already initialized
        }

        return new ArcRateLimiter(
            10, // 10 requests per minute
            60 * 1000, // 1 minute window
            5 * 60 * 1000, // 5 minute block
            !testMode, // Disable periodic cleanup in test mode
        );
    }


    public static instance() {
        if (this.context) return this.context;
        else throw new Error("Context is not initialized!");
    }

    public getNoteDatabase(): NoteDatabase {
        if (!this.noteDatabase) {
            throw new Error('Database not initialized in context');
        }
        return this.noteDatabase;
    }

    public getRateLimiter(): ArcRateLimiter {
        if (!this.rateLimiter) {
            throw new Error('Rate limiter not initialized in context');
        }
        return this.rateLimiter;
    }

    public async cleanup() {
        console.log('Cleaning up context resources...');
        if (this.rateLimiter) {
            this.rateLimiter.destroy();
            this.rateLimiter = undefined;
        }

        // Clean up database connection
        if (this.noteDatabase) {
            await this.noteDatabase.close();
        }
        this.noteDatabase = undefined;
    }
}


export async function handler(
    _req: Request,
    ctx: FreshContext<State>,
) {
    ctx.state.context = Context.instance();
    return await ctx.next();
}
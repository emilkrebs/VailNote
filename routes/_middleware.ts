import { FreshContext } from "$fresh/server.ts";
import { NoteDatabase } from '../database/note-database.ts';
import { ArcRateLimiter } from '../utils/rate-limiting/arc-rate-limiter.ts';

export interface State {
    context: Context;
}

export class Context {
    private static context: Context;
    private noteDatabase: NoteDatabase | undefined;
    private rateLimiter: ArcRateLimiter | undefined;

    public constructor() {
        // only called during initialization
    }


    public static async init(testDatabase?: NoteDatabase) {
        if (Context.context) {
            Context.context.cleanup();
        }
        Context.context = new Context();
        await Context.context.initializeResources(testDatabase);
    }

    private async initializeResources(testDatabase?: NoteDatabase) {
        try {
            if (testDatabase) {
                this.noteDatabase = testDatabase;
            } else {
                this.noteDatabase = new NoteDatabase(this.getBaseUri());
            }

            this.rateLimiter = this.getDefaultArcRateLimiter();
            await this.noteDatabase.init(); 
        } catch (error) {
            throw new Error(`Failed to initialize context: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private getBaseUri(): string {
        const uri = Deno.env.get('BASE_URI');
        if (!uri) {
            throw new Error('BASE_URI environment variable is not set');
        }
        return uri;
    }

    private getDefaultArcRateLimiter(): ArcRateLimiter {
        if (this.rateLimiter) {
            return this.rateLimiter; // Return existing instance if already initialized
        }
        return new ArcRateLimiter(
            10, // 10 requests per minute
            60 * 1000, // 1 minute window
            5 * 60 * 1000, // 5 minute block
            true, // Disable periodic cleanup in test mode
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
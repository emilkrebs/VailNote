import { App, type Context, cors, csp, csrf, staticFiles } from 'fresh';
import { headers } from './middleware.ts';
import { ArcRateLimiter } from './lib/rate-limiting/src/arc-rate-limiter.ts';
import { ORIGIN, State } from './lib/types/common.ts';
import { NoteDatabase } from './lib/database/note-database.ts';
import { defaultLogger } from './lib/logging.ts';
import { apiErrorHandler } from './lib/http.ts';

const serverSecret = Deno.env.get('ARC_SECRET');
const databasePath = Deno.env.get('DATABASE_PATH');
let noteDatabase: NoteDatabase;

if (!serverSecret) {
    throw new Error('ARC_SECRET environment variable is not set');
}

try {
    noteDatabase = await new NoteDatabase(databasePath).init();
    defaultLogger.log(`Database Path Source: ${databasePath ? 'env' : 'default'}`);
} catch (error) {
    defaultLogger.error('Failed to initialize NoteDatabase', error);
    throw error;
}

// Configure rate limiter: 15 requests per minute, 5 min block duration
const rateLimiter = new ArcRateLimiter({
    maxRequests: 15,
    windowMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000,
    identifier: 'vailnote-rate-limiter',
    serverSecret,
});

const rateLimitMiddleware = rateLimiter.middleware<State>();

export { noteDatabase };

export const app = new App<State>()
    .use(staticFiles())
    .use(cors({
        origin: ORIGIN,
        allowHeaders: ['Content-Type', 'Authorization'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        maxAge: 86400,
    }))
    .use(csrf({
        origin: ORIGIN,
    }))
    .use(csp())
    .use(async (ctx: Context<State>) => {
        // Skip rate limiting for static legal pages
        const { pathname } = new URL(ctx.req.url);
        if (pathname === '/privacy' || pathname === '/terms') {
            return await ctx.next();
        }
        try {
            return await rateLimitMiddleware(ctx);
        } catch (error) {
            // The rate limiter runs at the app root, outside the `/api/*` error
            // route, so intercept its errors here: API clients must receive
            // JSON (with retry info), never the HTML error page.
            if (pathname.startsWith('/api/')) {
                ctx.error = error;
                return apiErrorHandler(ctx);
            }
            throw error;
        }
    })
    .use(headers({
        'Cross-Origin-Resource-Policy': 'same-site',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Permissions-Policy':
            'geolocation=(), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    }))
    // API errors (including 429 rate-limit responses) must be JSON, never
    // rendered as the HTML error page. Clients parse `message` from the body.
    // Note: Fresh matches error routes by URL segment, so `/api` (the shared
    // ancestor of all API routes) catches, while `/api/*` would not.
    .onError('/api', apiErrorHandler)
    .fsRoutes();

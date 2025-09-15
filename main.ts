import { App, cors, csrf, staticFiles } from 'fresh';
import { csp, headers } from './middleware.ts';
import { ArcRateLimiter, rateLimiter } from './lib/rate-limiting/arc-rate-limiter.ts';

export interface State {
    shared: string;
}

export const ORIGIN = 'https://vailnote.com';
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
    .use(rateLimiter(new ArcRateLimiter(15, 60000, 300000))) // 15 requests per minute, 5 min block
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
    .fsRoutes();

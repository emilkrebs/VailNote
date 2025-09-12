import { App, cors, csrf, Middleware, staticFiles } from 'fresh';

export interface State {
    shared: string;
}

export const ORIGIN = 'https://vailnote.com';
export const app = new App<State>();

app.use(staticFiles());
app.use(cors({
    origin: ORIGIN,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
}));

app.use(csrf({
    origin: ORIGIN,
}));

app.use(headers());

app.fsRoutes();

function headers<State>(): Middleware<State> {
    const addHeaderProperties = (headers: Headers) => {
        // Cross-Origin Policies
        headers.set('Cross-Origin-Resource-Policy', 'same-site');
        headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
        headers.set('Cross-Origin-Opener-Policy', 'same-origin');

        // Privacy and Permissions
        headers.set(
            'Permissions-Policy',
            'geolocation=(), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()',
        );
        headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Content Security
        headers.set('X-Content-Type-Options', 'nosniff');
        headers.set('X-Frame-Options', 'DENY');

        // Enhanced CSP to allow Google Fonts move to build-in CSP in the future
        const csp = [
            "default-src 'self'",
            "script-src 'self'", // unsafe-inline needed for fresh
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self'",
            "img-src 'self' data:",
            "media-src 'self' data: blob:",
            "worker-src 'self' blob:",
            "connect-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            'upgrade-insecure-requests',
        ].join('; ');

        headers.set('Content-Security-Policy', csp);

        // Transport Security
        headers.set(
            'Strict-Transport-Security',
            'max-age=63072000; includeSubDomains; preload',
        );
    };
    return async (ctx) => {
        const res = await ctx.next();
        addHeaderProperties(res.headers);
        return res;
    };
}

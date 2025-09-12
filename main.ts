import { App, cors, csrf, staticFiles } from 'fresh';
import { csp, headers } from './middleware.ts';

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

app.use(csp({
    reportOnly: false,
    reportUri: '/csp-violation-report-endpoint',
}));

app.use(headers({
    'Cross-Origin-Resource-Policy': 'same-site',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy':
        'geolocation=(), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}));

app.fsRoutes();

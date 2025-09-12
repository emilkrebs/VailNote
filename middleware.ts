import { Middleware } from 'fresh';

/** Options for Content-Security-Policy middleware */
export interface CSPOptions {
    reportOnly?: boolean;
    reportUri?: string;
    csp?: string[];
}

/** Middleware to set Content-Security-Policy headers
 * @param options - CSP options
 * @example
 * app.use(csp({
 *   reportOnly: true,
 *   reportUri: '/csp-violation-report-endpoint',
 *   csp: [
 *       "script-src 'self' 'unsafe-inline'",
 *   ],
 * }));
 */
export function csp<State>(options: CSPOptions = {}): Middleware<State> {
    const {
        reportOnly = false,
        reportUri = '/csp-violation-report-endpoint',
        csp = [],
    } = options;

    const defaultCsp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for fresh
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
    ];

    const cspDirectives = [...defaultCsp, ...csp];
    if (reportUri) {
        cspDirectives.push(`report-uri ${reportUri}`);
    }
    const cspString = cspDirectives.join('; ');

    return async (ctx) => {
        const res = await ctx.next();
        const headerName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
        res.headers.set(headerName, cspString);
        return res;
    };
}

/** Middleware to set custom headers on responses
 * @param headers - Record of headers to set
 * @example
 * app.use(headers({
 *   headers: {
 *       'X-Custom-Header': 'value',
 *   },
 * }));
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
 */
export function headers<State>(headers?: Record<string, string>): Middleware<State> {
    return async (ctx) => {
        const res = await ctx.next();
        for (const [key, value] of Object.entries(headers || {})) {
            res.headers.set(key, value);
        }
        return res;
    };
}

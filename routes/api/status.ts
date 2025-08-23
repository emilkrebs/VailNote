import { FreshContext } from '$fresh/server.ts';
import { mergeWithRateLimitHeaders } from '../../utils/rate-limiting/rate-limit-headers.ts';
import { State } from '../_middleware.ts';

// Types for the status API response
interface ServiceStatus {
    status: 'online' | 'degraded' | 'offline';
    responseTime?: number;
    lastChecked: string;
    error?: string;
    details?: Record<string, unknown>;
}

interface StatusResponse {
    timestamp: string;
    overall: 'online' | 'degraded' | 'offline';
    services: {
        api: ServiceStatus;
        database: ServiceStatus;
        website: ServiceStatus;
    };
    uptime: number;
    version: string;
    environment?: string;
}

// Configuration
const STATUS_CONFIG = {
    TIMEOUT_MS: 5000, // 5 second timeout for health checks
    DEGRADED_THRESHOLD_MS: 2000, // Consider degraded if response time > 2s
    MAX_ERROR_MESSAGE_LENGTH: 200,
} as const;

// Service health checkers with timeout and error handling
async function checkApiHealth(): Promise<ServiceStatus> {
    const startTime = performance.now();
    const lastChecked = new Date().toISOString();

    try {
        // Make a real request to the API endpoint (e.g., /api/status)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), STATUS_CONFIG.TIMEOUT_MS);
        const response = await fetch('/api/status', { signal: controller.signal });
        clearTimeout(timeout);
        const responseTime = Math.round(performance.now() - startTime);

        // Determine status based on response time and HTTP status
        let status: 'online' | 'degraded' | 'offline' = 'online';
        if (!response.ok) {
            status = 'offline';
        } else if (responseTime > STATUS_CONFIG.DEGRADED_THRESHOLD_MS) {
            status = 'degraded';
        }

        return {
            status,
            responseTime,
            lastChecked,
            details: {
                endpoint: '/api/status',
                healthy: response.ok,
                httpStatus: response.status,
            },
        };
    } catch (error) {
        return {
            status: 'offline',
            responseTime: Math.round(performance.now() - startTime),
            lastChecked,
            error: truncateErrorMessage(error instanceof Error ? error.message : 'Unknown error'),
        };
    }
}

async function checkDatabaseHealth(ctx: FreshContext<State>): Promise<ServiceStatus> {
    const startTime = performance.now();
    const lastChecked = new Date().toISOString();

    try {
        // Set up timeout for database check
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Database health check timeout')), STATUS_CONFIG.TIMEOUT_MS);
        });

        const healthCheckPromise = (async () => {
            const noteDatabase = ctx.state.context.getNoteDatabase();
            if (!noteDatabase) {
                throw new Error('Database not initialized');
            }

            const isHealthy = await noteDatabase.ping();
            if (!isHealthy) {
                throw new Error('Database ping failed');
            }

            return true;
        })();

        // Race between health check and timeout
        await Promise.race([healthCheckPromise, timeoutPromise]);

        const responseTime = Math.round(performance.now() - startTime);
        const status = responseTime > STATUS_CONFIG.DEGRADED_THRESHOLD_MS ? 'degraded' : 'online';

        return {
            status,
            responseTime,
            lastChecked,
            details: {
                connection: 'established',
                ping: 'successful',
            },
        };
    } catch (error) {
        const responseTime = Math.round(performance.now() - startTime);
        const errorMessage = error instanceof Error ? error.message : 'Database connection failed';

        return {
            status: 'offline',
            responseTime,
            lastChecked,
            error: truncateErrorMessage(errorMessage),
            details: {
                connection: 'failed',
                timeout: responseTime >= STATUS_CONFIG.TIMEOUT_MS,
            },
        };
    }
}

function checkWebsiteHealth(): ServiceStatus {
    const startTime = performance.now();
    const lastChecked = new Date().toISOString();

    // If this endpoint is responding, the website is operational
    const responseTime = Math.round(performance.now() - startTime);
    return {
        status: 'online',
        responseTime,
        lastChecked,
        details: {
            endpoint: 'responsive',
            server: 'running',
        },
    };
}

// Utility functions
function calculateOverallStatus(services: StatusResponse['services']): 'online' | 'degraded' | 'offline' {
    const statuses = Object.values(services).map(service => service.status);

    if (statuses.includes('offline')) {
        return 'offline';
    }

    if (statuses.includes('degraded')) {
        return 'degraded';
    }

    return 'online';
}

function getUptime(): number {
    // Return uptime in seconds using Deno.uptime()
    return Math.round(Deno.uptime());
}

function getVersion(): string {
    return Deno.env.get('APP_VERSION') || '1.0.0';
}

function getEnvironment(): string {
    return Deno.env.get('DENO_ENV') || Deno.env.get('NODE_ENV') || 'development';
}

function truncateErrorMessage(message: string): string {
    if (message.length <= STATUS_CONFIG.MAX_ERROR_MESSAGE_LENGTH) {
        return message;
    }
    return message.substring(0, STATUS_CONFIG.MAX_ERROR_MESSAGE_LENGTH - 3) + '...';
}

function createHeaders(allowOrigin = '*'): HeadersInit {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'X-Robots-Tag': 'noindex, nofollow',
    };
}

// Main handler
export const handler = async (req: Request, ctx: FreshContext<State>): Promise<Response> => {
    const rateLimitResult = await ctx.state.context.getRateLimiter().checkRateLimit(req);
    
    // check if rate limit is exceeded
    if (!rateLimitResult.allowed) {
        const resetTime = new Date(rateLimitResult.resetTime);
        return new Response(
            JSON.stringify({
                message: 'Rate limit exceeded. Please try again later.',
                resetTime: resetTime.toISOString(),
                retryAfter: rateLimitResult.retryAfter,
            }),
            {
                headers: mergeWithRateLimitHeaders(
                    { 'Content-Type': 'application/json' },
                    rateLimitResult,
                ),
                status: 429,
            },
        );
    }

    try {
        // Perform all health checks in parallel
        const [databaseStatus, apiStatus, websiteStatus] = await Promise.all([
            checkDatabaseHealth(ctx),
            Promise.resolve(checkApiHealth()),
            Promise.resolve(checkWebsiteHealth()),
        ]);
        const services = {
            api: apiStatus,
            database: databaseStatus,
            website: websiteStatus,
        };

        const response: StatusResponse = {
            timestamp: new Date().toISOString(),
            overall: calculateOverallStatus(services),
            services,
            uptime: getUptime(),
            version: getVersion(),
            environment: getEnvironment(),
        };

        return new Response(JSON.stringify(response, null, 2), {
            status: 200,
            headers: createHeaders(),
        });
    } catch (error) {
        const errorResponse = {
            timestamp: new Date().toISOString(),
            overall: 'offline' as const,
            error: truncateErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred'),
            version: getVersion(),
            environment: getEnvironment(),
        };

        return new Response(JSON.stringify(errorResponse, null, 2), {
            status: 500,
            headers: createHeaders(),
        });
    }
};

// Handle OPTIONS requests for CORS preflight
export const GET = handler;
export const OPTIONS = (_req: Request, _ctx: FreshContext): Response => {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
};

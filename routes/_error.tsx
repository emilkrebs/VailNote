import ErrorActions from '../islands/ErrorActions.tsx';
import { HttpError, PageProps } from 'fresh';
import Header from '../components/Header.tsx';
import { defaultLogger } from '../lib/logging.ts';
import { RateLimitResult } from '../lib/rate-limiting/src/rate-limit-headers.ts';

interface ErrorContent {
    title: string;
    subtitle: string;
    description: string;
    icon: string;
}

const httpErrorMessages: Record<number, ErrorContent> = {
    400: {
        title: 'Bad Request',
        subtitle: 'The request was invalid or cannot be served',
        description:
            'The request could not be understood by the server due to malformed syntax. Please check your request and try again.',
        icon: '🚫',
    },
    401: {
        title: 'Unauthorized',
        subtitle: 'Authentication is required and has failed or has not yet been provided',
        description: 'The request requires user authentication. Please provide valid credentials and try again.',
        icon: '🚫',
    },
    403: {
        title: 'Forbidden',
        subtitle: 'You do not have permission to access this resource',
        description:
            'You do not have the necessary permissions to access this resource. Please check your credentials and try again.',
        icon: '⛔',
    },
    404: {
        title: 'Not Found',
        subtitle: 'The requested resource could not be found',
        description:
            'The resource you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
        icon: '🔍',
    },
    500: {
        title: 'Internal Server Error',
        subtitle: 'The server encountered an unexpected condition',
        description:
            'The server encountered an internal error and was unable to complete your request. Please try again later.',
        icon: '💥',
    },
    502: {
        title: 'Bad Gateway',
        subtitle: 'The server received an invalid response from the upstream server',
        description:
            'The server was acting as a gateway or proxy and received an invalid response from the upstream server.',
        icon: '🌐',
    },
    429: {
        title: 'Too Many Requests',
        subtitle: 'You have sent too many requests in a given amount of time',
        description: 'You have exceeded the rate limit for requests. Please wait a moment before trying again.',
        icon: '⏳',
    },
};

export default function Error(props: PageProps) {
    const error = props.error as HttpError;
    const status = error.status || 500;
    const errorContent = httpErrorMessages[status] || {
        title: 'Something went wrong',
        subtitle: 'An unexpected error occurred',
        description:
            "We're experiencing technical difficulties. Our team has been notified and is working to fix the issue.",
        icon: '⚠️',
    };

    // Extract rate limit information for 429 errors
    let rateLimitResetTime: number | undefined;

    if (status === 429 && error.cause) {
        const rateLimitInfo = error.cause as RateLimitResult;
        rateLimitResetTime = rateLimitInfo.resetTime;
    }

    // log critical errors (500 and above)
    if (status >= 500) {
        defaultLogger.error(`Critical error occurred: ${status} - ${error.message}`);
    }

    return (
        <>
            <Header title='Error' description={`An error occurred: ${error.message || 'Unknown error'}`} />

            <main class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-8 md:py-16'>
                {/* Animated background elements */}
                <div class='absolute inset-0 overflow-hidden pointer-events-none'>
                    <div class='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-700/10 to-gray-900/10 rounded-full blur-3xl animate-pulse'>
                    </div>
                    <div
                        class='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-gray-600/10 to-gray-800/10 rounded-full blur-3xl animate-pulse'
                        style='animation-delay: 2s'
                    >
                    </div>
                    <div
                        class='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-gray-700/5 to-gray-900/5 rounded-full blur-3xl animate-pulse'
                        style='animation-delay: 4s'
                    >
                    </div>
                </div>

                <div class='relative z-10 max-w-2xl w-full'>
                    {/* Main error card */}
                    <div class='bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 md:p-12 shadow-2xl'>
                        {/* Header with icon and status */}
                        <div class='text-center mb-8'>
                            <div class='text-6xl md:text-8xl mb-4 animate-bounce'>
                                {errorContent.icon}
                            </div>

                            <div class='mb-4'>
                                <div class='inline-block text-sm font-mono text-gray-400 bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700/30'>
                                    Error {status}
                                </div>
                            </div>

                            <h1 class='text-3xl md:text-4xl font-bold text-white mb-3 leading-tight'>
                                {errorContent.title}
                            </h1>

                            <p class='text-xl text-gray-300 mb-6 leading-relaxed'>
                                {errorContent.subtitle}
                            </p>

                            <p class='text-gray-400 leading-relaxed max-w-lg mx-auto'>
                                {errorContent.description}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div class='flex justify-center'>
                            <ErrorActions
                                status={status}
                                showRetryCountdown={status === 429 && rateLimitResetTime !== undefined}
                                resetTime={rateLimitResetTime}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div class='text-center mt-8'>
                        <p class='text-gray-200 text-sm'>
                            Powered by <span class='text-white font-medium'>VailNote</span>
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}

import ErrorActions from '../islands/ErrorActions.tsx';
import { HttpError, PageProps } from 'fresh';
import Header from '../components/Header.tsx';
import PageShell from '../components/PageShell.tsx';
import HomeButton from '../components/HomeButton.tsx';
import { defaultLogger } from '../lib/logging.ts';
import { RateLimitResult } from '../lib/rate-limiting/src/rate-limit-headers.ts';
import {
    ClockCountdownIcon,
    CloudSlashIcon,
    IconProps,
    LockKeyIcon,
    MagnifyingGlassIcon,
    WarningIcon,
} from '../components/Icons.tsx';
import { JSX } from 'preact';

interface ErrorContent {
    title: string;
    description: string;
    icon: (props: IconProps) => JSX.Element;
}

const httpErrorMessages: Record<number, ErrorContent> = {
    400: {
        title: 'Bad request',
        description:
            'The request could not be understood by the server due to malformed syntax. Please check your request and try again.',
        icon: WarningIcon,
    },
    401: {
        title: 'Unauthorized',
        description: 'This request requires authentication. Please provide valid credentials and try again.',
        icon: LockKeyIcon,
    },
    403: {
        title: 'Forbidden',
        description:
            'You do not have the necessary permissions to access this resource. Please check your credentials and try again.',
        icon: LockKeyIcon,
    },
    404: {
        title: 'Not found',
        description:
            'This page or note does not exist. A note link may have already been read and destroyed, or it may have expired.',
        icon: MagnifyingGlassIcon,
    },
    429: {
        title: 'Too many requests',
        description: 'You have exceeded the rate limit for requests. Please wait a moment before trying again.',
        icon: ClockCountdownIcon,
    },
    500: {
        title: 'Internal server error',
        description:
            'The server encountered an internal error and was unable to complete your request. Please try again later.',
        icon: WarningIcon,
    },
    502: {
        title: 'Bad gateway',
        description: 'The server received an invalid response from the upstream server. Please try again later.',
        icon: CloudSlashIcon,
    },
};

export default function Error(props: PageProps) {
    const error = props.error as HttpError;
    const status = error.status || 500;
    const errorContent = httpErrorMessages[status] || {
        title: 'Something went wrong',
        description:
            "We're experiencing technical difficulties. Our team has been notified and is working to fix the issue.",
        icon: WarningIcon,
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

    const StatusIcon = errorContent.icon;

    return (
        <>
            <Header title='Error' description={`An error occurred: ${error.message || 'Unknown error'}`} />

            <PageShell>
                <div class='flex flex-col items-center gap-5 py-10 text-center'>
                    <span class='flex size-14 items-center justify-center rounded-control bg-accent-soft text-accent-bright'>
                        <StatusIcon size={28} />
                    </span>

                    <div>
                        <p class='font-mono text-sm text-faint'>HTTP {status}</p>
                        <h1 class='mt-2 text-3xl font-bold tracking-tight sm:text-4xl'>
                            {errorContent.title}
                        </h1>
                        <p class='mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted'>
                            {errorContent.description}
                        </p>
                    </div>

                    <ErrorActions
                        status={status}
                        showRetryCountdown={status === 429 && rateLimitResetTime !== undefined}
                        resetTime={rateLimitResetTime}
                    />

                    <HomeButton />
                </div>
            </PageShell>
        </>
    );
}

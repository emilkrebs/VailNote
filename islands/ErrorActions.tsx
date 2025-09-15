import { useEffect, useState } from 'preact/hooks';

interface ErrorActionsProps {
    status: number;
    showRetryCountdown?: boolean;
    retryDelay?: number;
}

export default function ErrorActions({ status, showRetryCountdown, retryDelay = 3000 }: ErrorActionsProps) {
    const [countdown, setCountdown] = useState(retryDelay / 1000);

    useEffect(() => {
        if (showRetryCountdown && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (showRetryCountdown && countdown === 0) {
            globalThis.location.reload();
        }
    }, [countdown, showRetryCountdown]);

    const handleGoBack = () => {
        if (globalThis.history?.length > 1) {
            globalThis.history.back();
        } else {
            globalThis.location.href = '/';
        }
    };

    const handleReload = () => {
        globalThis.location.reload();
    };

    const handleGoHome = () => {
        globalThis.location.href = '/';
    };

    if (status === 429) {
        return (
            <div class='flex flex-col gap-4 items-center'>
                {showRetryCountdown && countdown > 0 && (
                    <div class='text-center'>
                        <p class='text-gray-400 mb-2'>Automatically retrying in</p>
                        <div class='text-3xl font-mono text-blue-400 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700'>
                            {countdown}s
                        </div>
                    </div>
                )}

                <div class='flex gap-3'>
                    <button
                        type='button'
                        onClick={handleGoBack}
                        class='px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white font-medium rounded-lg transition-colors'
                    >
                        Go Back
                    </button>

                    <button
                        type='button'
                        onClick={handleReload}
                        class='px-6 py-3 bg-blue-600/50 hover:bg-blue-600/70 text-white font-medium rounded-lg transition-colors border border-blue-500/30'
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (status === 500) {
        return (
            <div class='flex gap-3'>
                <button
                    type='button'
                    onClick={handleGoHome}
                    class='px-6 py-3 bg-blue-600/50 hover:bg-blue-600/70 text-white font-medium rounded-lg transition-colors border border-blue-500/30'
                >
                    Go Home
                </button>

                <button
                    type='button'
                    onClick={handleReload}
                    class='px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white font-medium rounded-lg transition-colors'
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Default actions for other errors (like 404)
    return (
        <div class='flex gap-3'>
            <button
                type='button'
                onClick={handleGoHome}
                class='px-6 py-3 bg-blue-600/50 hover:bg-blue-600/70 text-white font-medium rounded-lg transition-colors border border-blue-500/30'
            >
                Go Home
            </button>

            <button
                type='button'
                onClick={handleGoBack}
                class='px-6 py-3 bg-gray-600/50 hover:bg-gray-600/70 text-white font-medium rounded-lg transition-colors'
            >
                Go Back
            </button>
        </div>
    );
}

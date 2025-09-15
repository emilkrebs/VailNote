import { useEffect, useState } from 'preact/hooks';

interface ErrorActionsProps {
    status: number;
    showRetryCountdown?: boolean;
    resetTime?: number; // Unix timestamp when rate limit resets
    retryAfterSeconds?: number; // Seconds to wait before retry
}

// TODO: Improve countdown accuracy by relying solely on resetTime and removing retryAfterSeconds
export default function ErrorActions({ status, showRetryCountdown, resetTime }: ErrorActionsProps) {
    // Calculate initial countdown from resetTime or use retryAfterSeconds as fallback
    const getInitialCountdown = () => {
        if (resetTime) {
            return Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
        }
        return 60; // Default to 60 seconds if no info available
    };

    const [countdown, setCountdown] = useState(getInitialCountdown);

    useEffect(() => {
        if (showRetryCountdown && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown((prev) => {
                    if (resetTime) {
                        // Recalculate based on actual reset time for accuracy
                        return Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
                    }
                    return Math.max(0, prev - 1);
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown, showRetryCountdown, resetTime]);

    if (status === 429) {
        const totalWaitTime = 60;
        const progress = totalWaitTime > 0 ? ((totalWaitTime - countdown) / totalWaitTime) * 100 : 100;

        return (
            <div class='flex flex-col gap-6 items-center'>
                {showRetryCountdown && countdown > 0 && (
                    <div class='text-center'>
                        <p class='text-gray-400 mb-3'>Rate limit resets in</p>

                        {/* Countdown display */}
                        <div class='text-4xl font-mono text-orange-400 bg-gray-800/50 px-6 py-4 rounded-lg border border-gray-700 mb-3'>
                            {countdown}s
                        </div>

                        {/* Progress bar */}
                        <div class='w-64 bg-gray-700 rounded-full h-2 mb-3'>
                            <div
                                class='bg-gradient-to-r from-orange-500 to-yellow-500 h-2 rounded-full transition-all duration-1000 ease-linear'
                                style={`width: ${progress}%`}
                            >
                            </div>
                        </div>
                    </div>
                )}

                {showRetryCountdown && countdown === 0 && (
                    <div class='text-center'>
                        <div class='text-3xl mb-2'>✅</div>
                        <p class='text-green-400 mb-2 font-medium'>Rate limit has been reset!</p>
                        <p class='text-gray-500 text-sm'>You can now try your request again.</p>
                    </div>
                )}
            </div>
        );
    }
}

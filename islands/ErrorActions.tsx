import { useEffect, useState } from 'preact/hooks';
import { CheckCircleIcon } from '../components/Icons.tsx';

interface ErrorActionsProps {
    status: number;
    showRetryCountdown?: boolean;
    resetTime?: number; // Unix timestamp when rate limit resets
}

// TODO: Improve countdown accuracy by relying solely on resetTime and removing retryAfterSeconds
export default function ErrorActions({ status, showRetryCountdown, resetTime }: ErrorActionsProps) {
    // Calculate initial countdown from resetTime or use a sane default
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

    if (status !== 429) return null;

    return (
        <div class='flex flex-col items-center gap-2' role='status'>
            {showRetryCountdown && countdown > 0 && (
                <>
                    <p class='text-sm text-muted'>Rate limit resets in</p>
                    <p class='rounded-control border border-line-strong bg-surface px-6 py-3 font-mono text-3xl font-semibold tabular-nums text-ink'>
                        {countdown}s
                    </p>
                </>
            )}

            {showRetryCountdown && countdown === 0 && (
                <p class='flex items-center gap-2 font-medium text-ok'>
                    <CheckCircleIcon size={20} />
                    You can try your request again now.
                </p>
            )}
        </div>
    );
}

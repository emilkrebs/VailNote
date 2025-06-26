interface MessageProps {
    message?: string;
    type?: 'success' | 'error' | 'info';
}

export default function Message({ message, type = 'info' }: MessageProps) {
    return (
        <>
            {message && (
                <div
                    class={`p-4 rounded-lg border transition-all ${type === 'success'
                            ? 'bg-green-600/20 border-green-400 text-green-200'
                            : type === 'error'
                            ? 'bg-red-600/20 border-red-400 text-red-200'
                            : 'bg-blue-600/20 border-blue-400 text-blue-200'
                        }`}
                >
                    <span class='font-medium'>{message}</span>
                </div>
            )}
        </>
    );
}

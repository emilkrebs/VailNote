import SiteHeader from './SiteHeader.tsx';

interface LoadingPageProps {
    title?: string;
    message?: string;
}

export default function LoadingPage({ title, message }: LoadingPageProps) {
    return (
        <div class='flex flex-col items-center justify-center min-h-screen h-full w-full background-animate text-white py-16'>
            <SiteHeader />
            <div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
                <div class='flex flex-col items-center mt-6 p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
                    {/* Animated spinner */}
                    <div class='relative mb-8'>
                        <div class='w-16 h-16 border-4 border-gray-600 border-t-blue-400 border-r-blue-400 rounded-full animate-spin'>
                        </div>
                        <div class='absolute inset-2 w-12 h-12 border-2 border-gray-700 border-b-purple-400 border-l-purple-400 rounded-full animate-spin animate-reverse'>
                        </div>
                        <div class='absolute inset-4 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse'>
                        </div>
                    </div>

                    {/* Loading text */}
                    <div class='text-center'>
                        <h2 class='text-2xl font-bold text-white mb-2'>{title || 'Loading'}</h2>
                        <p class='text-gray-300 text-sm'>
                            {message || 'Please wait...'}
                        </p>
                    </div>

                    {/* Progress dots */}
                    <div class='flex space-x-2 mt-6'>
                        <div class='w-2 h-2 bg-blue-400 rounded-full animate-bounce'></div>
                        <div class='w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.1s]'></div>
                        <div class='w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]'></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

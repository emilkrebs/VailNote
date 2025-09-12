export default function ErrorPage({ message }: { message: string }) {
    return (
        <div class='flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4'>
            <h1 class='text-4xl font-bold text-red-600 mb-4'>Error</h1>
            <p class='text-lg text-gray-700'>{message}</p>
            <a href='/' class='mt-6 text-blue-500 hover:underline'>
                Return to Home
            </a>
        </div>
    );
}

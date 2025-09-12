import { Head } from 'fresh/runtime';
import HomeButton from '../components/HomeButton.tsx';
import { HttpError, PageProps } from 'fresh';

export default function ErrorPage(props: PageProps) {
    const error = props.error; // Contains the thrown Error or HTTPError

    if (error instanceof HttpError) {
        const status = error.status;

        if (status === 404) {
            return (
                <>
                    <Head>
                        <title>404 - Page not found</title>
                    </Head>
                    <div class='flex flex-col items-center justify-center min-h-screen h-full w-full background-animate text-white py-16'>
                        <h1 class='text-6xl font-bold mb-4'>404</h1>
                        <h2 class='text-3xl font-bold mb-2'>Page Not Found</h2>
                        <p class='text-lg text-center text-gray-300 mb-8'>
                            Sorry, the page you are looking for does not exist or has been removed.
                        </p>
                        <HomeButton />
                    </div>
                </>
            );
        }
    }
    return (
        <>
            <Head>
                <title>Error</title>
            </Head>
            <div class='flex flex-col items-center justify-center min-h-screen h-full w-full background-animate text-white py-16'>
                <h1 class='text-6xl font-bold mb-4'>Error</h1>
                <h2 class='text-3xl font-bold mb-2'>Something went wrong</h2>
                <p class='text-lg text-center text-gray-300 mb-8'>
                    {error instanceof Error ? error.message : 'An unexpected error occurred.'}
                </p>
                <HomeButton />
            </div>
        </>
    );
}

import { HttpError } from 'fresh';
import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';
import { CSS, render } from '@deno/gfm';

export default async function Privacy() {
    const rawMarkdown = await Deno.readTextFile('./PRIVACY.md');
    if (!rawMarkdown) {
        throw new HttpError(404);
    }

    return (
        <>
            <Header title='Privacy Policy' />
            <style>
                {CSS}
            </style>
            <div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
                <h1 class='text-4xl text-center font-bold mb-2'>Privacy Policy</h1>
                <p class='mt-2 text-base sm:text-lg text-center text-gray-200'>
                    Your privacy and security are our top priorities.
                </p>
                <div class='flex items-center justify-center w-full max-w-screen-md mx-auto px-2 sm:px-4 py-8 gap-8'>
                    <div class='flex flex-col gap-4 p-4 sm:p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600'>
                        <div
                            class='markdown-body'
                            // deno-lint-ignore react-no-danger
                            dangerouslySetInnerHTML={{ __html: render(rawMarkdown) }}
                        />

                        <HomeButton />
                    </div>
                </div>
            </div>
        </>
    );
}

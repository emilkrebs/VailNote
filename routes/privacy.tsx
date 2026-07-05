import { HttpError } from 'fresh';
import Header from '../components/Header.tsx';
import PageShell from '../components/PageShell.tsx';
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
            <PageShell width='wide'>
                <h1 class='text-title'>Privacy Policy</h1>
                <p class='mt-3 text-[1.0625rem] leading-relaxed text-muted'>
                    Your privacy and security are our top priorities.
                </p>
                <article class='mt-8 rounded-panel border border-line bg-surface p-5 sm:p-10'>
                    <div
                        data-color-mode='dark'
                        data-dark-theme='dark'
                        class='markdown-body'
                        // deno-lint-ignore react-no-danger
                        dangerouslySetInnerHTML={{ __html: render(rawMarkdown) }}
                    />
                </article>
            </PageShell>
        </>
    );
}

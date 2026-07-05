import Card, { CardContent } from './Card.tsx';
import PageShell from './PageShell.tsx';

interface LoadingPageProps {
    title?: string;
    message?: string;
}

export default function LoadingPage({ title, message }: LoadingPageProps) {
    return (
        <PageShell>
            <Card>
                <CardContent class='flex flex-col items-center gap-4 pt-10 pb-10 text-center'>
                    <div
                        class='size-10 rounded-full border-2 border-line-strong border-t-accent animate-spin motion-reduce:hidden'
                        aria-hidden='true'
                    >
                    </div>
                    <div role='status'>
                        <h2 class='text-xl font-bold tracking-tight'>{title || 'Loading'}</h2>
                        <p class='mt-1 text-sm text-muted'>{message || 'Please wait a moment.'}</p>
                    </div>
                </CardContent>
            </Card>
        </PageShell>
    );
}

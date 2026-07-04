import Card, { CardContent } from './Card.tsx';
import HomeButton from './HomeButton.tsx';
import PageShell from './PageShell.tsx';
import { WarningIcon } from './Icons.tsx';

export default function ErrorPage({ message }: { message: string }) {
    return (
        <PageShell>
            <Card>
                <CardContent class='flex flex-col items-center gap-4 pt-10 pb-10 text-center'>
                    <span class='flex size-12 items-center justify-center rounded-control bg-danger-soft text-danger'>
                        <WarningIcon size={24} />
                    </span>
                    <div>
                        <h1 class='text-xl font-bold tracking-tight'>Something went wrong</h1>
                        <p class='mt-1 max-w-md text-[0.9375rem] leading-relaxed text-muted'>{message}</p>
                    </div>
                    <HomeButton class='mt-2' />
                </CardContent>
            </Card>
        </PageShell>
    );
}

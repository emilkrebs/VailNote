import { type PageProps } from 'fresh';
import Footer from '../components/Footer.tsx';
import Header from '../components/Header.tsx';
import SiteHeader from '../components/SiteHeader.tsx';

export default function App({ Component }: PageProps) {
    return (
        <html lang='en'>
            <Header />
            <body>
                <a
                    href='#main-content'
                    class='sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:border focus:border-line-strong focus:bg-raised focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-ink'
                >
                    Skip to content
                </a>
                <SiteHeader />
                <Component />
                <Footer />
            {/* impeccable-live-start */}
<script src="http://localhost:8401/live.js?token=946c914a-91d2-4ea5-b47f-343df63b6686"></script>
{/* impeccable-live-end */}
</body>
        </html>
    );
}

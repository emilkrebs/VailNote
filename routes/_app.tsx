import { type PageProps } from 'fresh';
import Footer from '../components/Footer.tsx';
import Header from '../components/Header.tsx';
import SiteHeader from '../components/SiteHeader.tsx';

export default function App({ Component }: PageProps) {
    return (
        <html lang='en'>
            <Header />
            <body>
                <SiteHeader />
                <Component />
                <Footer />
            </body>
        </html>
    );
}

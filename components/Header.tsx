const defaultDescription =
    'VailNote - Open-source, encrypted note sharing with end-to-end encryption, self-destructing notes, and privacy-preserving rate limiting. Share secure notes that automatically delete after viewing.';

interface HeadProps {
    title?: string;
    description?: string;
    canonicalUrl?: string;
}

function OpenGraphMeta({ title, description, canonicalUrl }: HeadProps) {
    const ogTitle = title || 'VailNote';
    const ogDescription = description || defaultDescription;
    const ogImage = '/logo.png';
    const ogUrl = canonicalUrl || 'https://vailnote.com';

    return (
        <>
            <meta name='viewport' content='width=device-width, initial-scale=1' />
            <meta name='theme-color' content='#2563eb' />
            <meta name='description' content={ogDescription} />

            {/* SEO Meta Tags */}
            <meta
                name='keywords'
                content='secure notes, encrypted notes, privacy, open source, self-destructing notes, ephemeral messages, secure sharing, end-to-end encryption, anonymous sharing, temporary notes'
            />
            <meta name='author' content='Emil Krebs' />
            <meta name='creator' content='VailNote' />
            <meta name='publisher' content='VailNote' />
            <meta name='application-name' content='VailNote' />
            <meta name='generator' content='Fresh Framework' />
            <meta name='rating' content='general' />
            <meta name='distribution' content='global' />
            <meta name='language' content='English' />
            <meta name='classification' content='Security Software' />
            <meta name='category' content='Privacy,Security,Open Source' />

            {/* Open Graph / Facebook */}
            <meta property='og:type' content='website' />
            <meta property='og:url' content={ogUrl} />
            <meta property='og:title' content={ogTitle} />
            <meta property='og:description' content={ogDescription} />
            <meta property='og:image' content={ogImage} />
            <meta property='og:image:width' content='512' />
            <meta property='og:image:height' content='512' />
            <meta property='og:image:type' content='image/png' />
            <meta property='og:image:alt' content='VailNote - Secure Note Sharing Logo' />
            <meta property='og:site_name' content='VailNote' />
            <meta property='og:locale' content='en_US' />

            {/* Twitter Card tags */}
            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:url' content={ogUrl} />
            <meta name='twitter:title' content={ogTitle} />
            <meta name='twitter:description' content={ogDescription} />
            <meta name='twitter:image' content={ogImage} />
            <meta name='twitter:image:alt' content='VailNote - Secure Note Sharing Logo' />
            <meta name='twitter:creator' content='@emilkrebs' />
            <meta name='twitter:site' content='@emilkrebs' />

            {/* Apple Meta Tags */}
            <meta name='apple-mobile-web-app-capable' content='yes' />
            <meta name='apple-mobile-web-app-status-bar-style' content='black-translucent' />
            <meta name='apple-mobile-web-app-title' content='VailNote' />

            {/* Additional SEO */}
            <meta
                name='robots'
                content='index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
            />
            <meta name='googlebot' content='index, follow' />
            <meta name='bingbot' content='index, follow' />

            {/* Security and Privacy */}
            <meta http-equiv='Referrer-Policy' content='strict-origin-when-cross-origin' />

            {/* Performance - DNS prefetch for other domains */}
            <meta http-equiv='x-dns-prefetch-control' content='on' />
        </>
    );
}

export default function Header({ title, description, canonicalUrl }: HeadProps) {
    const pageTitle = title ? `VailNote - ${title}` : 'VailNote - Secure Encrypted Note Sharing';
    const finalCanonicalUrl = canonicalUrl || 'https://vailnote.com';

    return (
        <head>
            <meta charset='utf-8' />
            <title>{pageTitle}</title>

            <link rel='icon' href='/favicon.ico' />
            <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
            <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />

            {/* Apple Touch Icons */}
            <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
            <link rel='apple-touch-icon' href='/web-app-manifest-192x192.png' />
            <link rel='apple-touch-icon' href='/web-app-manifest-512x512.png' />

            <link rel='canonical' href={finalCanonicalUrl} />
            <link rel='manifest' href='/site.webmanifest' />

            {/* SEO and Social Media Meta Tags */}
            <OpenGraphMeta title={title} description={description} canonicalUrl={canonicalUrl} />
        </head>
    );
}

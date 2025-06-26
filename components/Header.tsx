const defaultDescription = 'VailNote - Transparent, Secure, Open-Source';

interface HeadProps {
	title?: string;
	description?: string;
}

function OpenGraphMeta({ title, description }: HeadProps) {
	return (
		<>
			<meta name='viewport' content='width=device-width, initial-scale=1' />
			<meta name='theme-color' content='#000000' />
			<meta name='description' content={description || defaultDescription} />
			<meta property='og:title' content={title || 'VailNote'} />
			<meta property='og:description' content={description || defaultDescription} />
			<meta property='og:url' content='https://vailnote.com' />
			<meta property='og:type' content='website' />
			<meta property='og:image' content='/logo.png' />
			<meta property='og:image:alt' content='VailNote Logo' />
			<meta name='robots' content='index, follow' />
		</>
	);
}

export default function Header({ title, description }: HeadProps) {
	return (
		<head>
			<meta charset='utf-8' />
			<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			<title>VailNote {title ? `- ${title}` : ''}</title>
			<link rel='stylesheet' href='/styles.css' />
			<link rel='icon' href='/favicon.ico' />
			<link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
			<link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />
			<link rel='apple-touch-icon' href='/apple-touch-icon.png' />
			<link rel='canonical' href='https://vailnote.com' />
			<OpenGraphMeta title={title} description={description} />
		</head>
	);
}

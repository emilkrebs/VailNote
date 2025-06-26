interface HeadProps {
	title?: string;
	description?: string;
}

export default function Header({ title, description }: HeadProps) {
	return (
		<head>
			<meta charset='utf-8' />
			<meta name='viewport' content='width=device-width, initial-scale=1.0' />
			<title>VailNote {title ? `- ${title}` : ''}</title>
			<link rel='stylesheet' href='/styles.css' />
			{description && <meta name='description' content={description} />}
		</head>
	);
}

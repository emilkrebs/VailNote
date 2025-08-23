import { RouteConfig, type PageProps } from '$fresh/server.ts';
import Footer from '../components/Footer.tsx';
import Header from '../components/Header.tsx';

export default function App({ Component }: PageProps) {
	return (
		<html lang='en'>
			<Header />
			<body>
				<Component />
				<Footer />
			</body>
		</html>
	);
}

export const config: RouteConfig = {
	csp: true,
};
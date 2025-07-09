import { Head } from '$fresh/runtime.ts';
import HomeButton from '../components/HomeButton.tsx';

export default function Error404() {
	return (
		<>
			<Head>
				<title>404 - Page not found</title>
			</Head>
			<div class='flex flex-col items-center justify-center min-h-screen h-full w-full background-animate text-white py-16'>
				<h1 class='text-6xl font-bold mb-4'>404</h1>
				<h2 class='text-3xl font-bold mb-2'>Page Not Found</h2>
				<p class='text-lg text-center text-gray-300 mb-8'>
					Sorry, the page you are looking for does not exist or has been removed.
				</p>
				<HomeButton />
			</div>
		</>
	);
}

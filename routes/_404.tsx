import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16">
        <h1 class="text-6xl font-bold mb-4">404</h1>
        <h2 class="text-3xl font-bold mb-2">Page Not Found</h2>
        <p class="text-lg text-gray-300 mb-8">
          Sorry, the page you are looking for does not exist or has been removed.
        </p>
        <a
          href="/"
          class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition"
        >
          Go Home
        </a>
      </div>
    </>
  );
}

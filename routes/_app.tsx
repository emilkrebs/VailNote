import { type PageProps } from "$fresh/server.ts";
import Footer from "../components/Footer.tsx";
import Header from "../components/Header.tsx";
export default function App({ Component }: PageProps) {
  return (
    <html>
      <Header />
      <body>
        <Component />
        <Footer />
      </body>
    </html>
  );
}

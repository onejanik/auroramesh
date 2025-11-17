import type { AppProps } from 'next/app';
import Head from 'next/head';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0b0c10" />
        <link rel="icon" href="/logo.svg" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}


import { useEffect } from 'react';
import Head from 'next/head';
import { AuthProvider } from '../hooks/useAuth';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>MoneyMuse</title>
        <meta name="description" content="Track and manage your personal finances with ease. Monitor income, expenses, and analyze spending patterns." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/budget.png" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://MoneyMuse.com/" />
        <meta property="og:title" content="Personal Finance Assistant" />
        <meta property="og:description" content="Track and manage your personal finances with ease" />
        
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content="Personal Finance Assistant" />
        <meta property="twitter:description" content="Track and manage your personal finances with ease" />
      </Head>
      
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </AuthProvider>
    </>
  );
}

export default MyApp;
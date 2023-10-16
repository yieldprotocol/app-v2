import Document, { Html, Head, Main, NextScript } from 'next/document';

function randomNonce(length = 32) {
  let nonce = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
      nonce += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return nonce;
}

export default class MyDocument extends Document {
  render() {
    const nonce = randomNonce();
    const csp = `object-src 'none'; base-uri 'none'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http: 'nonce-${nonce}' 'strict-dynamic'`

    return (
      <Html>
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,700;0,900;1,100;1,400;1,700;1,900&display=optional"
            rel="stylesheet"
          />
          <link rel="shortcut icon" href="/favicons/favicon.ico" />
          <meta httpEquiv="Content-Security-Policy" content={csp} />
          <meta httpEquiv='X-Frame-Options' content='DENY' />
        </Head>
        <body>
          <Main />
          <NextScript nonce={nonce} />
        </body>
      </Html>
    );
  }
}

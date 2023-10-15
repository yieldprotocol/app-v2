import Document, { Html, Head, Main, NextScript } from 'next/document';

const randomBytes = (count:number):string => {
	const result = Array(count);
  	for (let i = 0; i < count; ++i) {
    	result[i] = Math.floor(256 * Math.random());
    }
  	return result.toString();
};


export default class MyDocument extends Document {
  render() {

    const nonce = randomBytes(64);
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
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

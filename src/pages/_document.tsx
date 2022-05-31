import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,400;0,700;0,900;1,100;1,400;1,700;1,900&display=optional"
            rel="stylesheet"
          />
          <link rel="shortcut icon" href="/favicons/favicon.ico" />
        </Head>
        <body>
          <script
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: `
          function getColorScheme() {
            if (JSON.parse(localStorage.getItem('autoTheme'))) {
              return window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            } else {
              return JSON.parse(localStorage.getItem('darkMode')) ? 'dark' : 'light'
            }
          }
          document.body.dataset.theme = getColorScheme();
        `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

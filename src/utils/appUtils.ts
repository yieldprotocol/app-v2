export const copyToClipboard = (str:string) => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

/* log to console + any extra action required, extracted  */
export const toLog = (message: string, type: string = 'info') => {
  // eslint-disable-next-line no-console
  console.log(message);
};

/* creates internal tracking code of a transaction type */
export const genTxCode = (txType: string, series:string|null) => `${txType}${series || ''}`;

// /* google analytics log event */
// export const analyticsLogEvent = (eventName: string, eventParams: any ) => {
//   if (eventName) {
//     try {
//     window?.gtag('event', eventName, eventParams);
//     } catch (e) {
//       // eslint-disable-next-line no-console
//       console.log(e);
//     }
//   }
// };

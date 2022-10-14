import { useContext, useEffect, useMemo } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { GA_Event, GA_Properties, GA_View } from '../types/analytics';
import { useRouter } from 'next/router';

const useAnalytics = () => {
  /* get the chainId */
  const {
    chainState: {
      connection: { chainId },
    },
  } = useContext(ChainContext);

  /* get path from router */
  const { asPath } = useRouter();
  const viewArr = asPath.substring(1).split('/', 2);

  const getView = () => {
    if (viewArr[0] === 'pool' || viewArr[0] === 'poolposition') return GA_View.POOL;
    if (viewArr[0] === 'borrow' || viewArr[0] === 'vaultposition') return GA_View.BORROW;
    if (viewArr[0] === 'lend' || viewArr[0] === 'lendposition') return GA_View.LEND;
    if (viewArr[0] === 'dashboard') return GA_View.DASHBOARD;
    return GA_View.GENERAL;
  };

  /* Google analytics log event */
  const logAnalyticsEvent = (eventName: GA_Event, eventProps: any) => {
    if (eventName && process.env.ENV != 'development') {
      try {
        window?.gtag('event', eventName, {
          ...eventProps,
          chain_id: chainId,
          view: eventProps.view || getView(), // if no view is provided, try to get it
          view_id: viewArr[1] || '-',
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    } else {
      console.log( 
        ' DEV_ANALYTICS ::: ', [ eventName, eventProps,eventProps.view || getView(), viewArr[1] || '-' ]
      );
    }
  };

  return { logAnalyticsEvent };
};

export default useAnalytics;

import { useContext } from 'react';
import { ChainContext } from '../contexts/ChainContext';
import { GA_Event } from '../types/analytics';

const useAnalytics = () => { 

  const {
    chainState: {
      connection: { chainId },
    },
  } = useContext(ChainContext);
  
  /* Google analytics log event */
const logAnalyticsEvent= (eventName: GA_Event, eventProps: any ) => {
  if (eventName && process.env.ENV != 'development') {
    try {
      console.log(eventName, ' event logged');
      window?.gtag('event', eventName, { ...eventProps , chain_id: chainId} );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
};

return { logAnalyticsEvent };

};

export default useAnalytics;

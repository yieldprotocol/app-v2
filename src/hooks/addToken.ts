import { useContext, useEffect, useState } from 'react';
import { ChainContext } from '../contexts/ChainContext';

export const addToken = () => {
  const tokenAddress = '0xd00981105e61274c8a5cd5a88fe7e037d935b513';
  const tokenSymbol = 'TUT';
  const tokenDecimals = 18;
  const tokenImage = 'http://placekitten.com/200/300';

  const { chainState: provider } = useContext(ChainContext);
  const [tokenAddedData, setTokenAddedData] = useState<any>(null);

  useEffect(() => {
    console.log(provider);
    setTokenAddedData({ tokenAddress, tokenSymbol, tokenDecimals, tokenImage });
    try {
      // wasAdded is a boolean. Like any RPC method, an error may be thrown.
      // const wasAdded = await ethereum.request({
      //   method: 'wallet_watchAsset',
      //   params: {
      //     type: 'ERC20', // Initially only supports ERC20, but eventually more!
      //     options: {
      //       address: tokenAddress, // The address that the token is at.
      //       symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
      //       decimals: tokenDecimals, // The number of decimals in the token
      //       image: tokenImage, // A string url of the token logo
      //     },
      //   },
      // });
      // if (wasAdded) {
      //   console.log('Thanks for your interest!');
      // } else {
      //   console.log('Your loss!');
      // }
      setTokenAddedData({ tokenAddress, tokenSymbol, tokenDecimals, tokenImage, error: false, success: true });
    } catch (error) {
      console.log(error);
      setTokenAddedData({ tokenAddress, tokenSymbol, tokenDecimals, tokenImage, error: true, success: false });
    }
  }, [provider, tokenAddress, tokenDecimals, tokenSymbol, tokenImage]);

  return [tokenAddedData, setTokenAddedData];
};

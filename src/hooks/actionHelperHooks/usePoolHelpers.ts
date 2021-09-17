import { useContext, useEffect, useState } from 'react';
import { ethers, BigNumber } from 'ethers';
import { UserContext } from '../../contexts/UserContext';
import { ChainContext } from '../../contexts/ChainContext';
import { IAsset, IStrategy } from '../../types';
import { cleanValue } from '../../utils/appUtils';

export const usePoolHelpers = (input: string | undefined) => {
  /* STATE FROM CONTEXT */
  const {
    userState: { selectedStrategyAddr, strategyMap, assetMap, activeAccount },
  } = useContext(UserContext);

  const strategy: IStrategy | undefined = strategyMap?.get(selectedStrategyAddr);
  const strategyBase: IAsset | undefined = assetMap?.get(strategy?.baseId);

  /* LOCAL STATE */
  const [poolPercentPreview, setPoolPercentPreview] = useState<string | undefined>();
  const [poolTokenPreview, setPoolTokenPreview] = useState<string | undefined>(input);
  const [maxPool, setMaxPool] = useState<string | undefined>();

  /* SET MAX VALUES */
  useEffect(() => {
    if (activeAccount) {
      /* Checks asset selection and sets the max available value */
      (async () => {
        const max = await strategyBase?.getBalance(activeAccount);
        if (max) setMaxPool(ethers.utils.formatUnits(max, strategyBase?.decimals).toString());
      })();
    }
  }, [input, activeAccount, strategyBase]);

  useEffect(() => {
    if (input && strategy) {
      console.log(strategy);
      // update the below to get an actual estimated token value based on the input
      const _poolTokenPreview = BigNumber.from(ethers.utils.parseUnits(input, strategy.decimals));

      console.log(BigNumber.from('100').div(strategy?.strategyTotalSupply!));
      const _poolPercentPreview = cleanValue(
        _poolTokenPreview.div(strategy?.strategyTotalSupply!).mul(100).toString(),
        2
      );
      setPoolPercentPreview(_poolPercentPreview);
    }
  }, [input, strategy, strategyBase]);

  return { maxPool, poolTokenPreview, poolPercentPreview };
};

import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, RadioButtonGroup, ResponsiveContext, Text, TextInput } from 'grommet';

import { ethers } from 'ethers';

import { FiSquare, FiClock, FiTrendingUp, FiPercent, FiInfo } from 'react-icons/fi';
import { BiCoinStack, BiMessageSquareAdd } from 'react-icons/bi';
import { cleanValue, getTxCode, nFormatter } from '../utils/appUtils';
import AssetSelector from '../components/selectors/AssetSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, IUserContext } from '../types';
import { usePool, usePoolActions } from '../hooks/poolHooks';
import { useTx } from '../hooks/useTx';
import MaxButton from '../components/buttons/MaxButton';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import StepperText from '../components/StepperText';
import PositionSelector from '../components/selectors/PositionSelector';
import ActiveTransaction from '../components/ActiveTransaction';
import YieldInfo from '../components/YieldInfo';
import YieldLiquidity from '../components/YieldLiquidity';
import BackButton from '../components/buttons/BackButton';
import YieldMark from '../components/logos/YieldMark';
import NextButton from '../components/buttons/NextButton';
import TransactButton from '../components/buttons/TransactButton';
import { useInputValidation } from '../hooks/inputValidationHook';
import AltText from '../components/texts/AltText';
import PositionListItem from '../components/PositionItem';

function Pool() {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, seriesMap, selectedSeriesId, selectedBaseId } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */
  const [poolInput, setPoolInput] = useState<string | undefined>(undefined);
  const [maxPool, setMaxPool] = useState<string | undefined>();

  const [poolDisabled, setPoolDisabled] = useState<boolean>(true);

  const [strategy, setStrategy] = useState<'BUY' | 'MINT'>('BUY');

  const [stepPosition, setStepPosition] = useState<number>(0);

  /* HOOK FNS */
  const { addLiquidity } = usePoolActions();
  const { poolMax } = usePool(poolInput);
  /* input validation hooks */
  const { inputError: poolError } = useInputValidation(poolInput, ActionCodes.ADD_LIQUIDITY, selectedSeries, [
    0,
    maxPool,
  ]);

  const { tx: poolTx, resetTx } = useTx(ActionCodes.ADD_LIQUIDITY, selectedSeries?.id);

  /* LOCAL ACTION FNS */
  const handleAdd = () => {
    // !poolDisabled &&
    selectedSeries && addLiquidity(poolInput!, selectedSeries, strategy);
  };

  const resetInputs = () => {
    setPoolInput(undefined);
    setStepPosition(0);
    resetTx();
  };

  /* SET MAX VALUES */
  useEffect(() => {
    if (activeAccount) {
      /* Checks asset selection and sets the max available value */
      (async () => {
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxPool(ethers.utils.formatEther(max).toString());
      })();
    }
  }, [activeAccount, poolInput, selectedBase, setMaxPool]);

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */
  useEffect(() => {
    !activeAccount || !poolInput || !selectedSeries || poolError ? setPoolDisabled(true) : setPoolDisabled(false);
  }, [poolInput, activeAccount, poolError, selectedSeries]);

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap>
          <Box margin={{ top: '35%' }}>
            <StepperText
              position={stepPosition}
              values={[
                // ['Choose amount to', 'POOL', ''],
                ['Choose an amount and a maturity date', '', ''],
                ['Review &', 'Transact', ''],
              ]}
            />
          </Box>
          <YieldInfo />
        </PanelWrap>
      )}

      <CenterPanelWrap series={selectedSeries}>
        <Box height="100%" pad="large">
          {stepPosition === 0 && (
            <Box gap="medium">
              <Box gap="xsmall">
                <AltText size="large">ADD LIQUIDITY</AltText>
                <Box>
                  <AltText color="text-weak" size="xsmall">
                    for variable returns based on protocol usage.
                  </AltText>
                </Box>
              </Box>

              <Box gap="large">
                {/* <SectionWrap title={assetMap.size > 0 ? 'Select an asset and amount' : 'Assets Loading...'}> */}
                <SectionWrap>
                  <Box direction="row" gap="small">
                    <Box basis={mobile ? '50%' : '60%'}>
                      <InputWrap action={() => console.log('maxAction')} isError={poolError}>
                        <TextInput
                          plain
                          type="number"
                          placeholder="Enter amount"
                          value={poolInput || ''}
                          onChange={(event: any) => setPoolInput(cleanValue(event.target.value))}
                        />
                        <MaxButton
                          action={() => setPoolInput(maxPool)}
                          disabled={maxPool === '0'}
                          clearAction={() => setPoolInput('')}
                          showingMax={!!poolInput && poolInput === maxPool}
                        />
                      </InputWrap>
                    </Box>

                    <Box basis={mobile ? '50%' : '40%'}>
                      <AssetSelector />
                    </Box>
                  </Box>
                </SectionWrap>

                <SectionWrap
                  title={
                    seriesMap.size > 0
                      ? `Select a ${selectedBase?.symbol}${selectedBase && '-based'} maturity date`
                      : ''
                  }
                >
                  <SeriesSelector actionType={ActionType.POOL} inputValue={poolInput} />
                </SectionWrap>
              </Box>
            </Box>
          )}

          {stepPosition === 1 && (
            <Box gap="large">
              {!poolTx.success && !poolTx.failed ? <BackButton action={() => setStepPosition(0)} /> : <Box pad="1em" />}

              <ActiveTransaction full tx={poolTx}>
                <Box gap="large">
                  {!selectedSeries?.seriesIsMature && (
                    <SectionWrap>
                      <Box direction="row" justify="between" fill align="center">
                        {!mobile && <Text size="small"> Pooling strategy: </Text>}
                        <RadioButtonGroup
                          name="strategy"
                          options={[
                            { label: <Text size="small"> Buy & Pool </Text>, value: 'BUY' },
                            { label: <Text size="small"> Mint & Pool </Text>, value: 'MINT', disabled: true },
                          ]}
                          value={strategy}
                          onChange={(event: any) => setStrategy(event.target.value)}
                          direction="row"
                          justify="between"
                        />
                      </Box>
                    </SectionWrap>
                  )}

                  <SectionWrap title="Review transaction:">
                    <Box
                      gap="small"
                      pad={{ horizontal: 'large', vertical: 'medium' }}
                      round="xsmall"
                      animation={{ type: 'zoomIn', size: 'small' }}
                    >
                      <InfoBite
                        label="Amount to pool"
                        icon={<BiMessageSquareAdd />}
                        value={`${cleanValue(poolInput, selectedBase?.digitFormat!)} ${selectedBase?.symbol}`}
                      />
                      <InfoBite label="Series Maturity" icon={<FiClock />} value={`${selectedSeries?.displayName}`} />
                      <InfoBite
                        label="Amount of liquidity tokens recieved"
                        icon={<BiCoinStack />}
                        value={`${'[todo]'} Liquidity tokens`}
                      />
                      <InfoBite label="Percentage of pool" icon={<FiPercent />} value={`${'[todo]'}%`} />
                    </Box>
                  </SectionWrap>
                </Box>
              </ActiveTransaction>
            </Box>
          )}
        </Box>

        <ActionButtonGroup pad>
          {stepPosition !== 1 && !selectedSeries?.seriesIsMature && (
            <NextButton
              secondary
              label={<Text size={mobile ? 'small' : undefined}> Next step </Text>}
              onClick={() => setStepPosition(stepPosition + 1)}
              disabled={poolDisabled}
              errorLabel={poolError}
            />
          )}
          {stepPosition === 1 && !selectedSeries?.seriesIsMature && !poolTx.success && !poolTx.failed && (
            <TransactButton
              primary
              label={
                <Text size={mobile ? 'small' : undefined}>
                  {`Pool${poolTx.processActive ? `ing` : ''} ${
                    nFormatter(Number(poolInput), selectedBase?.digitFormat!) || ''
                  } ${selectedBase?.symbol || ''}`}
                </Text>
              }
              onClick={() => handleAdd()}
              disabled={poolDisabled || poolTx.processActive}
            />
          )}

          {stepPosition === 1 &&
            !selectedSeries?.seriesIsMature &&
            !poolTx.processActive &&
            (poolTx.success || poolTx.failed) && (
              <>
                {/* <PositionListItem series={selectedSeries!} actionType={ActionType.POOL} /> */}
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}>Add more Liquidity</Text>}
                  onClick={() => resetInputs()}
                />
              </>
            )}
        </ActionButtonGroup>
      </CenterPanelWrap>

      <PanelWrap right basis="40%">
        {/* <YieldLiquidity input={poolInput} /> */}
        {!mobile && <PositionSelector actionType={ActionType.POOL} />}
      </PanelWrap>
    </MainViewWrap>
  );
}

export default Pool;

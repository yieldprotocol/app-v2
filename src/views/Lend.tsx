import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';

import { FiPocket, FiClock, FiTrendingUp, FiPercent, FiSquare } from 'react-icons/fi';
import { BiMessageSquareAdd } from 'react-icons/bi';
import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { cleanValue, getTxCode } from '../utils/appUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { useLendActions } from '../hooks/lendHooks';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, IUserContext } from '../types';
import MaxButton from '../components/buttons/MaxButton';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';

import StepperText from '../components/StepperText';
import PositionSelector from '../components/selectors/PositionSelector';
import ActiveTransaction from '../components/ActiveTransaction';
import YieldInfo from '../components/YieldInfo';
import BackButton from '../components/buttons/BackButton';
import YieldMark from '../components/logos/YieldMark';
import NextButton from '../components/buttons/NextButton';
import ReviewTxItem from '../components/ReviewTxItem';
import TransactButton from '../components/buttons/TransactButton';
import YieldApr from '../components/YieldApr';
import { useApr } from '../hooks/aprHook';

const Lend = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */
  const [lendInput, setLendInput] = useState<string>();
  const [maxLend, setMaxLend] = useState<string | undefined>();
  const [lendError, setLendError] = useState<string | null>(null);
  const [lendDisabled, setLendDisabled] = useState<boolean>(true);
  const [stepPosition, setStepPosition] = useState<number>(0);

  /* HOOK FNS */
  const { lend, redeem } = useLendActions();
  const { apr } = useApr(lendInput, ActionType.LEND, selectedSeries);

  /* LOCAL FNS */
  const handleLend = () => {
    !lendDisabled && lend(lendInput, selectedSeries!);
  };
  const handleRedeem = () => {
    redeem(selectedSeries!, undefined);
  };

  /* SET MAX VALUES */
  useEffect(() => {
    /* Check max available lend (only if activeAccount to save call) */
    if (activeAccount) {
      (async () => {
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxLend(ethers.utils.formatEther(max).toString());
      })();
    }
  }, [activeAccount, lendInput, selectedBase, setMaxLend]);

  /* WATCH FOR WARNINGS AND ERRORS */
  useEffect(() => {
    /* lendInput errors */
    if (activeAccount && (lendInput || lendInput === '')) {
      /* 1. Check if input exceeds balance */
      if (maxLend && parseFloat(lendInput) > parseFloat(maxLend)) setLendError('Amount exceeds balance');
      /* 2. Check if input is above zero */ else if (parseFloat(lendInput) < 0)
        setLendError('Amount should be expressed as a positive value');
      /* 2. next Check */ else if (false) setLendError('Insufficient');
      /* if all checks pass, set null error message */ else {
        setLendError(null);
      }
    }
  }, [activeAccount, lendInput, maxLend, setLendError]);

  /* ACTION DISABLING LOGIC  - if conditions are met: allow action */
  useEffect(() => {
    activeAccount && lendInput && selectedSeries && !lendError ? setLendDisabled(false) : setLendDisabled(true);
  }, [lendInput, activeAccount, lendError, selectedSeries]);

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap>
          <StepperText
            position={stepPosition}
            values={[
              ['Choose an asset to', 'lend', ''],
              ['', 'Review', 'and transact'],
            ]}
          />
          <YieldInfo />
        </PanelWrap>
      )}

      <CenterPanelWrap series={selectedSeries}>
        <Box height="100%" pad="large">
          {stepPosition === 0 && (
            <Box gap="medium">
              <Box direction="row" gap="small" align="center" margin={{ bottom: 'medium' }}>
                <YieldMark />
                <Text>LEND</Text>
              </Box>
              <SectionWrap title="Select an asset and amount to lend">
                <Box direction="row" gap="small" fill="horizontal" align="start">
                  <Box basis={mobile ? '50%' : '60%'}>
                    <InputWrap
                      action={() => console.log('maxAction')}
                      isError={lendError}
                      disabled={selectedSeries?.seriesIsMature}
                    >
                      <TextInput
                        plain
                        type="number"
                        placeholder="Enter amount"
                        value={lendInput || ''}
                        onChange={(event: any) => setLendInput(cleanValue(event.target.value))}
                        disabled={selectedSeries?.seriesIsMature}
                      />
                      <MaxButton
                        action={() => setLendInput(maxLend)}
                        disabled={maxLend === '0' || selectedSeries?.seriesIsMature}
                      />
                    </InputWrap>
                  </Box>
                  <Box basis={mobile ? '50%' : '40%'}>
                    <AssetSelector />
                  </Box>
                </Box>
              </SectionWrap>

              <SectionWrap title="Choose a series to lend to">
                <SeriesSelector inputValue={lendInput} actionType={ActionType.LEND} />
              </SectionWrap>
            </Box>
          )}

          {stepPosition === 1 && (
            <Box gap="large">
              <BackButton action={() => setStepPosition(0)} />

              <ActiveTransaction txCode={getTxCode(ActionCodes.LEND, selectedSeriesId)} size="LARGE">
                <SectionWrap title="Review your transaction">
                  <Box
                    gap="small"
                    pad={{ horizontal: 'large', vertical: 'medium' }}
                    round="xsmall"
                    animation={{ type: 'zoomIn', size: 'small' }}
                  >
                    <ReviewTxItem
                      label="Amount to lend"
                      icon={<BiMessageSquareAdd />}
                      value={`${lendInput} fyTokens`}
                    />
                    <ReviewTxItem label="Series Maturity" icon={<FiClock />} value={`${selectedSeries?.displayName}`} />
                    <ReviewTxItem
                      label="Redeemable @ Maturity"
                      icon={<FiTrendingUp />}
                      value={`${lendInput} ${selectedBase?.symbol}`}
                    />
                    <ReviewTxItem label="Effective APR" icon={<FiPercent />} value={`${apr}%`} />
                  </Box>
                </SectionWrap>
              </ActiveTransaction>
            </Box>
          )}
        </Box>

        <ActionButtonGroup pad>
          {stepPosition !== 1 && !selectedSeries?.seriesIsMature && (
            <NextButton
              secondary
              disabled={lendDisabled}
              label={<Text size={mobile ? 'small' : undefined}> Next step </Text>}
              key="ONE"
              onClick={() => setStepPosition(stepPosition + 1)}
            />
          )}
          {stepPosition === 1 && !selectedSeries?.seriesIsMature && (
            <TransactButton
              primary
              label={
                <Text size={mobile ? 'small' : undefined}>
                  {' '}
                  {`Supply ${lendInput || ''} ${selectedBase?.symbol || ''}`}{' '}
                </Text>
              }
              onClick={() => handleLend()}
              disabled={lendDisabled}
            />
          )}
          {selectedSeries?.seriesIsMature && (
            <NextButton
              primary
              label={<Text size={mobile ? 'small' : undefined}> Redeem </Text>}
              onClick={() => handleRedeem()}
            />
          )}
        </ActionButtonGroup>
      </CenterPanelWrap>

      <PanelWrap right basis="40%">
        {/* <YieldApr input={lendInput} actionType={ActionType.LEND} /> */}
        {!mobile && <PositionSelector actionType={ActionType.LEND} />}
      </PanelWrap>
    </MainViewWrap>
  );
};

export default Lend;

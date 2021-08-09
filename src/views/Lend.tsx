import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';

import { FiPocket, FiClock, FiTrendingUp, FiPercent, FiSquare, FiInfo } from 'react-icons/fi';
import { BiMessageSquareAdd } from 'react-icons/bi';
import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { cleanValue, getTxCode, nFormatter } from '../utils/appUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { useLend, useLendActions } from '../hooks/lendHooks';
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

import NextButton from '../components/buttons/NextButton';
import InfoBite from '../components/InfoBite';
import TransactButton from '../components/buttons/TransactButton';

import { useApr } from '../hooks/aprHook';
import { useInputValidation } from '../hooks/inputValidationHook';
import { useTx } from '../hooks/useTx';
import AltText from '../components/texts/AltText';

const Lend = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */
  const [lendInput, setLendInput] = useState<string>();
  // const [maxLend, setMaxLend] = useState<string | undefined>();
  const [lendDisabled, setLendDisabled] = useState<boolean>(true);
  const [stepPosition, setStepPosition] = useState<number>(0);

  /* HOOK FNS */
  const { maxLend, currentValue } = useLend(selectedSeries!);
  const { lend, redeem } = useLendActions();
  const { apr } = useApr(lendInput, ActionType.LEND, selectedSeries);

  const lendOutput = cleanValue((Number(lendInput) * (1 + Number(apr) / 100)).toString(), selectedBase?.digitFormat!);

  const { tx: lendTx } = useTx(ActionCodes.LEND);

  /* input validation hooks */
  const { inputError: lendError } = useInputValidation(lendInput, ActionCodes.LEND, selectedSeries, [0, maxLend]);

  /* LOCAL FNS */
  const handleLend = () => {
    !lendDisabled && lend(lendInput, selectedSeries!);
  };
  const handleRedeem = () => {
    redeem(selectedSeries!, undefined);
  };

  /* ACTION DISABLING LOGIC  - if conditions are met: allow action */
  useEffect(() => {
    activeAccount && lendInput && selectedSeries && !lendError ? setLendDisabled(false) : setLendDisabled(true);
  }, [lendInput, activeAccount, lendError, selectedSeries]);

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap>
          <Box margin={{ top: '35%' }}>
            <StepperText
              position={stepPosition}
              values={[
                ['Choose amount to', 'LEND', ''],
                ['Review & Transact', '', ''],
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
                <AltText size="large">
                  LEND
                </AltText>
                <Box>
                  <AltText color="text-weak" size="xsmall">
                    popular ERC20 tokens for fixed returns.
                  </AltText>
                </Box>
              </Box>

              <Box gap="large">
                {/* <SectionWrap title={assetMap.size > 0 ? 'Select an asset and amount' : 'Assets Loading...'}> */}
                  <SectionWrap>
                  <Box direction="row" gap="small">
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
                          clearAction={() => setLendInput('')}
                          showingMax={!!lendInput && (lendInput === maxLend || !!lendError)}
                        />
                      </InputWrap>
                    </Box>
                    <Box basis={mobile ? '50%' : '40%'}>
                      <AssetSelector />
                    </Box>
                  </Box>
                </SectionWrap>

                <SectionWrap
                  title={seriesMap.size > 0 ? `Select a ${selectedBase?.symbol}${selectedBase && '-based'} maturity date` : ''}
                >
                  <SeriesSelector inputValue={lendInput} actionType={ActionType.LEND} />
                </SectionWrap>
              </Box>
            </Box>
          )}

          {stepPosition === 1 && (
            <Box gap="large">
              <BackButton action={() => setStepPosition(0)} />

              <ActiveTransaction txCode={lendTx.txCode} full>
                <SectionWrap title="Review transaction:">
                  <Box
                    gap="small"
                    pad={{ horizontal: 'large', vertical: 'medium' }}
                    round="xsmall"
                    animation={{ type: 'zoomIn', size: 'small' }}
                  >
                    <InfoBite
                      label="Amount to lend"
                      icon={<BiMessageSquareAdd />}
                      value={`${cleanValue(lendInput, selectedBase?.digitFormat!)} ${selectedBase?.symbol}`}
                    />
                    <InfoBite label="Series Maturity" icon={<FiClock />} value={`${selectedSeries?.displayName}`} />
                    <InfoBite
                      label="Redeemable @ Maturity"
                      icon={<FiTrendingUp />}
                      value={`${lendOutput} ${selectedBase?.symbol}`}
                    />
                    <InfoBite label="Effective APR" icon={<FiPercent />} value={`${apr}%`} />
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
              errorLabel={lendError}
            />
          )}
          {stepPosition === 1 && !selectedSeries?.seriesIsMature && (
            <TransactButton
              primary
              label={
                <Text size={mobile ? 'small' : undefined}>
                  {`Supply${lendTx.pending ? `ing` : ''} ${
                    nFormatter(Number(lendInput), selectedBase?.digitFormat!) || ''
                  } ${selectedBase?.symbol || ''}`}
                </Text>
              }
              onClick={() => handleLend()}
              disabled={lendDisabled || lendTx.pending}
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

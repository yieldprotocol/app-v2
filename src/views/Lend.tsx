import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Text, TextInput } from 'grommet';

import { FiClock, FiTrendingUp, FiPercent } from 'react-icons/fi';
import { BiMessageSquareAdd } from 'react-icons/bi';
import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { cleanValue, nFormatter } from '../utils/appUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, IUserContext, ProcessStage, TxState } from '../types';
import MaxButton from '../components/buttons/MaxButton';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';

import StepperText from '../components/StepperText';
import PositionSelector from '../components/selectors/LendPositionSelector';
import ActiveTransaction from '../components/ActiveTransaction';
import YieldInfo from '../components/YieldInfo';
import BackButton from '../components/buttons/BackButton';

import NextButton from '../components/buttons/NextButton';
import InfoBite from '../components/InfoBite';
import TransactButton from '../components/buttons/TransactButton';

import { useApr } from '../hooks/useApr';
import { useInputValidation } from '../hooks/useInputValidation';
import { useTx } from '../hooks/useTx';
import AltText from '../components/texts/AltText';
import YieldCardHeader from '../components/YieldCardHeader';
import { useLendHelpers } from '../hooks/actionHelperHooks/useLendHelpers';
import { useLend } from '../hooks/actionHooks/useLend';
import { useRedeemPosition } from '../hooks/actionHooks/useRedeemPosition';

import TransactionWidget from '../components/TransactionWidget';
import ColorText from '../components/texts/ColorText';
import { useProcess } from '../hooks/useProcess';

const Lend = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;
  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */
  const [lendInput, setLendInput] = useState<string | undefined>(undefined);
  // const [maxLend, setMaxLend] = useState<string | undefined>();
  const [lendDisabled, setLendDisabled] = useState<boolean>(true);
  const [stepPosition, setStepPosition] = useState<number>(0);

  /* HOOK FNS */
  const { maxLend, fyTokenMarketValue } = useLendHelpers(selectedSeries!);
  const lend = useLend();
  const redeem = useRedeemPosition();
  const { apr } = useApr(lendInput, ActionType.LEND, selectedSeries);

  const lendOutput = cleanValue((Number(lendInput) * (1 + Number(apr) / 100)).toString(), selectedBase?.digitFormat!);

  const { txProcess: lendProcess, resetProcess } = useProcess(ActionCodes.LEND, selectedSeries?.id);

  /* input validation hooks */
  const { inputError: lendError } = useInputValidation(lendInput, ActionCodes.LEND, selectedSeries, [0, maxLend]);

  /* LOCAL FNS */
  const handleLend = () => {
    !lendDisabled && lend(lendInput, selectedSeries!);
  };

  const handleRedeem = () => {
    redeem(selectedSeries!, undefined);
  };

  const resetInputs = () => {
    setLendInput(undefined);
    setStepPosition(0);
    resetProcess();
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
            {/* <StepperText
              position={stepPosition}
              values={[
                // ['Choose amount to', 'LEND', ''],
                ['Choose an amount and a maturity date', '', ''],
                ['Review & Transact', '', ''],
              ]}
            /> */}
          </Box>
          <YieldInfo />
        </PanelWrap>
      )}

      <CenterPanelWrap series={selectedSeries}>
        <Box height="100%" pad={mobile ? 'medium' : 'large'}>
          {stepPosition === 0 && (
            <Box gap="large">
              <YieldCardHeader logo={mobile} series={selectedSeries}>
                <Box gap={mobile ? undefined : 'xsmall'}>
                <ColorText size={mobile ? 'medium' : '2rem'}>LEND</ColorText>
                  <AltText color="text-weak" size="xsmall">
                    Lend popular ERC20 tokens for <ColorText size="small"> fixed returns</ColorText>
                  </AltText>
                </Box>
              </YieldCardHeader>

              <Box gap="large">
                {/* <SectionWrap title={assetMap.size > 0 ? 'Select an asset and amount' : 'Assets Loading...'}> */}
                <SectionWrap>
                  <Box direction="row-responsive" gap="small">
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
                  title={
                    seriesMap.size > 0
                      ? `Select a ${selectedBase?.symbol}${selectedBase && '-based'} maturity date`
                      : ''
                  }
                >
                  <SeriesSelector inputValue={lendInput} actionType={ActionType.LEND} />
                </SectionWrap>
              </Box>
            </Box>
          )}

          {stepPosition === 1 && (
            <Box gap="large">
              <YieldCardHeader>
                {lendProcess?.stage !== ProcessStage.PROCESS_COMPLETE ? (
                  <BackButton action={() => setStepPosition(0)} />
                ) : (
                  <Box pad="1em" />
                )}
              </YieldCardHeader>

              <ActiveTransaction full txProcess={lendProcess}>
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
          {stepPosition !== 1 && 
          !selectedSeries?.seriesIsMature && (
            <NextButton
              secondary
              disabled={lendDisabled}
              label={<Text size={mobile ? 'small' : undefined}> Next step </Text>}
              key="ONE"
              onClick={() => setStepPosition(stepPosition + 1)}
              errorLabel={lendError}
            />
          )}

          {stepPosition === 1 && 
          !selectedSeries?.seriesIsMature &&
          lendProcess?.stage !== ProcessStage.PROCESS_COMPLETE && 
          // !(lendTx.success || lendTx.failed) &&         
          (
            <TransactButton
              primary
              label={
                <Text size={mobile ? 'small' : undefined}>
                  {`Supply${lendProcess?.processActive ? `ing` : ''} ${
                    nFormatter(Number(lendInput), selectedBase?.digitFormat!) || ''
                  } ${selectedBase?.symbol || ''}`}
                </Text>
              }
              onClick={() => handleLend()}
              disabled={lendDisabled || lendProcess?.processActive}
            />
          )}

          {stepPosition === 1 && 
          !selectedSeries?.seriesIsMature && 
          lendProcess?.stage === ProcessStage.PROCESS_COMPLETE && 
          lendProcess?.tx.status === TxState.SUCCESSFUL && 
          ( // lendTx.success && (
            <>
              {/* <PositionListItem series={selectedSeries!} actionType={ActionType.LEND} /> */}
              <NextButton
                label={<Text size={mobile ? 'small' : undefined}>Lend some more</Text>}
                onClick={() => resetInputs()}
              />
            </>
          )}

          {stepPosition === 1 && 
          lendProcess?.stage === ProcessStage.PROCESS_COMPLETE && 
          lendProcess?.tx.status === TxState.FAILED &&
          (
            <>
              <NextButton
                size="xsmall"
                label={<Text size={mobile ? 'xsmall' : undefined}> Report and go back</Text>}
                onClick={() => resetInputs()}
              />
            </>
          )}

          {/* {selectedSeries?.seriesIsMature && (
            <NextButton
              primary
              label={<Text size={mobile ? 'small' : undefined}> Redeem </Text>}
              onClick={() => handleRedeem()}
            />
          )} */}
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

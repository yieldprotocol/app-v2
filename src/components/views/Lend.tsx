import { useContext, useState, useEffect, useCallback } from 'react';
import { Box, ResponsiveContext, Text, TextInput } from 'grommet';

import { FiClock, FiTrendingUp, FiPercent } from 'react-icons/fi';
import { BiMessageSquareAdd } from 'react-icons/bi';
import ActionButtonGroup from '../wraps/ActionButtonWrap';
import AssetSelector from '../selectors/AssetSelector';
import InputWrap from '../wraps/InputWrap';
import MainViewWrap from '../wraps/MainViewWrap';
import SeriesSelector from '../selectors/SeriesSelector';
import { cleanValue, nFormatter } from '../../utils/appUtils';
import SectionWrap from '../wraps/SectionWrap';
import VariableRate from '../selectors/VariableRate';

import { UserContext } from '../../contexts/UserContext';
import { ActionCodes, ActionType, ProcessStage, TxState } from '../../types';
import MaxButton from '../buttons/MaxButton';
import PanelWrap from '../wraps/PanelWrap';
import CenterPanelWrap from '../wraps/CenterPanelWrap';

import PositionSelector from '../selectors/LendPositionSelector';
import ActiveTransaction from '../ActiveTransaction';
import YieldInfo from '../FooterInfo';
import BackButton from '../buttons/BackButton';

import NextButton from '../buttons/NextButton';
import InfoBite from '../InfoBite';
import TransactButton from '../buttons/TransactButton';

import { useInputValidation } from '../../hooks/useInputValidation';
import AltText from '../texts/AltText';
import YieldCardHeader from '../YieldCardHeader';
import { useLendHelpers } from '../../hooks/viewHelperHooks/useLendHelpers';
import { useLend } from '../../hooks/actionHooks/useLend';

import ColorText from '../texts/ColorText';
import { useProcess } from '../../hooks/useProcess';
import LendItem from '../positionItems/LendItem';

import InputInfoWrap from '../wraps/InputInfoWrap';
import SeriesOrStrategySelectorModal from '../selectors/SeriesOrStrategySelectorModal';
import Navigation from '../Navigation';
import Line from '../elements/Line';
import { useAccount } from 'wagmi';
import { GA_Event, GA_Properties, GA_View } from '../../types/analytics';
import useAnalytics from '../../hooks/useAnalytics';
import { WETH } from '../../config/assets';
import useAccountPlus from '../../hooks/useAccountPlus';

const Lend = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext);
  const { selectedVR, selectedSeries, selectedBase, seriesMap } = userState;

  const { address: activeAccount } = useAccountPlus();

  /* LOCAL STATE */
  const [modalOpen, toggleModal] = useState<boolean>(false);
  const [lendInput, setLendInput] = useState<string>('');
  // const [maxLend, setMaxLend] = useState<string | undefined>();
  const [lendDisabled, setLendDisabled] = useState<boolean>(true);
  const [stepPosition, setStepPosition] = useState<number>(0);
  const [stepDisabled, setStepDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  const { maxLend_, apy, protocolLimited, valueAtMaturity_ } = useLendHelpers(selectedSeries, lendInput);
  const lend = useLend();

  const { logAnalyticsEvent } = useAnalytics();

  const { txProcess: lendProcess, resetProcess: resetLendProcess } = useProcess(ActionCodes.LEND, selectedSeries?.id!);

  /* input validation hooks */
  const { inputError: lendError } = useInputValidation(lendInput, ActionCodes.LEND, selectedSeries, [0, maxLend_]);

  /* LOCAL FNS */
  const handleLend = () => {
    if (lendDisabled) return;
    setLendDisabled(true);
    lend(lendInput, selectedSeries!);
    logAnalyticsEvent(GA_Event.transaction_initiated, {
      view: GA_View.LEND,
      series_id: selectedSeries?.name,
      action_code: ActionCodes.LEND,
    } as GA_Properties.transaction_initiated);
  };

  /* Event handlers */
  const handleNavAction = (_stepPosition: number) => {
    setStepPosition(_stepPosition);
    logAnalyticsEvent(GA_Event.next_step_clicked, {
      view: GA_View.LEND,
      step_index: _stepPosition,
    } as GA_Properties.next_step_clicked);
  };

  const handleMaxAction = () => {
    maxLend_ && setLendInput(maxLend_);
    logAnalyticsEvent(GA_Event.max_clicked, {
      view: GA_View.LEND,
      action_code: ActionCodes.LEND,
    } as GA_Properties.max_clicked);
  };

  const resetInputs = useCallback(() => {
    setLendInput('');
    setStepPosition(0);
    resetLendProcess();
  }, [resetLendProcess]);

  /* ACTION DISABLING LOGIC  - if conditions are met: allow action */
  useEffect(() => {
    activeAccount && lendInput && (selectedSeries || selectedVR) && !lendError
      ? setLendDisabled(false)
      : setLendDisabled(true);
    lendInput && (selectedSeries || selectedVR) && !lendError ? setStepDisabled(false) : setStepDisabled(true);
  }, [lendInput, activeAccount, lendError, selectedSeries, selectedVR]);

  /* Watch process timeouts */
  useEffect(() => {
    lendProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs();
  }, [lendProcess, resetInputs]);

  return (
    <MainViewWrap>
      {!mobile && (
        <PanelWrap basis="30%">
          <Navigation sideNavigation={true} />
          <PositionSelector actionType={ActionType.LEND} />
        </PanelWrap>
      )}

      <CenterPanelWrap series={selectedSeries}>
        <Box id="topsection">
          {stepPosition === 0 && (
            <>
              <Box height="100%" pad={mobile ? 'medium' : { top: 'large', horizontal: 'large' }} gap="large">
                <YieldCardHeader>
                  <Box gap={mobile ? undefined : 'xsmall'}>
                    <ColorText size={mobile ? 'medium' : '2rem'}>LEND</ColorText>
                    <AltText color="text-weak" size="xsmall">
                      Lend popular ERC20 tokens for{' '}
                      <Text size="small" color="text">
                        fixed or variable returns
                      </Text>
                    </AltText>
                  </Box>
                </YieldCardHeader>

                <Box gap="medium">
                  <SectionWrap>
                    <Box direction="row-responsive">
                      <Box basis={mobile ? '50%' : '60%'}>
                        <InputWrap
                          action={() => console.log('maxAction')}
                          isError={lendError}
                          disabled={selectedSeries?.seriesIsMature}
                        >
                          <TextInput
                            plain
                            type="number"
                            inputMode="decimal"
                            placeholder="Enter amount"
                            value={lendInput}
                            onChange={(event: any) =>
                              setLendInput(cleanValue(event.target.value, selectedSeries?.decimals))
                            }
                            disabled={selectedSeries?.seriesIsMature}
                          />
                          <MaxButton
                            action={() => handleMaxAction()}
                            disabled={maxLend_ === '0' || selectedSeries?.seriesIsMature}
                            clearAction={() => setLendInput('')}
                            showingMax={!!lendInput && (lendInput === maxLend_ || !!lendError)}
                          />
                        </InputWrap>
                      </Box>
                      <Box basis={mobile ? '50%' : '40%'}>
                        <AssetSelector />
                      </Box>
                    </Box>
                  </SectionWrap>

                  {mobile ? (
                    <SeriesOrStrategySelectorModal
                      inputValue={lendInput!}
                      actionType={ActionType.LEND}
                      open={modalOpen}
                      setOpen={toggleModal}
                    />
                  ) : (
                    <Box direction="column" gap="medium">
                      <SectionWrap
                        title={
                          selectedBase
                            ? `Select a${selectedBase?.id === WETH ? 'n' : ''} ${selectedBase?.displaySymbol}${
                                selectedBase && '-based'
                              } maturity date:`
                            : ''
                        }
                      >
                        <SeriesSelector inputValue={lendInput} actionType={ActionType.LEND} />
                      </SectionWrap>
                      <SectionWrap title="OR lend indefintiely for a variable rate">
                        <VariableRate />
                      </SectionWrap>
                    </Box>
                  )}
                </Box>

                {selectedBase && selectedSeries && protocolLimited && (
                  <InputInfoWrap action={() => handleMaxAction()}>
                    <Text size="xsmall" color="text-weak">
                      Max lend is{' '}
                      <Text size="small" color="text-weak">
                        {cleanValue(maxLend_, 2)} {selectedBase?.displaySymbol}
                      </Text>{' '}
                      (limited by protocol liquidity)
                    </Text>
                  </InputInfoWrap>
                )}
              </Box>
            </>
          )}
          {stepPosition === 1 && (
            <>
              <Box
                height={{ min: '350px' }}
                background="gradient-transparent"
                round={{ corner: 'top', size: 'xsmall' }}
                pad="medium"
                gap="large"
              >
                {lendProcess?.stage !== ProcessStage.PROCESS_COMPLETE ? (
                  <BackButton action={() => handleNavAction(0)} />
                ) : (
                  <Box pad="1em" />
                )}

                <ActiveTransaction full txProcess={lendProcess}>
                  <Box
                    pad={{ horizontal: 'medium', vertical: 'medium' }}
                    gap="small"
                    animation={{ type: 'zoomIn', size: 'small' }}
                    flex={false}
                  >
                    <InfoBite
                      label="Amount to lend"
                      icon={<BiMessageSquareAdd />}
                      value={`${cleanValue(lendInput, selectedBase?.digitFormat!)} ${selectedBase?.displaySymbol}`}
                    />
                    {!selectedVR && (
                      <InfoBite label="Series Maturity" icon={<FiClock />} value={`${selectedSeries?.displayName}`} />
                    )}
                    <InfoBite
                      label="Redeemable @ Maturity"
                      icon={<FiTrendingUp />}
                      value={`${cleanValue(valueAtMaturity_, selectedBase?.digitFormat!)} ${
                        selectedBase?.displaySymbol
                      }`}
                    />
                    <InfoBite label="Effective APY" icon={<FiPercent />} value={`${apy}%`} />
                  </Box>
                </ActiveTransaction>
              </Box>
              <Line />
              <Box />
            </>
          )}
        </Box>

        <Box id="midsection" pad="medium">
          {stepPosition === 1 &&
            lendProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
            lendProcess?.tx.status === TxState.SUCCESSFUL && (
              <Box pad="large" gap="small">
                <Text size="small"> View position: </Text>
                <LendItem
                  series={seriesMap?.get(selectedSeries?.id!)!}
                  index={0}
                  actionType={ActionType.LEND}
                  condensed
                />
              </Box>
            )}
        </Box>

        <ActionButtonGroup pad>
          {stepPosition !== 1 && !selectedSeries?.seriesIsMature && (
            <NextButton
              secondary
              disabled={stepDisabled}
              label={<Text size={mobile ? 'small' : undefined}>Next Step</Text>}
              key="ONE"
              onClick={() => handleNavAction(stepPosition + 1)}
              errorLabel={lendError}
            />
          )}

          {stepPosition === 1 &&
            !selectedSeries?.seriesIsMature &&
            lendProcess?.stage !== ProcessStage.PROCESS_COMPLETE && (
              <TransactButton
                primary
                label={
                  <Text size={mobile ? 'small' : undefined}>
                    {!activeAccount
                      ? 'Connect Wallet'
                      : `Lend${lendProcess?.processActive ? `ing` : ''} ${
                          nFormatter(Number(lendInput), selectedBase?.digitFormat!) || ''
                        } ${selectedBase?.displaySymbol || ''}`}
                  </Text>
                }
                onClick={() => handleLend()}
                disabled={lendDisabled || lendProcess?.processActive}
              />
            )}

          {stepPosition === 1 &&
            !selectedSeries?.seriesIsMature &&
            lendProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
            lendProcess?.tx.status === TxState.SUCCESSFUL && ( // lendTx.success && (
              <NextButton
                label={<Text size={mobile ? 'small' : undefined}>Lend more</Text>}
                onClick={() => resetInputs()}
              />
            )}

          {stepPosition === 1 &&
            lendProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
            lendProcess?.tx.status === TxState.FAILED && (
              <NextButton
                size="xsmall"
                label={<Text size={mobile ? 'xsmall' : undefined}>Report and go back</Text>}
                onClick={() => resetInputs()}
              />
            )}
        </ActionButtonGroup>
      </CenterPanelWrap>

      {!mobile && (
        <PanelWrap right>
          <Box />
          <YieldInfo />
        </PanelWrap>
      )}
    </MainViewWrap>
  );
};

export default Lend;

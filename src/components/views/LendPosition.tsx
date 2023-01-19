import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Box, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { useRouter } from 'next/router';
import { FiArrowRight, FiChevronDown, FiClock, FiTool, FiTrendingUp } from 'react-icons/fi';

import ActionButtonGroup from '../wraps/ActionButtonWrap';
import InputWrap from '../wraps/InputWrap';
import SeriesSelector from '../selectors/SeriesSelector';
import { abbreviateHash, cleanValue, getTxCode, nFormatter } from '../../utils/appUtils';
import SectionWrap from '../wraps/SectionWrap';

import { UserContext } from '../../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, ProcessStage } from '../../types';
import MaxButton from '../buttons/MaxButton';
import InfoBite from '../InfoBite';
import ActiveTransaction from '../ActiveTransaction';
import PositionAvatar from '../PositionAvatar';
import CenterPanelWrap from '../wraps/CenterPanelWrap';
import NextButton from '../buttons/NextButton';
import TransactButton from '../buttons/TransactButton';
import YieldHistory from '../YieldHistory';
import { useInputValidation } from '../../hooks/useInputValidation';
import ModalWrap from '../wraps/ModalWrap';
import { useLendHelpers } from '../../hooks/viewHelperHooks/useLendHelpers';
import { useClosePosition } from '../../hooks/actionHooks/useClosePosition';
import { useRollPosition } from '../../hooks/actionHooks/useRollPosition';
import CopyWrap from '../wraps/CopyWrap';
import { useProcess } from '../../hooks/useProcess';
import InputInfoWrap from '../wraps/InputInfoWrap';
import ExitButton from '../buttons/ExitButton';
import Logo from '../logos/Logo';
import { GA_Event, GA_Properties, GA_View } from '../../types/analytics';
import useAnalytics from '../../hooks/useAnalytics';
import useAsset from '../../hooks/useAsset';
import useSeriesEntity from '../../hooks/useSeriesEntity';
import useSeriesEntities from '../../hooks/useSeriesEntities';

const LendPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const router = useRouter();
  const { data: seriesMap } = useSeriesEntities();
  const { id: idFromUrl } = router.query;
  const { data: seriesEntity, isLoading: seriesEntityLoading } = useSeriesEntity(idFromUrl as string);
  const { data: base, isLoading: baseLoading } = useAsset(seriesEntity?.baseId);

  /* STATE FROM CONTEXT */
  const {
    userActions: { setSelectedSeries, setSelectedBase },
  } = useContext(UserContext);

  /* LOCAL STATE */
  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });

  // stepper for stepping within multiple tabs
  const actionCodeToStepperIdx: { [actionCode: string]: number } = useMemo(
    () => ({
      [ActionCodes.CLOSE_POSITION]: 0,
      [ActionCodes.ROLL_POSITION]: 1,
    }),
    []
  );

  const initialStepperState = [0, 0, 0];
  const [stepPosition, setStepPosition] = useState<number[]>(initialStepperState);
  const [closeInput, setCloseInput] = useState<string | undefined>();
  const [rollInput, setRollInput] = useState<string | undefined>();
  const [rollToSeries, setRollToSeries] = useState<ISeries | undefined>();

  const [closeDisabled, setCloseDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  /* Close helpers */
  const { fyTokenMarketValue, maxClose_, maxClose } = useLendHelpers(seriesEntity?.id!, closeInput, rollToSeries?.id!);

  /* Roll helpers */
  const { maxRoll_, rollEstimate_ } = useLendHelpers(seriesEntity?.id!, rollInput, rollToSeries?.id!);

  const closePosition = useClosePosition();
  const rollPosition = useRollPosition(rollToSeries?.id!);

  const { logAnalyticsEvent } = useAnalytics();

  /* Processes to watch */
  const { txProcess: closeProcess, resetProcess: resetCloseProcess } = useProcess(
    ActionCodes.CLOSE_POSITION,
    seriesEntity?.id!
  );
  const { txProcess: rollProcess, resetProcess: resetRollProcess } = useProcess(
    ActionCodes.ROLL_POSITION,
    seriesEntity?.id!
  );

  /* input validation hooks */
  const { inputError: closeError } = useInputValidation(closeInput, ActionCodes.CLOSE_POSITION, seriesEntity!, [
    0,
    maxClose_,
  ]);

  const { inputError: rollError } = useInputValidation(rollInput, ActionCodes.ROLL_POSITION, seriesEntity!, [
    0,
    maxRoll_,
  ]);

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x, i) => (i === actionActive.index ? x + step : x));
    const validatedSteps = newStepArray.map((x) => (x >= 0 ? x : 0));
    setStepPosition(validatedSteps);
  };

  const resetStepper = useCallback(
    (actionCode: ActionCodes) => {
      const newStepPositions = stepPosition;
      newStepPositions[actionCodeToStepperIdx[actionCode]] = 0;
      setStepPosition(newStepPositions);
    },
    [actionCodeToStepperIdx, stepPosition]
  );

  const handleClosePosition = () => {
    if (!seriesEntity) throw new Error('No series entity detected');

    if (closeDisabled) return;
    setCloseDisabled(true);
    closePosition(closeInput);

    logAnalyticsEvent(GA_Event.transaction_initiated, {
      view: GA_View.LEND,
      series_id: seriesEntity.name,
      action_code: ActionCodes.CLOSE_POSITION,
    } as GA_Properties.transaction_initiated);
  };

  const handleRollPosition = () => {
    if (!seriesEntity) throw new Error('No series entity detected');

    if (rollDisabled) return;
    setRollDisabled(true);
    rollPosition(rollInput);

    logAnalyticsEvent(GA_Event.transaction_initiated, {
      view: GA_View.LEND,
      series_id: seriesEntity.name,
      action_code: ActionCodes.ROLL_POSITION,
    } as GA_Properties.transaction_initiated);
  };

  const handleMaxAction = (actionCode: ActionCodes) => {
    actionCode === ActionCodes.ROLL_POSITION && maxRoll_ && setRollInput(maxRoll_);
    actionCode === ActionCodes.CLOSE_POSITION && maxClose_ && setCloseInput(maxClose_);
    logAnalyticsEvent(GA_Event.max_clicked, {
      view: GA_View.LEND,
      action_code: actionCode,
    } as GA_Properties.max_clicked);
  };

  const handleSetActionActive = (option: { text: string; index: number }) => {
    setActionActive(option);
    logAnalyticsEvent(GA_Event.position_action_selected, {
      action: option.text,
    } as GA_Properties.position_action_selected);
  };

  const resetInputs = useCallback(
    (actionCode: ActionCodes) => {
      resetStepper(actionCode);

      if (actionCode === ActionCodes.CLOSE_POSITION) {
        setCloseInput(undefined);
        resetCloseProcess();
      }
      if (actionCode === ActionCodes.ROLL_POSITION) {
        setRollInput(undefined);
        resetRollProcess();
      }
    },
    [resetCloseProcess, resetRollProcess, resetStepper]
  );

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */
  useEffect(() => {
    !closeInput || closeError ? setCloseDisabled(true) : setCloseDisabled(false);
    !rollInput || !rollToSeries || rollError || !rollToSeries ? setRollDisabled(true) : setRollDisabled(false);
  }, [closeInput, closeError, rollInput, rollToSeries, rollError]);

  /* Watch process timeouts */
  useEffect(() => {
    closeProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.CLOSE_POSITION);
    rollProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.ROLL_POSITION);
  }, [closeProcess?.stage, resetInputs, rollProcess?.stage]);

  useEffect(() => {
    if (idFromUrl) {
      setSelectedSeries(seriesEntity!);
      setSelectedBase(base!);
    }
  }, [base, idFromUrl, seriesEntity, setSelectedBase, setSelectedSeries]);

  return (
    <>
      {seriesEntity && (
        <ModalWrap series={seriesEntity}>
          <CenterPanelWrap>
            {!mobile && <ExitButton action={() => router.back()} />}

            <Box pad={mobile ? 'medium' : 'large'} gap="1em">
              <Box height={{ min: '250px' }} gap="medium">
                <Box
                  direction="row"
                  justify="between"
                  fill="horizontal"
                  align="center"
                  pad={{ top: mobile ? 'medium' : undefined }}
                >
                  <Box direction="row" align="center" gap="medium">
                    <PositionAvatar position={seriesEntity} actionType={ActionType.LEND} />
                    <Box>
                      <Text size={mobile ? 'medium' : 'large'}> {seriesEntity.displayName} </Text>
                      <CopyWrap hash={seriesEntity.fyTokenAddress}>
                        <Text size="small"> {abbreviateHash(seriesEntity.fyTokenAddress, 6)}</Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                </Box>

                <SectionWrap>
                  <Box gap="small">
                    <InfoBite
                      label="Maturity date"
                      value={`${seriesEntity.fullDate}`}
                      icon={<FiClock color={seriesEntity.color} />}
                    />
                    <InfoBite
                      label="Portfolio value at Maturity"
                      value={`${cleanValue(seriesEntity.fyTokenBalance.formatted, base?.digitFormat)} ${
                        base?.displaySymbol
                      }`}
                      icon={<FiTrendingUp />}
                      loading={seriesEntityLoading || baseLoading}
                    />
                    <InfoBite
                      label="Current value"
                      value={
                        fyTokenMarketValue === 'Low liquidity'
                          ? 'Low Liquidity'
                          : `${cleanValue(fyTokenMarketValue, base?.digitFormat)} ${base?.displaySymbol}`
                      }
                      icon={
                        <Box height="1em" width="1em">
                          <Logo image={base?.image} />
                        </Box>
                      }
                      loading={seriesEntityLoading || baseLoading}
                    />
                  </Box>
                </SectionWrap>
              </Box>

              <Box height={{ min: '300px' }}>
                <SectionWrap title="Position Actions" icon={<FiTool />}>
                  <Box elevation="xsmall" round background={mobile ? 'hoverBackground' : 'hoverBackground'}>
                    <Select
                      plain
                      size="small"
                      dropProps={{ round: 'small' }}
                      options={[
                        { text: `Redeem ${base?.displaySymbol}`, index: 0 },
                        { text: 'Roll Position', index: 1 },
                        { text: 'View Transaction History', index: 2 },
                      ]}
                      icon={<FiChevronDown />}
                      labelKey="text"
                      valueKey="index"
                      value={actionActive}
                      onChange={({ option }) => handleSetActionActive(option)}
                      disabled={[3]}
                    />
                  </Box>
                </SectionWrap>

                {actionActive.index === 0 && (
                  <>
                    {stepPosition[0] === 0 && (
                      <Box margin={{ top: 'small' }}>
                        <InputWrap action={() => console.log('maxAction')} isError={closeError} disabled={!base} round>
                          <TextInput
                            plain
                            type="number"
                            inputMode="decimal"
                            placeholder="Amount to redeem"
                            value={closeInput || ''}
                            onChange={(event: any) =>
                              setCloseInput(cleanValue(event.target.value, seriesEntity.decimals))
                            }
                            disabled={!seriesEntity}
                            icon={<Logo image={base?.image} />}
                          />
                          <MaxButton
                            action={() => handleMaxAction(ActionCodes.CLOSE_POSITION)}
                            disabled={maxClose_ === '0.0'}
                            clearAction={() => setCloseInput('')}
                            showingMax={!!closeInput && closeInput === maxClose_}
                          />
                        </InputWrap>

                        {maxClose.lt(seriesEntity.fyTokenBalance.value) && (
                          <InputInfoWrap action={() => handleMaxAction(ActionCodes.CLOSE_POSITION)}>
                            <Text color="text" alignSelf="end" size="xsmall">
                              Max redeemable is {cleanValue(maxClose_, 2)} {base?.displaySymbol}
                              {seriesEntity.sharesReserves.value.eq(maxClose) && ' (limited by protocol)'}
                            </Text>
                          </InputInfoWrap>
                        )}
                      </Box>
                    )}

                    {stepPosition[0] !== 0 && (
                      <ActiveTransaction
                        pad
                        txProcess={closeProcess}
                        cancelAction={() => resetInputs(ActionCodes.CLOSE_POSITION)}
                      >
                        <InfoBite
                          label={`Redeem Position ${base?.displaySymbol}`}
                          icon={<FiArrowRight />}
                          value={`${cleanValue(closeInput, base?.digitFormat!)} ${base?.displaySymbol}`}
                          loading={seriesEntityLoading || baseLoading}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 1 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'small' }} gap="small">
                        <SeriesSelector
                          seriesMap={seriesMap!}
                          selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                          actionType={ActionType.LEND}
                          cardLayout={false}
                        />

                        <InputWrap
                          action={() => console.log('maxAction')}
                          isError={closeError}
                          disabled={!rollToSeries}
                          round
                        >
                          <TextInput
                            plain
                            type="number"
                            placeholder={`Amount of ${base?.displaySymbol} to roll`}
                            value={rollInput || ''}
                            onChange={(event: any) =>
                              setRollInput(cleanValue(event.target.value, seriesEntity.decimals))
                            }
                            disabled={!rollToSeries}
                            icon={<Logo image={base?.image} />}
                          />
                          <MaxButton
                            action={() => handleMaxAction(ActionCodes.ROLL_POSITION)}
                            disabled={maxRoll_ === '0.0' || !rollToSeries}
                            clearAction={() => setRollInput('')}
                            showingMax={!!rollInput && rollInput === maxRoll_}
                          />
                        </InputWrap>
                      </Box>
                    )}

                    {stepPosition[actionActive.index] !== 0 && (
                      <ActiveTransaction
                        pad
                        txProcess={rollProcess}
                        cancelAction={() => resetInputs(ActionCodes.ROLL_POSITION)}
                      >
                        <InfoBite
                          label="Roll To Series"
                          icon={<FiArrowRight />}
                          value={`Roll${rollProcess?.processActive ? 'ing' : ''}  ${cleanValue(
                            rollInput,
                            base?.digitFormat!
                          )} ${base?.displaySymbol} to ${rollToSeries?.displayName}, receiving ~${cleanValue(
                            rollEstimate_,
                            2
                          )} fy${base?.displaySymbol}`}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 2 && <YieldHistory seriesOrVault={seriesEntity} view={['TRADE']} />}
              </Box>
            </Box>

            <ActionButtonGroup pad>
              {stepPosition[actionActive.index] === 0 && actionActive.index !== 2 && (
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}>Next Step</Text>}
                  onClick={() => handleStepper()}
                  key="next"
                  disabled={(actionActive.index === 0 && closeDisabled) || (actionActive.index === 1 && rollDisabled)}
                  errorLabel={(actionActive.index === 0 && closeError) || (actionActive.index === 1 && rollError)}
                />
              )}

              {actionActive.index === 0 &&
                stepPosition[actionActive.index] !== 0 &&
                closeProcess?.stage !== ProcessStage.PROCESS_COMPLETE &&
                closeProcess?.stage !== ProcessStage.PROCESS_COMPLETE_TIMEOUT && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>
                        {`Redeem${closeProcess?.processActive ? 'ing' : ''} ${
                          nFormatter(Number(closeInput), base?.digitFormat!) || ''
                        } ${base?.displaySymbol}`}
                      </Text>
                    }
                    onClick={() => handleClosePosition()}
                    disabled={closeDisabled || closeProcess?.processActive}
                  />
                )}

              {actionActive.index === 1 &&
                stepPosition[actionActive.index] !== 0 &&
                rollProcess?.stage !== ProcessStage.PROCESS_COMPLETE && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>
                        {`Roll${rollProcess?.processActive ? 'ing' : ''} ${
                          nFormatter(Number(rollInput), base?.digitFormat!) || ''
                        } ${base?.displaySymbol}`}
                      </Text>
                    }
                    onClick={() => handleRollPosition()}
                    disabled={rollDisabled || rollProcess?.processActive}
                  />
                )}
            </ActionButtonGroup>
          </CenterPanelWrap>
        </ModalWrap>
      )}
    </>
  );
};

export default LendPosition;

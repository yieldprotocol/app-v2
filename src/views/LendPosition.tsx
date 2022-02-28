import React, { useContext, useState, useEffect } from 'react';
import { Box, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { useHistory, useParams } from 'react-router-dom';
import { FiArrowRight, FiClock, FiTool, FiTrendingUp } from 'react-icons/fi';

import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import InputWrap from '../components/wraps/InputWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { abbreviateHash, cleanValue, nFormatter } from '../utils/appUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, IUserContext, ProcessStage } from '../types';
import MaxButton from '../components/buttons/MaxButton';
import InfoBite from '../components/InfoBite';
import ActiveTransaction from '../components/ActiveTransaction';
import PositionAvatar from '../components/PositionAvatar';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import NextButton from '../components/buttons/NextButton';
import TransactButton from '../components/buttons/TransactButton';
import YieldHistory from '../components/YieldHistory';
import { useInputValidation } from '../hooks/useInputValidation';
import ModalWrap from '../components/wraps/ModalWrap';
import { useLendHelpers } from '../hooks/viewHelperHooks/useLendHelpers';
import { useClosePosition } from '../hooks/actionHooks/useClosePosition';
import { useRollPosition } from '../hooks/actionHooks/useRollPosition';
import CopyWrap from '../components/wraps/CopyWrap';
import { useProcess } from '../hooks/useProcess';
import InputInfoWrap from '../components/wraps/InputInfoWrap';
import ExitButton from '../components/buttons/ExitButton';

const LendPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const history = useHistory();
  const { id: idFromUrl } = useParams<{ id: string }>();

  /* STATE FROM CONTEXT */
  const {
    userState,
    userActions: { setSelectedSeries, setSelectedBase },
  } = useContext(UserContext) as IUserContext;
  const { selectedSeries, seriesMap, assetMap, seriesLoading } = userState;

  const selectedBase = assetMap.get(selectedSeries?.baseId!);

  /* LOCAL STATE */
  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });

  // stepper for stepping within multiple tabs
  const actionCodeToStepperIdx: { [actionCode: string]: number } = {
    [ActionCodes.CLOSE_POSITION]: 0,
    [ActionCodes.ROLL_POSITION]: 1,
  };
  const initialStepperState = [0, 0, 0];
  const [stepPosition, setStepPosition] = useState<number[]>(initialStepperState);
  const [closeInput, setCloseInput] = useState<string | undefined>();
  const [rollInput, setRollInput] = useState<string | undefined>();
  const [rollToSeries, setRollToSeries] = useState<ISeries | undefined>();

  const [closeDisabled, setCloseDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  const { fyTokenMarketValue, maxClose_, maxClose, maxRoll_ } = useLendHelpers(
    selectedSeries!,
    closeInput,
    rollToSeries!
  );

  const closePosition = useClosePosition();
  const rollPosition = useRollPosition();

  /* Processes to watch */
  const { txProcess: closeProcess, resetProcess: resetCloseProcess } = useProcess(
    ActionCodes.CLOSE_POSITION,
    selectedSeries?.id!
  );
  const { txProcess: rollProcess, resetProcess: resetRollProcess } = useProcess(
    ActionCodes.ROLL_POSITION,
    selectedSeries?.id!
  );

  /* input validation hooks */
  const { inputError: closeError } = useInputValidation(closeInput, ActionCodes.CLOSE_POSITION, selectedSeries, [
    0,
    maxClose_,
  ]);

  const { inputError: rollError } = useInputValidation(rollInput, ActionCodes.ROLL_POSITION, selectedSeries, [
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

  const resetStepper = (actionCode: ActionCodes) => {
    const newStepPositions = stepPosition;
    newStepPositions[actionCodeToStepperIdx[actionCode]] = 0;
    setStepPosition(newStepPositions);
  };

  const handleClosePosition = () => {
    !closeDisabled && closePosition(closeInput, selectedSeries!);
  };

  const handleRollPosition = () => {
    !rollDisabled && rollToSeries && rollPosition(rollInput, selectedSeries!, rollToSeries);
  };

  const resetInputs = (actionCode: ActionCodes) => {
    resetStepper(actionCode);

    if (actionCode === ActionCodes.CLOSE_POSITION) {
      setCloseInput(undefined);
      resetCloseProcess();
    }
    if (actionCode === ActionCodes.ROLL_POSITION) {
      setRollInput(undefined);
      resetRollProcess();
    }
  };

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */
  useEffect(() => {
    !closeInput || closeError ? setCloseDisabled(true) : setCloseDisabled(false);
    !rollInput || !rollToSeries || rollError ? setRollDisabled(true) : setRollDisabled(false);
  }, [closeInput, closeError, rollInput, rollToSeries, rollError]);

  /* Watch process timeouts */
  useEffect(() => {
    closeProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.CLOSE_POSITION);
    rollProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.ROLL_POSITION);
  }, [closeProcess?.stage, rollProcess?.stage]);

  useEffect(() => {
    const _series = seriesMap.get(idFromUrl) || null;
    const _base = assetMap.get(_series?.baseId!);
    if (idFromUrl) {
      setSelectedSeries(_series);
      setSelectedBase(_base!);
    }
  }, [idFromUrl, seriesMap, setSelectedSeries, assetMap, setSelectedBase]);

  return (
    <>
      {selectedSeries && (
        <ModalWrap series={selectedSeries}>
          <CenterPanelWrap>
            {!mobile && <ExitButton action={() => history.goBack()} />}

            <Box pad={mobile ? 'medium' : 'large'}>
              <Box height={{ min: '250px' }} gap="medium">
                <Box
                  direction="row"
                  justify="between"
                  fill="horizontal"
                  align="center"
                  pad={{ top: mobile ? 'medium' : undefined }}
                >
                  <Box direction="row" align="center" gap="medium">
                    <PositionAvatar position={selectedSeries!} actionType={ActionType.LEND} />
                    <Box>
                      <Text size={mobile ? 'medium' : 'large'}> {selectedSeries?.displayName} </Text>
                      <CopyWrap hash={selectedSeries.fyTokenAddress}>
                        <Text size="small"> {abbreviateHash(selectedSeries?.fyTokenAddress!, 6)}</Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                </Box>

                <SectionWrap>
                  <Box gap="small">
                    <InfoBite
                      label="Maturity date"
                      value={`${selectedSeries?.fullDate}`}
                      icon={<FiClock color={selectedSeries?.color} />}
                    />
                    <InfoBite
                      label="Portfolio value at Maturity"
                      value={`${cleanValue(
                        selectedSeries?.fyTokenBalance_!,
                        selectedBase?.digitFormat!
                      )} ${selectedBase?.displaySymbol!}`}
                      icon={<FiTrendingUp />}
                      loading={seriesLoading}
                    />
                    <InfoBite
                      label="Current value"
                      value={
                        fyTokenMarketValue === 'Low liquidity'
                          ? 'Low Liquidity'
                          : `${cleanValue(
                              fyTokenMarketValue,
                              selectedBase?.digitFormat!
                            )} ${selectedBase?.displaySymbol!}`
                      }
                      icon={selectedBase?.image}
                      loading={seriesLoading}
                    />
                  </Box>
                </SectionWrap>
              </Box>

              <Box gap='small' fill>

                <SectionWrap title="Position Actions" icon={<FiTool />}>
                  <Box elevation="xsmall" round background={mobile ? 'hoverBackground' : 'hoverBackground'}>
                    <Select
                      plain
                      dropProps={{ round: 'small' }}
                      options={[
                        { text: `Redeem ${selectedBase?.displaySymbol}`, index: 0 },
                        { text: 'Roll Position', index: 1 },
                        { text: 'View Transaction History', index: 2 },
                        // { text: 'Redeem', index: 3 },
                      ]}
                      labelKey="text"
                      valueKey="index"
                      value={actionActive}
                      onChange={({ option }) => setActionActive(option)}
                      disabled={[3]}
                    />
                  </Box>
                </SectionWrap>

                {actionActive.index === 0 && (
                  <>
                    {stepPosition[0] === 0 && (
                      <Box margin={{ top: 'medium' }} gap="medium">
                        <InputWrap
                          action={() => console.log('maxAction')}
                          isError={closeError}
                          disabled={!selectedSeries}
                          message={
                            <>
                              {maxClose.lt(selectedSeries?.fyTokenBalance!) && (
                                <InputInfoWrap action={() => setCloseInput(maxClose_)}>
                                  <Text color="text" alignSelf="end" size="xsmall">
                                    Max redeemable is {cleanValue(maxClose_, 2)} {selectedBase?.displaySymbol}
                                    {selectedSeries.baseReserves.eq(maxClose) && ' (limited by protocol)'}
                                  </Text>
                                </InputInfoWrap>
                              )}
                            </>
                          }
                        >
                          <TextInput
                            plain
                            type="number"
                            inputMode="decimal"
                            placeholder="Amount to redeem"
                            value={closeInput || ''}
                            onChange={(event: any) =>
                              setCloseInput(cleanValue(event.target.value, selectedSeries.decimals))
                            }
                            disabled={!selectedSeries}
                            icon={<>{selectedBase?.image}</>}
                          />
                          <MaxButton
                            action={() => setCloseInput(maxClose_)}
                            disabled={maxClose_ === '0.0' || !selectedSeries}
                            clearAction={() => setCloseInput('')}
                            showingMax={!!closeInput && closeInput === maxClose_}
                          />
                        </InputWrap>
                      </Box>
                    )}

                    {stepPosition[0] !== 0 && (
                      <ActiveTransaction
                        pad
                        txProcess={closeProcess}
                        cancelAction={() => resetInputs(ActionCodes.CLOSE_POSITION)}
                      >
                        <InfoBite
                          label={`Redeem Position ${selectedBase?.displaySymbol}`}
                          icon={<FiArrowRight />}
                          value={`${cleanValue(closeInput, selectedBase?.digitFormat!)} ${selectedBase?.displaySymbol}`}
                          loading={seriesLoading}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 1 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'medium' }} gap="xsmall" >
        
                        <SeriesSelector
                          selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                          actionType={ActionType.LEND}
                          cardLayout={false}
                        />

                        <InputWrap
                          action={() => console.log('maxAction')}
                          isError={closeError}
                          disabled={!selectedSeries || !rollToSeries}
                        >
                          <TextInput
                            plain
                            type="number"
                            placeholder={`Amount of ${selectedBase?.displaySymbol} to roll`}
                            value={rollInput || ''}
                            onChange={(event: any) =>
                              setRollInput(cleanValue(event.target.value, selectedSeries.decimals))
                            }
                            disabled={!selectedSeries || !rollToSeries}
                            icon={<>{selectedBase?.image}</>}
                          />
                          <MaxButton
                            action={() => setRollInput(maxRoll_)}
                            disabled={maxRoll_ === '0.0' || !selectedSeries || !rollToSeries}
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
                          value={` Roll${rollProcess?.processActive ? 'ing' : ''}  ${cleanValue(
                            rollInput,
                            selectedBase?.digitFormat!
                          )} ${selectedBase?.displaySymbol} to ${rollToSeries?.displayName}`}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 2 && <YieldHistory seriesOrVault={selectedSeries!} view={['TRADE']} />}
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
                          nFormatter(Number(closeInput), selectedBase?.digitFormat!) || ''
                        } ${selectedBase?.displaySymbol}`}
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
                          nFormatter(Number(rollInput), selectedBase?.digitFormat!) || ''
                        } ${selectedBase?.displaySymbol}`}
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

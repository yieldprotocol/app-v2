import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Box, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { useParams } from 'react-router-dom';
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
import CancelButton from '../components/buttons/CancelButton';
import TransactButton from '../components/buttons/TransactButton';
import YieldHistory from '../components/YieldHistory';
import { useInputValidation } from '../hooks/useInputValidation';
import ModalWrap from '../components/wraps/ModalWrap';
import { useLendHelpers } from '../hooks/actionHelperHooks/useLendHelpers';
import { useClosePosition } from '../hooks/actionHooks/useClosePosition';
import { useRollPosition } from '../hooks/actionHooks/useRollPosition';
import CopyWrap from '../components/wraps/CopyWrap';
import { useProcess } from '../hooks/useProcess';

const LendPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const { id: idFromUrl } = useParams<{ id: string }>();

  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { selectedSeriesId, seriesMap, assetMap, seriesLoading } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId || idFromUrl);
  const selectedBase = assetMap.get(selectedSeries?.baseId!);

  /* LOCAL STATE */

  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });

  // stepper for stepping within multiple tabs
  const [stepPosition, setStepPosition] = useState<number[]>([0, 0, 0]);

  const [closeInput, setCloseInput] = useState<string | undefined>();
  const [rollInput, setRollInput] = useState<string | undefined>();
  const [rollToSeries, setRollToSeries] = useState<ISeries | null>(null);

  const [closeDisabled, setCloseDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);
  // const [redeemDisabled, setRedeemDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  const { fyTokenMarketValue, maxClose } = useLendHelpers(selectedSeries!);
  const { maxLend } = useLendHelpers(rollToSeries!);

  const closePosition = useClosePosition();
  const rollPosition = useRollPosition();

  /* Processes to watch */
  const { txProcess: closeProcess, resetProcess: resetCloseProcess } = useProcess(
    ActionCodes.CLOSE_POSITION,
    selectedSeries?.id
  );
  const { txProcess: rollProcess, resetProcess: resetRollProcess } = useProcess(
    ActionCodes.ROLL_POSITION,
    selectedSeries?.id
  );

  /* input validation hooks */
  const { inputError: closeError } = useInputValidation(closeInput, ActionCodes.CLOSE_POSITION, selectedSeries, [
    0,
    maxClose,
  ]);

  const { inputError: rollError } = useInputValidation(rollInput, ActionCodes.ROLL_POSITION, selectedSeries, [
    0,
    maxClose,
  ]);

  const { inputError: rollToError } = useInputValidation(rollInput, ActionCodes.ROLL_POSITION, rollToSeries!, [
    0,
    maxLend,
  ]);

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    const validatedSteps = newStepArray.map((x: number) => (x >= 0 ? x : 0));
    setStepPosition(validatedSteps);
  };

  const handleClosePosition = () => {
    !closeDisabled && closePosition(closeInput, selectedSeries!);
  };

  const handleRollPosition = () => {
    !rollDisabled && rollToSeries && rollPosition(rollInput, selectedSeries!, rollToSeries);
  };

  const resetInputs = (actionCode: ActionCodes) => {
    if (actionCode === ActionCodes.CLOSE_POSITION) {
      handleStepper(true);
      setCloseInput(undefined);
      resetCloseProcess();
    }
    if (actionCode === ActionCodes.ROLL_POSITION) {
      handleStepper(true);
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
    idFromUrl && userActions.setSelectedSeries(idFromUrl);
  }, [idFromUrl]);

  /* INTERNAL COMPONENTS */
  const CompletedTx = (props: any) => (
    <>
      <NextButton
        label={<Text size={mobile ? 'xsmall' : undefined}>Go back</Text>}
        onClick={() => {
          props.resetTx();
          handleStepper(true);
          resetInputs(props.actionCode);
        }}
      />
    </>
  );

  return (
    <>
      {selectedSeries && (
        <ModalWrap series={selectedSeries}>
          <CenterPanelWrap>
            <Box fill gap="small" pad={mobile ? 'medium' : 'large'}>
              <Box height={{ min: '250px' }} gap="2em">
                <Box
                  direction="row-responsive"
                  justify="between"
                  fill="horizontal"
                  align="center"
                  pad={{ top: mobile ? 'medium' : undefined }}
                >
                  <Box direction="row" align="center" gap="medium">
                    <PositionAvatar position={selectedSeries!} actionType={ActionType.LEND} />
                    <Box>
                      <Text size={mobile ? 'medium' : 'large'}> {selectedSeries?.displayName} </Text>
                      <CopyWrap>
                        <Text size="small"> {abbreviateHash(selectedSeries?.fyTokenAddress!, 6)}</Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                </Box>

                <SectionWrap>
                  <Box gap="small">
                    <InfoBite
                      label="Maturity date:"
                      value={`${selectedSeries?.fullDate}`}
                      icon={<FiClock color={selectedSeries?.color} />}
                    />
                    <InfoBite
                      label="Portfolio value at Maturity"
                      value={`${cleanValue(
                        selectedSeries?.fyTokenBalance_!,
                        selectedBase?.digitFormat!
                      )} ${selectedBase?.symbol!}`}
                      icon={<FiTrendingUp />}
                      loading={seriesLoading}
                    />
                    <InfoBite
                      label="Current value"
                      value={`${cleanValue(fyTokenMarketValue, selectedBase?.digitFormat!)} ${selectedBase?.symbol!}`}
                      icon={selectedBase?.image}
                      loading={seriesLoading}
                    />
                  </Box>
                </SectionWrap>
              </Box>

              <Box height={{ min: '300px' }}>
                <SectionWrap title="Position Actions" icon={<FiTool />}>
                  <Box elevation="xsmall" round="xsmall" background={mobile ? 'white' : undefined}>
                    <Select
                      plain
                      dropProps={{ round: 'xsmall' }}
                      options={[
                        { text: `Redeem ${selectedBase?.symbol}`, index: 0 },
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
                        >
                          <TextInput
                            plain
                            type="number"
                            placeholder="Amount to reclaim"
                            value={closeInput || ''}
                            onChange={(event: any) => setCloseInput(cleanValue(event.target.value))}
                            disabled={!selectedSeries}
                            icon={<>{selectedBase?.image}</>}
                          />
                          <MaxButton
                            action={() => setCloseInput(maxClose)}
                            disabled={maxClose === '0.0' || !selectedSeries}
                            clearAction={() => setCloseInput('')}
                            showingMax={!!closeInput && closeInput === maxClose}
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
                          label={`Redeem Position ${selectedBase?.symbol}`}
                          icon={<FiArrowRight />}
                          value={`${cleanValue(closeInput, selectedBase?.digitFormat!)} ${selectedBase?.symbol}`}
                          loading={seriesLoading}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 1 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'medium' }} gap="small">
                        <InputWrap
                          action={() => console.log('maxAction')}
                          isError={closeError}
                          disabled={!selectedSeries}
                        >
                          <TextInput
                            plain
                            type="number"
                            placeholder={`Amount of ${selectedBase?.symbol} to roll`}
                            value={rollInput || ''}
                            onChange={(event: any) => setRollInput(cleanValue(event.target.value))}
                            disabled={!selectedSeries}
                            icon={<>{selectedBase?.image}</>}
                          />
                          <MaxButton
                            action={() => setRollInput(maxClose)}
                            disabled={maxClose === '0.0' || !selectedSeries}
                            clearAction={() => setRollInput('')}
                            showingMax={!!rollInput && rollInput === maxClose}
                          />
                        </InputWrap>

                        <SeriesSelector
                          selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                          actionType={ActionType.LEND}
                          cardLayout={false}
                        />
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
                          )} ${selectedBase?.symbol} to ${rollToSeries?.displayName}`}
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
                  label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
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
                        {`Clos${closeProcess?.processActive ? 'ing' : 'e'} ${
                          nFormatter(Number(closeInput), selectedBase?.digitFormat!) || ''
                        } ${selectedBase?.symbol}`}
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
                        } ${selectedBase?.symbol}`}
                      </Text>
                    }
                    onClick={() => handleRollPosition()}
                    disabled={rollDisabled || rollProcess?.processActive}
                  />
                )}

              {stepPosition[actionActive.index] === 1 &&
                actionActive.index === 0 &&
                closeProcess?.stage === ProcessStage.PROCESS_COMPLETE && (
                  <CompletedTx
                    tx={closeProcess}
                    resetTx={() => resetCloseProcess()}
                    actionCode={ActionCodes.CLOSE_POSITION}
                  />
                )}

              {stepPosition[actionActive.index] === 1 &&
                actionActive.index === 1 &&
                rollProcess?.stage === ProcessStage.PROCESS_COMPLETE && (
                  <CompletedTx
                    tx={rollProcess}
                    resetTx={() => resetRollProcess()}
                    actionCode={ActionCodes.ROLL_POSITION}
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

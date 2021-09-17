import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Box, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import { useHistory, useParams } from 'react-router-dom';
import { FiArrowRight, FiPercent, FiSlash, FiTrendingUp } from 'react-icons/fi';

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

import YieldMark from '../components/logos/YieldMark';
import CancelButton from '../components/buttons/CancelButton';
import TransactButton from '../components/buttons/TransactButton';
import YieldHistory from '../components/YieldHistory';
import { useInputValidation } from '../hooks/useInputValidation';
import ModalWrap from '../components/wraps/ModalWrap';
import { useRemoveLiquidity } from '../hooks/actionHooks/useRemoveLiquidity';
import { useRollLiquidity } from '../hooks/actionHooks/useRollLiquidity';
import CopyWrap from '../components/wraps/CopyWrap';
import { useProcess } from '../hooks/useProcess';

const PoolPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const history = useHistory();
  const { id: idFromUrl } = useParams<{ id: string }>();

  /* STATE FROM CONTEXT */
  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedStrategyAddr, strategyMap, assetMap, seriesLoading } = userState;

  // const selectedSeries = seriesMap.get(selectedSeriesId || idFromUrl);
  // const selectedBase = assetMap.get(selectedSeries?.baseId!);
  const selectedStrategy = strategyMap.get(selectedStrategyAddr || idFromUrl);
  const selectedSeries = selectedStrategy?.currentSeries;
  const selectedBase = assetMap.get(selectedStrategy?.baseId!);

  /* LOCAL STATE */
  const [removeInput, setRemoveInput] = useState<string | undefined>(undefined);
  const [rollInput, setRollInput] = useState<string | undefined>(undefined);
  const [rollToSeries, setRollToSeries] = useState<ISeries | null>(null);
  const [maxRemove, setMaxRemove] = useState<string | undefined>();

  // const [removeError, setRemoveError] = useState<string | null>(null);
  // const [rollError, setRollError] = useState<string | null>(null);

  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  // multi-tracking stepper
  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });
  const [stepPosition, setStepPosition] = useState<number[]>([0, 0, 0]);

  /* HOOK FNS */
  const removeLiquidity = useRemoveLiquidity();
  const rollLiquidity = useRollLiquidity();

  /* TX data */
  const { txProcess: removeProcess, resetProcess: resetRemoveProcess } = useProcess(
    ActionCodes.REMOVE_LIQUIDITY,
    selectedSeries?.id
  );
  const { txProcess: rollProcess, resetProcess: resetRollProcess } = useProcess(
    ActionCodes.ROLL_LIQUIDITY,
    selectedSeries?.id
  );

  /* input validation hoooks */
  const { inputError: removeError } = useInputValidation(removeInput, ActionCodes.REMOVE_LIQUIDITY, selectedSeries, [
    0,
    maxRemove,
  ]);

  const { inputError: rollError } = useInputValidation(rollInput, ActionCodes.ROLL_LIQUIDITY, selectedSeries, [
    0,
    maxRemove,
  ]);

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    setStepPosition(newStepArray);
  };

  const handleRemove = () => {
    // !removeDisabled &&
    console.log(selectedSeries?.displayName);
    selectedSeries && removeLiquidity(removeInput!, selectedSeries);
  };

  const handleRoll = () => {
    // !rollDisabled &&
    selectedSeries && rollToSeries && rollLiquidity(rollInput!, selectedSeries, rollToSeries);
  };

  const resetInputs = 
    (actionCode: ActionCodes) => {
      if (actionCode === ActionCodes.REMOVE_LIQUIDITY) {
        handleStepper(true);
        setRemoveInput(undefined);
        resetRemoveProcess();
      }
      if (actionCode === ActionCodes.ROLL_LIQUIDITY) {
        handleStepper(true);
        setRollInput(undefined);
        resetRollProcess();
      }
    };

  /* SET MAX VALUES */
  useEffect(() => {
    /* Checks the max available to roll or move */
    const max = selectedStrategy?.accountBalance;
    if (max) setMaxRemove(ethers.utils.formatUnits(max, selectedStrategy?.decimals).toString());
  }, [rollInput, selectedStrategy, setMaxRemove]);

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */
  useEffect(() => {
    !removeInput || removeError ? setRemoveDisabled(true) : setRemoveDisabled(false);
    !rollInput || !rollToSeries || rollError ? setRollDisabled(true) : setRollDisabled(false);
  }, [activeAccount, removeError, removeInput, rollError, rollInput, rollToSeries]);

  useEffect(() => {
    !selectedStrategyAddr && idFromUrl && userActions.setSelectedStrategy(idFromUrl);
  }, [selectedStrategyAddr, idFromUrl, userActions.setSelectedStrategy]);

  /* watch process timeouts */
  useEffect(() => {
    removeProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.REMOVE_LIQUIDITY);
    rollProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.ROLL_LIQUIDITY);
  }, [removeProcess?.stage, rollProcess?.stage]);

  /* INTERNAL COMPONENTS */
  const CompletedTx = (props: any) => (
    <>
      <NextButton
        // size="xsmall"
        label={<Text size={mobile ? 'xsmall' : undefined}>Go back</Text>}
        onClick={() => {
          props.resetTx();
          handleStepper(true);
          resetInputs(props.actionCode);
        }}
      />
      {/* {props.tx.failed && <EtherscanButton txHash={props.tx.txHash} />} */}
    </>
  );

  return (
    <>
      {selectedStrategy && (
        <ModalWrap series={selectedSeries}>
          <CenterPanelWrap>
            <Box fill pad={mobile ? 'medium' : 'large'} gap="small">
              <Box height={{ min: '250px' }} gap="2em">
                <Box direction="row-responsive" justify="between" fill="horizontal" align="center">
                  <Box direction="row" align="center" gap="medium">
                    {/* <PositionAvatar position={selectedStrategy} /> */}
                    <PositionAvatar position={selectedSeries!} actionType={ActionType.POOL} />
                    <Box>
                      <Text size={mobile ? 'medium' : 'large'}> {selectedStrategy?.name} </Text>
                      <CopyWrap>
                        <Text size="small"> {abbreviateHash(selectedStrategyAddr!, 6)}</Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                  {/* <ExitButton action={() => history.goBack()} /> */}
                </Box>

                <SectionWrap>
                  <Box gap="small">
                    {/* <InfoBite label="Vault debt + interest:" value={`${selectedVault?.art_} ${vaultBase?.symbol}`} icon={<FiTrendingUp />} /> */}

                    <InfoBite
                      label="Strategy Token Balance"
                      value={cleanValue(selectedStrategy?.accountBalance_, selectedBase?.digitFormat!)}
                      icon={<YieldMark height="1em" colors={[selectedSeries?.startColor!]} />}
                      loading={seriesLoading}
                    />

                    {!selectedStrategy.currentSeries && (
                      <InfoBite
                        label="Strategy is currently inactive"
                        value="Only token removal allowed"
                        icon={<FiSlash />}
                        loading={seriesLoading}
                      />
                    )}

                    {selectedStrategy.currentSeries && (
                      <InfoBite
                        label="Strategy Token percentage"
                        value={`${cleanValue(selectedStrategy?.accountStrategyPercent, 4)} %  of ${nFormatter(
                          parseFloat(selectedStrategy?.strategyTotalSupply_!),
                          2
                        )}`}
                        icon={<FiPercent />}
                        loading={seriesLoading}
                      />
                    )}

                    {selectedStrategy.currentSeries && (
                      <InfoBite
                        label="Returns in current Pool"
                        value={`${cleanValue(selectedStrategy?.accountStrategyPercent, 4)}% `}
                        icon={<FiTrendingUp />}
                        loading={seriesLoading}
                      />
                    )}

                    {/* <InfoBite label="Maturity date:" value={`${selectedSeries?.fullDate}`} icon={<FiClock />} /> */}
                  </Box>
                </SectionWrap>
              </Box>

              <Box height={{ min: '300px' }}>
                <SectionWrap title="Position Actions">
                  <Box elevation="xsmall" round="xsmall">
                    <Select
                      plain
                      dropProps={{ round: 'xsmall' }}
                      options={[
                        { text: 'Remove Liquidity', index: 0 },
                        { text: 'View Transaction History', index: 1 },
                        // { text: 'Roll Liquidity', index: 2 },
                      ]}
                      labelKey="text"
                      valueKey="index"
                      value={actionActive}
                      onChange={({ option }) => setActionActive(option)}
                    />
                  </Box>
                </SectionWrap>

                {actionActive.index === 0 && (
                  <>
                    {stepPosition[0] === 0 && (
                      <Box margin={{ top: 'medium' }} gap="medium">
                        <InputWrap action={() => console.log('maxAction')} isError={removeError}>
                          <TextInput
                            plain
                            type="number"
                            placeholder="Tokens to remove"
                            value={removeInput || ''}
                            onChange={(event: any) => setRemoveInput(cleanValue(event.target.value))}
                          />
                          <MaxButton
                            action={() => setRemoveInput(maxRemove)}
                            disabled={maxRemove === '0.0'}
                            clearAction={() => setRemoveInput('')}
                            showingMax={!!removeInput && removeInput === maxRemove}
                          />
                        </InputWrap>
                      </Box>
                    )}

                    {stepPosition[0] !== 0 && (
                      <ActiveTransaction
                        pad
                        txProcess={removeProcess}
                        cancelAction={() => resetInputs(ActionCodes.REMOVE_LIQUIDITY)}
                      >
                        <Box margin={{ top: 'medium' }}>
                          <InfoBite
                            label="Remove Liquidity"
                            icon={<FiArrowRight />}
                            value={`${cleanValue(removeInput, selectedBase?.digitFormat!)} liquidity tokens`}
                          />
                        </Box>
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 1 && <YieldHistory seriesOrVault={selectedStrategy!} view={['POOL']} />}

                {actionActive.index === 2 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'medium' }} gap="medium">
                        <InputWrap action={() => console.log('maxAction')} isError={rollError}>
                          <TextInput
                            plain
                            type="number"
                            placeholder="Tokens to roll"
                            value={rollInput || ''}
                            onChange={(event: any) => setRollInput(cleanValue(event.target.value))}
                          />
                          <MaxButton
                            action={() => setRollInput(maxRemove)}
                            disabled={maxRemove === '0.0'}
                            clearAction={() => setRollInput('')}
                            showingMax={!!rollInput && rollInput === maxRemove}
                          />
                        </InputWrap>
                        <SeriesSelector
                          selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                          actionType={ActionType.POOL}
                          cardLayout={false}
                        />
                      </Box>
                    )}

                    {stepPosition[actionActive.index] !== 0 && (
                      <ActiveTransaction
                        pad
                        txProcess={rollProcess}
                        cancelAction={() => resetInputs(ActionCodes.ROLL_LIQUIDITY)}
                      >
                        <Box margin={{ top: 'medium' }}>
                          <InfoBite
                            label="Roll Liquidity"
                            icon={<FiArrowRight />}
                            value={`${cleanValue(rollInput, selectedBase?.digitFormat!)} Liquidity Tokens to ${
                              rollToSeries?.displayName
                            } `}
                          />
                        </Box>
                      </ActiveTransaction>
                    )}
                  </>
                )}
              </Box>
            </Box>

            <ActionButtonGroup pad>
              {stepPosition[actionActive.index] === 0 && actionActive.index !== 1 && (
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
                  onClick={() => handleStepper()}
                  key="next"
                  disabled={(actionActive.index === 0 && removeDisabled) || (actionActive.index === 2 && rollDisabled)}
                  errorLabel={(actionActive.index === 0 && removeError) || (actionActive.index === 2 && rollError)}
                />
              )}

              {actionActive.index === 0 &&
                stepPosition[actionActive.index] !== 0 &&
                removeProcess?.stage !== ProcessStage.PROCESS_COMPLETE && (
                  // !(removeTx.success || removeTx.failed) && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>
                        {`Remov${removeProcess?.processActive ? 'ing' : 'e'} ${
                          cleanValue(removeInput, selectedBase?.digitFormat!) || ''
                        } tokens`}
                      </Text>
                    }
                    onClick={() => handleRemove()}
                    disabled={removeDisabled || removeProcess?.processActive}
                  />
                )}

              {actionActive.index === 2 &&
                stepPosition[actionActive.index] !== 0 &&
                removeProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
                rollProcess?.stage === ProcessStage.PROCESS_COMPLETE && (
                  // !(removeTx.success || removeTx.failed || rollTx.success || rollTx.failed) && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>
                        {`Roll${rollProcess?.processActive ? 'ing' : ''} ${
                          cleanValue(rollInput, selectedBase?.digitFormat!) || ''
                        } tokens`}
                      </Text>
                    }
                    onClick={() => handleRoll()}
                    disabled={rollDisabled || rollProcess?.processActive}
                  />
                )}

              {stepPosition[actionActive.index] === 1 &&
                actionActive.index === 0 &&
                !removeProcess?.processActive &&
                removeProcess?.stage === ProcessStage.PROCESS_COMPLETE && (
                  <CompletedTx
                    tx={removeProcess}
                    resetTx={() => resetRemoveProcess()}
                    actionCode={ActionCodes.REMOVE_LIQUIDITY}
                  />
                )}

              {stepPosition[actionActive.index] === 2 &&
                actionActive.index === 2 &&
                !rollProcess?.processActive &&
                rollProcess?.stage === ProcessStage.PROCESS_COMPLETE && (
                  <CompletedTx
                    tx={rollProcess}
                    resetTx={() => resetRollProcess()}
                    actionCode={ActionCodes.ROLL_LIQUIDITY}
                  />
                )}
            </ActionButtonGroup>
          </CenterPanelWrap>
        </ModalWrap>
      )}
    </>
  );
};

export default PoolPosition;

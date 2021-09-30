import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Box, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import { useHistory, useParams } from 'react-router-dom';
import { FiArrowRight, FiPercent, FiSlash, FiTrendingUp } from 'react-icons/fi';

import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import InputWrap from '../components/wraps/InputWrap';
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
import TransactButton from '../components/buttons/TransactButton';
import YieldHistory from '../components/YieldHistory';
import { useInputValidation } from '../hooks/useInputValidation';
import ModalWrap from '../components/wraps/ModalWrap';
import { useRemoveLiquidity } from '../hooks/actionHooks/useRemoveLiquidity';
import CopyWrap from '../components/wraps/CopyWrap';
import { useProcess } from '../hooks/useProcess';
import { usePoolHelpers } from '../hooks/actionHelperHooks/usePoolHelpers';
import InputInfoWrap from '../components/wraps/InputInfoWrap';
import { ZERO_BN } from '../utils/constants';

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
  const [maxRemove, setMaxRemove] = useState<string | undefined>();

  const [ignoreVault, setIgnoreVault] = useState<boolean>(false);

  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);

  // multi-tracking stepper
  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });
  const [stepPosition, setStepPosition] = useState<number[]>([0, 0, 0]);

  /* HOOK FNS */
  const removeLiquidity = useRemoveLiquidity();
  const { matchingVault, maxRemoveWithVault, maxRemoveNoVault, healthyBaseReserves, fyTokenTradePossible } =
    usePoolHelpers(removeInput);

  /* TX data */
  const { txProcess: removeProcess, resetProcess: resetRemoveProcess } = useProcess(
    ActionCodes.REMOVE_LIQUIDITY,
    selectedSeries?.id
  );

  /* input validation hooks */
  const { inputError: removeError } = useInputValidation(removeInput, ActionCodes.REMOVE_LIQUIDITY, selectedSeries, [
    0,
    matchingVault ? maxRemoveWithVault : maxRemoveNoVault,
  ]);

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    const validatedSteps = newStepArray.map((x: number) => (x >= 0 ? x : 0));
    setStepPosition(validatedSteps);
  };

  const handleRemove = () => {
    // !removeDisabled &&
    const _vault = ignoreVault ? undefined : matchingVault;
    selectedSeries && removeLiquidity(removeInput!, selectedSeries, _vault);
  };

  const resetInputs = (actionCode: ActionCodes) => {
    if (actionCode === ActionCodes.REMOVE_LIQUIDITY) {
      handleStepper(true);
      setRemoveInput(undefined);
      resetRemoveProcess();
    }
  };

  /* SET MAX VALUES */
  useEffect(() => {
    /* Checks the max available to roll or move */
    selectedStrategy && matchingVault
      ? // ? setMaxRemove( maxRemoveWithVault )
        setMaxRemove(maxRemoveNoVault)
      : setMaxRemove(maxRemoveNoVault);
  }, [selectedStrategy, matchingVault, maxRemoveNoVault, maxRemoveWithVault, setMaxRemove]);

  /* ACTION DISABLING LOGIC - if ANY conditions are met: block action */
  useEffect(() => {
    !removeInput || removeError ? setRemoveDisabled(true) : setRemoveDisabled(false);
  }, [activeAccount, removeError, removeInput]);

  useEffect(() => {
    !selectedStrategyAddr && idFromUrl && userActions.setSelectedStrategy(idFromUrl);
  }, [selectedStrategyAddr, idFromUrl, userActions.setSelectedStrategy]);

  /* watch process timeouts */
  useEffect(() => {
    removeProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.REMOVE_LIQUIDITY);
  }, [removeProcess?.stage]);

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
      {selectedStrategy && (
        <ModalWrap series={selectedSeries}>
          <CenterPanelWrap>
            <Box fill pad={mobile ? 'medium' : 'large'} gap="small">
              <Box height={{ min: '250px' }} gap="2em">
                <Box
                  direction="row-responsive"
                  justify="between"
                  fill="horizontal"
                  align="center"
                  pad={{ top: mobile ? 'medium' : undefined }}
                >
                  <Box direction="row" align="center" gap="medium">
                    <PositionAvatar position={selectedSeries!} actionType={ActionType.POOL} />
                    <Box>
                      <Text size={mobile ? 'medium' : 'large'}> {selectedStrategy?.name} </Text>
                      <CopyWrap>
                        <Text size="small"> {abbreviateHash(selectedStrategyAddr!, 6)}</Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                </Box>

                <SectionWrap>
                  <Box gap="small">
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
                        value={`${cleanValue(selectedStrategy?.accountStrategyPercent, 2)} %  of ${nFormatter(
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
                        value={`${cleanValue(selectedStrategy?.accountStrategyPercent, 2)}% `}
                        icon={<FiTrendingUp />}
                        loading={seriesLoading}
                      />
                    )}
                  </Box>
                </SectionWrap>
              </Box>

              <Box height={{ min: '300px' }}>
                <SectionWrap title="Position Actions">
                  <Box elevation="xsmall" round="xsmall" background={mobile ? 'white' : undefined}>
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
                        <InputWrap
                          action={() => console.log('maxAction')}
                          isError={removeError}
                          message={
                            <>
                            {!healthyBaseReserves &&
                             !removeInput &&
                             selectedStrategy?.accountBalance?.gt(ZERO_BN) &&
                            <InputInfoWrap>
                              <Text color="text-weak" alignSelf="end" size="xsmall">
                                Pools aren't healthy as they could be. Currently, not all of your liquidity tokens are
                                redeemable for the base.
                              </Text>
                            </InputInfoWrap>
                            }
                            {!healthyBaseReserves &&
                            removeInput && 
                            !fyTokenTradePossible &&
                            <InputInfoWrap>
                              <Text color="text-weak" alignSelf="end" size="xsmall">
                                Input amount exceeds maximum currently tradeable.
                              </Text>
                            </InputInfoWrap>
                            }
                            </>
                          }
                        >
                          <TextInput
                            plain
                            type="number"
                            placeholder="Tokens to remove"
                            value={removeInput || ''}
                            onChange={(event: any) => setRemoveInput(cleanValue(event.target.value))}
                          />
                          <MaxButton
                            action={() => setRemoveInput(maxRemove)}
                            disabled={maxRemove === '0.0' || !healthyBaseReserves}
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
                        <InfoBite
                          label="Remove Liquidity"
                          icon={<FiArrowRight />}
                          value={`${cleanValue(removeInput, selectedBase?.digitFormat!)} liquidity tokens`}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 1 && <YieldHistory seriesOrVault={selectedStrategy!} view={['POOL']} />}
              </Box>
            </Box>

            <ActionButtonGroup pad>
              {stepPosition[actionActive.index] === 0 && actionActive.index !== 1 && (
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
                  onClick={() => handleStepper()}
                  key="next"
                  disabled={(actionActive.index === 0 && removeDisabled) || !fyTokenTradePossible}
                  errorLabel={actionActive.index === 0 && removeError}
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
            </ActionButtonGroup>
          </CenterPanelWrap>
        </ModalWrap>
      )}
    </>
  );
};

export default PoolPosition;

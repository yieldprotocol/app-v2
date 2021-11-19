import React, { useContext, useState, useEffect } from 'react';
import { Box, CheckBox, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { useHistory, useParams } from 'react-router-dom';
import { FiArrowRight, FiPercent, FiSlash } from 'react-icons/fi';

import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import InputWrap from '../components/wraps/InputWrap';
import { abbreviateHash, cleanValue, nFormatter } from '../utils/appUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, IUserContext, ProcessStage } from '../types';
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
import ExitButton from '../components/buttons/ExitButton';

const PoolPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const history = useHistory();
  const { id: idFromUrl } = useParams<{ id: string }>();

  /* STATE FROM CONTEXT */
  const {
    userState,
    userActions: { setSelectedStrategy },
  } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedStrategy, strategyMap, assetMap, seriesLoading } = userState;

  const _selectedStrategy = selectedStrategy || strategyMap.get(idFromUrl);

  const selectedSeries = _selectedStrategy?.currentSeries;
  const selectedBase = assetMap.get(_selectedStrategy?.baseId!);

  /* LOCAL STATE */
  const [removeInput, setRemoveInput] = useState<string | undefined>(undefined);
  const [maxRemove, setMaxRemove] = useState<string | undefined>();
  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);

  const [forceDisclaimerChecked, setForceDisclaimerChecked] = useState<boolean>(false);

  // multi-tracking stepper
  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });
  const [stepPosition, setStepPosition] = useState<number[]>([0, 0, 0]);

  /* HOOK FNS */
  const removeLiquidity = useRemoveLiquidity();
  const { matchingVault, maxRemoveWithVault, maxRemoveNoVault, removeBaseReceived_, partialRemoveRequired } =
    usePoolHelpers(removeInput, true);

  /* TX data */
  const { txProcess: removeProcess, resetProcess: resetRemoveProcess } = useProcess(
    ActionCodes.REMOVE_LIQUIDITY,
    selectedSeries?.id!
  );

  /* input validation hooks */
  const { inputError: removeError } = useInputValidation(removeInput, ActionCodes.REMOVE_LIQUIDITY, selectedSeries!, [
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
    const shouldTradeExtra = partialRemoveRequired && forceDisclaimerChecked ? false : undefined;
    selectedSeries && removeLiquidity(removeInput!, selectedSeries, matchingVault, shouldTradeExtra);
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
    /* Checks the max available to remove */
    _selectedStrategy && matchingVault ? setMaxRemove(maxRemoveWithVault) : setMaxRemove(maxRemoveNoVault);
  }, [_selectedStrategy, matchingVault, maxRemoveNoVault, maxRemoveWithVault, setMaxRemove]);

  /* ACTION DISABLING LOGIC - if ANY conditions are met: block action */
  useEffect(() => {
    !removeInput || removeError ? setRemoveDisabled(true) : setRemoveDisabled(false);
  }, [activeAccount, forceDisclaimerChecked, removeError, removeInput]);

  useEffect(() => {
    const _strategy = strategyMap.get(idFromUrl) || null;
    idFromUrl && setSelectedStrategy(_strategy);
  }, [idFromUrl, setSelectedStrategy, strategyMap]);

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
      {_selectedStrategy && (
        <ModalWrap series={selectedSeries}>
          <CenterPanelWrap>
            <Box fill pad={mobile ? 'medium' : 'large'} gap="small">
              <Box height={{ min: '250px' }} gap="2em">
                <Box
                  direction="row"
                  justify="between"
                  fill="horizontal"
                  align="center"
                  pad={{ top: mobile ? 'medium' : undefined }}
                >
                  <Box direction="row" align="center" gap="medium">
                    <PositionAvatar position={selectedSeries!} actionType={ActionType.POOL} />
                    <Box>
                      <Text size={mobile ? 'medium' : 'large'}> {_selectedStrategy?.name} </Text>
                      <CopyWrap hash={_selectedStrategy.address}>
                        <Text size="small"> {abbreviateHash(_selectedStrategy.address!, 6)}</Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                  <ExitButton action={() => history.goBack()} />
                </Box>

                <SectionWrap>
                  <Box gap="small">
                    <InfoBite
                      label="Strategy Token Balance"
                      value={cleanValue(_selectedStrategy?.accountBalance_, selectedBase?.digitFormat!)}
                      icon={<YieldMark height="1em" colors={[selectedSeries?.startColor!]} />}
                      loading={seriesLoading}
                    />

                    {!_selectedStrategy.currentSeries && (
                      <InfoBite
                        label="Strategy is currently inactive"
                        value="Only token removal allowed"
                        icon={<FiSlash />}
                        loading={seriesLoading}
                      />
                    )}

                    {_selectedStrategy.currentSeries && (
                      <InfoBite
                        label="Strategy Token Ownership"
                        value={`${cleanValue(_selectedStrategy?.accountStrategyPercent, 2)} %  of ${nFormatter(
                          parseFloat(_selectedStrategy?.strategyTotalSupply_!),
                          2
                        )}`}
                        icon={<FiPercent />}
                        loading={seriesLoading}
                      />
                    )}

                    {/* {selectedStrategy.currentSeries && accountTradeValue && (
                      <InfoBite
                        label="Strategy Token Value"
                        value={`${cleanValue(accountTradeValue!, selectedBase?.digitFormat)} ${selectedBase?.displaySymbol}`}
                        icon={<FiTrendingUp />}
                        loading={seriesLoading}
                      />
                    )} */}
                  </Box>
                </SectionWrap>
              </Box>

              <Box height={{ min: '300px' }}>
                <SectionWrap title="Position Actions">
                  <Box elevation="xsmall" round="xsmall" background={mobile ? 'hoverBackground' : 'hoverBackground'}>
                    <Select
                      plain
                      dropProps={{ round: 'xsmall' }}
                      options={[
                        { text: 'Remove Liquidity Tokens', index: 0 },
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
                              {/* {(!removeTradePossible &&
                                removeInput &&
                                selectedSeries &&
                                !selectedSeries.seriesIsMature) ||
                                (inputTradeValue?.eq(ethers.constants.Zero) && (
                                  <InputInfoWrap>
                                    <Text color="text-weak" alignSelf="end" size="xsmall">
                                      Input amount exceeds maximum currently tradeable.
                                    </Text>
                                  </InputInfoWrap>
                                ))} */}

                              {removeInput && !partialRemoveRequired && !removeError && (
                                <InputInfoWrap>
                                  <Text color="text-weak" alignSelf="end" size="small">
                                    Approx. return {cleanValue(removeBaseReceived_, selectedBase?.digitFormat)}{' '}
                                    {selectedBase?.displaySymbol}
                                  </Text>
                                </InputInfoWrap>
                              )}

                              {removeInput && partialRemoveRequired && !removeError && (
                                <InputInfoWrap>
                                  <Box gap="xsmall" pad={{ right: 'medium' }} justify="between">
                                    <Text color="text-weak" alignSelf="end" size="xsmall">
                                      Removing that amount of tokens and trading immediately for {selectedBase?.displaySymbol}{' '}
                                      is currently not possible due to liquidity limitations.
                                    </Text>
                                  </Box>
                                </InputInfoWrap>
                              )}
                            </>
                          }
                        >
                          <TextInput
                            plain
                            type="number"
                            placeholder="Tokens to remove"
                            value={removeInput || ''}
                            onChange={(event: any) =>
                              setRemoveInput(cleanValue(event.target.value, selectedSeries?.decimals))
                            }
                            icon={<YieldMark height="1em" colors={[selectedSeries?.startColor!]} />}
                          />
                          <MaxButton
                            action={() => setRemoveInput(maxRemove)}
                            disabled={maxRemove === '0.0' || !selectedSeries || selectedSeries.seriesIsMature}
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
                          label="Remove Liquidity Tokens"
                          icon={<FiArrowRight />}
                          value={`${cleanValue(removeInput, selectedBase?.digitFormat!)} tokens`}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}
                {actionActive.index === 1 && <YieldHistory seriesOrVault={_selectedStrategy!} view={['POOL']} />}
              </Box>
            </Box>

            <ActionButtonGroup pad>
              {stepPosition[actionActive.index] === 0 && removeInput && partialRemoveRequired && !removeError && (
                <Box fill="horizontal" pad={{ vertical: 'small', horizontal: 'xsmall' }}>
                  <CheckBox
                    label={
                      <Box>
                        {/* <Text size="xsmall">Force Removal: </Text> */}
                        {/* <Text size="xsmall">
                            {`( You will receive `}
                            {cleanValue(removeFyTokenReceived_, 2)} fy{selectedBase?.displaySymbol}{' '}
                            {removeFyTokenReceived?.gt(ethers.constants.Zero) &&
                              ` and ${cleanValue(removeBaseReceived_, 2)} ${selectedBase?.displaySymbol} )`}
                          </Text> */}
                        <Text size="xsmall">
                          Force Removal:
                          {` (You will receive about ${cleanValue(removeBaseReceived_, 2)} ${selectedBase?.displaySymbol} `}
                          {`and then rest will be in redeemable fy${selectedBase?.displaySymbol})`}
                        </Text>
                      </Box>
                    }
                    checked={forceDisclaimerChecked}
                    onChange={() => setForceDisclaimerChecked(!forceDisclaimerChecked)}
                  />
                </Box>
              )}

              {stepPosition[actionActive.index] === 0 && actionActive.index !== 1 && (
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}>Next Step</Text>}
                  onClick={() => handleStepper()}
                  key="next"
                  disabled={
                    (actionActive.index === 0 && removeDisabled) || (partialRemoveRequired && !forceDisclaimerChecked)
                  }
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

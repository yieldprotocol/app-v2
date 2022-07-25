import { useRouter } from 'next/router';
import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Box, CheckBox, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { FiArrowRight, FiChevronDown, FiClock, FiPercent, FiSlash } from 'react-icons/fi';

import ActionButtonGroup from '../wraps/ActionButtonWrap';
import InputWrap from '../wraps/InputWrap';
import { abbreviateHash, cleanValue, formatStrategyName, nFormatter } from '../../utils/appUtils';
import SectionWrap from '../wraps/SectionWrap';

import { UserContext } from '../../contexts/UserContext';
import { ActionCodes, ActionType, IUserContext, ProcessStage } from '../../types';
import MaxButton from '../buttons/MaxButton';
import InfoBite from '../InfoBite';
import ActiveTransaction from '../ActiveTransaction';
import PositionAvatar from '../PositionAvatar';
import CenterPanelWrap from '../wraps/CenterPanelWrap';
import NextButton from '../buttons/NextButton';

import YieldMark from '../logos/YieldMark';
import TransactButton from '../buttons/TransactButton';
import YieldHistory from '../YieldHistory';
import { useInputValidation } from '../../hooks/useInputValidation';
import ModalWrap from '../wraps/ModalWrap';
import { useRemoveLiquidity } from '../../hooks/actionHooks/useRemoveLiquidity';
import CopyWrap from '../wraps/CopyWrap';
import { useProcess } from '../../hooks/useProcess';
import { usePoolHelpers } from '../../hooks/viewHelperHooks/usePoolHelpers';
import InputInfoWrap from '../wraps/InputInfoWrap';
import ExitButton from '../buttons/ExitButton';

const PoolPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const router = useRouter();
  const { id: idFromUrl } = router.query;

  /* STATE FROM CONTEXT */
  const {
    userState,
    userActions: { setSelectedStrategy },
  } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedStrategy, strategyMap, assetMap, seriesLoading } = userState;

  const _selectedStrategy = selectedStrategy || strategyMap.get(idFromUrl as string);

  const selectedSeries = _selectedStrategy?.currentSeries;
  const selectedBase = assetMap.get(_selectedStrategy?.baseId!);

  /* LOCAL STATE */
  const [removeInput, setRemoveInput] = useState<string | undefined>(undefined);
  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);

  const [forceDisclaimerChecked, setForceDisclaimerChecked] = useState<boolean>(false);

  // multi-tracking stepper
  const actionCodeToStepperIdx: { [actionCode: string]: number } = useMemo(
    () => ({ [ActionCodes.REMOVE_LIQUIDITY]: 0 }),
    []
  );

  const initialStepperState = [0, 0, 0];
  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });
  const [stepPosition, setStepPosition] = useState<number[]>(initialStepperState);

  /* HOOK FNS */
  const removeLiquidity = useRemoveLiquidity();
  const { matchingVault, maxRemove, removeBaseReceived_, partialRemoveRequired } = usePoolHelpers(removeInput, true);
  const { removeBaseReceived_: removeBaseReceivedMax_ } = usePoolHelpers(_selectedStrategy?.accountBalance_, true);

  /* TX data */
  const { txProcess: removeProcess, resetProcess: resetRemoveProcess } = useProcess(
    ActionCodes.REMOVE_LIQUIDITY,
    selectedSeries?.id!
  );

  /* input validation hooks */
  const { inputError: removeError } = useInputValidation(removeInput, ActionCodes.REMOVE_LIQUIDITY, selectedSeries!, [
    0,
    maxRemove,
  ]);

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    const validatedSteps = newStepArray.map((x: number) => (x >= 0 ? x : 0));
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

  const handleRemove = () => {
    if (removeDisabled) return;
    setRemoveDisabled(true);
    removeLiquidity(removeInput!, selectedSeries, matchingVault);
  };

  const resetInputs = useCallback(
    (actionCode: ActionCodes) => {
      resetStepper(actionCode);
      if (actionCode === ActionCodes.REMOVE_LIQUIDITY) {
        setRemoveInput(undefined);
        resetRemoveProcess();
      }
    },
    [resetRemoveProcess, resetStepper]
  );

  /* ACTION DISABLING LOGIC - if ANY conditions are met: block action */
  useEffect(() => {
    !removeInput || removeError || !selectedSeries ? setRemoveDisabled(true) : setRemoveDisabled(false);
  }, [activeAccount, forceDisclaimerChecked, removeError, removeInput, selectedSeries]);

  useEffect(() => {
    const _strategy = strategyMap.get(idFromUrl as string) || null;
    idFromUrl && setSelectedStrategy(_strategy);
  }, [idFromUrl, setSelectedStrategy, strategyMap]);

  /* watch process timeouts */
  useEffect(() => {
    removeProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.REMOVE_LIQUIDITY);
  }, [removeProcess?.stage, resetInputs]);

  return (
    <>
      {_selectedStrategy && (
        <ModalWrap series={selectedSeries}>
          <CenterPanelWrap>
            {!mobile && <ExitButton action={() => router.back()} />}

            <Box fill pad={mobile ? 'medium' : 'large'} gap="1em">
              <Box height={{ min: '250px' }} gap="medium">
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
                      <Text size={mobile ? 'medium' : 'large'}> {formatStrategyName(_selectedStrategy?.name)}</Text>
                      <CopyWrap hash={_selectedStrategy.address}>
                        <Text size="small"> {abbreviateHash(_selectedStrategy.address!, 6)}</Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                </Box>

                <SectionWrap>
                  <Box gap="small">
                    <InfoBite
                      label="Next Roll Date"
                      value={_selectedStrategy?.currentSeries?.fullDate.toString()!}
                      icon={<FiClock height="1em" />}
                      loading={seriesLoading}
                    />

                    <InfoBite
                      label="Strategy Token Balance"
                      value={`${cleanValue(
                        _selectedStrategy?.accountBalance_,
                        selectedBase?.digitFormat!
                      )} tokens (${cleanValue(removeBaseReceivedMax_, selectedBase?.digitFormat!)} ${
                        selectedBase.symbol
                      })`}
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
                  </Box>
                </SectionWrap>
              </Box>

              <Box height={{ min: '300px' }}>
                <SectionWrap title="Position Actions">
                  <Box elevation="xsmall" round background={mobile ? 'hoverBackground' : 'hoverBackground'}>
                    <Select
                      plain
                      size="small"
                      dropProps={{ round: 'small' }}
                      options={[
                        { text: 'Remove Liquidity Tokens', index: 0 },
                        { text: 'View Transaction History', index: 1 },
                      ]}
                      icon={<FiChevronDown />}
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
                      <Box margin={{ top: 'small' }}>
                        <InputWrap action={() => console.log('maxAction')} isError={removeError} round>
                          <TextInput
                            plain
                            type="number"
                            inputMode="decimal"
                            placeholder="Tokens to remove"
                            value={removeInput || ''}
                            onChange={(event: any) =>
                              setRemoveInput(cleanValue(event.target.value, selectedSeries?.decimals))
                            }
                            icon={<YieldMark height="24px" width="24px" colors={[selectedSeries?.startColor!]} />}
                          />
                          <MaxButton
                            action={() => setRemoveInput(maxRemove)}
                            disabled={maxRemove === '0.0'}
                            clearAction={() => setRemoveInput('')}
                            showingMax={!!removeInput && removeInput === maxRemove}
                          />
                        </InputWrap>

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
                {actionActive.index === 1 && <YieldHistory seriesOrVault={_selectedStrategy!} view={['STRATEGY']} />}
              </Box>
            </Box>

            <ActionButtonGroup pad>
              {stepPosition[actionActive.index] === 0 && removeInput && partialRemoveRequired && !removeError && (
                <Box fill="horizontal" pad={{ vertical: 'small', horizontal: 'xsmall' }}>
                  <CheckBox
                    label={
                      <Box>
                        <Text size="xsmall">
                          Force Removal:
                          {` (you will receive about ${cleanValue(removeBaseReceived_, 2)} ${
                            selectedBase?.displaySymbol
                          } `}
                          {`and the rest will be in redeemable fy${selectedBase?.displaySymbol})`}
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
            </ActionButtonGroup>
          </CenterPanelWrap>
        </ModalWrap>
      )}
    </>
  );
};

export default PoolPosition;

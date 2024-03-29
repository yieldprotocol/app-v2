import { useRouter } from 'next/router';
import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Box, CheckBox, ResponsiveContext, Select, Text, TextInput, Tip } from 'grommet';
import { FiArrowRight, FiChevronDown, FiClock, FiSlash, FiStar, FiZap } from 'react-icons/fi';

import ActionButtonGroup from '../wraps/ActionButtonWrap';
import InputWrap from '../wraps/InputWrap';
import { abbreviateHash, cleanValue, formatStrategyName, getTxCode, nFormatter } from '../../utils/appUtils';
import SectionWrap from '../wraps/SectionWrap';

import { UserContext } from '../../contexts/UserContext';
import { ActionCodes, ActionType, ProcessStage } from '../../types';
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
import { useRemoveFraxLiquidity } from '../../hooks/actionHooks/useRemoveFraxLiquidity';
import CopyWrap from '../wraps/CopyWrap';
import { useProcess } from '../../hooks/useProcess';
import { usePoolHelpers } from '../../hooks/viewHelperHooks/usePoolHelpers';
import InputInfoWrap from '../wraps/InputInfoWrap';
import ExitButton from '../buttons/ExitButton';
import { useAccount } from 'wagmi';
import useAnalytics from '../../hooks/useAnalytics';
import { GA_Event, GA_Properties, GA_View } from '../../types/analytics';
import useClaimRewards from '../../hooks/actionHooks/useClaimRewards';
import useStrategyReturns from '../../hooks/useStrategyReturns';
import GeneralButton from '../buttons/GeneralButton';
import { MdShortcut } from 'react-icons/md';
import { ZERO_BN } from '@yield-protocol/ui-math';
import useAccountPlus from '../../hooks/useAccountPlus';
import { StrategyType } from '../../config/strategies';
import { FRAX } from '../../config/assets';
import { FaExclamationCircle } from 'react-icons/fa';
import useChainId from '../../hooks/useChainId';
import useUpgradeTokens from '../../hooks/actionHooks/useUpgradeTokens';
import TermsModal from '../TermsModal';

const PoolPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const router = useRouter();
  const { id: idFromUrl } = router.query;

  /* STATE FROM CONTEXT */
  const {
    userState,
    userActions: { setSelectedStrategy },
  } = useContext(UserContext);
  const { selectedStrategy, strategyMap, assetMap, seriesLoading } = userState;

  const { address: activeAccount } = useAccountPlus();

  const _selectedStrategy = selectedStrategy || strategyMap?.get((idFromUrl as string).toLowerCase());

  const selectedSeries = _selectedStrategy?.currentSeries;
  const selectedBase = assetMap?.get(_selectedStrategy?.baseId!);

  const chainId = useChainId();
  const { isUpgrading, upgradeAllStrategies, completedUpgrade } = useUpgradeTokens();

  /* LOCAL STATE */
  const [removeInput, setRemoveInput] = useState<string | undefined>(undefined);
  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);
  const [claimDisabled, setClaimDisabled] = useState<boolean>(true);
  const [showTerms, setShowTerms] = useState<boolean>(false);

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
  const removeFraxLiquidity = useRemoveFraxLiquidity();
  const { matchingVault, maxRemove, removeBaseReceived_, partialRemoveRequired, removeFyTokenReceived_ } =
    usePoolHelpers(removeInput, true);
  const { removeBaseReceived_: removeBaseReceivedMax_ } = usePoolHelpers(_selectedStrategy?.accountBalance_, true);

  const { logAnalyticsEvent } = useAnalytics();
  const { claimRewards } = useClaimRewards(selectedStrategy!);
  const { returns: lpReturns } = useStrategyReturns(_selectedStrategy?.accountBalance_, _selectedStrategy);

  /* TX data */
  const { txProcess: removeProcess, resetProcess: resetRemoveProcess } = useProcess(
    ActionCodes.REMOVE_LIQUIDITY,
    selectedSeries?.id!
  );

  const { txProcess: claimProcess, resetProcess: resetClaimProcess } = useProcess(
    ActionCodes.CLAIM_REWARDS,
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

  // Logic to allow terms modal for users upgrading their tokens
  const toggleTermsModal = () => {
    setShowTerms(!showTerms);
  };

  const confirmUpgrade = (hasAcceptedTerms: boolean) => {
    if (!hasAcceptedTerms) {
      return;
    }
    upgradeAllStrategies(hasAcceptedTerms);
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

    if (selectedStrategy?.baseId === FRAX) {
      removeFraxLiquidity(removeInput!, selectedSeries!);
    } else {
      removeLiquidity(removeInput!, selectedSeries!, matchingVault);
    }


    logAnalyticsEvent(GA_Event.transaction_initiated, {
      view: GA_View.POOL,
      series_id: selectedStrategy?.currentSeries?.name,
      action_code: ActionCodes.REMOVE_LIQUIDITY,
    } as GA_Properties.transaction_initiated);
  };

  const handleClaim = () => {
    if (claimDisabled) return;
    setClaimDisabled(true);
    claimRewards();

    logAnalyticsEvent(GA_Event.transaction_initiated, {
      view: GA_View.POOL,
      series_id: selectedStrategy?.currentSeries?.name,
      action_code: ActionCodes.CLAIM_REWARDS,
    } as GA_Properties.transaction_initiated);
  };

  const handleMaxAction = () => {
    maxRemove && setRemoveInput(maxRemove);
    logAnalyticsEvent(GA_Event.max_clicked, {
      view: GA_View.POOL,
      action_code: ActionCodes.REMOVE_LIQUIDITY,
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
      if (actionCode === ActionCodes.REMOVE_LIQUIDITY) {
        setRemoveInput(undefined);
        resetRemoveProcess();
      }
    },
    [resetRemoveProcess, resetStepper]
  );

  const restrictOptions =
    selectedStrategy?.type !== StrategyType.V2_1 && chainId === 1 && selectedStrategy?.baseId !== FRAX;

  useEffect(() => {
    if (restrictOptions) setActionActive({ text: 'Upgrade Tokens', index: 3 })
  }, [selectedStrategy, restrictOptions]);

  useEffect(() => {
    if (!isUpgrading && completedUpgrade) {
      router.back()
    }
  }, [isUpgrading, completedUpgrade])


  /* ACTION DISABLING LOGIC - if ANY conditions are met: block action */
  useEffect(() => {
    !removeInput || removeError || (selectedStrategy?.type === StrategyType.V2_1 && !selectedSeries)
      ? setRemoveDisabled(true)
      : setRemoveDisabled(false);
    +selectedStrategy?.accountRewards_! === 0 ? setClaimDisabled(true) : setClaimDisabled(false);
  }, [selectedStrategy, activeAccount, forceDisclaimerChecked, removeError, removeInput, selectedSeries]);

  useEffect(() => {
    const _strategy = strategyMap?.get(idFromUrl as string) || null;
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
                    <PositionAvatar
                      position={selectedSeries!}
                      actionType={ActionType.POOL}
                      type={selectedStrategy?.type}
                    />
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
                    />
                    <InfoBite
                      label="Strategy Token Balance"
                      value={`${cleanValue(_selectedStrategy?.accountBalance_, selectedBase?.digitFormat!)} tokens
                    `}
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

                    {lpReturns && +lpReturns.blendedAPY! > 0 && (
                      <InfoBite
                        textSize="small"
                        label="Variable APY"
                        icon={<FiZap />}
                        value={`${cleanValue(lpReturns.blendedAPY, 2)}%`}
                        labelInfo={
                          <Box>
                            {+lpReturns.rewardsAPY! > 0 && (
                              <Text size="small" weight="lighter">
                                Rewards APY: {lpReturns.rewardsAPY}%
                              </Text>
                            )}
                            {
                              <Text size="small" weight="lighter">
                                {`${selectedBase?.symbol} APY: ${lpReturns.sharesAPY}%`}
                              </Text>
                            }
                            {
                              <Text size="small" weight="lighter">
                                fyToken APY: {lpReturns.fyTokenAPY}%
                              </Text>
                            }
                            {+lpReturns.feesAPY! > 0 && (
                              <Text size="small" weight="lighter">
                                Fees APY: {lpReturns.feesAPY}%
                              </Text>
                            )}
                            <Text size="small" weight="bold">
                              Blended APY: {lpReturns.blendedAPY}%
                            </Text>
                          </Box>
                        }
                      />
                    )}

                    {restrictOptions && (
                      <InfoBite
                        label="This strategy contract has been upgraded"
                        value="You must upgrade your tokens to remove liquidity"
                        icon={<FaExclamationCircle />}
                        loading={false}
                      />
                    )}

                    {selectedStrategy?.accountRewards?.gt(ZERO_BN) && selectedStrategy?.rewardsTokenAddress && (
                      <Box direction="row" gap="large" justify="between">
                        <InfoBite
                          label="Claimable Rewards"
                          value={`${cleanValue(selectedStrategy?.accountRewards_, 6)} ETH`}
                          icon={<FiStar />}
                          loading={seriesLoading}
                        />
                        {actionActive.index !== 2 && (
                          <GeneralButton
                            action={() => handleSetActionActive({ text: 'Claim Rewards', index: 2 })}
                            // action={handleClaim}
                            background="background"
                          >
                            <Text size="xsmall" textAlign="center">
                              <MdShortcut /> Go to Claim rewards
                            </Text>
                          </GeneralButton>
                        )}
                      </Box>
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
                        !restrictOptions && { text: 'Remove Liquidity Tokens', index: 0 },
                        { text: 'View Transaction History', index: 1 },
                        !!selectedStrategy?.rewardsTokenAddress && { text: 'Claim Rewards', index: 2 },
                        restrictOptions && { text: 'Upgrade Tokens', index: 3 },
                      ].filter(Boolean)}
                      icon={<FiChevronDown />}
                      labelKey="text"
                      valueKey="index"
                      value={actionActive}
                      onChange={({ option }) => handleSetActionActive(option)}
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
                            action={() => handleMaxAction()}
                            disabled={maxRemove === '0.0'}
                            clearAction={() => setRemoveInput('')}
                            showingMax={!!removeInput && removeInput === maxRemove}
                          />
                        </InputWrap>
{/* 
                        {removeInput && !partialRemoveRequired && !removeError && removeBaseReceived_ && (
                          <InputInfoWrap>
                            <Text color="text-weak" alignSelf="end" size="small">
                              Approx. return {cleanValue(removeBaseReceived_, selectedBase?.digitFormat)}{' '}
                              {selectedBase?.displaySymbol}
                            </Text>
                          </InputInfoWrap>
                        )} */}

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
                        {/* <Text size='small'>Liquidity Removal Temporarily disabled</Text> */}
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
                          Force removal and
                          {` receive ~${cleanValue(removeBaseReceived_, 2)} ${selectedBase?.displaySymbol} `}
                          {`and ~${removeFyTokenReceived_} fy${selectedBase?.displaySymbol}`}
                        </Text>
                      </Box>
                    }
                    checked={forceDisclaimerChecked}
                    onChange={() => setForceDisclaimerChecked(!forceDisclaimerChecked)}
                  />
                </Box>
              )}

              {stepPosition[actionActive.index] === 0 && ![1, 2].includes(actionActive.index) && (
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

              {actionActive.index === 2 && (
                <TransactButton
                  primary
                  label={
                    <Text size={mobile ? 'small' : undefined}>
                      {`Claim${claimProcess?.processActive ? 'ing' : ''} ${
                        cleanValue(selectedStrategy?.accountRewards_, 8) || ''
                      } ETH`}
                    </Text>
                  }
                  onClick={handleClaim}
                  disabled={claimDisabled || claimProcess?.processActive}
                />
              )}

              {actionActive.index === 3 && (
                <TransactButton
                  primary
                  label={
                    <Text size={mobile ? 'small' : undefined}>
                      {isUpgrading ? 'Upgrading Tokens...' : 'Upgrade Tokens'}
                    </Text>
                  }
                  onClick={() => setShowTerms(true)}
                  disabled={isUpgrading || (!isUpgrading && completedUpgrade)}
                />
              )}
              <TermsModal isOpen={showTerms} onClose={() => toggleTermsModal()} onConfirm={confirmUpgrade}  />
            </ActionButtonGroup>
          </CenterPanelWrap>
        </ModalWrap>
      )}
    </>
  );
};

export default PoolPosition;

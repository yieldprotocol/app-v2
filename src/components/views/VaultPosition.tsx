import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Box, CheckBox, ResponsiveContext, Select, Text, TextInput } from 'grommet';

import { FiClock, FiTrendingUp, FiAlertTriangle, FiArrowRight, FiActivity, FiChevronDown } from 'react-icons/fi';
import { GiMedalSkull } from 'react-icons/gi';

import { abbreviateHash, cleanValue, nFormatter } from '../../utils/appUtils';
import { UserContext } from '../../contexts/UserContext';
import InputWrap from '../wraps/InputWrap';
import InfoBite from '../InfoBite';
import { ActionCodes, ActionType, ISeries, ProcessStage } from '../../types';

import ActionButtonWrap from '../wraps/ActionButtonWrap';
import SectionWrap from '../wraps/SectionWrap';
import SeriesSelector from '../selectors/SeriesSelector';
import MaxButton from '../buttons/MaxButton';
import ActiveTransaction from '../ActiveTransaction';
import PositionAvatar from '../PositionAvatar';
import CenterPanelWrap from '../wraps/CenterPanelWrap';
import NextButton from '../buttons/NextButton';
import { Gauge } from '../Gauge';
import YieldHistory from '../YieldHistory';
import TransactButton from '../buttons/TransactButton';
import { useInputValidation } from '../../hooks/useInputValidation';
import ModalWrap from '../wraps/ModalWrap';

import { useCachedState } from '../../hooks/generalHooks';
import { useRepayDebt } from '../../hooks/actionHooks/useRepayDebt';
import { useRollDebt } from '../../hooks/actionHooks/useRollDebt';
import { useCollateralHelpers } from '../../hooks/viewHelperHooks/useCollateralHelpers';
import { useAddCollateral } from '../../hooks/actionHooks/useAddCollateral';
import { useRemoveCollateral } from '../../hooks/actionHooks/useRemoveCollateral';
import { useBorrowHelpers } from '../../hooks/viewHelperHooks/useBorrowHelpers';
import InputInfoWrap from '../wraps/InputInfoWrap';
import CopyWrap from '../wraps/CopyWrap';
import { useProcess } from '../../hooks/useProcess';
import ExitButton from '../buttons/ExitButton';
import { ZERO_BN } from '../../utils/constants';
import { useAssetPair } from '../../hooks/useAssetPair';
import Logo from '../logos/Logo';
import { useAccount } from 'wagmi';
import useAnalytics from '../../hooks/useAnalytics';
import { GA_Event, GA_View, GA_Properties } from '../../types/analytics';
import useAsset from '../../hooks/useAsset';
import useVault from '../../hooks/useVault';
import useSeriesEntity from '../../hooks/useSeriesEntity';
import useSeriesEntities from '../../hooks/useSeriesEntities';

const VaultPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const prevLoc = useCachedState('lastVisit', '')[0].slice(1).split('/')[0];

  const router = useRouter();
  const { id: idFromUrl } = router.query;
  const { data: seriesMap } = useSeriesEntities();

  /* STATE FROM CONTEXT */
  const { userActions } = useContext(UserContext);
  const { setSelectedBase, setSelectedIlk, setSelectedSeries, setSelectedVault } = userActions;

  const { address: account } = useAccount();

  const { data: vault, isLoading: vaultLoading } = useVault(idFromUrl as string);
  const { data: vaultBase } = useAsset(vault?.baseId!);
  const { data: vaultIlk } = useAsset(vault?.ilkId!);
  const { data: vaultSeries } = useSeriesEntity(vault?.seriesId!);

  const assetPairInfo = useAssetPair(vaultBase, vaultIlk);

  /* TX info (for disabling buttons) */
  const { txProcess: repayProcess, resetProcess: resetRepayProcess } = useProcess(ActionCodes.REPAY, vault?.id!);

  const { txProcess: rollProcess, resetProcess: resetRollProcess } = useProcess(ActionCodes.ROLL_DEBT, vault?.id!);

  const { txProcess: addCollateralProcess, resetProcess: resetAddCollateralProcess } = useProcess(
    ActionCodes.ADD_COLLATERAL,
    vault?.id!
  );

  const { txProcess: removeCollateralProcess, resetProcess: resetRemoveCollateralProcess } = useProcess(
    ActionCodes.REMOVE_COLLATERAL,
    vault?.id!
  );

  /* LOCAL STATE */
  // stepper for stepping within multiple tabs
  const actionCodeToStepperIdx: { [actionCode: string]: number } = useMemo(
    () => ({
      [ActionCodes.REPAY]: 0,
      [ActionCodes.ROLL_DEBT]: 1,
      [ActionCodes.ADD_COLLATERAL]: 2,
      [ActionCodes.REMOVE_COLLATERAL]: 3,
    }),
    []
  );

  const [stepPosition, setStepPosition] = useState<number[]>(new Array(7).fill(0));

  const [repayInput, setRepayInput] = useState<any>(undefined);
  const [reclaimCollateral, setReclaimCollateral] = useState<boolean>(true);

  const [addCollatInput, setAddCollatInput] = useState<any>(undefined);
  const [removeCollatInput, setRemoveCollatInput] = useState<any>(undefined);

  const [rollToSeries, setRollToSeries] = useState<ISeries | undefined>(undefined);

  const [repayDisabled, setRepayDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);
  const [removeCollateralDisabled, setRemoveCollateralDisabled] = useState<boolean>(true);
  const [addCollateralDisabled, setAddCollateralDisabled] = useState<boolean>(true);

  const [actionActive, setActionActive] = useState<any>(vault && !vault?.isActive ? { index: 3 } : { index: 0 });

  /* HOOK FNS */
  const repay = useRepayDebt();
  const rollDebt = useRollDebt(rollToSeries?.id!);

  const { logAnalyticsEvent } = useAnalytics();

  const { addCollateral } = useAddCollateral();
  const { removeCollateral } = useRemoveCollateral();

  const {
    maxCollateral,
    collateralizationPercent,
    maxRemovableCollateral,
    minCollatRatioPct,
    unhealthyCollatRatio,
    liquidationPrice_,
  } = useCollateralHelpers('0', '0', vault?.id, assetPairInfo);

  const { collateralizationPercent: repayCollEst } = useCollateralHelpers(
    `-${repayInput! || '0'}`,
    '0',
    vault?.id,
    assetPairInfo
  );

  const { collateralizationPercent: removeCollEst, unhealthyCollatRatio: removeCollEstUnhealthyRatio } =
    useCollateralHelpers('0', `-${removeCollatInput! || '0'}`, vault?.id, assetPairInfo);

  const { collateralizationPercent: addCollEst } = useCollateralHelpers(
    '0',
    `${addCollatInput! || '0'}`,
    vault?.id,
    assetPairInfo
  );

  const {
    maxRepay,
    maxRepay_,
    minRepayable,
    minRepayable_,
    maxRoll_,
    minDebt,
    userBaseBalance,
    userBaseBalance_,
    rollPossible,
    debtAfterRepay,
    debtInBase,
    debtInBase_,
    rollProtocolLimited,
  } = useBorrowHelpers(repayInput, undefined, vault?.id, assetPairInfo, rollToSeries);

  const { inputError: repayError } = useInputValidation(repayInput, ActionCodes.REPAY, vaultSeries!, [
    debtAfterRepay?.eq(ZERO_BN) || debtAfterRepay?.gt(minDebt!) ? undefined : '0',
    userBaseBalance_,
  ]);

  const { inputError: addCollatError } = useInputValidation(addCollatInput, ActionCodes.ADD_COLLATERAL, vaultSeries!, [
    0,
    maxCollateral,
  ]);

  const { inputError: removeCollatError } = useInputValidation(
    removeCollatInput,
    ActionCodes.REMOVE_COLLATERAL,
    vaultSeries!,
    [0, maxRemovableCollateral]
  );

  const { inputError: rollError } = useInputValidation(maxRoll_, ActionCodes.ROLL_DEBT, vaultSeries!, [0, maxRoll_]);

  /* LOCAL COMPNENT FNS */
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

  const handleRepay = () => {
    if (repayDisabled) return;
    setRepayDisabled(true);
    repay(repayInput?.toString(), reclaimCollateral);

    logAnalyticsEvent(GA_Event.transaction_initiated, {
      view: GA_View.BORROW,
      series_id: vaultSeries?.name!,
      action_code: ActionCodes.REPAY,
    } as GA_Properties.transaction_initiated);
  };

  const handleRoll = () => {
    if (rollDisabled) return;
    setRollDisabled(true);
    rollDebt();

    logAnalyticsEvent(GA_Event.transaction_initiated, {
      view: GA_View.BORROW,
      series_id: vaultSeries?.name!,
      action_code: ActionCodes.ROLL_DEBT,
    } as GA_Properties.transaction_initiated);
  };

  const handleCollateral = (action: 'ADD' | 'REMOVE') => {
    if (action === 'REMOVE') {
      if (removeCollateralDisabled) return;
      setRemoveCollateralDisabled(true);
      removeCollateral(removeCollatInput);

      logAnalyticsEvent(GA_Event.transaction_initiated, {
        view: GA_View.BORROW,
        series_id: vaultSeries?.name!,
        action_code: ActionCodes.REMOVE_COLLATERAL,
      } as GA_Properties.transaction_initiated);
    } else {
      if (addCollateralDisabled) return;
      setAddCollateralDisabled(true);
      addCollateral(addCollatInput);

      logAnalyticsEvent(GA_Event.transaction_initiated, {
        view: GA_View.BORROW,
        series_id: vaultSeries?.name!,
        action_code: ActionCodes.ADD_COLLATERAL,
      } as GA_Properties.transaction_initiated);
    }
  };

  const handleMaxAction = (actionCode: ActionCodes) => {
    actionCode === ActionCodes.REPAY && setRepayInput(maxRepay.gt(minRepayable) ? maxRepay_ : minRepayable_);
    actionCode === ActionCodes.ADD_COLLATERAL && setAddCollatInput(maxCollateral);
    actionCode === ActionCodes.REMOVE_COLLATERAL && setRemoveCollatInput(maxRemovableCollateral);
    logAnalyticsEvent(GA_Event.max_clicked, {
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
      switch (actionCode) {
        case ActionCodes.REPAY:
          setRepayInput(undefined);
          resetRepayProcess();
          break;
        case ActionCodes.ROLL_DEBT:
          resetRollProcess();
          break;
        case ActionCodes.ADD_COLLATERAL:
          setAddCollatInput(undefined);
          resetAddCollateralProcess();
          break;
        case ActionCodes.REMOVE_COLLATERAL:
          setRemoveCollatInput(undefined);
          resetRemoveCollateralProcess();
          break;
      }
    },
    [resetAddCollateralProcess, resetRemoveCollateralProcess, resetRepayProcess, resetRollProcess, resetStepper]
  );

  /* ACTION DISABLING LOGIC */
  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    !repayInput || repayError || !vault ? setRepayDisabled(true) : setRepayDisabled(false);
    !rollToSeries || rollError || !vault ? setRollDisabled(true) : setRollDisabled(false);
    !addCollatInput || addCollatError || !vault ? setAddCollateralDisabled(true) : setAddCollateralDisabled(false);
    !removeCollatInput || removeCollatError || !vault
      ? setRemoveCollateralDisabled(true)
      : setRemoveCollateralDisabled(false);
  }, [
    repayInput,
    repayError,
    rollToSeries,
    addCollatInput,
    removeCollatInput,
    addCollatError,
    removeCollatError,
    rollError,
    vault,
  ]);

  /* EXTRA INITIATIONS */
  useEffect(() => {
    if (vault) {
      setSelectedSeries(vaultSeries!);
      setSelectedBase(vaultBase!);
      setSelectedIlk(vaultIlk!);
      setSelectedVault(vault);
    }
  }, [vault, setSelectedBase, setSelectedIlk, setSelectedSeries, setSelectedVault, vaultBase, vaultIlk, vaultSeries]);

  useEffect(() => {
    if (vault && account !== vault?.owner) router.push(prevLoc);
  }, [account, vault, prevLoc, router]);

  /* watch if the processes timeout - if so, reset() */
  useEffect(() => {
    repayProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.REPAY);
    // rollProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.ROLL_DEBT);
    addCollateralProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.ADD_COLLATERAL);
    removeCollateralProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT &&
      resetInputs(ActionCodes.REMOVE_COLLATERAL);
    rollProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.ROLL_DEBT);
  }, [addCollateralProcess, removeCollateralProcess, repayProcess, resetInputs, rollProcess]);

  return (
    <>
      {vault && (
        <ModalWrap>
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
                    <PositionAvatar position={vault!} actionType={ActionType.BORROW} />
                    <Box>
                      <Text size={mobile ? 'medium' : 'large'}> {vault?.displayName} </Text>
                      <CopyWrap hash={vault?.id}>
                        <Text size="small"> {abbreviateHash(vault?.id, 6)} </Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                </Box>

                {vault?.isActive && (
                  <Box>
                    <Box gap="small">
                      {vault?.isActive && !unhealthyCollatRatio && (
                        <InfoBite
                          label="Maturity date"
                          value={`${vaultSeries?.displayName}`}
                          icon={<FiClock color={vaultSeries?.color} />}
                          loading={!vaultSeries?.maturity}
                        />
                      )}

                      <InfoBite
                        label="Vault debt + interest"
                        value={`${cleanValue(ethers.utils.formatUnits(debtInBase, vaultBase?.decimals), 10)} ${
                          vaultBase?.displaySymbol
                        }${vaultSeries?.seriesIsMature ? ` (variable rate: ${vault.rate.formatted}%)` : ''}`}
                        icon={<FiTrendingUp />}
                        loading={vaultLoading || !debtInBase_}
                      />

                      {vault?.ink.value.gt(ZERO_BN) && (
                        <InfoBite
                          label="Collateral posted"
                          value={`${cleanValue(vault?.ink.formatted, vaultIlk?.decimals!)} ${
                            vaultIlk?.displaySymbol
                          } (${collateralizationPercent}%)`}
                          icon={<Gauge value={parseFloat(collateralizationPercent!)} size="1em" />}
                          loading={vaultLoading}
                        />
                      )}

                      {vault?.accruedArt.value.gt(ZERO_BN) && (
                        <InfoBite
                          label="Vault Liquidation"
                          value={`1 ${vaultIlk?.displaySymbol} : ${liquidationPrice_} ${vaultBase?.displaySymbol}`}
                          icon={<FiActivity />}
                          loading={vaultLoading}
                        />
                      )}
                    </Box>
                    <Box margin={{ top: 'small' }}>
                      {vault?.isActive && unhealthyCollatRatio && (
                        <InfoBite
                          label="Vault is in danger of liquidation"
                          value={`Minimum collateralization needed is ${minCollatRatioPct}%`}
                          icon={
                            <Text color="warning">
                              <FiAlertTriangle size="1.5em" />
                            </Text>
                          }
                          loading={false}
                        />
                      )}

                      {vault?.hasBeenLiquidated && (
                        <InfoBite
                          label="This vault has been Liquidated."
                          value="The collateralization ratio dropped below minimum required."
                          icon={
                            <Text color="error">
                              <GiMedalSkull size="1.5em" />
                            </Text>
                          }
                          loading={false}
                        />
                      )}

                      {!vault?.isActive && !vault?.isWitchOwner && (
                        <InfoBite
                          label="The connected account no longer owns this vault"
                          value={`Vault ${vault?.id} has either been transfered, deleted or liquidated`}
                          icon={<FiAlertTriangle size="1.5em" color="red" />}
                          loading={false}
                        />
                      )}
                    </Box>
                  </Box>
                )}
                {vault?.isWitchOwner && (
                  <InfoBite
                    label="Liquidation in progress."
                    value="This vault is in the process of being liquidated and the account no longer owns this vault"
                    icon={<FiAlertTriangle size="1.5em" color="red" />}
                    loading={false}
                  />
                )}
              </Box>

              <Box height={{ min: '300px' }}>
                <SectionWrap title="Vault Actions">
                  <Box elevation="xsmall" round background={mobile ? 'hoverBackground' : 'hoverBackground'}>
                    <Select
                      dropProps={{ round: 'small' }}
                      plain
                      size="small"
                      options={[
                        { text: 'Repay Debt', index: 0 },
                        { text: 'Roll Vault', index: 1, disabled: !rollPossible },
                        { text: 'Add More Collateral', index: 2 },
                        { text: 'Remove Collateral', index: 3 },
                        { text: 'View Transaction History', index: 4 },
                      ]}
                      icon={<FiChevronDown />}
                      labelKey="text"
                      valueKey="index"
                      value={actionActive}
                      onChange={({ option }) => handleSetActionActive(option)}
                      disabled={vault?.isActive ? undefined : [0, 1, 2, 4, 5]}
                    />
                  </Box>
                </SectionWrap>

                {actionActive.index === 0 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'small' }}>
                        <InputWrap action={() => console.log('maxAction')} isError={repayError} round>
                          <TextInput
                            plain
                            type="number"
                            inputMode="decimal"
                            placeholder={`Enter ${vaultBase?.displaySymbol} amount to Repay`}
                            // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                            value={repayInput || ''}
                            onChange={(event: any) =>
                              setRepayInput(cleanValue(event.target.value, vaultBase?.decimals))
                            }
                            icon={<Logo image={vaultBase?.image} />}
                          />
                          <MaxButton
                            action={() => handleMaxAction(ActionCodes.REPAY)}
                            clearAction={() => setRepayInput('')}
                            showingMax={!!repayInput && repayInput === maxRepay_}
                          />
                        </InputWrap>

                        {!repayInput && minRepayable && maxRepay_ && maxRepay.gt(minRepayable) && (
                          <InputInfoWrap action={() => setRepayInput(maxRepay_)}>
                            {maxRepay.eq(userBaseBalance!) ? (
                              <Text color="text" alignSelf="end" size="xsmall">
                                Use {vaultBase?.displaySymbol!} balance ({cleanValue(userBaseBalance_, 2)})
                              </Text>
                            ) : (
                              <Text color="text" alignSelf="end" size="xsmall">
                                Repay all debt ({maxRepay_} {vaultBase?.displaySymbol!})
                              </Text>
                            )}
                          </InputInfoWrap>
                        )}

                        {!repayInput &&
                          minDebt?.gt(ZERO_BN) &&
                          vault.accruedArt.value.gt(ZERO_BN) &&
                          minDebt.gt(vault.accruedArt.value) && (
                            <InputInfoWrap>
                              <Text size="xsmall">Your debt is below the current minimumn debt requirement.</Text>
                              <Text size="xsmall">(It is only possible to repay the full debt)</Text>
                            </InputInfoWrap>
                          )}

                        {repayInput && !repayError && debtAfterRepay && (
                          <InputInfoWrap>
                            {repayCollEst && parseFloat(repayCollEst) > 10000 && !debtAfterRepay.eq(ZERO_BN) && (
                              <Text color="text-weak" alignSelf="end" size="xsmall">
                                Repaying this amount will leave a small amount of debt.
                              </Text>
                            )}

                            {repayCollEst &&
                              parseFloat(repayCollEst) < 10000 &&
                              parseFloat(repayCollEst) !== 0 &&
                              !debtAfterRepay.eq(ZERO_BN) && (
                                <Text color="text-weak" alignSelf="end" size="xsmall">
                                  Collateralization ratio after repayment: {nFormatter(parseFloat(repayCollEst), 2)}%
                                </Text>
                              )}

                            {debtAfterRepay?.eq(ZERO_BN) && (
                              <Text color="text-weak" alignSelf="end" size="xsmall">
                                All debt will be repaid ({cleanValue(debtInBase_, 2)} {vaultBase?.displaySymbol!})
                              </Text>
                            )}
                          </InputInfoWrap>
                        )}
                      </Box>
                    )}

                    {stepPosition[actionActive.index] === 1 && (
                      <ActiveTransaction
                        pad
                        txProcess={repayProcess}
                        cancelAction={() => resetInputs(ActionCodes.REPAY)}
                      >
                        <Box gap="small">
                          <InfoBite
                            label="Repay Debt"
                            icon={<FiArrowRight />}
                            value={`${cleanValue(repayInput, vaultBase?.digitFormat!)} ${vaultBase?.displaySymbol}`}
                          />

                          {debtAfterRepay?.eq(ZERO_BN) && (
                            <Box fill="horizontal" align="end">
                              <CheckBox
                                reverse
                                size={0.5}
                                label={
                                  <Text size="xsmall" color="text-weak" alignSelf="center">
                                    Remove collateral in the same transaction
                                  </Text>
                                }
                                checked={reclaimCollateral}
                                onChange={() => setReclaimCollateral(!reclaimCollateral)}
                              />
                            </Box>
                          )}
                        </Box>
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 1 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'small' }}>
                        <SeriesSelector
                          seriesMap={seriesMap!}
                          selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                          actionType={ActionType.BORROW}
                          cardLayout={false}
                        />
                        {rollToSeries && (
                          <Box fill="horizontal">
                            {rollPossible ? (
                              <InputInfoWrap>
                                <Text size="xsmall">All debt will be rolled</Text>
                              </InputInfoWrap>
                            ) : (
                              <InputInfoWrap>
                                <Box pad="xsmall">
                                  <Text size="small">It is not currently possible to roll to this series</Text>
                                  <Text color="text-weak" size="xsmall">
                                    {rollProtocolLimited
                                      ? `Protocol liquidity is limited in the future series`
                                      : `Most likely because the debt doesn't meet the minimum debt requirements of the
                                    future series`}
                                  </Text>
                                </Box>
                              </InputInfoWrap>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}

                    {stepPosition[actionActive.index] !== 0 && (
                      <ActiveTransaction
                        pad
                        txProcess={rollProcess}
                        cancelAction={() => resetInputs(ActionCodes.ROLL_DEBT)}
                      >
                        <InfoBite
                          label="Roll Debt to Series"
                          icon={<FiArrowRight />}
                          value={`${rollToSeries?.displayName}`}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 2 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'small' }}>
                        <InputWrap action={() => console.log('maxAction')} isError={addCollatError} round>
                          <TextInput
                            // disabled={removeCollatInput}
                            plain
                            type="number"
                            inputMode="decimal"
                            placeholder="Collateral to add"
                            value={addCollatInput || ''}
                            onChange={(event: any) =>
                              setAddCollatInput(cleanValue(event.target.value, vaultIlk?.decimals))
                            }
                            icon={<Logo image={vaultIlk?.image} />}
                          />
                          <MaxButton
                            // disabled={removeCollatInput}
                            action={() => handleMaxAction(ActionCodes.ADD_COLLATERAL)}
                            clearAction={() => setAddCollatInput('')}
                            showingMax={!!addCollatInput && addCollatInput === maxCollateral}
                          />
                        </InputWrap>

                        {!addCollatInput ? (
                          <InputInfoWrap action={() => setAddCollatInput(maxCollateral)}>
                            <Text size="xsmall" color="text-weak">
                              Use {vaultIlk?.displaySymbol!} balance ({vaultIlk?.balance.formatted}{' '}
                              {vaultIlk?.displaySymbol!})
                            </Text>
                          </InputInfoWrap>
                        ) : (
                          <InputInfoWrap>
                            <Text color="text" alignSelf="end" size="xsmall">
                              New collateralization ratio will be {nFormatter(parseFloat(addCollEst!), 2)}%
                            </Text>
                          </InputInfoWrap>
                        )}
                      </Box>
                    )}

                    {stepPosition[actionActive.index] !== 0 && (
                      <ActiveTransaction
                        pad
                        txProcess={addCollatInput ? addCollateralProcess : removeCollateralProcess}
                        cancelAction={() => resetInputs(ActionCodes.ADD_COLLATERAL)}
                      >
                        <InfoBite
                          label="Add Collateral"
                          icon={<FiArrowRight />}
                          value={`${cleanValue(addCollatInput, vaultIlk?.digitFormat!)} ${vaultIlk?.displaySymbol}`}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 3 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'small' }}>
                        <InputWrap action={() => console.log('maxAction')} isError={removeCollatError} round>
                          <TextInput
                            // disabled={addCollatInput}
                            plain
                            type="number"
                            inputMode="decimal"
                            placeholder="Collateral to remove"
                            value={removeCollatInput || ''}
                            onChange={(event: any) =>
                              setRemoveCollatInput(cleanValue(event.target.value, vaultIlk?.decimals))
                            }
                            icon={<Logo image={vaultIlk?.image} />}
                          />
                          <MaxButton
                            action={() => handleMaxAction(ActionCodes.REMOVE_COLLATERAL)}
                            clearAction={() => setRemoveCollatInput('')}
                            showingMax={!!removeCollatInput && maxRemovableCollateral === removeCollatInput}
                          />
                        </InputWrap>

                        {!removeCollatInput ? (
                          <InputInfoWrap action={() => handleMaxAction(ActionCodes.REMOVE_COLLATERAL)}>
                            <Text size="xsmall" color="text-weak">
                              Remove all collateral ({cleanValue(maxRemovableCollateral, 6)} {vaultIlk?.displaySymbol!})
                            </Text>
                          </InputInfoWrap>
                        ) : (
                          <InputInfoWrap>
                            <Box>
                              <Text color="text" alignSelf="start" size="xsmall">
                                Your collateralization ratio will be {nFormatter(parseFloat(removeCollEst!), 2)}%
                              </Text>
                              {removeCollEstUnhealthyRatio && (
                                <Text color="red" alignSelf="start" size="xsmall">
                                  Removing this much collateral will put the vault in danger of liquidation
                                </Text>
                              )}
                            </Box>
                          </InputInfoWrap>
                        )}
                      </Box>
                    )}

                    {stepPosition[actionActive.index] !== 0 && (
                      <ActiveTransaction
                        pad
                        txProcess={addCollatInput ? addCollateralProcess : removeCollateralProcess}
                        cancelAction={() => resetInputs(ActionCodes.REMOVE_COLLATERAL)}
                      >
                        <InfoBite
                          label="Remove Collateral"
                          icon={<FiArrowRight />}
                          value={`${cleanValue(removeCollatInput, vaultIlk?.digitFormat!)} ${vaultIlk?.displaySymbol}`}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 4 && <YieldHistory seriesOrVault={vault!} view={['VAULT']} />}
              </Box>
            </Box>

            <ActionButtonWrap pad>
              {stepPosition[actionActive.index] === 0 && actionActive.index !== 4 && (
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}>Next Step</Text>}
                  onClick={() => handleStepper()}
                  key="next"
                  disabled={
                    (actionActive.index === 0 && repayDisabled) ||
                    (actionActive.index === 1 && rollDisabled) ||
                    (actionActive.index === 1 && !rollPossible) ||
                    (actionActive.index === 3 && removeCollatInput && removeCollateralDisabled) ||
                    (actionActive.index === 2 && addCollatInput && addCollateralDisabled) ||
                    ((actionActive.index === 2 || actionActive.index === 3) && !addCollatInput && !removeCollatInput)
                  }
                  errorLabel={
                    (actionActive.index === 0 && repayError) ||
                    (actionActive.index === 3 && removeCollatError) ||
                    (actionActive.index === 2 && addCollatError)
                  }
                />
              )}

              {actionActive.index === 0 &&
                stepPosition[actionActive.index] !== 0 &&
                repayProcess?.stage !== ProcessStage.PROCESS_COMPLETE && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>
                        {`${repayProcess?.processActive ? 'Repaying' : 'Repay'} ${
                          nFormatter(
                            Number(cleanValue(repayInput, vaultBase?.digitFormat!)),
                            vaultBase?.digitFormat!
                          ) || ''
                        } ${vaultBase?.displaySymbol}`}
                      </Text>
                    }
                    onClick={() => handleRepay()}
                    disabled={repayDisabled || repayProcess?.processActive}
                  />
                )}

              {actionActive.index === 1 &&
                stepPosition[actionActive.index] !== 0 &&
                rollProcess?.stage !== ProcessStage.PROCESS_COMPLETE && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>{`Roll${
                        rollProcess?.processActive ? 'ing' : ''
                      } debt`}</Text>
                    }
                    onClick={() => handleRoll()}
                    disabled={rollProcess?.processActive}
                  />
                )}

              {actionActive.index === 2 &&
                stepPosition[actionActive.index] !== 0 &&
                addCollatInput &&
                addCollateralProcess?.stage !== ProcessStage.PROCESS_COMPLETE && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>
                        {`${addCollateralProcess?.processActive ? 'Adding' : 'Add'} ${
                          nFormatter(
                            Number(cleanValue(addCollatInput, vaultIlk?.digitFormat!)),
                            vaultIlk?.digitFormat!
                          ) || ''
                        } ${vaultIlk?.displaySymbol}`}
                      </Text>
                    }
                    onClick={() => handleCollateral('ADD')}
                    disabled={addCollateralProcess?.processActive}
                  />
                )}

              {actionActive.index === 3 &&
                stepPosition[actionActive.index] !== 0 &&
                removeCollatInput &&
                removeCollateralProcess?.stage !== ProcessStage.PROCESS_COMPLETE && (
                  <TransactButton
                    primary
                    label={
                      <Text size={mobile ? 'small' : undefined}>
                        {`${removeCollateralProcess?.processActive ? 'Removing' : 'Remove'} ${
                          Number(cleanValue(removeCollatInput, vaultIlk?.digitFormat!)) || ''
                        } ${vaultIlk?.displaySymbol}`}
                      </Text>
                    }
                    onClick={() => handleCollateral('REMOVE')}
                    disabled={removeCollateralProcess?.processActive}
                  />
                )}
            </ActionButtonWrap>
          </CenterPanelWrap>
        </ModalWrap>
      )}
    </>
  );
};

export default VaultPosition;

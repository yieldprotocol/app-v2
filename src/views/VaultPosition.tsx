import React, { useContext, useState, useEffect, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Box, ResponsiveContext, Select, Text, TextInput } from 'grommet';

import { ethers } from 'ethers';

import { FiClock, FiTrendingUp, FiAlertTriangle, FiArrowRight, FiPlusCircle, FiMinusCircle } from 'react-icons/fi';
import { abbreviateHash, cleanValue, nFormatter } from '../utils/appUtils';
import { UserContext } from '../contexts/UserContext';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import { ActionCodes, ActionType, IAsset, ISeries, IUserContext, IVault, ProcessStage } from '../types';

import ActionButtonWrap from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import MaxButton from '../components/buttons/MaxButton';
import ActiveTransaction from '../components/ActiveTransaction';
import PositionAvatar from '../components/PositionAvatar';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import NextButton from '../components/buttons/NextButton';
import { Gauge } from '../components/Gauge';
import YieldHistory from '../components/YieldHistory';
import TransactButton from '../components/buttons/TransactButton';
import { useInputValidation } from '../hooks/useInputValidation';
import ModalWrap from '../components/wraps/ModalWrap';

import { useCachedState } from '../hooks/generalHooks';
import { useRepayDebt } from '../hooks/actionHooks/useRepayDebt';
import { useRollDebt } from '../hooks/actionHooks/useRollDebt';
import { useCollateralHelpers } from '../hooks/actionHelperHooks/useCollateralHelpers';
import { useAddCollateral } from '../hooks/actionHooks/useAddCollateral';
import { useRemoveCollateral } from '../hooks/actionHooks/useRemoveCollateral';
import { useBorrowHelpers } from '../hooks/actionHelperHooks/useBorrowHelpers';
import InputInfoWrap from '../components/wraps/InputInfoWrap';
import CopyWrap from '../components/wraps/CopyWrap';
import { useProcess } from '../hooks/useProcess';

const VaultPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const prevLoc = useCachedState('lastVisit', '')[0].slice(1).split('/')[0];

  const history = useHistory();
  const { id: idFromUrl } = useParams<{ id: string }>();

  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount: account, assetMap, seriesMap, vaultMap, selectedVaultId, vaultsLoading } = userState;

  const selectedVault: IVault | undefined = vaultMap && vaultMap.get(selectedVaultId || idFromUrl);

  const vaultBase: IAsset | undefined = assetMap.get(selectedVault?.baseId!);
  const vaultIlk: IAsset | undefined = assetMap.get(selectedVault?.ilkId!);
  const vaultSeries: ISeries | undefined = seriesMap.get(selectedVault?.seriesId!);

  /* TX info (for disabling buttons) */
  const { txProcess: repayProcess, resetProcess: resetRepayProcess } = useProcess(ActionCodes.REPAY, selectedVaultId!);
  const { txProcess: rollProcess, resetProcess: resetRollProcess } = useProcess(
    ActionCodes.ROLL_DEBT,
    selectedVaultId!
  );
  const { txProcess: addCollateralProcess, resetProcess: resetAddCollateralProcess } = useProcess(
    ActionCodes.ADD_COLLATERAL,
    selectedVaultId!
  );
  const { txProcess: removeCollateralProcess, resetProcess: resetRemoveCollateralProcess } = useProcess(
    ActionCodes.REMOVE_COLLATERAL,
    selectedVaultId!
  );

  // const { tx: transferTx, resetTx: resetTransferTx } = useTx(ActionCodes.TRANSFER_VAULT, selectedVaultId!, true);
  // const { tx: mergeTx, resetTx: resetMergeTx } = useTx(ActionCodes.MERGE_VAULT, selectedVaultId!);

  /* LOCAL STATE */
  // stepper for stepping within multiple tabs
  const [stepPosition, setStepPosition] = useState<number[]>(new Array(7).fill(0));

  const [repayInput, setRepayInput] = useState<any>(undefined);
  const [reclaimCollateral, setReclaimCollateral] = useState<boolean>(false);

  const [addCollatInput, setAddCollatInput] = useState<any>(undefined);
  const [removeCollatInput, setRemoveCollatInput] = useState<any>(undefined);

  const [rollToSeries, setRollToSeries] = useState<ISeries | undefined>(undefined);

  const [repayDisabled, setRepayDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);
  const [removeCollateralDisabled, setRemoveCollateralDisabled] = useState<boolean>(true);
  const [addCollateralDisabled, setAddCollateralDisabled] = useState<boolean>(true);

  const [actionActive, setActionActive] = useState<any>(
    selectedVault && !selectedVault.isActive ? { index: 3 } : { index: 0 }
  );

  const parsedInput = repayInput ? ethers.utils.parseUnits(repayInput, vaultBase?.decimals) : ethers.constants.Zero;

  /* HOOK FNS */
  const repay = useRepayDebt();
  const rollDebt = useRollDebt();
  // const { transfer, merge } = useVaultAdmin();

  const { addCollateral } = useAddCollateral();
  const { removeCollateral } = useRemoveCollateral();

  const { maxCollateral, collateralizationPercent, maxRemovableCollateral } = useCollateralHelpers(
    '0',
    '0',
    selectedVault
  );
  const { collateralizationPercent: repayCollEst } = useCollateralHelpers(`-${repayInput! || '0'}`, '0', selectedVault);
  const { collateralizationPercent: removeCollEst } = useCollateralHelpers(
    '0',
    `-${removeCollatInput! || '0'}`,
    selectedVault
  );
  const { collateralizationPercent: addCollEst } = useCollateralHelpers(
    '0',
    `${addCollatInput! || '0'}`,
    selectedVault
  );

  const {
    maxRepay,
    maxRepay_,
    maxRepayDustLimit,
    protocolBaseAvailable,
    userBaseAvailable,
    maxRoll,
    maxRoll_,
    maxDebt_,
    rollPossible,
  } = useBorrowHelpers(undefined, undefined, selectedVault, rollToSeries);

  const { inputError: repayError } = useInputValidation(repayInput, ActionCodes.REPAY, vaultSeries, [
    maxRepayDustLimit, // this is the max pay to get to dust limit. note different logic in input validation hook.
    maxRepay_,
  ]);

  const { inputError: addCollatError } = useInputValidation(addCollatInput, ActionCodes.ADD_COLLATERAL, vaultSeries, [
    0,
    maxCollateral,
  ]);

  const { inputError: removeCollatError } = useInputValidation(
    removeCollatInput,
    ActionCodes.REMOVE_COLLATERAL,
    vaultSeries,
    [0, maxRemovableCollateral]
  );

  const { inputError: rollError } = useInputValidation(selectedVault?.art_, ActionCodes.ROLL_DEBT, vaultSeries, [
    0,
    maxRoll_,
  ]);

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    const validatedSteps = newStepArray.map((x: number) => (x >= 0 ? x : 0));
    setStepPosition(validatedSteps);
  };

  const handleRepay = () => {
    selectedVault && repay(selectedVault, repayInput?.toString(), reclaimCollateral);
  };

  const handleRoll = () => {
    rollToSeries && selectedVault && rollDebt(selectedVault, rollToSeries);
  };

  const handleCollateral = (action: 'ADD' | 'REMOVE') => {
    const remove: boolean = action === 'REMOVE';
    if (selectedVault) {
      !remove && addCollateral(selectedVault, addCollatInput);
      remove && removeCollateral(selectedVault, removeCollatInput);
    }
  };

  const resetInputs = (actionCode: ActionCodes) => {
    switch (actionCode) {
      case ActionCodes.REPAY:
        handleStepper(true);
        setRepayInput(null);
        resetRepayProcess();
        break;
      case ActionCodes.ROLL_DEBT:
        handleStepper(true);
        resetRollProcess();
        break;
      case ActionCodes.ADD_COLLATERAL:
        handleStepper(true);
        setAddCollatInput(undefined);
        resetAddCollateralProcess();
        break;
      case ActionCodes.REMOVE_COLLATERAL:
        handleStepper(true);
        setRemoveCollatInput(undefined);
        resetRemoveCollateralProcess();
        break;
    }
  };

  /* ACTION DISABLING LOGIC */
  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    !repayInput || repayError ? setRepayDisabled(true) : setRepayDisabled(false);
    !rollToSeries || rollError ? setRollDisabled(true) : setRollDisabled(false);
    !addCollatInput || addCollatError ? setAddCollateralDisabled(true) : setAddCollateralDisabled(false);
    !removeCollatInput || removeCollatError ? setRemoveCollateralDisabled(true) : setRemoveCollateralDisabled(false);
  }, [repayInput, repayError, rollToSeries, addCollatInput, removeCollatInput, addCollatError, removeCollatError]);

  /* EXTRA INITIATIONS */

  useEffect(() => {
    /* set global series, base and ilk */
    selectedVault && userActions.setSelectedSeries(selectedVault.seriesId);
    selectedVault && userActions.setSelectedBase(selectedVault.baseId);
    selectedVault && userActions.setSelectedIlk(selectedVault.ilkId);
  }, [vaultMap, selectedVault]);

  useEffect(() => {
    if (selectedVault && account !== selectedVault?.owner) history.push(prevLoc);
  }, [account, selectedVault, history, prevLoc]);

  /* watch if the processes timeout - if so, reset() */
  useEffect(() => {
    repayProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.REPAY);
    // rollProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.ROLL_DEBT);
    addCollateralProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.ADD_COLLATERAL);
    removeCollateralProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT &&
      resetInputs(ActionCodes.REMOVE_COLLATERAL);
    rollProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs(ActionCodes.ROLL_DEBT);
  }, [addCollateralProcess, removeCollateralProcess, repayProcess, rollProcess]);

  return (
    <>
      {selectedVault && (
        <ModalWrap>
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
                    <PositionAvatar position={selectedVault!} actionType={ActionType.BORROW} />
                    <Box>
                      <Text size={mobile ? 'medium' : 'large'}> {selectedVault?.displayName} </Text>
                      <CopyWrap hash={selectedVault?.id}>
                        <Text size="small"> {abbreviateHash(selectedVault?.id, 6)} </Text>
                      </CopyWrap>
                    </Box>
                  </Box>
                  {/* <ExitButton action={() => history.goBack()} /> */}
                </Box>

                {selectedVault?.isActive && (
                  <SectionWrap>
                    <Box gap="small">
                      <InfoBite
                        label="Maturity date:"
                        value={`${vaultSeries?.displayName}`}
                        icon={<FiClock color={vaultSeries?.color} />}
                        loading={vaultsLoading}
                      />
                      <InfoBite
                        label="Vault debt + interest:"
                        value={`${cleanValue(selectedVault?.art_, vaultBase?.digitFormat!)} ${vaultBase?.symbol}`}
                        icon={<FiTrendingUp />}
                        loading={vaultsLoading}
                      />
                      <InfoBite
                        label="Collateral posted:"
                        value={`${cleanValue(selectedVault?.ink_, vaultIlk?.decimals!)} ${
                          vaultIlk?.symbol
                        } (${collateralizationPercent} %)`}
                        icon={<Gauge value={parseFloat(collateralizationPercent!)} size="1em" />}
                        loading={vaultsLoading}
                      />
                    </Box>
                  </SectionWrap>
                )}
                {!selectedVault?.isActive && !selectedVault?.isWitchOwner && (
                  <SectionWrap>
                    <Box fill align="center" justify="center">
                      <Box direction="row" pad="medium" gap="small" align="center">
                        <FiAlertTriangle size="3em" />
                        <Box gap="xsmall">
                          <Text>The connected account no longer owns this vault</Text>
                        </Box>
                      </Box>

                      <Box pad={{ horizontal: 'medium' }}>
                        <Text size="xsmall">Vault {selectedVault?.id} has either been transfered or deleted.</Text>
                      </Box>
                    </Box>
                  </SectionWrap>
                )}
                {selectedVault?.isWitchOwner && (
                  <SectionWrap>
                    <Box fill align="center" justify="center">
                      <Box direction="row" pad="medium" gap="small" align="center">
                        <FiAlertTriangle size="3em" />
                        <Box gap="xsmall">
                          <Text>
                            This vault is in the process of being liquidated and the account no longer owns this vault
                          </Text>
                        </Box>
                      </Box>
                    </Box>
                  </SectionWrap>
                )}
              </Box>

              <Box height={{ min: '300px' }}>
                <SectionWrap title="Vault Actions">
                  <Box elevation="xsmall" round="xsmall" background={mobile ? 'white' : undefined}>
                    <Select
                      dropProps={{ round: 'xsmall' }}
                      plain
                      options={[
                        { text: 'Repay Debt', index: 0 },
                        { text: 'Roll Debt', index: 1, disabled: rollPossible },
                        { text: 'Add More Collateral', index: 2 },
                        { text: 'Remove Collateral', index: 3 },
                        { text: 'View Transaction History', index: 4 },
                      ]}
                      labelKey="text"
                      valueKey="index"
                      value={actionActive}
                      onChange={({ option }) => setActionActive(option)}
                      disabled={selectedVault?.isActive ? undefined : [0, 1, 2, 4, 5]}
                    />
                  </Box>
                </SectionWrap>

                {actionActive.index === 0 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'medium' }} gap="medium">
                        <InputWrap
                          action={() => console.log('maxAction')}
                          isError={repayError}
                          message={
                            <>
                              {!repayInput && maxRepay_ && (
                                <InputInfoWrap action={() => setRepayInput(maxRepay_)}>
                                  {selectedVault.art.gt(maxRepay) ? (
                                    <Text color="gray" alignSelf="end" size="xsmall">
                                      Maximum repayable is {cleanValue(maxRepay_!, 2)} {vaultBase?.symbol!}{' '}
                                      {userBaseAvailable.lt(protocolBaseAvailable)
                                        ? '(based on your token balance)'
                                        : '(limited by protocol reserves)'}
                                    </Text>
                                  ) : (
                                    <Text color="gray" alignSelf="end" size="xsmall">
                                      Max debt repayable ({selectedVault?.art_!} {vaultBase?.symbol!})
                                    </Text>
                                  )}
                                </InputInfoWrap>
                              )}

                              {repayInput && !repayError && (
                                <InputInfoWrap>
                                  {repayCollEst && parseFloat(repayCollEst) > 10000 && repayInput !== maxDebt_ && (
                                    <Text color="text-weak" alignSelf="end" size="xsmall">
                                      Repaying this amount will leave a small amount of debt.
                                    </Text>
                                  )}
                                  {repayCollEst &&
                                    parseFloat(repayCollEst) < 10000 &&
                                    parseFloat(repayCollEst) !== 0 &&
                                    repayInput !== maxDebt_ && (
                                      <Text color="text-weak" alignSelf="end" size="xsmall">
                                        Collateralization ratio after repayment:{' '}
                                        {repayCollEst && nFormatter(parseFloat(repayCollEst), 2)}%
                                      </Text>
                                    )}

                                  {repayInput === maxDebt_ && (
                                    <Text color="text-weak" alignSelf="end" size="xsmall">
                                      All debt will be repaid.
                                    </Text>
                                  )}
                                </InputInfoWrap>
                              )}
                            </>
                          }
                        >
                          <TextInput
                            plain
                            type="number"
                            placeholder={`Enter ${vaultBase?.symbol} amount to Repay`}
                            // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                            value={repayInput || ''}
                            onChange={(event: any) => setRepayInput(cleanValue(event.target.value))}
                            icon={<>{vaultBase?.image}</>}
                          />
                          <MaxButton
                            action={() => setRepayInput(maxRepay_)}
                            clearAction={() => setRepayInput('')}
                            showingMax={!!repayInput && repayInput === maxRepay_}
                          />
                        </InputWrap>
                      </Box>
                    )}

                    {stepPosition[actionActive.index] === 1 && (
                      <ActiveTransaction
                        pad
                        txProcess={repayProcess}
                        cancelAction={() => resetInputs(ActionCodes.REPAY)}
                      >
                        <InfoBite
                          label="Repay Debt"
                          icon={<FiArrowRight />}
                          value={`${cleanValue(repayInput, vaultBase?.digitFormat!)} ${vaultBase?.symbol}`}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 1 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'medium' }} gap="xsmall">
                        <SeriesSelector
                          selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                          actionType={ActionType.BORROW}
                          cardLayout={false}
                        />
                        <Box fill="horizontal">
                          {rollToSeries && (
                            <InputInfoWrap>
                              <Text color="text-weak" size="xsmall">
                                Debt of {cleanValue(maxRoll_, 2)} {vaultBase?.symbol} will be rolled
                                {userBaseAvailable.lte(maxRoll) ? '.' : ' (limited by protocol reserves).'}
                              </Text>
                            </InputInfoWrap>
                          )}
                        </Box>
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
                      <Box margin={{ top: 'medium' }}>
                        <Box direction="row" gap="small">
                          <InputWrap
                            action={() => console.log('maxAction')}
                            isError={addCollatError}
                            message={
                              !addCollatInput ? (
                                <InputInfoWrap action={() => setAddCollatInput(maxCollateral)}>
                                  <Text size="xsmall" color="text-weak">
                                    Max collateral available: {vaultIlk?.balance_!} {vaultIlk?.symbol!}{' '}
                                  </Text>
                                </InputInfoWrap>
                              ) : (
                                <InputInfoWrap>
                                  <Text color="gray" alignSelf="end" size="xsmall">
                                    New collateralization ratio will be: {nFormatter(parseFloat(addCollEst!), 2)}%
                                  </Text>
                                </InputInfoWrap>
                              )
                            }
                          >
                            <TextInput
                              // disabled={removeCollatInput}
                              plain
                              type="number"
                              placeholder="Collateral to add"
                              value={addCollatInput || ''}
                              onChange={(event: any) => setAddCollatInput(cleanValue(event.target.value))}
                              icon={<>{vaultIlk?.image}</>}
                            />
                            <MaxButton
                              // disabled={removeCollatInput}
                              action={() => setAddCollatInput(maxCollateral)}
                              clearAction={() => setAddCollatInput('')}
                              showingMax={!!addCollatInput && addCollatInput === maxCollateral}
                            />
                          </InputWrap>
                        </Box>
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
                          value={`${cleanValue(addCollatInput, vaultIlk?.digitFormat!)} ${vaultIlk?.symbol}`}
                        />
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 3 && (
                  <>
                    {stepPosition[actionActive.index] === 0 && (
                      <Box margin={{ top: 'medium' }}>
                        <InputWrap
                          action={() => console.log('maxAction')}
                          isError={removeCollatError}
                          message={
                            !removeCollatInput ? (
                              <InputInfoWrap action={() => setRemoveCollatInput(maxRemovableCollateral)}>
                                <Text size="xsmall" color="text-weak">
                                  Max removable collateral: {cleanValue(maxRemovableCollateral, 6)} {vaultIlk?.symbol!}
                                </Text>
                              </InputInfoWrap>
                            ) : (
                              <InputInfoWrap>
                                <Text color="gray" alignSelf="end" size="xsmall">
                                  Your collateralization ratio will be: {nFormatter(parseFloat(removeCollEst!), 2)}%
                                </Text>
                              </InputInfoWrap>
                            )
                          }
                        >
                          <TextInput
                            // disabled={addCollatInput}
                            plain
                            type="number"
                            placeholder="Collateral to remove"
                            value={removeCollatInput || ''}
                            onChange={(event: any) => setRemoveCollatInput(cleanValue(event.target.value))}
                            icon={<>{vaultIlk?.image}</>}
                          />
                          <MaxButton
                            action={() => setRemoveCollatInput(maxRemovableCollateral)}
                            clearAction={() => setRemoveCollatInput('')}
                            showingMax={!!removeCollatInput && maxRemovableCollateral === removeCollatInput}
                          />
                        </InputWrap>
                      </Box>
                    )}

                    {stepPosition[actionActive.index] !== 0 && (
                      <ActiveTransaction
                        pad
                        txProcess={addCollatInput ? addCollateralProcess : removeCollateralProcess}
                        cancelAction={() => resetInputs(ActionCodes.REMOVE_COLLATERAL)}
                      >
                        <Box>
                          <InfoBite
                            label="Remove Collateral"
                            icon={<FiArrowRight />}
                            value={`${cleanValue(removeCollatInput, vaultIlk?.digitFormat!)} ${vaultIlk?.symbol}`}
                          />
                        </Box>
                      </ActiveTransaction>
                    )}
                  </>
                )}

                {actionActive.index === 4 && <YieldHistory seriesOrVault={selectedVault!} view={['VAULT']} />}
              </Box>
            </Box>

            <ActionButtonWrap pad>
              {stepPosition[actionActive.index] === 0 && actionActive.index !== 4 && (
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}> Next Step </Text>}
                  onClick={() => handleStepper()}
                  key="next"
                  disabled={
                    (actionActive.index === 0 && repayDisabled) ||
                    (actionActive.index === 1 && rollDisabled) ||
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
                        } ${vaultBase?.symbol}`}
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
                        } ${vaultIlk?.symbol}`}
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
                        } ${vaultIlk?.symbol}`}
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

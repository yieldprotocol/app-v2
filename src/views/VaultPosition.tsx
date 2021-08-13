import React, { useContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { base, Box, Button, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';

import {
  FiLock,
  FiClock,
  FiTrendingUp,
  FiLogOut,
  FiXCircle,
  FiPlusCircle,
  FiAlertTriangle,
  FiArrowRight,
} from 'react-icons/fi';
import { abbreviateHash, cleanValue, getTxCode, nFormatter } from '../utils/appUtils';
import { UserContext } from '../contexts/UserContext';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import { ActionCodes, ActionType, IAsset, ISeries, IUserContext, IVault, TxState } from '../types';

import ActionButtonWrap from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';
import { useCollateralActions, useCollateralization } from '../hooks/collateralHooks';
import { useBorrowActions } from '../hooks/borrowHooks';
import SeriesSelector from '../components/selectors/SeriesSelector';
import MaxButton from '../components/buttons/MaxButton';
import ActiveTransaction from '../components/ActiveTransaction';
import PositionAvatar from '../components/PositionAvatar';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import NextButton from '../components/buttons/NextButton';
import { Gauge } from '../components/Gauge';
import YieldHistory from '../components/YieldHistory';
import TransactButton from '../components/buttons/TransactButton';
import CancelButton from '../components/buttons/CancelButton';
import VaultDropSelector from '../components/selectors/VaultDropSelector';
import ExitButton from '../components/buttons/ExitButton';
import { useInputValidation } from '../hooks/inputValidationHook';
import { TxContext } from '../contexts/TxContext';
import { useTx } from '../hooks/useTx';
import EtherscanButton from '../components/buttons/EtherscanButton';

const Vault = ({ close }: { close: () => void }) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const routerHistory = useHistory();

  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, seriesMap, vaultMap, selectedVaultId, selectedIlkId } = userState;
  const { txState: transactions } = useContext(TxContext);
  // const { setSelectedVault } = userActions;

  const selectedVault: IVault | undefined = vaultMap.get(selectedVaultId!);
  const selectedIlk = assetMap.get(selectedIlkId!);
  const vaultBase: IAsset | undefined = assetMap.get(selectedVault?.baseId!);
  const vaultIlk: IAsset | undefined = assetMap.get(selectedVault?.ilkId!);
  const vaultSeries: ISeries | undefined = seriesMap.get(selectedVault?.seriesId!);

  const { collateralizationPercent, maxRemove } = useCollateralization(
    selectedVault?.art.toString(),
    selectedVault?.ink.toString(),
    selectedVault
  );

  /* TX info (for disabling buttons) */
  const { tx: repayTx, resetTx: resetRepayTx } = useTx(ActionCodes.REPAY, selectedVaultId!);
  const { tx: rollTx, resetTx: resetRollTx } = useTx(ActionCodes.ROLL_DEBT, selectedVaultId!);
  const { tx: addCollateralTx, resetTx: resetAddCollateralTx } = useTx(ActionCodes.ADD_COLLATERAL, selectedVaultId!);
  const { tx: removeCollateralTx, resetTx: resetRemoveCollateralTx } = useTx(
    ActionCodes.REMOVE_COLLATERAL,
    selectedVaultId!
  );
  const { tx: transferTx, resetTx: resetTransferTx } = useTx(ActionCodes.TRANSFER_VAULT, selectedVaultId!, true);
  const { tx: mergeTx, resetTx: resetMergeTx } = useTx(ActionCodes.MERGE_VAULT, selectedVaultId!);

  /* LOCAL STATE */
  // tab state + control
  const [tabIndex, setTabIndex] = React.useState(0);
  const onActive = (nextIndex: number) => setTabIndex(nextIndex);

  // stepper for stepping within multiple tabs
  const [stepPosition, setStepPosition] = useState<number[]>(new Array(7).fill(0));

  const [repayInput, setRepayInput] = useState<any>(undefined);
  const [collatInput, setCollatInput] = useState<any>(undefined);

  const [addCollatInput, setAddCollatInput] = useState<any>(undefined);
  const [removeCollatInput, setRemoveCollatInput] = useState<any>(undefined);

  const [rollToSeries, setRollToSeries] = useState<ISeries | null>(null);

  const [transferToAddressInput, setTransferToAddressInput] = useState<string>('');

  const [maxRepay, setMaxRepay] = useState<string | undefined>();
  const [minRepay, setMinRepay] = useState<string | undefined>();
  const [maxAddCollat, setMaxAddCollat] = useState<string | undefined>();

  const [repayDisabled, setRepayDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);
  const [removeCollateralDisabled, setRemoveCollateralDisabled] = useState<boolean>(true);
  const [addCollateralDisabled, setAddCollateralDisabled] = useState<boolean>(true);
  const [mergeDisabled, setMergeDisabled] = useState<boolean>(true);
  const [transferDisabled, setTransferDisabled] = useState<boolean>(true);

  const [actionActive, setActionActive] = useState<any>(selectedVault?.isActive ? { index: 0 } : { index: 3 });

  const initialMergeData = {
    toVault: null,
    ink: selectedVault?.ink_,
    art: selectedVault?.art_,
    inkError: false,
    artError: false,
    advancedMergeToggle: false,
    totalMergedInk: null,
    totalMergedArt: null,
  };

  const [mergeData, setMergeData] = useState<any>(initialMergeData);
  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);

  /* HOOK FNS */
  const { repay, borrow, rollDebt, transfer, merge } = useBorrowActions();
  const { addCollateral, removeCollateral } = useCollateralActions();

  const { inputError: repayError } = useInputValidation(repayInput, ActionCodes.REPAY, vaultSeries, [
    0,
    maxRepay,
  ]);
  const { inputError: addCollatError } = useInputValidation(addCollatInput, ActionCodes.ADD_COLLATERAL, vaultSeries, [
    0,
    maxAddCollat,
  ]);
  const { inputError: removeCollatError } = useInputValidation(
    removeCollatInput,
    ActionCodes.REMOVE_COLLATERAL,
    vaultSeries,
    [0, ethers.utils.formatEther(maxRemove)]
  );
  const { inputError: transferError } = useInputValidation(
    transferToAddressInput,
    ActionCodes.TRANSFER_VAULT,
    vaultSeries,
    [],
    selectedVault
  );

  useEffect(() => {
    const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
    const _matchingVaults = arr.filter(
      (v: IVault) =>
        v.ilkId === selectedVault?.ilkId &&
        v.baseId === selectedVault.baseId &&
        v.seriesId === selectedVault.seriesId &&
        v.id !== selectedVault.id &&
        v.isActive
    );
    setMatchingVaults(_matchingVaults);
  }, [vaultMap, selectedVault?.ilkId, selectedVault?.baseId, selectedVault?.seriesId, selectedVault?.id]);

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    setStepPosition(newStepArray);
  };

  const handleRepay = () => {
    selectedVault && repay(selectedVault, repayInput?.toString());
    // setRepayInput('');
  };

  const handleCollateral = (action: 'ADD' | 'REMOVE') => {
    const remove: boolean = action === 'REMOVE';
    if (selectedVault) {
      !remove && addCollateral(selectedVault, addCollatInput);
      remove && removeCollateral(selectedVault, removeCollatInput);
    }
    setCollatInput('');
  };

  const handleRoll = () => {
    rollToSeries && selectedVault && rollDebt(selectedVault, rollToSeries);
  };

  const handleTransfer = () => {
    selectedVault && transfer(selectedVault, transferToAddressInput);
  };

  const handleMerge = () => {
    selectedVault && merge(selectedVault, mergeData.toVault, mergeData.ink, mergeData.art);
  };

  const handleMergeDataChange = (e: any) => {
    const { name, value } = e.target;
    setMergeData((fData: any) => ({ ...fData, [name]: cleanValue(value) }));

    if (name === 'ink') {
      const validInk = selectedVault && value <= selectedVault?.ink_;
      !validInk
        ? setMergeData((fData: any) => ({ ...fData, inkError: true }))
        : setMergeData((fData: any) => ({ ...fData, inkError: false }));
    }

    if (name === 'art') {
      const validArt = selectedVault && value <= selectedVault?.art_;
      !validArt
        ? setMergeData((fData: any) => ({ ...fData, artError: true }))
        : setMergeData((fData: any) => ({ ...fData, artError: false }));
    }
  };

  const handleMergeVaultSelect = (vault: IVault) => {
    setMergeData((fData: any) => ({ ...fData, toVault: vault }));
  };

  /* SET MAX / MIN VALUES */
  useEffect(() => {
    /* CHECK the max available repay */
    if (activeAccount) {
      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _max = _maxToken && selectedVault?.art.gt(_maxToken) ? _maxToken : selectedVault?.art;
        _max && setMaxRepay(ethers.utils.formatEther(_max)?.toString());
      })();

      setMinRepay(selectedVault?.art.sub(ethers.utils.parseEther('1')).toString() );
    }
  }, [activeAccount, selectedVault?.art, vaultBase, setMaxRepay]);


  useEffect(() => {
    /* CHECK collateral selection and sets the max available collateral */
    activeAccount &&
      (async () => {
        const _max = await vaultIlk?.getBalance(activeAccount);
        _max && setMaxAddCollat(ethers.utils.formatEther(_max)?.toString());
      })();
  }, [activeAccount, vaultIlk, setMaxAddCollat]);

  /* ACTION DISABLING LOGIC */
  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    !repayInput || repayError ? setRepayDisabled(true) : setRepayDisabled(false);
    !rollToSeries ? setRollDisabled(true) : setRollDisabled(false);
    !mergeData.toVault ? setMergeDisabled(true) : setMergeDisabled(false);
    !transferToAddressInput || transferError ? setTransferDisabled(true) : setTransferDisabled(false);
    !addCollatInput || addCollatError ? setAddCollateralDisabled(true) : setAddCollateralDisabled(false);
    !removeCollatInput || removeCollatError ? setRemoveCollateralDisabled(true) : setRemoveCollateralDisabled(false);
  }, [
    repayInput,
    repayError,
    collatInput,
    rollToSeries,
    mergeData,
    transferToAddressInput,
    addCollatInput,
    removeCollatInput,
    addCollatError,
    removeCollatError,
    transferError,
  ]);

  /* EXTRA INITIATIONS */

  useEffect(() => {
    /* set global series, base and ilk */
    selectedVault && userActions.setSelectedSeries(selectedVault.seriesId);
    selectedVault && userActions.setSelectedBase(selectedVault.baseId);
    selectedVault && userActions.setSelectedIlk(selectedVault.ilkId);
  }, [vaultMap, selectedVault]);

  // update data for vault to merge with
  useEffect(() => {
    if (mergeData.toVault) {
      const toVault = vaultMap.get(mergeData.toVault.id);
      const mergedInkNum = Number(mergeData?.ink) + Number(toVault?.ink_);
      const mergedArtNum = Number(mergeData?.art) + Number(toVault?.art_);
      const totalMergedInk = cleanValue(mergedInkNum.toString(), 2);
      const totalMergedArt = cleanValue(mergedArtNum.toString(), 2);
      setMergeData((fData: any) => ({ ...fData, totalMergedInk, totalMergedArt }));
    }
  }, [vaultMap, mergeData.toVault, mergeData.ink, mergeData.art]);

  /* INTERNAL COMPONENTS */
  const CompletedTx = (props: any) => (
    <>
      <NextButton
        // size="xsmall"
        label={
          <Text size={mobile ? 'xsmall' : undefined}>{props.tx.failed ? 'Report issue and go back' : 'Got it!'} </Text>
        }
        onClick={() => {
          props.resetTx();
          handleStepper(true);
        }}
      />
    </>
  );

  return (
    <CenterPanelWrap>
      <Box fill pad="large" gap="medium">
        <Box height={{ min: '250px' }} gap="medium">
          <Box direction="row-responsive" justify="between" fill="horizontal" align="center">
            <Box direction="row" align="center" gap="medium">
              <PositionAvatar position={selectedVault!} />
              <Box>
                <Text size={mobile ? 'medium' : 'large'}> {selectedVault?.displayName} </Text>
                <Text size="small"> {selectedVault?.id} </Text>
              </Box>
            </Box>
            <ExitButton action={() => close()} />
          </Box>

          {selectedVault?.isActive ? (
            <SectionWrap>
              <Box gap="small">
                <InfoBite
                  label="Vault debt + interest:"
                  value={`${cleanValue(selectedVault?.art_, vaultBase?.digitFormat!)} ${vaultBase?.symbol}`}
                  icon={<FiTrendingUp />}
                />
                <InfoBite
                  label="Maturity date:"
                  value={`${vaultSeries?.displayName}`}
                  icon={<FiClock color={vaultSeries?.color} />}
                />
                <InfoBite
                  label="Collateral posted:"
                  value={`${cleanValue(selectedVault?.ink_, vaultIlk?.digitFormat!)} ${
                    vaultIlk?.symbol
                  } ( ${collateralizationPercent} %)`}
                  icon={<Gauge value={parseFloat(collateralizationPercent!)} size="1em" />}
                />
              </Box>
            </SectionWrap>
          ) : (
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
        </Box>

        <Box height={{ min: '300px' }}>
          <SectionWrap title="Vault Actions">
            <Box elevation="xsmall" round="xsmall">
              <Select
                dropProps={{ round: 'xsmall' }}
                plain
                options={[
                  { text: 'Repay Debt', index: 0 },
                  { text: 'Roll Debt', index: 1 },
                  { text: 'Manage Collateral', index: 2 },
                  { text: 'View Transaction History', index: 3 },
                  { text: 'Transfer Vault', index: 4 },
                  { text: 'Merge Vault', index: 5 },
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
              {stepPosition[0] === 0 && (
                <Box margin={{ top: 'medium' }} gap="medium">
                  <InputWrap action={() => console.log('maxAction')} isError={repayError}>
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
                      action={() => setRepayInput(maxRepay)}
                      clearAction={() => setRepayInput('')}
                      showingMax={!!repayInput && repayInput === maxRepay}
                    />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[0] !== 0 && (
                <ActiveTransaction pad tx={repayTx}>
                  {/* <ActiveTransaction txCode={(selectedVault && repayTx.txCode) || ''} pad> */}
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite
                        label="Repay Debt"
                        icon={<FiArrowRight />}
                        value={`${cleanValue(repayInput, vaultBase?.digitFormat!)} ${vaultBase?.symbol}`}
                      />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </>
          )}

          {actionActive.index === 1 && (
            <>
              {stepPosition[actionActive.index] === 0 && (
                <Box margin={{ top: 'medium' }} gap="medium">
                  <SeriesSelector
                    selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                    actionType={ActionType.BORROW}
                    cardLayout={false}
                  />
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction pad tx={rollTx}>
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite
                        label="Roll Debt to Series"
                        icon={<FiArrowRight />}
                        value={`${rollToSeries?.displayName}`}
                      />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </>
          )}

          {actionActive.index === 2 && (
            <>
              {stepPosition[actionActive.index] === 0 && (
                <Box margin={{ top: 'medium' }} gap="medium">
                  <InputWrap action={() => console.log('maxAction')} isError={addCollatError}>
                    <TextInput
                      disabled={removeCollatInput}
                      plain
                      type="number"
                      placeholder="Additional collateral to add"
                      value={addCollatInput || ''}
                      onChange={(event: any) => setAddCollatInput(cleanValue(event.target.value))}
                      icon={<>{vaultIlk?.image}</>}
                    />
                    <MaxButton
                      disabled={removeCollatInput}
                      action={() => setAddCollatInput(maxAddCollat)}
                      clearAction={() => setAddCollatInput('')}
                      showingMax={!!addCollatInput && addCollatInput === maxAddCollat}
                    />
                  </InputWrap>
                  <InputWrap action={() => console.log('maxAction')} isError={removeCollatError}>
                    <TextInput
                      disabled={addCollatInput}
                      plain
                      type="number"
                      placeholder="Collateral to remove"
                      value={removeCollatInput || ''}
                      onChange={(event: any) => setRemoveCollatInput(cleanValue(event.target.value))}
                      icon={<>{vaultIlk?.image}</>}
                    />
                    <MaxButton
                      disabled={!!addCollatInput}
                      action={() => setRemoveCollatInput(ethers.utils.formatEther(maxRemove))}
                      clearAction={() => setRemoveCollatInput('')}
                      showingMax={!!removeCollatInput && ethers.utils.formatEther(maxRemove) === removeCollatInput}
                    />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction pad tx={addCollatInput ? addCollateralTx : removeCollateralTx}>
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      {addCollatInput && (
                        <InfoBite
                          label="Add Collateral"
                          icon={<FiArrowRight />}
                          value={`${cleanValue(addCollatInput, vaultIlk?.digitFormat!)} ${vaultIlk?.symbol}`}
                        />
                      )}
                      {removeCollatInput && (
                        <InfoBite
                          label="Remove Collateral"
                          icon={<FiArrowRight />}
                          value={`${cleanValue(removeCollatInput, vaultIlk?.digitFormat!)} ${vaultIlk?.symbol}`}
                        />
                      )}
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </>
          )}

          {actionActive.index === 3 && <YieldHistory seriesOrVault={selectedVault!} view={['VAULT']} />}

          {actionActive.index === 4 && (
            <>
              {stepPosition[actionActive.index] === 0 && (
                <Box margin={{ top: 'medium' }} gap="medium">
                  <InputWrap action={() => console.log('maxAction')} isError={null}>
                    <TextInput
                      plain
                      type="string"
                      placeholder="Transfer vault to address"
                      value={transferToAddressInput}
                      onChange={(event: any) => setTransferToAddressInput(event.target.value)}
                    />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction pad tx={transferTx}>
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite
                        label="Transfer Vault to: "
                        icon={<FiArrowRight />}
                        value={transferToAddressInput !== '' ? abbreviateHash(transferToAddressInput) : ''}
                      />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </>
          )}

          {actionActive.index === 5 && (
            <>
              {stepPosition[actionActive.index] === 0 && (
                <Box margin={{ top: 'medium' }} gap="medium">
                  <VaultDropSelector
                    vaults={matchingVaults}
                    handleSelect={handleMergeVaultSelect}
                    itemSelected={mergeData.toVault}
                    displayName="Select Vault"
                    placeholder="Select Vault"
                  />
                  {mergeData.advancedMergeToggle && (
                    <Box gap="xsmall">
                      <Box direction="row" justify="between" align="center">
                        Collateral
                        <InputWrap action={() => console.log('maxAction')} isError={mergeData.inkError}>
                          <TextInput
                            disabled={false}
                            name="ink"
                            plain
                            type="number"
                            placeholder="COLLATERAL TO MERGE"
                            value={mergeData.ink || ''}
                            onChange={(event: any) => handleMergeDataChange(event)}
                          />
                        </InputWrap>
                      </Box>
                      <Box direction="row" justify="between" align="center">
                        Debt
                        <InputWrap action={() => console.log('maxAction')} isError={mergeData.artError}>
                          <TextInput
                            disabled={false}
                            name="art"
                            plain
                            type="number"
                            placeholder="DEBT TO MERGE"
                            value={mergeData.art || ''}
                            onChange={(event: any) => handleMergeDataChange(event)}
                          />
                        </InputWrap>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction pad tx={mergeTx}>
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite
                        label={`Merging debt/collateral in this vault with vault: `}
                        icon={<FiArrowRight />}
                        value={`${mergeData.toVault.displayName}`}
                      />
                      {/* 
                      <InfoBite
                        label={`Merge ${selectedVault?.displayName} collateral with ${mergeData.toVault.displayName}: `}
                        icon={<FiArrowRight />}
                        value={`${mergeData.toVault.displayName} collateral: ${mergeData.totalMergedInk}`}
                      />
                      <InfoBite
                        label={`Merge ${selectedVault?.displayName} debt with ${mergeData.toVault.displayName}: `}
                        icon={<FiArrowRight />}
                        value={`${mergeData.toVault.displayName} debt: ${mergeData.totalMergedArt}`}
                      /> */}
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </>
          )}
        </Box>
      </Box>

      <ActionButtonWrap pad>
        {stepPosition[actionActive.index] === 0 && actionActive.index !== 3 && (
          <NextButton
            label={<Text size={mobile ? 'small' : undefined}> Next Step </Text>}
            onClick={() => handleStepper()}
            key="next"
            disabled={
              (actionActive.index === 0 && repayDisabled) ||
              (actionActive.index === 1 && rollDisabled) ||
              (actionActive.index === 2 && removeCollatInput && removeCollateralDisabled) ||
              (actionActive.index === 2 && addCollatInput && addCollateralDisabled) ||
              (actionActive.index === 4 && transferDisabled) ||
              (actionActive.index === 5 && mergeDisabled)
            }
            errorLabel={
              (actionActive.index === 0 && repayError) ||
              (actionActive.index === 2 && removeCollatError) ||
              (actionActive.index === 2 && addCollatError) ||
              (actionActive.index === 4 && transferError) ||
              (actionActive.index === 5 && (mergeData.inkError || mergeData.artError))
            }
          />
        )}

        {actionActive.index === 0 && stepPosition[actionActive.index] !== 0 && !(repayTx.success || repayTx.failed) && (
          <TransactButton
            primary
            label={
              <Text size={mobile ? 'small' : undefined}>
                {`Repay${repayTx.processActive ? 'ing' : ''} ${
                  nFormatter(Number(repayInput), vaultBase?.digitFormat!) || ''
                } ${vaultBase?.symbol}`}
              </Text>
            }
            onClick={() => handleRepay()}
            disabled={repayDisabled || repayTx.processActive}
          />
        )}

        {actionActive.index === 1 && stepPosition[actionActive.index] !== 0 && !(rollTx.success || rollTx.failed) && (
          <TransactButton
            primary
            label={<Text size={mobile ? 'small' : undefined}>{`Roll${rollTx.processActive ? 'ing' : ''} debt`}</Text>}
            onClick={() => handleRoll()}
            disabled={rollTx.processActive}
          />
        )}

        {actionActive.index === 2 &&
          stepPosition[actionActive.index] !== 0 &&
          addCollatInput &&
          !(addCollateralTx.success || addCollateralTx.failed) && (
            <TransactButton
              primary
              label={
                <Text size={mobile ? 'small' : undefined}>{`Add${addCollateralTx.processActive ? 'ing' : ''}`}</Text>
              }
              onClick={() => handleCollateral('ADD')}
              disabled={addCollateralTx.processActive}
            />
          )}

        {actionActive.index === 2 &&
          stepPosition[actionActive.index] !== 0 &&
          removeCollatInput &&
          !(removeCollateralTx.success || removeCollateralTx.failed) && (
            <TransactButton
              primary
              label={
                <Text size={mobile ? 'small' : undefined}>{`Remov${
                  removeCollateralTx.processActive ? 'ing' : 'e'
                }`}</Text>
              }
              onClick={() => handleCollateral('REMOVE')}
              disabled={removeCollateralTx.processActive}
            />
          )}

        {actionActive.index === 4 &&
          stepPosition[actionActive.index] !== 0 &&
          !(transferTx.success || transferTx.failed) && (
            <TransactButton
              primary
              label={
                <Text size={mobile ? 'small' : undefined}>
                  {`Transfer${transferTx.processActive ? 'ing' : ''} Vault`}
                </Text>
              }
              onClick={() => handleTransfer()}
              disabled={transferTx.processActive}
            />
          )}

        {actionActive.index === 5 && stepPosition[actionActive.index] !== 0 && !(mergeTx.success || mergeTx.failed) && (
          <TransactButton
            primary
            label={
              <Text size={mobile ? 'small' : undefined}>{`Merg${mergeTx.processActive ? 'ing' : 'e'} Vaults`}</Text>
            }
            onClick={() => handleMerge()}
            disabled={mergeData.inkError || mergeData.artError || mergeTx.processActive}
          />
        )}

        {/* TODO simplify this */}

        {stepPosition[actionActive.index] === 1 &&
          actionActive.index === 0 &&
          !repayTx.processActive &&
          (repayTx.success || repayTx.failed) && <CompletedTx tx={repayTx} resetTx={resetRepayTx} />}

        {stepPosition[actionActive.index] === 1 &&
          actionActive.index === 1 &&
          !rollTx.processActive &&
          (rollTx.success || rollTx.failed) && <CompletedTx tx={rollTx} resetTx={resetRollTx} />}

        {stepPosition[actionActive.index] === 1 &&
          actionActive.index === 2 &&
          !addCollateralTx.processActive &&
          (addCollateralTx.success || addCollateralTx.failed) && (
            <CompletedTx tx={addCollateralTx} resetTx={resetAddCollateralTx} />
          )}

        {stepPosition[actionActive.index] === 1 &&
          actionActive.index === 2 &&
          !removeCollateralTx.processActive &&
          (removeCollateralTx.success || removeCollateralTx.failed) && (
            <CompletedTx tx={removeCollateralTx} resetTx={resetRemoveCollateralTx} />
          )}

        {stepPosition[actionActive.index] === 1 &&
          actionActive.index === 4 &&
          !transferTx.processActive &&
          (transferTx.success || transferTx.failed) && <CompletedTx tx={rollTx} resetTx={resetTransferTx} />}

        {stepPosition[actionActive.index] === 1 &&
          actionActive.index === 5 &&
          !mergeTx.processActive &&
          (mergeTx.success || mergeTx.failed) && <CompletedTx tx={mergeTx} resetTx={resetMergeTx} />}
      </ActionButtonWrap>
    </CenterPanelWrap>
  );
};

export default Vault;

import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import { useHistory } from 'react-router-dom';

import { FiLock, FiClock, FiTrendingUp, FiLogOut, FiXCircle, FiPlusCircle, FiAlertTriangle } from 'react-icons/fi';
import { abbreviateHash, cleanValue, getTxCode } from '../utils/appUtils';
import { UserContext } from '../contexts/UserContext';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import { ActionCodes, ActionType, IAsset, ISeries, IUserContext, IVault } from '../types';

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

const Vault = ({ close }: { close: () => void }) => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const routerHistory = useHistory();

  /* STATE FROM CONTEXT */

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, seriesMap, vaultMap, selectedVaultId, selectedIlkId } = userState;
  // const { setSelectedVault } = userActions;

  const selectedVault: IVault | undefined = vaultMap.get(selectedVaultId!);
  const selectedIlk = assetMap.get(selectedIlkId!);
  const vaultBase: IAsset | undefined = assetMap.get(selectedVault?.baseId!);
  const vaultIlk: IAsset | undefined = assetMap.get(selectedVault?.ilkId!);
  const vaultSeries: ISeries | undefined = seriesMap.get(selectedVault?.seriesId!);

  const { collateralizationPercent } = useCollateralization(
    selectedVault?.art.toString(),
    selectedVault?.ink.toString(),
    selectedVault
  );

  /* LOCAL STATE */
  // tab state + control
  const [tabIndex, setTabIndex] = React.useState(0);
  const onActive = (nextIndex: number) => setTabIndex(nextIndex);

  // stepper for stepping within multiple tabs
  const [stepPosition, setStepPosition] = useState<number[]>([0, 0, 0, 0, 0, 0]);

  const [repayInput, setRepayInput] = useState<any>(undefined);
  const [borrowInput, setBorrowInput] = useState<any>(undefined);
  const [collatInput, setCollatInput] = useState<any>(undefined);

  const [addCollatInput, setAddCollatInput] = useState<any>(undefined);
  const [removeCollatInput, setRemoveCollatInput] = useState<any>(undefined);

  const [rollInput, setRollInput] = useState<any>(undefined);
  const [rollToSeries, setRollToSeries] = useState<ISeries | null>(null);

  const [transferToAddressInput, setTransferToAddressInput] = useState<string>('');

  const [maxRepay, setMaxRepay] = useState<string | undefined>();
  const [maxCollat, setMaxCollat] = useState<string | undefined>();

  const [repayError, setRepayError] = useState<string | null>(null);
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const [addCollatError, setAddCollatError] = useState<string | null>(null);
  const [removeCollatError, setRemoveCollatError] = useState<string | null>(null);

  const [repayDisabled, setRepayDisabled] = useState<boolean>(true);

  const [actionActive, setActionActive] = useState<any>(selectedVault?.isActive ? { index: 0 } : { index: 3 });
  // const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  const [mergeData, setMergeData] = useState<any>({ toVault: null, ink: '', art: '' });

  const [destroyDisabled, setDestroyDisabled] = useState<boolean>(true);
  const [destroyInput, setDestroyInput] = useState<string>('');

  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);

  /* HOOK FNS */
  const { repay, borrow, rollDebt, transfer, merge, destroy } = useBorrowActions();
  const { addCollateral, removeCollateral } = useCollateralActions();

  useEffect(() => {
    const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
    const _matchingVaults = arr.filter(
      (v: IVault) =>
        v.ilkId === selectedVault?.ilkId && v.baseId === selectedVault.baseId && v.seriesId === selectedVault.seriesId
    );
    setMatchingVaults(_matchingVaults);
  }, [vaultMap, selectedVault?.ilkId, selectedVault?.baseId, selectedVault?.seriesId]);

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    setStepPosition(newStepArray);
  };

  const handleRepay = () => {
    selectedVault && repay(selectedVault, repayInput?.toString());
    setRepayInput('');
  };

  const handleBorrow = () => {
    selectedVault && borrow(selectedVault, borrowInput, '0');
    setBorrowInput('');
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
    setTransferToAddressInput('');
  };

  const handleMerge = () => {
    selectedVault && merge(selectedVault, mergeData.toVault, mergeData.ink, mergeData.art);
  };

  const handleMergeDataChange = (e: any) => {
    const { name, value } = e.target;
    setMergeData((fData: any) => ({ ...fData, [name]: cleanValue(value) }));
  };

  const handleMergeVaultSelect = (vault: IVault) => {
    setMergeData((fData: any) => ({ ...fData, toVault: vault }));
  };

  const handleDestroy = () => {
    selectedVault && destroy(selectedVault);
  };

  const handleDestroyInputChange = (event: any) => {
    const {
      target: { value },
    } = event;

    setDestroyInput(value);
    value === selectedVault?.displayName ? setDestroyDisabled(false) : setDestroyDisabled(true);
  };

  /* SET MAX VALUES */

  useEffect(() => {
    /* CHECK the max available repay */
    if (activeAccount) {
      (async () => {
        const _maxToken = await vaultBase?.getBalance(activeAccount);
        const _max = _maxToken && selectedVault?.art.gt(_maxToken) ? _maxToken : selectedVault?.art;

        _max && setMaxRepay(ethers.utils.formatEther(_max)?.toString());
        // if (_max?.gt(ZERO_BN)) {
        //   _max && setMaxRepay(ethers.utils.formatEther(_max)?.toString());
        // } else {
        //   setMaxRepay(undefined);
        // }
      })();
    }
  }, [activeAccount, selectedVault?.art, vaultBase, setMaxRepay]);

  useEffect(() => {
    /* CHECK collateral selection and sets the max available collateral */
    activeAccount &&
      (async () => {
        const _max = await vaultIlk?.getBalance(activeAccount);
        _max && setMaxCollat(ethers.utils.formatEther(_max)?.toString());
      })();
  }, [activeAccount, vaultIlk, setMaxCollat]);

  /* WATCH FOR WARNINGS AND ERRORS */

  /* CHECK for any repay input errors/warnings */
  useEffect(() => {
    if (repayInput || repayInput === '') {
      /* 1. Check if input exceeds balance */
      if (maxRepay && parseFloat(repayInput) > parseFloat(maxRepay))
        setRepayError('Repay amount exceeds maximum available');
      /* 3. next check */ else if (maxRepay && parseFloat(maxRepay) === 0) setRepayError('Zero token balance');
      /* 2. Check if input is above zero */ else if (parseFloat(repayInput) < 0)
        setRepayError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */ else {
        setRepayError(null);
      }
    }
  }, [repayInput, maxRepay, setRepayError]);

  /* CHECK for any collateral input errors/warnings */
  useEffect(() => {
    if (addCollatInput || addCollatInput === '') {
      /* 1. Check if input exceeds balance */
      if (maxCollat && parseFloat(addCollatInput) > parseFloat(maxCollat)) setAddCollatError('Amount exceeds balance');
      /* 2. Check if input is above zero */ else if (parseFloat(collatInput) < 0)
        setAddCollatError('Amount should be expressed as a positive value');
      /* 3. next check */ else if (false) setAddCollatError('Undercollateralised');
      /* if all checks pass, set null error message */ else {
        setAddCollatError(null);
      }
    }
  }, [addCollatInput, maxCollat, setAddCollatError]);

  /* ACTION DISABLING LOGIC */

  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    !repayInput || repayError ? setRepayDisabled(true) : setRepayDisabled(false);
  }, [repayInput, repayError, collatInput]);

  /* EXTRA INITIATIONS */

  useEffect(() => {
    // setAvailableVaults(Array.from(vaultMap.values())); // add some filtering here

    /* set global series, base and ilk */
    selectedVault && userActions.setSelectedSeries(selectedVault.seriesId);
    selectedVault && userActions.setSelectedBase(selectedVault.baseId);
    selectedVault && userActions.setSelectedIlk(selectedVault.ilkId);
  }, [vaultMap, selectedVault]);

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
                  value={`${selectedVault?.art_} ${vaultBase?.symbol}`}
                  icon={<FiTrendingUp />}
                />
                <InfoBite
                  label="Maturity date:"
                  value={`${vaultSeries?.displayName}`}
                  icon={<FiClock color={vaultSeries?.color} />}
                />
                <InfoBite
                  label="Collateral posted:"
                  value={`${selectedVault?.ink_} ${vaultIlk?.symbol} ( ${collateralizationPercent} %)`}
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
                    <Text>This account no longer controls this vault</Text>
                  </Box>
                </Box>

                <Box pad={{ horizontal: 'medium' }}>
                  <Text size="xsmall">Vault {selectedVault?.id} has either been deleted or transfered.</Text>
                </Box>
              </Box>
            </SectionWrap>
          )}
        </Box>

        <Box height={{ min: '250px' }}>
          <Box elevation="xsmall" round="xsmall">
            <Select
              dropProps={{ round: 'xsmall' }}
              plain
              options={[
                { text: 'Repay Debt', index: 0 },
                { text: 'Roll All Debt', index: 1 },
                { text: 'Manage Collateral', index: 2 },
                { text: 'View History', index: 3 },
                { text: 'Transfer Vault', index: 4 },
                { text: 'Merge Vaults', index: 5 },
                { text: 'Delete Vault', index: 6 },
              ]}
              labelKey="text"
              valueKey="index"
              value={actionActive}
              onChange={({ option }) => setActionActive(option)}
              disabled={selectedVault?.isActive ? undefined : [0, 1, 2, 4, 5]}
            />
          </Box>

          {actionActive.index === 0 && (
            <Box>
              {stepPosition[0] === 0 && (
                <Box pad={{ vertical: 'medium' }}>
                  <InputWrap action={() => console.log('maxAction')} isError={repayError}>
                    <TextInput
                      plain
                      type="number"
                      placeholder="Enter amount to Repay"
                      // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                      value={repayInput || ''}
                      onChange={(event: any) => setRepayInput(cleanValue(event.target.value))}
                    />
                    <MaxButton action={() => setRepayInput(maxRepay)} />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[0] !== 0 && (
                <ActiveTransaction
                  txCode={(selectedVault && getTxCode(ActionCodes.REPAY, selectedVault?.id)) || ''}
                  pad
                >
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite label="Repay Debt" icon={<FiClock />} value={`${repayInput} ${vaultBase?.symbol}`} />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </Box>
          )}

          {actionActive.index === 1 && (
            <Box>
              {stepPosition[actionActive.index] === 0 && (
                <Box pad={{ vertical: 'medium' }} fill="horizontal" direction="row" align="center">
                  <SeriesSelector
                    selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                    actionType={ActionType.BORROW}
                    cardLayout={false}
                  />
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction
                  txCode={(selectedVault && getTxCode(ActionCodes.ROLL_DEBT, selectedVault.id)) || ''}
                  pad
                >
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite label="Roll Debt to Series" icon={<FiClock />} value={`${rollToSeries?.displayName}`} />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </Box>
          )}

          {actionActive.index === 2 && (
            <Box>
              {stepPosition[actionActive.index] === 0 && (
                <Box fill gap="small" pad="small">
                  <Box direction="row" justify="between" align="center">
                    Add
                    <InputWrap action={() => console.log('maxAction')} isError={addCollatError}>
                      <TextInput
                        disabled={removeCollatInput}
                        plain
                        type="number"
                        placeholder="ADD"
                        value={addCollatInput || ''}
                        onChange={(event: any) => setAddCollatInput(cleanValue(event.target.value))}
                      />
                    </InputWrap>
                  </Box>
                  <Box direction="row" justify="between" align="center">
                    Remove
                    <InputWrap action={() => console.log('maxAction')} isError={removeCollatError}>
                      <TextInput
                        disabled={addCollatInput}
                        plain
                        type="number"
                        placeholder="REMOVE"
                        value={removeCollatInput || ''}
                        onChange={(event: any) => setRemoveCollatInput(cleanValue(event.target.value))}
                      />
                    </InputWrap>
                  </Box>
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction
                  txCode={
                    selectedVault && addCollatInput
                      ? getTxCode(ActionCodes.ADD_COLLATERAL, selectedVault.id)
                      : (selectedVault && getTxCode(ActionCodes.REMOVE_COLLATERAL, selectedVault?.id)) || ''
                  }
                  pad
                >
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      {addCollatInput && (
                        <InfoBite
                          label="Add Collateral"
                          icon={<FiPlusCircle />}
                          value={`${addCollatInput} ${vaultIlk?.symbol}`}
                        />
                      )}
                      {removeCollatInput && (
                        <InfoBite
                          label="Remove Collateral"
                          icon={<FiPlusCircle />}
                          value={`${removeCollatInput} ${vaultIlk?.symbol}`}
                        />
                      )}
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </Box>
          )}

          {actionActive.index === 3 && <YieldHistory seriesOrVault={selectedVault!} view={['VAULT']} />}

          {actionActive.index === 4 && (
            <Box>
              {stepPosition[actionActive.index] === 0 && (
                <Box pad={{ vertical: 'medium' }}>
                  <InputWrap action={() => console.log('maxAction')} isError={null}>
                    <TextInput
                      plain
                      type="string"
                      placeholder="Transfer vault to address"
                      // ref={(el:any) => { el && !repayOpen && !rateLockOpen && !mobile && el.focus(); setInputRef(el); }}
                      value={transferToAddressInput}
                      onChange={(event: any) => setTransferToAddressInput(event.target.value)}
                    />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction
                  txCode={(selectedVault && getTxCode(ActionCodes.TRANSFER_VAULT, selectedVault?.id)) || ''}
                  pad
                >
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite
                        label="Transfer Vault to: "
                        icon={<FiPlusCircle />}
                        value={transferToAddressInput !== '' ? abbreviateHash(transferToAddressInput) : ''}
                      />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </Box>
          )}

          {actionActive.index === 5 && (
            <Box>
              {stepPosition[actionActive.index] === 0 && (
                <Box gap="xsmall">
                  <VaultDropSelector
                    vaults={matchingVaults}
                    handleSelect={handleMergeVaultSelect}
                    selectedIlk={selectedIlk}
                    itemSelected={mergeData.toVault}
                    displayName="Select Vault"
                    placeholder="Select Vault"
                  />
                  <Box gap="xsmall">
                    <Box direction="row" justify="between" align="center">
                      Collateral
                      <InputWrap action={() => console.log('maxAction')} isError={addCollatError}>
                        <TextInput
                          name="ink"
                          disabled={removeCollatInput}
                          plain
                          type="number"
                          placeholder="AMOUNT TO MERGE"
                          value={mergeData.ink || ''}
                          onChange={(event: any) => handleMergeDataChange(event)}
                        />
                      </InputWrap>
                    </Box>
                    <Box direction="row" justify="between" align="center">
                      Debt
                      <InputWrap action={() => console.log('maxAction')} isError={removeCollatError}>
                        <TextInput
                          name="art"
                          disabled={addCollatInput}
                          plain
                          type="number"
                          placeholder="AMOUNT TO MERGE"
                          value={mergeData.art || ''}
                          onChange={(event: any) => handleMergeDataChange(event)}
                        />
                      </InputWrap>
                    </Box>
                  </Box>
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction
                  txCode={(selectedVault && getTxCode(ActionCodes.TRANSFER_VAULT, selectedVault?.id)) || ''}
                  pad
                >
                  <SectionWrap
                    title="Review your merge transaction"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <InfoBite
                      label={`Merge ${selectedVault?.displayName} with ${mergeData.toVault.displayName}: `}
                      icon={<FiPlusCircle />}
                      value={`Collateral: ${mergeData.ink}, Debt: ${mergeData.art}`}
                    />
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </Box>
          )}

          {actionActive.index === 6 && (
            <Box>
              {stepPosition[actionActive.index] === 0 && (
                <Box pad={{ vertical: 'medium' }}>
                  <InputWrap action={() => console.log('maxAction')} isError={null}>
                    <TextInput
                      plain
                      type="string"
                      placeholder="Type the name of the vault."
                      value={destroyInput}
                      onChange={(event) => handleDestroyInputChange(event)}
                    />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <ActiveTransaction
                  txCode={(selectedVault && getTxCode(ActionCodes.DELETE_VAULT, selectedVault?.id)) || ''}
                  pad
                >
                  <SectionWrap
                    title="Review transaction:"
                    rightAction={<CancelButton action={() => handleStepper(true)} />}
                  >
                    <Box margin={{ top: 'medium' }}>
                      <InfoBite
                        // label="Pay back all debt and delete vault:"
                        label="Delete vault (vault must have 0 debt and 0 collateral):"
                        icon={<FiPlusCircle />}
                        value={destroyInput}
                      />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              )}
            </Box>
          )}
        </Box>
      </Box>

      <ActionButtonWrap pad>
        {stepPosition[actionActive.index] === 0 && actionActive.index !== 3 && actionActive.index !== 5 && (
          <NextButton
            label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
            onClick={() => handleStepper()}
            key="next"
            disabled={!selectedVault?.isActive}
          />
        )}

        {/* TODO Marco this is screaming for more efficient code   -> simple array.map possibly? */}

        {actionActive.index === 0 && stepPosition[actionActive.index] !== 0 && (
          <TransactButton
            primary
            label={<Text size={mobile ? 'small' : undefined}> {`Repay ${cleanValue(repayInput, 6) || ''} Dai`} </Text>}
            onClick={() => handleRepay()}
            disabled={repayDisabled}
          />
        )}

        {actionActive.index === 1 && stepPosition[actionActive.index] !== 0 && (
          <TransactButton
            primary
            label={<Text size={mobile ? 'small' : undefined}> Roll debt </Text>}
            onClick={() => handleRoll()}
          />
        )}

        {actionActive.index === 2 && stepPosition[actionActive.index] !== 0 && addCollatInput && (
          <TransactButton
            primary
            label={<Text size={mobile ? 'small' : undefined}> Add </Text>}
            onClick={() => handleCollateral('ADD')}
          />
        )}

        {actionActive.index === 2 && stepPosition[actionActive.index] !== 0 && removeCollatInput && (
          <TransactButton
            primary
            label={<Text size={mobile ? 'small' : undefined}> Remove </Text>}
            onClick={() => handleCollateral('REMOVE')}
          />
        )}

        {actionActive.index === 4 && stepPosition[actionActive.index] !== 0 && transferToAddressInput !== '' && (
          <TransactButton
            primary
            label={
              <Text size={mobile ? 'small' : undefined}>
                {ethers.utils.isAddress(transferToAddressInput) ? 'Transfer vault' : 'Invalid Address'}
              </Text>
            }
            onClick={() => handleTransfer()}
            disabled={!ethers.utils.isAddress(transferToAddressInput)}
          />
        )}

        {actionActive.index === 5 && stepPosition[actionActive.index] !== 0 && (
          <TransactButton
            primary
            label={<Text size={mobile ? 'small' : undefined}> Merge Vaults </Text>}
            onClick={() => handleMerge()}
          />
        )}

        {actionActive.index === 6 && stepPosition[actionActive.index] === 0 && (
          <NextButton
            disabled={destroyDisabled}
            label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
            onClick={() => handleStepper()}
            key="next"
          />
        )}

        {actionActive.index === 6 && stepPosition[actionActive.index] !== 0 && (
          <TransactButton
            primary
            disabled={destroyDisabled}
            label={<Text size={mobile ? 'small' : undefined}> {`Delete ${selectedVault?.displayName}`} </Text>}
            onClick={() => handleDestroy()}
          />
        )}
      </ActionButtonWrap>
    </CenterPanelWrap>
  );
};

export default Vault;

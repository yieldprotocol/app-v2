import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Keyboard, ResponsiveContext, Text, TextInput } from 'grommet';

import { FiClock, FiPocket, FiPercent, FiTrendingUp } from 'react-icons/fi';

import SeriesSelector from '../components/selectors/SeriesSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import ActionButtonWrap from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';

import MaxButton from '../components/buttons/MaxButton';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, IUserContext, IVault, ProcessStage, TxState } from '../types';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import VaultSelector from '../components/selectors/VaultPositionSelector';
import ActiveTransaction from '../components/ActiveTransaction';

import { cleanValue, getVaultIdFromReceipt, nFormatter } from '../utils/appUtils';

import YieldInfo from '../components/YieldInfo';
import BackButton from '../components/buttons/BackButton';
import { Gauge } from '../components/Gauge';
import InfoBite from '../components/InfoBite';
import NextButton from '../components/buttons/NextButton';
import TransactButton from '../components/buttons/TransactButton';
import { useApr } from '../hooks/useApr';
import PositionAvatar from '../components/PositionAvatar';
import VaultDropSelector from '../components/selectors/VaultDropSelector';
import { useInputValidation } from '../hooks/useInputValidation';
import AltText from '../components/texts/AltText';
import YieldCardHeader from '../components/YieldCardHeader';
import { useBorrow } from '../hooks/actionHooks/useBorrow';
import { useCollateralHelpers } from '../hooks/actionHelperHooks/useCollateralHelpers';
import { useBorrowHelpers } from '../hooks/actionHelperHooks/useBorrowHelpers';
import InputInfoWrap from '../components/wraps/InputInfoWrap';
import ColorText from '../components/texts/ColorText';
import { useProcess } from '../hooks/useProcess';

import { ChainContext } from '../contexts/ChainContext';
import DummyVaultItem from '../components/positionItems/DummyVaultItem';
import DashMobileButton from '../components/buttons/DashMobileButton';

const Borrow = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, seriesMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;

  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedIlk = assetMap.get(selectedIlkId!);
  const selectedSeries = seriesMap.get(selectedSeriesId!);

  /* LOCAL STATE */
  const [stepPosition, setStepPosition] = useState<number>(0);

  const [borrowInput, setBorrowInput] = useState<string>('');
  const [collatInput, setCollatInput] = useState<string>('');
  // const [maxCollat, setMaxCollat] = useState<string | undefined>();

  const [borrowDisabled, setBorrowDisabled] = useState<boolean>(true);
  const [stepDisabled, setStepDisabled] = useState<boolean>(true);

  const [vaultToUse, setVaultToUse] = useState<IVault | undefined>(undefined);
  const [newVaultId, setNewVaultId] = useState<string | undefined>(undefined);

  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);

  const borrow = useBorrow();
  const { apr } = useApr(borrowInput, ActionType.BORROW, selectedSeries);

  const { collateralizationPercent, undercollateralized, minCollateral_, minSafeCollateral, maxCollateral } =
    useCollateralHelpers(borrowInput, collatInput, vaultToUse);

  const { maxAllowedBorrow, minAllowedBorrow, borrowEstimate_ } = useBorrowHelpers(
    borrowInput,
    collatInput,
    vaultToUse,
    selectedSeries
  );

  /* input validation hooks */
  const { inputError: borrowInputError } = useInputValidation(borrowInput, ActionCodes.BORROW, selectedSeries, [
    minAllowedBorrow,
    maxAllowedBorrow,
  ]);

  const { inputError: collatInputError } = useInputValidation(collatInput, ActionCodes.ADD_COLLATERAL, selectedSeries, [
    Number(minCollateral_) - Number(vaultToUse?.ink_),
    maxCollateral,
  ]);

  /* TX info (for disabling buttons) */
  const { txProcess: borrowProcess, resetProcess } = useProcess(ActionCodes.BORROW, selectedSeriesId!);

  /** LOCAL ACTION FNS */
  const handleBorrow = () => {
    const _vault = vaultToUse?.id ? vaultToUse : undefined; // if vaultToUse has id property, use it
    !borrowDisabled && borrow(_vault, borrowInput, collatInput);
  };

  const resetInputs = useCallback(() => {
    setBorrowInput('');
    setCollatInput('');
    setStepPosition(0);
    resetProcess();
  }, [resetProcess]);

  /* BORROW DISABLING LOGIC */
  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    !activeAccount ||
    !borrowInput ||
    !selectedSeries ||
    !selectedIlk ||
    undercollateralized ||
    borrowInputError ||
    collatInputError ||
    selectedSeries?.seriesIsMature
      ? setBorrowDisabled(true)
      : /* else if all pass, then unlock borrowing */
        setBorrowDisabled(false);
  }, [
    borrowInput,
    collatInput,
    selectedSeries,
    selectedIlk,
    activeAccount,
    borrowInputError,
    collatInputError,
    undercollateralized,
  ]);

  /* ADD COLLATERAL DISABLING LOGIC */

  /* if ANY of the following conditions are met: block next step action */
  useEffect(() => {
    !activeAccount || !borrowInput || !selectedSeries || borrowInputError || selectedSeries?.seriesIsMature
      ? setStepDisabled(true)
      : setStepDisabled(false); /* else if all pass, then unlock borrowing */
  }, [borrowInput, borrowInputError, selectedSeries, activeAccount]);

  /* CHECK the list of current vaults which match the current series/ilk selection */ // TODO look at moving this to helper hook?
  useEffect(() => {
    if (selectedBase && selectedSeries && selectedIlk) {
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVaults = arr.filter(
        (v: IVault) =>
          v.ilkId === selectedIlk.id && v.baseId === selectedBase.id && v.seriesId === selectedSeries.id && v.isActive
      );
      setMatchingVaults(_matchingVaults);
    }
  }, [vaultMap, selectedBase, selectedIlk, selectedSeries]);

  /* reset the selected vault on every component change */
  useEffect(() => {
    setVaultToUse(undefined);
  }, [selectedIlk, selectedBase, selectedSeries]);

  // // IS THIS VALUE IS ACTIUALLY JUST the fytoken value:
  // const borrowOutput = cleanValue(
  //   (Number(borrowInput) * (1 + Number(apr) / 100)).toString(),
  //   selectedBase?.digitFormat!
  // );

  useEffect(() => {
    if (
      borrowProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
      borrowProcess?.tx.status === TxState.SUCCESSFUL &&
      !vaultToUse
    ) {
      setNewVaultId(getVaultIdFromReceipt(borrowProcess?.tx?.receipt, contractMap)!);
    }

    borrowProcess?.stage === ProcessStage.PROCESS_COMPLETE_TIMEOUT && resetInputs();
  }, [borrowProcess, resetInputs]);

  return (
    <Keyboard onEsc={() => setCollatInput('')} onEnter={() => console.log('ENTER smashed')} target="document">
      {mobile && <DashMobileButton transparent={!!borrowInput} />}
      <MainViewWrap>
        {!mobile && (
          <PanelWrap>
            <Box margin={{ top: '35%' }} />
            <YieldInfo />
          </PanelWrap>
        )}

        <CenterPanelWrap series={selectedSeries || undefined}>
          <Box height="100%" pad={mobile ? 'medium' : { top: 'large', horizontal: 'large' }}>
            {stepPosition === 0 && ( // INITIAL STEP
              <Box fill gap="large">
                <YieldCardHeader>
                  <Box gap={mobile ? undefined : 'xsmall'}>
                    <ColorText size={mobile ? 'medium' : '2rem'}>BORROW</ColorText>
                    <AltText color="text-weak" size="xsmall">
                      Borrow popular ERC20 tokens at a{' '}
                      <Text size="small" color="text">
                        {' '}
                        fixed rate{' '}
                      </Text>
                    </AltText>
                  </Box>
                </YieldCardHeader>

                <SectionWrap>
                  <Box direction="row-responsive" gap="small">
                    <Box basis={mobile ? undefined : '60%'}>
                      <InputWrap
                        action={() => console.log('maxAction')}
                        isError={borrowInputError}
                        message={
                          borrowInput && (
                            <InputInfoWrap>
                              <Text size="small" color="text-weak">
                                Requires equivalent of {cleanValue(minCollateral_, selectedIlk?.digitFormat)}{' '}
                                {selectedIlk?.symbol} collateral
                              </Text>
                            </InputInfoWrap>
                          )
                        }
                      >
                        <TextInput
                          plain
                          type="number"
                          placeholder="Enter amount"
                          value={borrowInput}
                          onChange={(event: any) => setBorrowInput(cleanValue(event.target.value))}
                          autoFocus={!mobile}
                        />
                      </InputWrap>
                    </Box>
                    <Box basis={mobile ? undefined : '40%'}>
                      <AssetSelector />
                    </Box>
                  </Box>
                </SectionWrap>

                <SectionWrap
                  title={
                    seriesMap.size > 0
                      ? `Available ${selectedBase?.symbol}${selectedBase && '-based'} maturity dates`
                      : ''
                  }
                >
                  <SeriesSelector inputValue={borrowInput} actionType={ActionType.BORROW} />
                </SectionWrap>
              </Box>
            )}

            {stepPosition === 1 && ( // ADD COLLATERAL
              <Box gap="medium">
                <YieldCardHeader>
                  <BackButton action={() => setStepPosition(0)} />
                </YieldCardHeader>

                <Box gap="large" height="400px">
                  <SectionWrap>
                    <Box direction="row" gap="large" margin={{ vertical: 'medium' }}>
                      <Box>
                        <Gauge value={parseFloat(collateralizationPercent!)} size={mobile ? '6em' : '8em'} />
                      </Box>

                      <Box align="center">
                        <Text size={mobile ? 'xsmall' : 'medium'} color="text-weak">
                          Collateralization
                        </Text>
                        <Text size={mobile ? 'large' : 'xlarge'}>
                          {parseFloat(collateralizationPercent!) > 10000
                            ? nFormatter(parseFloat(collateralizationPercent!), 2)
                            : parseFloat(collateralizationPercent!)}
                          %
                        </Text>
                      </Box>
                    </Box>
                  </SectionWrap>

                  <SectionWrap title="Amount of collateral to add">
                    <Box direction="row-responsive" gap="medium">
                      <Box basis={mobile ? undefined : '60%'} fill="horizontal">
                        <InputWrap
                          action={() => console.log('maxAction')}
                          disabled={!selectedSeries}
                          isError={collatInputError}
                          message={
                            borrowInput &&
                            minSafeCollateral && (
                              <InputInfoWrap action={() => setCollatInput(cleanValue(minSafeCollateral, 12))}>
                                <Text size="small" color="text-weak">
                                  Use Safe Minimum{': '}
                                  {cleanValue(minSafeCollateral, 4)} {selectedIlk?.symbol}
                                </Text>
                              </InputInfoWrap>
                            )
                          }
                        >
                          <TextInput
                            plain
                            type="number"
                            placeholder="Enter amount"
                            // ref={(el:any) => { el && el.focus(); }}
                            value={collatInput}
                            onChange={(event: any) => setCollatInput(cleanValue(event.target.value))}
                            disabled={!selectedSeries || selectedSeries.seriesIsMature}
                          />
                          <MaxButton
                            action={() => maxCollateral && setCollatInput(maxCollateral)}
                            disabled={!selectedSeries || collatInput === maxCollateral || selectedSeries.seriesIsMature}
                            clearAction={() => setCollatInput('')}
                            showingMax={!!collatInput && collatInput === maxCollateral}
                          />
                        </InputWrap>
                      </Box>
                      <Box basis={mobile ? undefined : '40%'}>
                        <AssetSelector selectCollateral />
                      </Box>
                    </Box>
                  </SectionWrap>

                  {matchingVaults.length > 0 && (
                    <SectionWrap title="Add to an exisiting vault" disabled={matchingVaults.length < 1}>
                      <VaultDropSelector
                        vaults={matchingVaults}
                        handleSelect={(option: any) => setVaultToUse(option)}
                        itemSelected={vaultToUse}
                        displayName="Create New Vault"
                        placeholder="Create New Vault"
                        defaultOptionValue="Create New Vault"
                      />
                    </SectionWrap>
                  )}
                </Box>
              </Box>
            )}

            {stepPosition === 2 && ( // REVIEW
              <Box gap="large">
                <YieldCardHeader>
                  {borrowProcess?.stage !== ProcessStage.PROCESS_COMPLETE ? (
                    <BackButton action={() => setStepPosition(1)} />
                  ) : (
                    <Box pad="1em" />
                  )}
                </YieldCardHeader>

                <ActiveTransaction full txProcess={borrowProcess}>
                  <Box
                    gap="small"
                    pad={{ horizontal: 'large', vertical: 'medium' }}
                    round="xsmall"
                    animation={{ type: 'zoomIn', size: 'small' }}
                  >
                    <InfoBite
                      label="Amount to be Borrowed"
                      icon={<FiPocket />}
                      value={`${cleanValue(borrowInput, selectedBase?.digitFormat!)} ${selectedBase?.symbol}`}
                    />
                    <InfoBite label="Series Maturity" icon={<FiClock />} value={`${selectedSeries?.displayName}`} />
                    <InfoBite
                      label="Vault Debt Payable @ Maturity"
                      icon={<FiTrendingUp />}
                      value={`${cleanValue(borrowEstimate_, selectedBase?.digitFormat! )} ${selectedBase?.symbol}`}
                    />
                    <InfoBite label="Effective APR" icon={<FiPercent />} value={`${apr}%`} />
                    <InfoBite
                      label="Total Supporting Collateral"
                      icon={<Gauge value={parseFloat(collateralizationPercent!)} size="1em" />}
                      value={`${cleanValue(collatInput, selectedIlk?.digitFormat!)} ${
                        selectedIlk?.symbol
                      } (${collateralizationPercent}% )`}
                    />
                    {vaultToUse?.id && (
                      <InfoBite
                        label="Adding to Existing Vault"
                        icon={<PositionAvatar position={vaultToUse} condensed actionType={ActionType.BORROW} />}
                        value={`${vaultToUse.displayName}`}
                      />
                    )}
                  </Box>
                </ActiveTransaction>
              </Box>
            )}

            {stepPosition === 2 &&
              borrowProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
              borrowProcess?.tx.status === TxState.SUCCESSFUL && (
                <Box pad="large" gap="small">
                  <Text size="small"> View Vault: </Text>
                  {newVaultId && <DummyVaultItem series={selectedSeries!} vaultId={newVaultId!} condensed />}
                </Box>
              )}
          </Box>

          <Box>
            <ActionButtonWrap pad>
              {(stepPosition === 0 || stepPosition === 1) && (
                <NextButton
                  // label={<Text size={mobile ? 'small' : undefined}> Next step </Text>}
                  label={
                    borrowInput && !selectedSeries
                      ? `Select a ${selectedBase?.symbol}${selectedBase && '-based'} Maturity`
                      : 'Next Step'
                  }
                  onClick={() => setStepPosition(stepPosition + 1)}
                  disabled={stepPosition === 0 ? stepDisabled : borrowDisabled}
                  errorLabel={stepPosition === 0 ? borrowInputError : collatInputError}
                />
              )}

              {stepPosition === 2 && borrowProcess?.stage !== ProcessStage.PROCESS_COMPLETE && (
                <TransactButton
                  primary
                  label={
                    <Text size={mobile ? 'small' : undefined}>
                      {`Borrow${borrowProcess?.processActive ? `ing` : ''} ${
                        nFormatter(Number(borrowInput), selectedBase?.digitFormat!) || ''
                      } ${selectedBase?.symbol || ''}`}
                    </Text>
                  }
                  onClick={() => handleBorrow()}
                  disabled={borrowDisabled || borrowProcess?.processActive}
                />
              )}

              {stepPosition === 2 &&
                borrowProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
                borrowProcess?.tx.status === TxState.SUCCESSFUL && (
                  <NextButton
                    label={<Text size={mobile ? 'small' : undefined}>Borrow more</Text>}
                    onClick={() => resetInputs()}
                  />
                )}

              {stepPosition === 2 &&
                borrowProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
                borrowProcess?.tx.status === TxState.FAILED && (
                  <>
                    <NextButton
                      size="xsmall"
                      label={<Text size={mobile ? 'xsmall' : undefined}> Report and go back</Text>}
                      onClick={() => resetInputs()}
                    />
                  </>
                )}
            </ActionButtonWrap>
          </Box>
        </CenterPanelWrap>

        <PanelWrap right basis="40%">
          {!mobile && <VaultSelector />}
        </PanelWrap>
      </MainViewWrap>
    </Keyboard>
  );
};

export default Borrow;

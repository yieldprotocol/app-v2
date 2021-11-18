import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, Keyboard, ResponsiveContext, Text, TextInput, } from 'grommet';

import { FiClock, FiPocket, FiPercent, FiTrendingUp, } from 'react-icons/fi';

import SeriesSelector from '../components/selectors/SeriesSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import ActionButtonWrap from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';

import MaxButton from '../components/buttons/MaxButton';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, IUserContext, IUserContextState, IVault, ProcessStage, TxState } from '../types';
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
import SeriesOrStrategySelectorModal from '../components/selectors/SeriesOrStrategySelectorModal';
import YieldNavigation from '../components/YieldNavigation';
import VaultItem from '../components/positionItems/VaultItem';

const Borrow = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);
  const { userState }: { userState: IUserContextState } = useContext(UserContext) as IUserContext;
  const { activeAccount, vaultMap, seriesMap, selectedSeries, selectedIlk, selectedBase } = userState;

  /* LOCAL STATE */
  const [modalOpen, toggleModal] = useState<boolean>(false);
  const [stepPosition, setStepPosition] = useState<number>(0);

  const [borrowInput, setBorrowInput] = useState<string>('');
  const [collatInput, setCollatInput] = useState<string>('');
  // const [maxCollat, setMaxCollat] = useState<string | undefined>();

  const [borrowDisabled, setBorrowDisabled] = useState<boolean>(true);
  const [stepDisabled, setStepDisabled] = useState<boolean>(true);

  const [vaultToUse, setVaultToUse] = useState<IVault | undefined>(undefined);
  const [newVaultId, setNewVaultId] = useState<string | undefined>(undefined);

  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);
  const [currentGaugeColor, setCurrentGaugeColor] = useState<string>('#EF4444');

  const borrow = useBorrow();
  const { apr } = useApr(borrowInput, ActionType.BORROW, selectedSeries);

  const {
    collateralizationPercent,
    undercollateralized,
    minCollateral_,
    minSafeCollateral,
    maxCollateral,
    minSafeCollatRatioPct,
    minCollatRatioPct,
  } = useCollateralHelpers(borrowInput, collatInput, vaultToUse);

  const { minDebt_, maxDebt_, borrowPossible, borrowEstimate_ } = useBorrowHelpers(
    borrowInput,
    collatInput,
    vaultToUse,
    selectedSeries
  );

  /* input validation hooks */
  const { inputError: borrowInputError } = useInputValidation(borrowInput, ActionCodes.BORROW, selectedSeries, [
    minDebt_,
    maxDebt_,
  ]);

  const { inputError: collatInputError } = useInputValidation(collatInput, ActionCodes.ADD_COLLATERAL, selectedSeries, [
    Number(minCollateral_) - Number(vaultToUse?.ink_),
    maxCollateral,
  ]);

  /* TX info (for disabling buttons) */
  const { txProcess: borrowProcess, resetProcess } = useProcess(ActionCodes.BORROW, selectedSeries?.id!);

  /** LOCAL ACTION FNS */
  const handleBorrow = () => {
    const _vault = vaultToUse?.id ? vaultToUse : undefined; // if vaultToUse has id property, use it
    !borrowDisabled && borrow(_vault, borrowInput, collatInput);
  };

  const handleGaugeColorChange: any = (val: string) => {
    setCurrentGaugeColor(val);
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
      : setBorrowDisabled(false); /* else if all pass, then unlock borrowing */
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
    !borrowInput ||
    !selectedSeries ||
    borrowInputError ||
    selectedSeries?.seriesIsMature ||
    borrowInputError ||
    (stepPosition === 1 && undercollateralized) ||
    (stepPosition === 1 && collatInputError)
      ? setStepDisabled(true)
      : setStepDisabled(false); /* else if all pass, then unlock borrowing */
  }, [
    borrowInput,
    borrowInputError,
    selectedSeries,
    activeAccount,
    stepPosition,
    collatInput,
    undercollateralized,
    collatInputError,
  ]);

  /* CHECK the list of current vaults which match the current series/ilk selection */ // TODO look at moving this to helper hook?
  useEffect(() => {
    if (selectedBase && selectedSeries && selectedIlk) {
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVaults = arr.filter(
        (v: IVault) =>
          v.ilkId === selectedIlk.idToUse &&
          v.baseId === selectedBase.idToUse &&
          v.seriesId === selectedSeries.id &&
          v.isActive
      );
      setMatchingVaults(_matchingVaults);
    }
  }, [vaultMap, selectedBase, selectedIlk, selectedSeries]);

  /* reset the selected vault, and get limits on every component change */
  useEffect(() => {
    setVaultToUse(undefined);
  }, [selectedIlk, selectedBase, selectedSeries]);

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
      <MainViewWrap>
        {mobile && <DashMobileButton transparent={!!borrowInput} />}
        {!mobile && (
          <PanelWrap>
            <YieldNavigation sideNavigation={true} />
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
                          !mobile ? (
                            <>
                              {borrowInput && !borrowPossible && selectedSeries && (
                                <InputInfoWrap action={() => setBorrowInput(selectedSeries?.baseReserves_!)}>
                                  <Text size="xsmall" color="text-weak">
                                    Max borrow is{' '}
                                    <Text size="small" color="text-weak">
                                      {cleanValue(selectedSeries?.baseReserves_!, 2)} {selectedBase?.displaySymbol}
                                    </Text>{' '}
                                    (limited by protocol liquidity)
                                  </Text>
                                </InputInfoWrap>
                              )}
                              {borrowInput && borrowPossible && selectedSeries && (
                                // minCollateral.gt(selectedSeries.) &&
                                <InputInfoWrap>
                                  <Text size="small" color="text-weak">
                                    Requires equivalent of{' '}
                                    {nFormatter(parseFloat(minCollateral_!), selectedIlk?.digitFormat!)}{' '}
                                    {selectedIlk?.displaySymbol} collateral
                                  </Text>
                                </InputInfoWrap>
                              )}
                            </>
                          ) : (
                            <></>
                          )
                        }
                      >
                        <TextInput
                          plain
                          type="number"
                          placeholder="Enter amount"
                          value={borrowInput}
                          onChange={(event: any) =>
                            setBorrowInput(cleanValue(event.target.value, selectedSeries?.decimals))
                          }
                          autoFocus={!mobile}
                        />
                      </InputWrap>
                    </Box>
                    <Box basis={mobile ? undefined : '40%'}>
                      <AssetSelector />
                    </Box>
                  </Box>
                </SectionWrap>

                {mobile ? (
                  <SeriesOrStrategySelectorModal
                    inputValue={borrowInput}
                    actionType={ActionType.BORROW}
                    open={modalOpen}
                    setOpen={toggleModal}
                  />
                ) : (
                  <SectionWrap
                    title={
                      seriesMap.size > 0
                        ? `Available ${selectedBase?.displaySymbol}${selectedBase && '-based'} maturity dates`
                        : ''
                    }
                  >
                    <SeriesSelector inputValue={borrowInput} actionType={ActionType.BORROW} />
                  </SectionWrap>
                )}
              </Box>
            )}

            {stepPosition === 1 && ( // ADD COLLATERAL
              <Box gap={mobile ? undefined : 'medium'}>
                <YieldCardHeader>
                  <BackButton action={() => setStepPosition(0)} />
                </YieldCardHeader>

                <Box gap="large" height="100%">
                  <SectionWrap>
                    <Box
                      pad="medium"
                      direction="row"
                      gap="large"
                      justify="center"
                      round="small"
                      background="gradient-transparent"
                    >
                      <Box justify="center">
                        <Gauge
                          value={parseFloat(collateralizationPercent!)}
                          size={mobile ? '6em' : '8em'}
                          mean={parseFloat(minSafeCollatRatioPct!) * 0.9}
                          setColor={handleGaugeColorChange}
                        />
                      </Box>

                      <Box align="center" gap="small">
                        <Box align="center">
                          <Text size={mobile ? 'xsmall' : 'medium'} color="text-weak">
                            Collateralization
                          </Text>
                          <Text size={mobile ? 'large' : 'xlarge'} color={currentGaugeColor}>
                            {parseFloat(collateralizationPercent!) > 10000
                              ? nFormatter(parseFloat(collateralizationPercent!), 2)
                              : parseFloat(collateralizationPercent!)}
                            %
                          </Text>
                        </Box>
                        <Box align="center" direction="row" gap="xsmall">
                          <Text size={mobile ? 'xsmall' : 'xsmall'} color="text-weak">
                            {mobile ? 'Min reqd. :' : 'Minimum reqd. :'}{' '}
                          </Text>
                          <Text size={mobile ? 'xsmall' : 'xsmall'}>{minCollatRatioPct}%</Text>
                        </Box>
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
                            !mobile ? (
                              borrowInput &&
                              minSafeCollateral && (
                                <InputInfoWrap
                                  action={() => setCollatInput(cleanValue(minSafeCollateral, selectedIlk?.decimals))}
                                >
                                  <Text size="small" color="text-weak">
                                    Use Safe Collateralization{': '}
                                    {cleanValue(minSafeCollateral, selectedIlk?.digitFormat)} {selectedIlk?.displaySymbol}
                                  </Text>
                                </InputInfoWrap>
                              )
                            ) : (
                              <></>
                            )
                          }
                        >
                          <TextInput
                            plain
                            type="number"
                            placeholder="Enter amount"
                            // ref={(el:any) => { el && el.focus(); }}
                            value={collatInput}
                            onChange={(event: any) =>
                              setCollatInput(cleanValue(event.target.value, selectedIlk?.decimals))
                            }
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
              <Box gap="medium">
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
                      value={`${cleanValue(borrowInput, selectedBase?.digitFormat!)} ${selectedBase?.displaySymbol}`}
                    />
                    <InfoBite label="Series Maturity" icon={<FiClock />} value={`${selectedSeries?.displayName}`} />
                    <InfoBite
                      label="Vault Debt Payable @ Maturity"
                      icon={<FiTrendingUp />}
                      value={`${cleanValue(borrowEstimate_, selectedBase?.digitFormat!)} ${selectedBase?.displaySymbol}`}
                    />
                    <InfoBite label="Effective APR" icon={<FiPercent />} value={`${apr}%`} />
                    <InfoBite
                      label="Total Supporting Collateral"
                      icon={
                        <Gauge
                          value={parseFloat(collateralizationPercent!)}
                          size="1em"
                          mean={parseFloat(minSafeCollatRatioPct!) * 0.9}
                        />
                      }
                      value={`${cleanValue(collatInput, selectedIlk?.digitFormat!)} ${
                        selectedIlk?.displaySymbol
                      } (${collateralizationPercent}%)`}
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
                  {vaultToUse && <VaultItem vault={vaultToUse!} condensed index={1} />}
                  {!vaultToUse && newVaultId && (
                    <DummyVaultItem series={selectedSeries!} vaultId={newVaultId!} condensed />
                  )}
                </Box>
              )}
          </Box>

          <ActionButtonWrap pad>
            {(stepPosition === 0 || stepPosition === 1) && (
              <NextButton
                // label={<Text size={mobile ? 'small' : undefined}> Next step </Text>}
                label={
                  <Text size={mobile ? 'small' : undefined}>
                    {borrowInput && !selectedSeries
                      ? `Select a ${selectedBase?.displaySymbol}${selectedBase && '-based'} Maturity`
                      : 'Next Step'}
                  </Text>
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
                    {!activeAccount
                      ? 'Connect Wallet'
                      : `Borrow${borrowProcess?.processActive ? `ing` : ''} ${
                          nFormatter(Number(borrowInput), selectedBase?.digitFormat!) || ''
                        } ${selectedBase?.displaySymbol || ''}`}
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
                <NextButton
                  label={<Text size={mobile ? 'xsmall' : undefined}>Report and go back</Text>}
                  onClick={() => resetInputs()}
                />
              )}
          </ActionButtonWrap>
        </CenterPanelWrap>

        {!mobile && (
          <PanelWrap right basis="40%">
            <VaultSelector />
          </PanelWrap>
        )}
      </MainViewWrap>
    </Keyboard>
  );
};

export default Borrow;

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Box, CheckBox, Keyboard, ResponsiveContext, Text, TextInput } from 'grommet';

import { FiClock, FiPocket, FiPercent, FiTrendingUp } from 'react-icons/fi';

import SeriesSelector from '../selectors/SeriesSelector';
import MainViewWrap from '../wraps/MainViewWrap';
import AssetSelector from '../selectors/AssetSelector';
import InputWrap from '../wraps/InputWrap';
import ActionButtonWrap from '../wraps/ActionButtonWrap';
import SectionWrap from '../wraps/SectionWrap';

import MaxButton from '../buttons/MaxButton';

import { UserContext } from '../../contexts/UserContext';
import { ActionCodes, ActionType, IUserContext, IUserContextState, IVault, ProcessStage, TxState } from '../../types';
import PanelWrap from '../wraps/PanelWrap';
import CenterPanelWrap from '../wraps/CenterPanelWrap';
import VaultSelector from '../selectors/VaultPositionSelector';
import ActiveTransaction from '../ActiveTransaction';

import { cleanValue, getTxCode, getVaultIdFromReceipt, nFormatter } from '../../utils/appUtils';

import YieldInfo from '../FooterInfo';
import BackButton from '../buttons/BackButton';
import { Gauge } from '../Gauge';
import InfoBite from '../InfoBite';
import NextButton from '../buttons/NextButton';
import TransactButton from '../buttons/TransactButton';
import { useApr } from '../../hooks/useApr';
import PositionAvatar from '../PositionAvatar';
import VaultDropSelector from '../selectors/VaultDropSelector';
import { useInputValidation } from '../../hooks/useInputValidation';
import AltText from '../texts/AltText';
import YieldCardHeader from '../YieldCardHeader';
import { useBorrow } from '../../hooks/actionHooks/useBorrow';
import { useCollateralHelpers } from '../../hooks/viewHelperHooks/useCollateralHelpers';
import { useBorrowHelpers } from '../../hooks/viewHelperHooks/useBorrowHelpers';
import InputInfoWrap from '../wraps/InputInfoWrap';
import ColorText from '../texts/ColorText';
import { useProcess } from '../../hooks/useProcess';

import { ChainContext } from '../../contexts/ChainContext';
import DummyVaultItem from '../positionItems/DummyVaultItem';
import SeriesOrStrategySelectorModal from '../selectors/SeriesOrStrategySelectorModal';
import Navigation from '../Navigation';
import VaultItem from '../positionItems/VaultItem';
import { useAssetPair } from '../../hooks/useAssetPair';
import Line from '../elements/Line';
import useTenderly from '../../hooks/useTenderly';
import { useAccount, useNetwork } from 'wagmi';
import { GA_Event, GA_Properties, GA_View } from '../../types/analytics';
import useAnalytics from '../../hooks/useAnalytics';
import { WETH } from '../../config/assets';

const Borrow = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  useTenderly();

  const { logAnalyticsEvent } = useAnalytics();

  /* STATE FROM CONTEXT */
  const {
    chainState: { contractMap },
  } = useContext(ChainContext);

  const { userState, userActions } = useContext(UserContext) as IUserContext;
  const { assetMap, vaultMap, seriesMap, selectedSeries, selectedIlk, selectedBase } = userState;
  const { setSelectedIlk } = userActions;

  const { address: activeAccount } = useAccount();

  /* LOCAL STATE */
  const [modalOpen, toggleModal] = useState<boolean>(false);
  const [stepPosition, setStepPosition] = useState<number>(0);

  // renderId for user flow traking (analytics)
  const [renderId, setRenderId] = useState<string>();

  const [borrowInput, setBorrowInput] = useState<string>('');
  const [collatInput, setCollatInput] = useState<string>('');

  const [borrowDisabled, setBorrowDisabled] = useState<boolean>(true);
  const [stepDisabled, setStepDisabled] = useState<boolean>(true);

  const [disclaimerChecked, setDisclaimerChecked] = useState<boolean>(false);

  const [vaultToUse, setVaultToUse] = useState<IVault | undefined>(undefined);
  const [newVaultId, setNewVaultId] = useState<string | undefined>(undefined);

  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);
  const [currentGaugeColor, setCurrentGaugeColor] = useState<string>('#EF4444');

  const borrow = useBorrow();
  const { apr } = useApr(borrowInput, ActionType.BORROW, selectedSeries);

  const assetPairInfo = useAssetPair(selectedBase!, selectedIlk!);
  const {
    collateralizationPercent,
    undercollateralized,
    minCollateral_,
    minSafeCollateral,
    maxCollateral,
    minSafeCollatRatioPct,
    minCollatRatioPct,
    totalCollateral_,
    liquidationPrice_,
  } = useCollateralHelpers(borrowInput, collatInput, vaultToUse, assetPairInfo);

  const { minDebt_, maxDebt_, borrowPossible, borrowEstimate_ } = useBorrowHelpers(
    borrowInput,
    collatInput,
    vaultToUse,
    assetPairInfo,
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
    if (borrowDisabled) return;

    const _vault = vaultToUse?.id ? vaultToUse : undefined; // if vaultToUse has id property, use it
    setBorrowDisabled(true);
    borrow(_vault, borrowInput, collatInput);

    logAnalyticsEvent(GA_Event.transaction_initiated, {
      view: GA_View.BORROW,
      series_id: selectedSeries?.name!,
      action_code: ActionCodes.BORROW,
      supporting_collateral: selectedIlk?.symbol,
    } as GA_Properties.transaction_initiated);
  };

  useEffect(() => {
    setRenderId(new Date().getTime().toString(36));
  }, []);

  /** Interaction handlers */
  const handleNavAction = (_stepPosition: number) => {
    _stepPosition === 0 && setSelectedIlk(assetMap?.get('0x303000000000')!);
    setStepPosition(_stepPosition);
    logAnalyticsEvent(GA_Event.next_step_clicked, {
      view: GA_View.BORROW,
      step_index: _stepPosition,
    } as GA_Properties.next_step_clicked);
  };

  const handleMaxAction = (actionCode: ActionCodes) => {
    actionCode === ActionCodes.ADD_COLLATERAL && setCollatInput(maxCollateral!);
    actionCode === ActionCodes.BORROW && selectedSeries && setBorrowInput(selectedSeries.sharesReserves_!);
    logAnalyticsEvent(GA_Event.max_clicked, {
      view: GA_View.BORROW,
      action_code: actionCode,
    } as GA_Properties.max_clicked);
  };

  const handleUseSafeCollateral = () => {
    selectedIlk && setCollatInput(cleanValue(minSafeCollateral, selectedIlk.decimals));
    logAnalyticsEvent(GA_Event.safe_collateralization_clicked, {
      view: GA_View.BORROW,
    } as GA_Properties.safe_collateralization_clicked);
  };

  const handleGaugeColorChange: any = (val: string) => {
    setCurrentGaugeColor(val);
  };

  const resetInputs = useCallback(() => {
    setBorrowInput('');
    setCollatInput('');
    setStepPosition(0);
    resetProcess();
    setDisclaimerChecked(false);
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
    (stepPosition === 1 && undercollateralized) ||
    (stepPosition === 1 && collatInputError) ||
    selectedSeries.baseId !== selectedBase?.proxyId
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
    selectedBase?.proxyId,
  ]);

  /* CHECK the list of current vaults which match the current series/ilk selection */ // TODO look at moving this to helper hook?
  useEffect(() => {
    if (selectedBase && selectedSeries && selectedIlk) {
      const arr: IVault[] = Array.from(vaultMap?.values()!) as IVault[];
      const _matchingVaults = arr.filter(
        (v: IVault) =>
          v.ilkId === selectedIlk.proxyId &&
          v.baseId === selectedBase.proxyId &&
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
  }, [borrowProcess, contractMap, resetInputs, vaultToUse]);

  return (
    <Keyboard onEsc={() => setCollatInput('')} onEnter={() => console.log('ENTER smashed')} target="document">
      <MainViewWrap>
        {!mobile && (
          <PanelWrap basis="30%">
            <Navigation sideNavigation={true} />
            <VaultSelector />
          </PanelWrap>
        )}

        <CenterPanelWrap series={selectedSeries || undefined}>
          <Box id="topsection">
            {stepPosition === 0 && ( // INITIAL STEP
              <Box height="100%" pad={mobile ? 'medium' : { top: 'large', horizontal: 'large' }} gap="large">
                <YieldCardHeader>
                  <Box gap={mobile ? undefined : 'xsmall'}>
                    <ColorText size={mobile ? 'medium' : '2rem'}>BORROW</ColorText>
                    <AltText color="text-weak" size="xsmall">
                      Borrow popular ERC20 tokens at a{' '}
                      <Text size="small" color="text">
                        fixed rate
                      </Text>
                    </AltText>
                  </Box>
                </YieldCardHeader>

                <Box gap="medium">
                  <Box direction="row-responsive">
                    <Box basis={mobile ? undefined : '60%'}>
                      <InputWrap action={() => console.log('maxAction')} isError={borrowInputError}>
                        <TextInput
                          plain
                          type="number"
                          inputMode="decimal"
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
                        seriesMap?.size! > 0
                          ? `Available ${selectedBase?.displaySymbol}${selectedBase && '-based'} maturity dates:`
                          : ''
                      }
                    >
                      <SeriesSelector inputValue={borrowInput} actionType={ActionType.BORROW} />
                    </SectionWrap>
                  )}
                </Box>

                {!borrowInputError && borrowInput && !borrowPossible && selectedSeries && (
                  <InputInfoWrap action={() => handleMaxAction(ActionCodes.BORROW)}>
                    <Text size="xsmall" color="text-weak">
                      Max borrow is{' '}
                      <Text size="small" color="text-weak">
                        {cleanValue(selectedSeries?.sharesReserves_!, 2)} {selectedBase?.displaySymbol}
                      </Text>{' '}
                      (limited by protocol liquidity)
                    </Text>
                  </InputInfoWrap>
                )}
                {!borrowInputError && borrowInput && borrowPossible && selectedSeries && (
                  <InputInfoWrap>
                    <Text size="small" color="text-weak">
                      Requires equivalent of {nFormatter(parseFloat(minCollateral_!), selectedIlk?.digitFormat!)}{' '}
                      {selectedIlk?.displaySymbol} collateral
                    </Text>
                  </InputInfoWrap>
                )}
              </Box>
            )}

            {stepPosition === 1 && ( // ADD COLLATERAL
              <>
                {/* <Box style={{ position: 'absolute', left:'-20px' }} pad="small">
                  <BackButton action={() => setStepPosition(0)} />
                </Box> */}
                <Box background="gradient-transparent" round={{ corner: 'top', size: 'xsmall' }} pad="medium">
                  <BackButton action={() => handleNavAction(0)} />
                  <Box pad="medium" direction="row" justify="between" round="small">
                    <Box justify="center">
                      <Gauge
                        value={parseFloat(collateralizationPercent!)}
                        size={mobile ? '6em' : '8em'}
                        mean={parseFloat(minSafeCollatRatioPct!) * 0.9}
                        setColor={handleGaugeColorChange}
                      />
                    </Box>

                    <Box align="center" pad={{ vertical: 'small' }}>
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
                  </Box>

                  <Box gap="xsmall" fill="horizontal" align="end" pad={{ horizontal: 'medium' }}>
                    <Box align="center" direction="row" gap="xsmall">
                      <Text size={mobile ? 'xsmall' : 'small'} color="text-weak">
                        Minimum
                      </Text>
                      <Text size={mobile ? 'xsmall' : 'small'}>{minCollatRatioPct}%</Text>
                    </Box>

                    <Box height={{ min: '1.5rem' }}>
                      {liquidationPrice_ && (
                        <Box align="center" direction="row" gap="xsmall">
                          <Text size={mobile ? 'xsmall' : 'small'} color="text-weak">
                            Liquidation when
                          </Text>
                          <Text size={mobile ? 'xsmall' : 'small'}>
                            1 {selectedIlk?.symbol} = {liquidationPrice_} {selectedBase?.symbol}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Line />

                <Box gap="medium" pad={{ horizontal: 'large', vertical: 'medium' }}>
                  <Box gap="small" flex={false}>
                    <SectionWrap title="Amount of collateral to add">
                      <Box direction="row-responsive">
                        <Box fill="horizontal">
                          <InputWrap
                            action={() => console.log('maxAction')}
                            disabled={!selectedSeries}
                            isError={collatInputError}
                          >
                            <TextInput
                              plain
                              type="number"
                              placeholder="Enter amount"
                              value={collatInput}
                              onChange={(event: any) =>
                                setCollatInput(cleanValue(event.target.value, selectedIlk?.decimals))
                              }
                              disabled={!selectedSeries || selectedSeries.seriesIsMature}
                            />
                            <MaxButton
                              action={() => maxCollateral && handleMaxAction(ActionCodes.ADD_COLLATERAL)}
                              disabled={
                                !selectedSeries || collatInput === maxCollateral || selectedSeries.seriesIsMature
                              }
                              clearAction={() => setCollatInput('')}
                              showingMax={!!collatInput && collatInput === maxCollateral}
                            />
                          </InputWrap>
                        </Box>
                        <Box flex="grow" width={{ min: '10rem' }}>
                          <AssetSelector selectCollateral isModal={true} />
                        </Box>
                      </Box>
                    </SectionWrap>

                    <Box flex={false}>
                      {matchingVaults.length > 0 && (
                        <SectionWrap title="Add to an exisiting vault" disabled={matchingVaults.length < 1}>
                          <VaultDropSelector
                            vaults={matchingVaults}
                            handleSelect={(option: any) => setVaultToUse(option.id ? option : undefined)}
                            itemSelected={vaultToUse}
                            displayName="Create New Vault"
                            placeholder="Create New Vault"
                            defaultOptionValue="Create New Vault"
                          />
                        </SectionWrap>
                      )}
                    </Box>

                    {borrowInput && minSafeCollateral && (
                      <Box margin={{ top: 'small' }}>
                        <InputInfoWrap action={() => handleUseSafeCollateral()}>
                          <Text size="small" color="text-weak">
                            Use Safe Collateralization{': '}
                            {cleanValue(minSafeCollateral, selectedIlk?.digitFormat)} {selectedIlk?.displaySymbol}
                          </Text>
                        </InputInfoWrap>
                      </Box>
                    )}
                  </Box>
                </Box>
              </>
            )}

            {stepPosition === 2 && ( // REVIEW
              <>
                <Box
                  background="gradient-transparent"
                  round={{ corner: 'top', size: 'xsmall' }}
                  pad="medium"
                  gap="medium"
                  height={{ min: '350px' }}
                >
                  {borrowProcess?.stage !== ProcessStage.PROCESS_COMPLETE ? (
                    <BackButton action={() => handleNavAction(1)} />
                  ) : (
                    <Box pad="1em" />
                  )}

                  <ActiveTransaction full txProcess={borrowProcess}>
                    <Box
                      gap="small"
                      pad={{ horizontal: 'medium', vertical: 'medium' }}
                      animation={{ type: 'zoomIn', size: 'small' }}
                      flex={false}
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
                        value={`${cleanValue(borrowEstimate_, selectedBase?.digitFormat!)} ${
                          selectedBase?.displaySymbol
                        }`}
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
                        value={`${cleanValue(totalCollateral_, selectedIlk?.digitFormat!)} ${
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
                <Line />
              </>
            )}
          </Box>

          <Box id="midsection">
            {stepPosition === 2 &&
              borrowProcess?.stage === ProcessStage.PROCESS_COMPLETE &&
              borrowProcess?.tx.status === TxState.SUCCESSFUL && (
                <Box pad="large" gap="small">
                  <Text size="small"> View Vault: </Text>
                  {vaultToUse && <VaultItem vault={vaultMap?.get(vaultToUse.id)!} condensed index={1} />}
                  {!vaultToUse && newVaultId && (
                    <DummyVaultItem series={selectedSeries!} vaultId={newVaultId!} condensed />
                  )}
                </Box>
              )}

            {stepPosition === 2 && !borrowProcess?.processActive && (
              <Box pad={{ horizontal: 'large' }}>
                <CheckBox
                  pad={{ vertical: 'small' }}
                  label={
                    <Text size="xsmall" weight="lighter">
                      I understand the risks associated with borrowing. In particular, I understand that as a new
                      protocol, Yield Protocol&apos;s liquidation auctions are not always competitive and if my vault
                      falls below the minimum collateralization requirement (
                      <Text size="xsmall" color="red">
                        {minCollatRatioPct}%
                      </Text>
                      ), I could lose most or all of my posted collateral.
                    </Text>
                  }
                  checked={disclaimerChecked}
                  onChange={() => setDisclaimerChecked(!disclaimerChecked)}
                />
              </Box>
            )}
          </Box>

          <ActionButtonWrap pad>
            {(stepPosition === 0 || stepPosition === 1) && (
              <NextButton
                // label={<Text size={mobile ? 'small' : undefined}> Next step </Text>}
                label={
                  <Text size={mobile ? 'small' : undefined}>
                    {borrowInput && (!selectedSeries || selectedBase?.proxyId !== selectedSeries.baseId)
                      ? `Select a${selectedBase?.id === WETH ? 'n' : ''} ${selectedBase?.displaySymbol}${
                          selectedBase && '-based'
                        } Maturity`
                      : 'Next Step'}
                  </Text>
                }
                // onClick={() => setStepPosition(stepPosition + 1)}
                onClick={() => handleNavAction(stepPosition + 1)}
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
                disabled={borrowDisabled || borrowProcess?.processActive || !disclaimerChecked}
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
          <PanelWrap right>
            <Box />
            <YieldInfo />
          </PanelWrap>
        )}
      </MainViewWrap>
    </Keyboard>
  );
};

export default Borrow;

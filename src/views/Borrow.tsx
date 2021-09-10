import React, { useContext, useEffect, useState } from 'react';
import { Box, Keyboard, ResponsiveContext, Text, TextInput } from 'grommet';
import { BigNumber } from 'ethers';

import { FiClock, FiPocket, FiPercent, FiTrendingUp, FiInfo } from 'react-icons/fi';

import SeriesSelector from '../components/selectors/SeriesSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import ActionButtonWrap from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';

import MaxButton from '../components/buttons/MaxButton';

import { useTx } from '../hooks/useTx';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, IUserContext, IVault } from '../types';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import StepperText from '../components/StepperText';
import VaultSelector from '../components/selectors/VaultPositionSelector';
import ActiveTransaction from '../components/ActiveTransaction';

import { cleanValue, nFormatter } from '../utils/appUtils';

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
import TransactionWidget from '../components/TransactionWidget';
import { useBorrowHelpers } from '../hooks/actionHelperHooks/useBorrowHelpers';
import InputInfoWrap from '../components/wraps/InputInfoWrap';
import NavText from '../components/texts/NavText';
import ColorText from '../components/texts/ColorText';

const Borrow = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
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
  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);

  const borrow = useBorrow();
  const { apr } = useApr(borrowInput, ActionType.BORROW, selectedSeries);

  const { collateralizationPercent, undercollateralized, minCollateral, minSafeCollateral, maxCollateral } =
    useCollateralHelpers(borrowInput, collatInput, vaultToUse);

  const { maxAllowedBorrow, minAllowedBorrow } = useBorrowHelpers(borrowInput, collatInput, vaultToUse);

  /* input validation hooks */
  const { inputError: borrowInputError } = useInputValidation(borrowInput, ActionCodes.BORROW, selectedSeries, [
    minAllowedBorrow,
    maxAllowedBorrow,
  ]);

  const { inputError: collatInputError } = useInputValidation(collatInput, ActionCodes.ADD_COLLATERAL, selectedSeries, [
    Number(minCollateral) - Number(vaultToUse?.ink_),
    maxCollateral,
  ]);

  /* TX info (for disabling buttons) */
  const { tx: borrowTx, resetTx } = useTx(ActionCodes.BORROW, selectedSeriesId!);

  /** LOCAL ACTION FNS */
  const handleBorrow = () => {
    const _vault = vaultToUse?.id ? vaultToUse : undefined; // if vaultToUse has id property, use it
    !borrowDisabled && borrow(_vault, borrowInput, collatInput);
  };

  const resetInputs = () => {
    setBorrowInput('');
    setCollatInput('');
    setStepPosition(0);
    resetTx();
  };

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
      // reset the selected vault on every change
      setVaultToUse(undefined);
    }
  }, [vaultMap, selectedBase, selectedIlk, selectedSeries]);

  /* Reset the selected vault on every Ilk change */
  useEffect(() => {
    selectedIlk && setVaultToUse(undefined);
  }, [selectedIlk]);

  // THIS VALUE IS ACTIUALLY JUST the fytoken value:
  // const borrowOutput = cleanValue(
  //   (Number(borrowInput) * (1 + Number(apr) / 100)).toString(),
  //   selectedBase?.digitFormat!
  // );

  return (
    <Keyboard onEsc={() => setCollatInput('')} onEnter={() => console.log('ENTER smashed')} target="document">
      <MainViewWrap>
        {!mobile && (
          <PanelWrap>
            <Box margin={{ top: '35%' }}>
              {/* <StepperText
                position={stepPosition}
                values={[
                  ['Choose an amount and a maturity date', '', ''],
                  ['Add Collateral', '', ''],
                  ['Review & Transact', '', ''],
                ]}
              /> */}
            </Box>
            <YieldInfo />
          </PanelWrap>
        )}

        <CenterPanelWrap series={selectedSeries || undefined}>
          <Box height="100%" pad={mobile ? 'medium' : 'large'}>
            {stepPosition === 0 && ( // INITIAL STEP
              <Box gap="large">

                <YieldCardHeader logo={mobile} series={selectedSeries}>
                  <Box gap={mobile ? undefined : 'xsmall'}>
                    <ColorText size={mobile ? 'medium' : '2rem'}>BORROW</ColorText>
                    <AltText color="text-weak" size="xsmall">
                      Borrow popular ERC20 tokens at a <ColorText size="small"> fixed rate </ColorText>
                    </AltText>
                  </Box>
                </YieldCardHeader>

                <Box gap="large">
                  {/* <SectionWrap title={assetMap.size > 0 ? 'Select an asset and amount' : 'Assets Loading...'}> */}
                  <SectionWrap>
                    <Box direction="row-responsive" gap="small">
                      <Box basis={mobile ? undefined : '60%'}>
                        <InputWrap
                          action={() => console.log('maxAction')}
                          isError={borrowInputError}
                          message={
                            borrowInput && (
                              <InputInfoWrap>
                                <Text size="small">
                                  <Text size="small">
                                    {cleanValue(minCollateral, 4)} {selectedIlk?.symbol}
                                  </Text>{' '}
                                  collateral required (or equivalent)
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
                        ? `Select a ${selectedBase?.symbol}${selectedBase && '-based'} maturity date`
                        : ''
                    }
                  >
                    <SeriesSelector inputValue={borrowInput} actionType={ActionType.BORROW} />
                  </SectionWrap>
                </Box>
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
                    <Box direction="row-responsive" gap="small">
                      <Box basis={mobile ? undefined : '60%'} fill="horizontal">
                        <InputWrap
                          action={() => console.log('maxAction')}
                          disabled={!selectedSeries}
                          isError={collatInputError}
                          message={
                            borrowInput &&
                            minSafeCollateral && (
                              <InputInfoWrap action={() => setCollatInput(cleanValue(minSafeCollateral, 12))}>
                                <Text size="small">
                                  Safe Minimum{': '}
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
                        {/* <AddTokenToMetamask
                          address={selectedIlk?.address}
                          symbol={selectedIlk?.symbol}
                          decimals={18}
                          image=""
                        /> */}
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
                  {!borrowTx.success && !borrowTx.failed ? (
                    <BackButton action={() => setStepPosition(1)} />
                  ) : (
                    <Box pad="1em" />
                  )}
                </YieldCardHeader>

                <ActiveTransaction full tx={borrowTx}>
                  <SectionWrap title="Review transaction:">
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
                        value={`${selectedSeries?.fyTokenBalance_} ${selectedBase?.symbol}`}
                      />
                      <InfoBite label="Effective APR" icon={<FiPercent />} value={`${apr}%`} />
                      <InfoBite
                        label="Supporting Collateral"
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
                  </SectionWrap>
                </ActiveTransaction>
              </Box>
            )}
          </Box>

          <Box>
            <ActionButtonWrap pad>
              {(stepPosition === 0 || stepPosition === 1) && (
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}> Next step </Text>}
                  onClick={() => setStepPosition(stepPosition + 1)}
                  disabled={stepPosition === 0 ? stepDisabled : borrowDisabled}
                  errorLabel={stepPosition === 0 ? borrowInputError : collatInputError}
                />
              )}

              {stepPosition === 2 && !(borrowTx.success || borrowTx.failed) && (
                <TransactButton
                  primary
                  label={
                    <Text size={mobile ? 'small' : undefined}>
                      {`Borrow${borrowTx.processActive ? `ing` : ''} ${
                        nFormatter(Number(borrowInput), selectedBase?.digitFormat!) || ''
                      } ${selectedBase?.symbol || ''}`}
                    </Text>
                  }
                  onClick={() => handleBorrow()}
                  disabled={borrowDisabled || borrowTx.processActive}
                />
              )}

              {stepPosition === 2 && !borrowTx.processActive && borrowTx.success && (
                <NextButton
                  label={<Text size={mobile ? 'small' : undefined}>Borrow more</Text>}
                  onClick={() => resetInputs()}
                />
              )}

              {stepPosition === 2 && !borrowTx.processActive && borrowTx.failed && (
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
          <Box margin={{ top: '20%' }} pad="small">
            <TransactionWidget />
          </Box>
          {/* <StepperText
              position={stepPosition}
              values={[
                ['Choose an asset to', 'borrow', ''],
                ['Add', 'collateral', ''],
                ['', 'Review', ' and transact'],
              ]}
            /> */}
          {/* <YieldApr input={borrowInput} actionType={ActionType.BORROW} /> */}
          {/* {!mobile && stepPosition === 1 && <Gauge value={parseFloat(collateralizationPercent!)} label="%" max={750} min={150} />} */}
          {!mobile && <VaultSelector />}
        </PanelWrap>
      </MainViewWrap>
    </Keyboard>
  );
};

export default Borrow;

import React, { useContext, useEffect, useState } from 'react';
import { Box, Keyboard, ResponsiveContext, Text, TextInput } from 'grommet';
import { useHistory, useParams } from 'react-router-dom';
import { ethers } from 'ethers';

import { FiClock, FiPocket, FiPercent, FiTrendingUp } from 'react-icons/fi';

import SeriesSelector from '../components/selectors/SeriesSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import ActionButtonWrap from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';

import MaxButton from '../components/buttons/MaxButton';

import { useBorrowActions } from '../hooks/borrowHooks';
import { useCollateralization } from '../hooks/collateralHooks';
import { useTx } from '../hooks/useTx';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, IUserContext, IVault } from '../types';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import StepperText from '../components/StepperText';
import VaultSelector from '../components/selectors/VaultSelector';
import ActiveTransaction from '../components/ActiveTransaction';

import { cleanValue, nFormatter } from '../utils/appUtils';

import YieldInfo from '../components/YieldInfo';
import BackButton from '../components/buttons/BackButton';
import { Gauge } from '../components/Gauge';
import InfoBite from '../components/InfoBite';
import NextButton from '../components/buttons/NextButton';
import TransactButton from '../components/buttons/TransactButton';
import { useApr } from '../hooks/aprHook';
import PositionAvatar from '../components/PositionAvatar';
import VaultDropSelector from '../components/selectors/VaultDropSelector';
import { useInputValidation } from '../hooks/inputValidationHook';
import AltText from '../components/texts/AltText';
import EtherscanButton from '../components/buttons/EtherscanButton';

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
  const [maxCollat, setMaxCollat] = useState<string | undefined>();

  const [borrowDisabled, setBorrowDisabled] = useState<boolean>(true);
  const [stepDisabled, setStepDisabled] = useState<boolean>(true);

  const [vaultToUse, setVaultToUse] = useState<IVault | undefined>(undefined);
  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);

  const { borrow } = useBorrowActions();

  const { apr } = useApr(borrowInput, ActionType.BORROW, selectedSeries);
  const borrowOutput = cleanValue(
    (Number(borrowInput) * (1 + Number(apr) / 100)).toString(),
    selectedBase?.digitFormat!
  );

  const { collateralizationPercent, undercollateralized, minCollateral } = useCollateralization(
    borrowInput,
    collatInput,
    vaultToUse
  );

  /* input validation hooks */
  const { inputError: borrowInputError } = useInputValidation(borrowInput, ActionCodes.BORROW, selectedSeries, []);
  const { inputError: collatInputError } = useInputValidation(collatInput, ActionCodes.ADD_COLLATERAL, selectedSeries, [
    minCollateral,
    maxCollat,
  ]);

  /* TX info (for disabling buttons) */
  const { tx: borrowTx, resetTx } = useTx(ActionCodes.BORROW, selectedSeriesId!);

  /** LOCAL ACTION FNS */
  const handleBorrow = () => {
    const _vault = vaultToUse?.id ? vaultToUse : undefined; // if vaultToUse has id property, use it
    !borrowDisabled && borrow(_vault, borrowInput, collatInput);
  };

  /* SET MAX VALUES */
  useEffect(() => {
    /* CHECK collateral selection and sets the max available collateral */
    activeAccount &&
      (async () => {
        const _max = await selectedIlk?.getBalance(activeAccount);
        _max && setMaxCollat(ethers.utils.formatEther(_max)?.toString());
      })();
  }, [activeAccount, selectedIlk, setMaxCollat]);

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

  /* CHECK the list of current vaults which match the current series/ilk selection */
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

  return (
    <Keyboard onEsc={() => setCollatInput('')} onEnter={() => console.log('ENTER smashed')} target="document">
      <MainViewWrap>
        {!mobile && (
          <PanelWrap>
            <Box margin={{ top: '35%' }}>
              <StepperText
                position={stepPosition}
                values={[
                  ['Choose an amount and a maturity date', '', ''],
                  ['Add Collateral', '', ''],
                  ['Review & Transact', '', ''],
                ]}
              />
            </Box>
            <YieldInfo />
          </PanelWrap>
        )}

        <CenterPanelWrap series={selectedSeries || undefined}>
          <Box height="100%" pad="large">
            {stepPosition === 0 && ( // INITIAL STEP
              <Box gap="medium">
                <Box gap="xsmall">
                  <AltText size="large">BORROW</AltText>
                  <Box>
                    <AltText color="text-weak" size="xsmall">
                      popular ERC20 tokens at a fixed rate.
                    </AltText>
                  </Box>
                </Box>

                <Box gap="large">
                  {/* <SectionWrap title={assetMap.size > 0 ? 'Select an asset and amount' : 'Assets Loading...'}> */}
                  <SectionWrap>
                    <Box direction="row" gap="small">
                      <Box basis={mobile ? '50%' : '60%'}>
                        <InputWrap action={() => console.log('maxAction')} isError={borrowInputError}>
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
                      <Box basis={mobile ? '50%' : '40%'}>
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
                <BackButton action={() => setStepPosition(0)} />

                <Box gap="large" height="400px">
                  <SectionWrap>
                    <Box direction="row" align="center" gap="large" justify="center" margin={{ vertical: 'medium' }}>
                      <Box>
                        <Gauge value={parseFloat(collateralizationPercent!)} size="8em" />
                      </Box>

                      <Box>
                        <Text size="small"> Collateralization </Text>
                        <Text size="xlarge">
                          {parseFloat(collateralizationPercent!) > 10000
                            ? nFormatter(parseFloat(collateralizationPercent!), 2)
                            : parseFloat(collateralizationPercent!)}
                          %
                        </Text>
                      </Box>
                    </Box>
                  </SectionWrap>

                  <SectionWrap title="Amount of collateral to add">
                    <Box direction="row" gap="small">
                      <Box basis={mobile ? '50%' : '60%'} fill="horizontal">
                        <InputWrap
                          action={() => console.log('maxAction')}
                          disabled={!selectedSeries}
                          isError={collatInputError}
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
                            action={() => maxCollat && setCollatInput(maxCollat)}
                            disabled={!selectedSeries || collatInput === maxCollat || selectedSeries.seriesIsMature}
                            clearAction={() => setCollatInput('')}
                            showingMax={!!collatInput && collatInput === maxCollat}
                          />
                        </InputWrap>
                      </Box>
                      <Box basis={mobile ? '50%' : '40%'}>
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
                <BackButton action={() => setStepPosition(1)} />

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
                        value={`${borrowOutput} ${selectedBase?.symbol}`}
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
                          icon={<PositionAvatar position={vaultToUse} condensed />}
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
                  onClick={() => {
                    setStepPosition(0);
                    resetTx();
                  }}
                />
              )}

              {stepPosition === 2 && !borrowTx.processActive && borrowTx.failed && (
                <>
                  <NextButton
                    size="xsmall"
                    label={<Text size={mobile ? 'xsmall' : undefined}> Report and go back</Text>}
                    onClick={() => {
                      setStepPosition(0);
                      resetTx();
                    }}
                  />
                  <EtherscanButton txHash={borrowTx.txHash} />
                </>
              )}
            </ActionButtonWrap>
          </Box>
        </CenterPanelWrap>

        <PanelWrap right basis="40%">
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

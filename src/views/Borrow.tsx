import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, CheckBox, Header, Heading, Keyboard, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { useHistory, useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import styled from 'styled-components';

import { FiClock, FiPocket, FiLayers, FiLock, FiPercent, FiTrendingUp } from 'react-icons/fi';

import SeriesSelector from '../components/selectors/SeriesSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import SectionWrap from '../components/wraps/SectionWrap';

import MaxButton from '../components/buttons/MaxButton';

import { useBorrowActions } from '../hooks/borrowHooks';
import { useCollateralization } from '../hooks/collateralHooks';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, IUserContext, IVault } from '../types';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import YieldApr from '../components/YieldApr';
import StepperText from '../components/StepperText';
import VaultSelector from '../components/selectors/VaultSelector';
import ActiveTransaction from '../components/ActiveTransaction';

import { getTxCode, nFormatter } from '../utils/appUtils';

import YieldInfo from '../components/YieldInfo';
import BackButton from '../components/buttons/BackButton';
import { Gauge } from '../components/Gauge';
import ReviewTxItem from '../components/ReviewTxItem';
import NextButton from '../components/buttons/NextButton';
import YieldMark from '../components/logos/YieldMark';
import TransactButton from '../components/buttons/TransactButton';

const Borrow = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const routerHistory = useHistory();

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

  const [borrowInputError, setBorrowInputError] = useState<string | null>(null);
  const [collatInputError, setCollatInputError] = useState<string | null>(null);

  const [vaultIdToUse, setVaultIdToUse] = useState<string | undefined>(undefined);
  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);

  const { borrow } = useBorrowActions();

  const { collateralizationPercent, collateralizationWarning, undercollateralized } = useCollateralization(
    borrowInput,
    collatInput,
    vaultMap.get(vaultIdToUse!)
  );

  /** LOCAL ACTION FNS */
  const handleBorrow = () => {
    !borrowDisabled && borrow(vaultIdToUse ? vaultMap.get(vaultIdToUse) : undefined, borrowInput, collatInput);
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

  /* WATCH FOR WARNINGS AND ERRORS */

  /* CHECK for any borrow input errors/warnings */
  useEffect(() => {
    if (activeAccount && (borrowInput || borrowInput === '')) {
      /* 1. Check if input exceeds amount available in pools */
      if (borrowInput && selectedSeries && ethers.utils.parseEther(borrowInput).gt(selectedSeries.baseReserves))
        setBorrowInputError(`Amount exceeds the ${selectedBase?.symbol} currently available in pool`);
      /* 2. Check if input is above zero */ else if (parseFloat(borrowInput) < 0)
        setBorrowInputError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */ else {
        setBorrowInputError(null);
      }
    }
  }, [activeAccount, borrowInput, selectedSeries, selectedBase, setBorrowInputError]);

  /* CHECK for any collateral input errors/warnings */
  useEffect(() => {
    if (activeAccount && (collatInput || collatInput === '')) {
      /* 1. Check if input exceeds balance */
      if (maxCollat && parseFloat(collatInput) > parseFloat(maxCollat)) setCollatInputError('Amount exceeds balance');
      /* 2. Check if input is above zero */ else if (parseFloat(collatInput) < 0)
        setCollatInputError('Amount should be expressed as a positive value');
      /* 3. next check */ else if (false) setCollatInputError('Undercollateralised');
      /* if all checks pass, set null error message */ else {
        setCollatInputError(null);
      }
    }
  }, [activeAccount, collatInput, maxCollat, setCollatInputError]);

  /* BORROW DISABLING LOGIC */
  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    !activeAccount ||
    !borrowInput ||
    !selectedSeries ||
    !selectedIlk ||
    undercollateralized ||
    borrowInputError ||
    selectedSeries?.seriesIsMature
      ? setBorrowDisabled(true)
      : /* else if all pass, then unlock borrowing */
        setBorrowDisabled(false);
  }, [borrowInput, collatInput, selectedSeries, selectedIlk, activeAccount, borrowInputError, undercollateralized]);

  /* ADD COLLATERAL DISABLING LOGIC */

  /* if ANY of the following conditions are met: block action */
  useEffect(() => {
    !activeAccount || !borrowInput || !selectedSeries || borrowInputError || selectedSeries?.seriesIsMature
      ? setStepDisabled(true)
      : setStepDisabled(false); /* else if all pass, then unlock borrowing */
  }, [borrowInput, borrowInputError, selectedSeries, activeAccount]);

  /**
   * EXTRAS
   * */

  /* CHECK the list of current vaults which match the current series/ilk selection */
  useEffect(() => {
    if (selectedBase && selectedSeries && selectedIlk) {
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVaults = arr.filter(
        (v: IVault) => v.ilkId === selectedIlk.id && v.baseId === selectedBase.id && v.seriesId === selectedSeries.id
      );
      setMatchingVaults(_matchingVaults);
    }
  }, [vaultMap, selectedBase, selectedIlk, selectedSeries]);

  /* wathc to see if user wants to use an existing vault */
  // useEffect(() => {
  //   if (useExistingVault) {
  //     setVaultIdToUse(matchingVaults[0]?.displayName);
  //   } else {
  //     setVaultIdToUse(undefined);
  //   }
  // }, [matchingVaults, useExistingVault]);

  return (
    <Keyboard onEsc={() => setCollatInput('')} onEnter={() => console.log('ENTER smashed')} target="document">
      <MainViewWrap>
        {/* <PanelWrap background="linear-gradient(to right, #EEEEEE,rgba(255,255,255,1))"> */}
        {!mobile && (
          <PanelWrap>
            <StepperText
              position={stepPosition}
              values={[
                ['Choose an asset to', 'borrow', ''],
                ['Add', 'collateral', ''],
                ['', 'Review', 'and transact'],
              ]}
            />
            <YieldInfo />
          </PanelWrap>
        )}

        <CenterPanelWrap series={selectedSeries || undefined}>
          <Box height="100%" pad="large">
            {stepPosition === 0 && ( // INITIAL STEP
              <Box gap="medium">
                <Box direction="row" gap="small" align="center" margin={{ bottom: 'medium' }}>
                  <YieldMark />
                  <Text>BORROW</Text>
                </Box>

                <SectionWrap title="Select an asset and amount: ">
                  <Box direction="row" gap="small" fill="horizontal" align="start">
                    <Box basis={mobile ? '50%' : '60%'}>
                      <InputWrap action={() => console.log('maxAction')} isError={borrowInputError}>
                        <TextInput
                          plain
                          type="number"
                          placeholder="Enter amount"
                          value={borrowInput}
                          onChange={(event: any) => setBorrowInput(event.target.value)}
                          autoFocus={!mobile}
                        />
                      </InputWrap>
                    </Box>
                    <Box basis={mobile ? '50%' : '40%'}>
                      <AssetSelector />
                    </Box>
                  </Box>
                </SectionWrap>

                <SectionWrap title="Choose an series to borrow from">
                  <SeriesSelector inputValue={borrowInput} actionType={ActionType.BORROW} />
                </SectionWrap>
              </Box>
            )}

            {stepPosition === 1 && ( // ADD COLLATERAL
              <Box gap="large" fill>
                <BackButton action={() => setStepPosition(0)} />

                <Box gap="small">
                  <SectionWrap title="Amount of collateral to add">
                    <Box direction="row" gap="small" fill="horizontal" align="start">
                      <Box basis={mobile ? '50%' : '60%'}>
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
                            onChange={(event: any) => setCollatInput(event.target.value)}
                            disabled={!selectedSeries || selectedSeries.seriesIsMature}
                          />
                          <MaxButton
                            action={() => maxCollat && setCollatInput(maxCollat)}
                            disabled={!selectedSeries || collatInput === maxCollat || selectedSeries.seriesIsMature}
                          />
                        </InputWrap>
                      </Box>
                      <Box basis={mobile ? '50%' : '40%'}>
                        <AssetSelector selectCollateral />
                      </Box>
                    </Box>
                  </SectionWrap>

                  <SectionWrap title="Add to an exisiting vault" disabled={matchingVaults.length < 1}>
                    <Box fill round="xsmall" gap="small" justify="between" elevation="xsmall" animation="slideDown">
                      <Select
                        plain
                        disabled={matchingVaults.length < 1}
                        options={matchingVaults.map((x: IVault) => x.id)}
                        placeholder="Create new vault"
                        value={vaultIdToUse || 'Create new vault'}
                        // defaultValue={undefined}
                        onChange={({ option }) => setVaultIdToUse(option)}
                      />
                    </Box>
                  </SectionWrap>
                </Box>

                <SectionWrap>
                  <Box direction="row" gap="large" justify="center" fill>
                    <Gauge value={parseFloat(collateralizationPercent!)} size="7em" />
                    <Box basis="40%">
                      <Text size="small"> Collateralization </Text>
                      <Text size="xlarge">
                        {' '}
                        {parseFloat(collateralizationPercent!) > 10000
                          ? nFormatter(parseFloat(collateralizationPercent!), 2)
                          : parseFloat(collateralizationPercent!)}{' '}
                        %{' '}
                      </Text>
                    </Box>
                  </Box>
                </SectionWrap>
              </Box>
            )}

            {stepPosition === 2 && ( // REVIEW
              <Box gap="large">
                <BackButton action={() => setStepPosition(1)} />

                <ActiveTransaction txCode={getTxCode(ActionCodes.BORROW, selectedSeriesId)} size="LARGE">
                  <SectionWrap title="Review your transaction">
                    <Box
                      gap="small"
                      pad={{ horizontal: 'large', vertical: 'medium' }}
                      round="xsmall"
                      animation={{ type: 'zoomIn', size: 'small' }}
                    >
                      <ReviewTxItem
                        label="Amount to be Borrowed"
                        icon={<FiPocket />}
                        value={`${borrowInput} ${selectedBase?.symbol}`}
                      />
                      <ReviewTxItem
                        label="Series Maturity"
                        icon={<FiClock />}
                        value={`${selectedSeries?.displayName}`}
                      />
                      {vaultIdToUse && (
                        <ReviewTxItem label="Using Existing Vault" icon={<FiLayers />} value={`${vaultIdToUse}`} />
                      )}
                      <ReviewTxItem
                        label="Vault Debt Payable @ Maturity"
                        icon={<FiTrendingUp />}
                        value={`${borrowInput} ${selectedBase?.symbol}`}
                      />
                      <ReviewTxItem label="Effective APR" icon={<FiPercent />} value={`${'do do get apr'}%`} />
                      <ReviewTxItem
                        label="Supporting Collateral"
                        icon={<Gauge value={parseFloat(collateralizationPercent!)} size="1em" />}
                        value={`${collatInput} ${selectedIlk?.symbol} (${collateralizationPercent} % )`}
                      />
                    </Box>
                  </SectionWrap>

                  <SectionWrap>
                    <Box pad={{ vertical: 'small' }}>
                      <CheckBox
                        label={<Text size="xsmall"> disclaimer example: I understand the terms of transactions.</Text>}
                      />
                    </Box>
                  </SectionWrap>
                </ActiveTransaction>
              </Box>
            )}
          </Box>

          <ActionButtonGroup>
            {(stepPosition === 0 || stepPosition === 1) && (
              <NextButton
                label={<Text size={mobile ? 'small' : undefined}> Next step </Text>}
                onClick={() => setStepPosition(stepPosition + 1)}
                disabled={stepPosition === 0 ? stepDisabled : borrowDisabled}
              />
            )}

            {stepPosition === 2 && (
              <TransactButton
                primary
                label={
                  <Text size={mobile ? 'small' : undefined}>
                    {' '}
                    {`Borrow  ${borrowInput || ''} ${selectedBase?.symbol || ''}`}
                  </Text>
                }
                onClick={() => handleBorrow()}
                disabled={borrowDisabled}
              />
            )}
          </ActionButtonGroup>
        </CenterPanelWrap>

        <PanelWrap right basis="40%">
          {/* <YieldApr input={borrowInput} actionType={ActionType.BORROW} /> */}
          {/* {!mobile && stepPosition === 1 && <Gauge value={parseFloat(collateralizationPercent!)} label="%" max={750} min={150} />} */}
          {!mobile && <VaultSelector />}
        </PanelWrap>
      </MainViewWrap>
    </Keyboard>
  );
};

export default Borrow;

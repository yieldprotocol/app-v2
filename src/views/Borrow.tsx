import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, CheckBox, Header, Heading, Keyboard, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { useHistory, useParams } from 'react-router-dom';
import { ethers } from 'ethers';

import Loader from 'react-spinners/ScaleLoader';

import SeriesSelector from '../components/selectors/SeriesSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import ActionButtonGroup from '../components/ActionButtonGroup';
import SectionWrap from '../components/wraps/SectionWrap';

import MaxButton from '../components/MaxButton';

import { useBorrowActions } from '../hooks/borrowActions';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext, IVault } from '../types';
import { collateralizationRatio } from '../utils/yieldMath';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import AprDisplay from '../components/AprDisplay';
import YieldApr from '../components/YieldApr';
import { ZERO_BN } from '../utils/constants';

const Borrow = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
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
  const [maxCollat, setMaxCollat] = useState<string|undefined>();

  const [borrowDisabled, setBorrowDisabled] = useState<boolean>(true);
  const [stepDisabled, setStepDisabled] = useState<boolean>(true);

  const [borrowInputError, setBorrowInputError] = useState<string|null>(null);
  const [collatInputError, setCollatInputError] = useState<string|null>(null);

  const [vaultIdToUse, setVaultIdToUse] = useState<string|undefined>(undefined);
  const [matchingBaseVaults, setMatchingBaseVaults] = useState<IVault[]>([]);
  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);

  const { borrow } = useBorrowActions();

  /** LOCAL ACTION FNS */

  const handleBorrow = () => {
    !borrowDisabled &&
    borrow(
      vaultIdToUse ? vaultMap.get(vaultIdToUse) : undefined,
      borrowInput,
      collatInput,
    );
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
      if (
        borrowInput &&
        selectedSeries &&
        ethers.utils.parseEther(borrowInput).gt(selectedSeries.baseReserves)
      ) setBorrowInputError(`Amount exceeds the ${selectedBase?.symbol} currently available in pool`);
      /* 2. Check if input is above zero */
      else if (parseFloat(borrowInput) < 0) setBorrowInputError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */
      else {
        setBorrowInputError(null);
      }
    }
  }, [activeAccount, borrowInput, selectedSeries, selectedBase, setBorrowInputError]);

  /* CHECK for any collateral input errors/warnings */
  useEffect(() => {
    if (activeAccount && (collatInput || collatInput === '')) {
      /* 1. Check if input exceeds balance */
      if (maxCollat && parseFloat(collatInput) > parseFloat(maxCollat)) setCollatInputError('Amount exceeds balance');
      /* 2. Check if input is above zero */
      else if (parseFloat(collatInput) < 0) setCollatInputError('Amount should be expressed as a positive value');
      /* 3. next check */
      else if (false) setCollatInputError('Undercollateralised');
      /* if all checks pass, set null error message */
      else {
        setCollatInputError(null);
      }
    }
  }, [activeAccount, collatInput, maxCollat, setCollatInputError]);

  /* BORROW DISABLING LOGIC */
  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    (
      !activeAccount ||
      !borrowInput ||
      !collatInput ||
      !selectedSeries ||
      !selectedIlk ||
      borrowInputError ||
      selectedSeries?.seriesIsMature
    )
      ? setBorrowDisabled(true)
    /* else if all pass, then unlock borrowing */
      : setBorrowDisabled(false);
  },
  [borrowInput, collatInput, selectedSeries, selectedIlk, activeAccount, borrowInputError]);

  /* ADD COLLATERAL DISABLING LOGIC */
  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    (
      !activeAccount ||
        !borrowInput ||
        !selectedSeries ||
        borrowInputError ||
        selectedSeries?.seriesIsMature
    )
      ? setStepDisabled(true)
      /* else if all pass, then unlock borrowing */
      : setStepDisabled(false);
  },
  [borrowInput, borrowInputError, selectedSeries, activeAccount]);

  /**
   * EXTRAS
   * */

  /* CHECK the list of current vaults which match the current series/ilk selection */
  useEffect(() => {
    if (selectedBase && selectedSeries) {
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVaults = arr.filter((v:IVault) => (
        v.baseId === selectedBase.id &&
        v.seriesId === selectedSeries.id
      ));
      setMatchingBaseVaults(_matchingVaults);
    }
    if (selectedBase && selectedSeries && selectedIlk) {
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVaults = arr.filter((v:IVault) => (
        v.ilkId === selectedIlk.id &&
        v.baseId === selectedBase.id &&
        v.seriesId === selectedSeries.id
      ));
      setMatchingVaults(_matchingVaults);
    }
  }, [vaultMap, selectedBase, selectedIlk, selectedSeries]);

  return (

    <Keyboard
      onEsc={() => setCollatInput('')}
      onEnter={() => console.log('ENTER smashed')}
      target="document"
    >

      <MainViewWrap>

        <PanelWrap basis="30%">
          <Box justify="between" fill pad="xlarge">
            <Box>
              { [['1. Choose asset to', 'borrow'], ['2. Add', 'collateral'], ['3. ', 'Review', 'and transact']].map((x:string[], i:number) => (
                <Box direction="row" key={x[1]}>
                  <Text weight={100} size="xlarge" color={stepPosition === i ? 'text' : 'text-xweak'}> {x[0]}
                    <Text weight="bold" size={stepPosition === i ? 'xxlarge' : 'xlarge'} color={stepPosition === i ? 'text' : 'text-xweak'}> {x[1]} </Text>
                    {x[2]}
                  </Text>
                </Box>
              )) }
            </Box>

            <Box gap="small">
              <Text weight="bold">Information</Text>
              <Text size="small"> Some information </Text>
            </Box>

          </Box>
        </PanelWrap>

        <CenterPanelWrap>

          <Box gap="small">

            {/**
             *
             *
             * STEPPER POSITION INITIAL
             *
             * */}

            {
            stepPosition === 0 &&
            <Box gap="large">
              <SectionWrap title="Select an asset and amount: ">
                <Box direction="row" gap="small" fill="horizontal" align="start">
                  <Box basis={mobile ? '50%' : '65%'}>
                    <InputWrap action={() => console.log('maxAction')} isError={borrowInputError}>
                      <TextInput
                        plain
                        type="number"
                        placeholder="Enter amount"
                        value={borrowInput}
                        onChange={(event:any) => setBorrowInput(event.target.value)}
                        autoFocus={!mobile}
                      />
                    </InputWrap>
                  </Box>
                  <Box basis={mobile ? '50%' : '35%'}>
                    <AssetSelector />
                  </Box>
                </Box>
              </SectionWrap>

              <SectionWrap title="Choose an series to borrow against">
                <Box>
                  <SeriesSelector />
                  {selectedSeries?.seriesIsMature && <Text color="pink" size="small">This series has matured.</Text>}
                </Box>
              </SectionWrap>

              {
              selectedSeries?.seriesIsMature &&
              matchingBaseVaults.length > 0 &&
              <SectionWrap>
                <Box gap="small" fill="horizontal">
                  <Text size="xsmall">Go to exisiting vault:</Text>
                  {
                    matchingVaults.map((x:IVault) => (
                      <Box
                        direction="row"
                        justify="end"
                        key={x.id}
                        onClick={() => routerHistory.push(`/vault/${x.id}`)}
                      >
                        <Text size="xsmall"> {x.id} </Text>
                      </Box>
                    ))
                  }
                </Box>
              </SectionWrap>
              }

            </Box>
            }

            {/**
             *
             *
             * STEPPER POSITION COLLATERAL
             *
             * */}

            {
            stepPosition === 1 &&

            <Box gap="large">
              <Box onClick={() => setStepPosition(0)}>
                <Text>Back</Text>
              </Box>

              <SectionWrap>
                <Box direction="row" gap="small" fill="horizontal" align="start">
                  <Box basis={mobile ? '50%' : '65%'}>
                    <InputWrap action={() => console.log('maxAction')} disabled={!selectedSeries} isError={collatInputError}>
                      <TextInput
                        plain
                        type="number"
                        placeholder="Enter amount"
                        // ref={(el:any) => { el && el.focus(); }}
                        value={collatInput}
                        onChange={(event:any) => setCollatInput(event.target.value)}
                        disabled={!selectedSeries || selectedSeries.seriesIsMature}
                      />
                      <MaxButton
                        action={() => maxCollat && setCollatInput(maxCollat)}
                        disabled={!selectedSeries || collatInput === maxCollat || selectedSeries.seriesIsMature}
                      />
                    </InputWrap>
                  </Box>
                  <Box basis={mobile ? '50%' : '35%'}>
                    <AssetSelector selectCollateral />
                  </Box>
                </Box>
              </SectionWrap>

              {
                !selectedSeries?.seriesIsMature &&
                <SectionWrap>
                  <Box gap="small" fill="horizontal">
                    <Box direction="row" justify="end">
                      <CheckBox
                        reverse
                        disabled={matchingVaults.length < 1}
                        checked={!vaultIdToUse || !matchingVaults.find((v:IVault) => v.id === vaultIdToUse)}
                        label={<Text size="small">Create new vault</Text>}
                        onChange={() => setVaultIdToUse(undefined)}
                      />
                    </Box>
                    {
                matchingVaults.length > 0 &&
                <Box alignSelf="center">
                  <Text size="xsmall"> Or borrow from an existing vault:</Text>
                  {/* <Select
                    plain
                    options={matchingVaults.map((x:IVault) => (<Text key={x.id} size="xsmall">{x.id}</Text>))}
                    placeholder="or Borrow from an existing vault"
                    value={vaultIdToUse}
                    defaultValue={undefined}
                    onChange={({ option }) => setVaultIdToUse(option)}
                  /> */}
                </Box>
              }

                    {
                matchingVaults.map((x:IVault) => (
                  <Box direction="row" justify="end" key={x.id}>
                    <CheckBox
                      reverse
                      // disabled={!selectedVaultId}
                      checked={vaultIdToUse === x.id}
                      label={<Text size="small">{x.id}</Text>}
                      onChange={(event:any) => setVaultIdToUse(x.id)}
                    />
                  </Box>
                ))
              }
                  </Box>
                </SectionWrap>
              }

            </Box>
        }

            {/**
             *
             *
             * STEPPER POSITION REVIEW
             *
             * */}

            {
            stepPosition === 2 &&

            <Box gap="large">
              <Box onClick={() => setStepPosition(1)}>
                <Text>Back</Text>
              </Box>
              <SectionWrap>
                <Box direction="row" gap="small" fill="horizontal" align="start">
                  REview transaction
                  buy x DAi at rate using x as collateral
                </Box>
              </SectionWrap>
            </Box>
        }
          </Box>

          <Box gap="small">
            <ActionButtonGroup>
              {
              stepPosition === 0 &&
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> continue to Add collateral </Text>}
                key="ONE"
                onClick={() => setStepPosition(stepPosition + 1)}
                disabled={stepDisabled}
              />
              }

              {
              stepPosition === 1 &&
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> continue to Review </Text>}
                key="ONE"
                onClick={() => setStepPosition(stepPosition + 1)}
                disabled={borrowDisabled}
              />
              }

              {
              stepPosition === 2 &&
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> {`Borrow  ${borrowInput || ''} ${selectedBase?.symbol || ''}`}</Text>}
                key="FINAL"
                onClick={() => handleBorrow()}
                disabled={borrowDisabled}
              />
              }
            </ActionButtonGroup>

            {/* <StepSelector
              selected={stepPosition}
              options={['1. choose asset', '2. add collateral', '3. review']}
              action={(x:number) => setStepPosition(x)}
            /> */}
          </Box>

        </CenterPanelWrap>

        <PanelWrap basis="30%">

          <YieldApr input={borrowInput} type="BORROW" />

          <Box gap="small">
            {
            matchingBaseVaults.length > 0 &&
            <Box animation="fadeIn">
              <Text size="small"> My existing {selectedBase?.symbol}-based vaults for the {selectedSeries?.displayName} series: </Text>
            </Box>
            }
            {
              matchingBaseVaults.map((x:IVault, i:number) => (
                <Box
                  direction="row"
                  key={x.id}
                  onClick={() => routerHistory.push(`/vault/${x.id}`)}
                  animation={{ type: 'fadeIn', delay: i * 100, duration: 1500 }}
                  border
                  // pad="xsmall"
                  round="xsmall"
                >
                  <Text size="small"> {x.id} </Text>
                </Box>
              ))
            }
          </Box>

        </PanelWrap>

      </MainViewWrap>

    </Keyboard>

  );
};

export default Borrow;

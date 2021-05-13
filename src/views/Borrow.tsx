import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, CheckBox, Keyboard, ResponsiveContext, Text, TextInput } from 'grommet';
import { useHistory, useParams } from 'react-router-dom';
import { ethers } from 'ethers';

import SeriesSelector from '../components/selectors/SeriesSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import ActionButtonGroup from '../components/ActionButtonGroup';
import SectionWrap from '../components/wraps/SectionWrap';

import MaxButton from '../components/MaxButton';

import { useBorrowActions } from '../hooks/borrowActions';
import { UserContext } from '../contexts/UserContext';
import { IUserContext, IVault } from '../types';
import { collateralizationRatio } from '../utils/yieldMath';

const Borrow = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;
  const selectedBase = assetMap.get(selectedBaseId!);
  const selectedIlk = assetMap.get(selectedIlkId!);

  /* LOCAL STATE */

  const [borrowInput, setBorrowInput] = useState<string>('');
  const [collatInput, setCollatInput] = useState<string>('');
  const [maxCollateral, setMaxCollateral] = useState<string|undefined>();

  const [borrowDisabled, setBorrowDisabled] = useState<boolean>(true);
  const [collatDisabled, setCollatDisabled] = useState<boolean>(true);

  const [borrowError, setBorrowError] = useState<string|null>(null);
  const [collatError, setCollatError] = useState<string|null>(null);

  const [vaultIdToUse, setVaultIdToUse] = useState<string|undefined>(undefined);
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
      _max && setMaxCollateral(ethers.utils.formatEther(_max)?.toString());
    })();
  }, [activeAccount, selectedIlk, setMaxCollateral]);

  /* WATCH FOR WARNINGS AND ERRORS */

  /* CHECK for any collateral input errors/warnings */
  useEffect(() => {
    if (activeAccount && (collatInput || collatInput === '')) {
      /* 1. Check if input exceeds balance */
      if (maxCollateral && parseFloat(collatInput) > parseFloat(maxCollateral)) setCollatError('Amount exceeds balance');
      /* 2. Check if input is above zero */
      else if (parseFloat(collatInput) < 0) setCollatError('Amount should be expressed as a positive value');
      /* 3. next check */
      else if (false) setCollatError('Undercollateralised');
      /* if all checks pass, set null error message */
      else {
        setCollatError(null);
      }
    }
  }, [activeAccount, collatInput, maxCollateral, setCollatError]);

  /* ACTION DISABLING LOGIC */

  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    (
      !activeAccount ||
      !borrowInput ||
      !collatInput ||
      !selectedSeriesId ||
      !selectedIlkId
    )
      ? setBorrowDisabled(true)
    /* else if all pass, then unlock borrowing */
      : setBorrowDisabled(false);
  },
  [borrowInput, collatInput, selectedSeriesId, selectedIlkId, activeAccount]);

  /**
   * EXTRAS
   * */

  /* CHECK the list of current vaults which match the current series/ilk selection */
  useEffect(() => {
    if (selectedBaseId && selectedSeriesId && selectedIlkId) {
      const arr: IVault[] = Array.from(vaultMap.values()) as IVault[];
      const _matchingVaults = arr.filter((v:IVault) => (
        v.ilkId === selectedIlkId &&
          v.baseId === selectedBaseId &&
          v.seriesId === selectedSeriesId
      ));
      setMatchingVaults(_matchingVaults);
    }
  }, [vaultMap, selectedBaseId, selectedIlkId, selectedSeriesId]);

  return (

    <Keyboard
      onEsc={() => setCollatInput('')}
      onEnter={() => console.log('ENTER smashed')}
      target="document"
    >

      <MainViewWrap>

        <SectionWrap title="1. Asset to Borrow" subtitle="Choose an asset and period to borrow for">

          <Box direction="row" gap="small" fill="horizontal">
            <InputWrap action={() => console.log('maxAction')} isError={borrowError}>
              <TextInput
                plain
                type="number"
                placeholder="Enter amount"
                value={borrowInput}
                onChange={(event:any) => setBorrowInput(event.target.value)}
                autoFocus={!mobile}
              />
            </InputWrap>
            <Box basis={mobile ? '50%' : '35%'} fill>
              <AssetSelector />
            </Box>
          </Box>

          {/* <Box justify="evenly" gap="small" fill="horizontal" direction="row-responsive">
            <InfoBite label="Borrowing Power:" value="100Dai" />
            <InfoBite label="Collateralization:" value="200%" />
          </Box> */}

        </SectionWrap>

        <SectionWrap title="2. Select a series">
          <SeriesSelector />
        </SectionWrap>

        <SectionWrap title="3. Add Collateral">
          <Box direction="row" gap="small" fill="horizontal" align="start">
            <InputWrap action={() => console.log('maxAction')} disabled={!selectedSeriesId} isError={collatError}>
              <TextInput
                plain
                type="number"
                placeholder="Enter amount"
                // ref={(el:any) => { el && el.focus(); }}
                value={collatInput}
                onChange={(event:any) => setCollatInput(event.target.value)}
                disabled={!selectedSeriesId}
              />
              <MaxButton
                action={() => maxCollateral && setCollatInput(maxCollateral)}
                disabled={!selectedSeriesId || collatInput === maxCollateral} /* disabled if is already Max */
              />
            </InputWrap>
            <Box basis={mobile ? '50%' : '35%'}>
              <AssetSelector selectCollateral />
            </Box>
          </Box>
        </SectionWrap>

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
                <Text size="xsmall"> -------- or use existing vault ----------</Text>
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

        <ActionButtonGroup buttonList={[
          <Button
            primary
            label={<Text size={mobile ? 'small' : undefined}> {`Borrow  ${borrowInput || ''} ${selectedBase?.symbol || ''}`}</Text>}
            key="primary"
            onClick={() => handleBorrow()}
            disabled={borrowDisabled}
          />,

          <Button
            secondary
            disabled
            label={<Text size={mobile ? 'small' : undefined}> Migrate Maker Vault</Text>}
            key="secondary"
          />,
        ]}
        />
      </MainViewWrap>

    </Keyboard>

  );
};

export default Borrow;

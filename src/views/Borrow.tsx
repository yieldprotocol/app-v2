import React, { useContext, useEffect, useRef, useState } from 'react';
import { Box, Button, CheckBox, Image, Keyboard, RadioButtonGroup, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { Router, useHistory } from 'react-router-dom';

import { FiArrowLeftCircle } from 'react-icons/fi';
import { cleanValue } from '../utils/displayUtils';

import SeriesSelector from '../components/selectors/SeriesSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import ActionButtonGroup from '../components/ActionButtonGroup';
import PlaceholderWrap from '../components/wraps/PlaceholderWrap';
import { useDebounce } from '../hooks';
import SectionWrap from '../components/wraps/SectionWrap';
import { useActions } from '../hooks/actionHooks';
import { UserContext } from '../contexts/UserContext';
import { IUserContext, IVault } from '../types';

const Borrow = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  // const routerHistory = useHistory();
  // const routerState = routerHistory.location.state as { from: string };

  /* state from context */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, vaultMap, selectedSeriesId, selectedIlkId, selectedBaseId } = userState;

  const selectedBase = assetMap.get(selectedBaseId!);

  const [inputValue, setInputValue] = useState<string>();
  const [collInputValue, setCollInputValue] = useState<string>();

  const [borrowDisabled, setBorrowDisabled] = useState<boolean>(true);

  const [matchingVaults, setMatchingVaults] = useState<IVault[]>([]);
  const [vaultIdToUse, setVaultIdToUse] = useState<string|undefined>(undefined);

  const { borrow } = useActions();

  const handleBorrow = () => {
    !borrowDisabled &&
    borrow(
      vaultIdToUse ? vaultMap.get(vaultIdToUse) : undefined,
      inputValue,
      collInputValue,
    );
  };

  /* checks and sets list of current vaults matching the current selection */
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

  /* TODO create vanity vault ids? */

  /* Action disabling logic: */
  useEffect(() => {
    /* if ANY of the following conditions are met: block action */
    (
      !activeAccount ||
      !inputValue ||
      !collInputValue ||
      !selectedSeriesId ||
      !selectedIlkId
    )
      ? setBorrowDisabled(true)
    /* else if all pass, then unlock borrowing */
      : setBorrowDisabled(false);
  }, [inputValue, collInputValue, selectedSeriesId, selectedIlkId, activeAccount]);

  return (

    <Keyboard
      onEsc={() => setInputValue(undefined)}
      onEnter={() => console.log('ENTER smashed')}
      target="document"
    >
      <MainViewWrap>

        <SectionWrap title="1. Asset to Borrow" subtitle="Choose an asset and period to borrow for">

          <Box direction="row" gap="small" fill="horizontal">
            <InputWrap action={() => console.log('maxAction')}>
              <TextInput
                plain
                type="number"
                placeholder={<PlaceholderWrap label="Enter amount" />}
                value={inputValue || ''}
                onChange={(event:any) => setInputValue(event.target.value)}
                autoFocus={!mobile}
              />
            </InputWrap>
            <Box basis={mobile ? '50%' : '35%'} fill>
              <AssetSelector />
            </Box>
          </Box>

          <Box justify="evenly" gap="small" fill="horizontal" direction="row-responsive">
            <InfoBite label="Borrowing Power:" value="100Dai" />
            <InfoBite label="Collateralization:" value="200%" />
          </Box>

        </SectionWrap>

        <SectionWrap title="2. Select a series">
          <SeriesSelector />
        </SectionWrap>

        <SectionWrap title="3. Add Collateral">
          <Box direction="row" gap="small" fill="horizontal" align="center">
            <InputWrap action={() => console.log('maxAction')} disabled={!selectedSeriesId}>
              <TextInput
                plain
                type="number"
                placeholder={<PlaceholderWrap label="Enter amount" disabled={!selectedSeriesId} />}
                // ref={(el:any) => { el && el.focus(); }}
                value={collInputValue || ''}
                onChange={(event:any) => setCollInputValue(event.target.value)}
                disabled={!selectedSeriesId}
              />
            </InputWrap>
            <Box basis={mobile ? '50%' : '35%'} fill>
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
                checked={!vaultIdToUse || matchingVaults.length < 1}
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
                    checked={!!vaultIdToUse || matchingVaults.length < 1}
                    label={<Text size="small">{x.id}</Text>}
                    onChange={(event:any) => setVaultIdToUse(event.target.checked)}
                  />
                </Box>
              ))
            }

          </Box>

        </SectionWrap>

        <ActionButtonGroup buttonList={[
          <Button
            primary
            label={<Text size={mobile ? 'small' : undefined}> {`Borrow  ${inputValue || ''} ${selectedBase?.symbol || ''}`}</Text>}
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

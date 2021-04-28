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

const Borrow = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  const routerHistory = useHistory();
  const routerState = routerHistory.location.state as { from: string };

  const { userState: {
    activeAccount,
    selectedVaultId,
    selectedSeriesId,
    selectedIlkId,
    selectedBaseId,
    assetMap,
  },
  } = useContext(UserContext);

  const selectedBase = assetMap.get(selectedBaseId);

  const [inputValue, setInputValue] = useState<string>();
  const [collInputValue, setCollInputValue] = useState<string>();
  const [vaultIdValue, setVaultIdValue] = useState<string>();

  const [borrowDisabled, setBorrowDisabled] = useState<boolean>(true);
  const [createNewVault, setCreateNewVault] = useState<boolean>(false);

  const { borrow } = useActions();

  const handleBorrow = () => {
    !borrowDisabled &&
    borrow(
      createNewVault ? undefined : selectedVaultId,
      inputValue,
      collInputValue,
    );
  };

  useEffect(() => {
    if (vaultIdValue && vaultIdValue.length === 12) {
      // checkVault();
      console.log('Max length reached');
    }
  }, [vaultIdValue]);

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
  }, [inputValue, collInputValue, selectedSeriesId, selectedIlkId]);

  return (

    <Keyboard
      onEsc={() => setInputValue(undefined)}
      onEnter={() => console.log('ENTER smashed')}
      target="document"
    >
      <MainViewWrap>

        {
          selectedVaultId &&
          <Box direction="row">
            <Image src={selectedVaultId.image} />
            <Text>{ selectedVaultId } </Text>
          </Box>
        }

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

        <Box direction="row" justify="end">
          <CheckBox
            reverse
            disabled={!selectedVaultId}
            checked={createNewVault || !selectedVaultId}
            label={<Text size="small">Create new vault</Text>}
            onChange={(event:any) => setCreateNewVault(event.target.checked)}
          />
        </Box>
        {/*
        <SectionWrap>
          <InputWrap>
            <TextInput
              plain
              placeholder={<PlaceholderWrap label="Enter vaultID" />}
                // ref={(el:any) => { el && el.focus(); }}
              maxLength={12}
              value={vaultIdValue || ''}
              onChange={(event:any) => setVaultIdValue(event.target.value)}
            />
            <CheckBox
              reverse
              disabled
              checked={createNewVault}
              label={<Text size="small">Random</Text>}
              onChange={(event:any) => setCreateNewVault(event.target.checked)}
            />
          </InputWrap>
        </SectionWrap> */}

        <ActionButtonGroup buttonList={[
          <Button
            primary
            label={<Text size={mobile ? 'small' : undefined}> {`Borrow  ${inputValue || ''} ${selectedBase?.symbol || ''}`}</Text>}
            key="primary"
            onClick={() => handleBorrow()}
            disabled={borrowDisabled}
          />,
          (
            !selectedVaultId
              ?
                <Button
                  secondary
                  disabled
                  label={<Text size={mobile ? 'small' : undefined}> Migrate Maker Vault</Text>}
                  key="secondary"
                />
              :
                <Box
                  onClick={() => routerHistory.push(`/vault/${selectedVaultId}`)}
                  gap="medium"
                  direction="row"
                  alignSelf="center"
                  key="tertiary"
                >
                  <FiArrowLeftCircle />
                  <Text size="small"> back to vault: {selectedVaultId} </Text>
                </Box>
          ),
        ]}
        />
      </MainViewWrap>

    </Keyboard>

  );
};

export default Borrow;

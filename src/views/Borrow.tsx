import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, CheckBox, Header, Heading, Keyboard, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { useHistory, useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import styled from 'styled-components';

import SeriesSelector from '../components/selectors/SeriesSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import AssetSelector from '../components/selectors/AssetSelector';
import InputWrap from '../components/wraps/InputWrap';
import ActionButtonGroup from '../components/ActionButtonGroup';
import SectionWrap from '../components/wraps/SectionWrap';

import MaxButton from '../components/MaxButton';

import { useBorrowActions } from '../hooks/borrowActions';
import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, IUserContext, IVault } from '../types';
import { collateralizationRatio } from '../utils/yieldMath';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import YieldApr from '../components/YieldApr';
import { ZERO_BN } from '../utils/constants';
import StepperText from '../components/StepperText';
import Collateralization from '../components/Collateralization';
import VaultSelector from '../components/selectors/VaultSelector';
import ActiveTransaction from '../components/ActiveTransaction';
import { getTxCode } from '../utils/appUtils';

const StampText = styled(Text)`

font-weight: 700;

padding: 0.25rem 0.5rem;
text-transform: uppercase;
border-radius: 1rem;
font-family: 'Courier';
-webkit-mask-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/8399/grunge.png');
-webkit-mask-size: 600px 300px;
mix-blend-mode: multiply;

color: #D21;
border: 0.5rem double #D21;
transform: rotate(-5deg);
-webkit-mask-position: 2rem 3rem;
font-size: 1rem;
`;

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
  const [basis, setBasis] = useState<string>('30%');

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

        {/* <PanelWrap background="linear-gradient(to right, #EEEEEE,rgba(255,255,255,1))"> */}
        { !mobile &&
        <PanelWrap>

          {/* <Box justify="between" fill pad="xlarge"> */}
          <StepperText
            position={stepPosition}
            values={[['Choose an asset to', 'borrow', ''], ['Add', 'collateral', ''], ['', 'Review', 'and transact']]}
          />

          <Box gap="small">
            <Text weight="bold">Information</Text>
            <Text size="small"> Some information </Text>
          </Box>
          {/* </Box> */}
        </PanelWrap>}

        <CenterPanelWrap>
          {
            stepPosition === 0 && // INITIAL STEP
            <Box gap="large">
              {/* <Box pad="small" /> */}
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

              <SectionWrap title="Choose an series to borrow from">
                <SeriesSelector inputValue={borrowInput} actionType={ActionType.BORROW} />
              </SectionWrap>
                {/* {selectedSeries?.seriesIsMature && <StampText>This series has matured.</StampText> */}
                {selectedSeries?.seriesIsMature && <Box round="xsmall" pad="small" border={{ color: 'pink' }}><Text color="pink" size="small">This series has matured.</Text></Box>}

            </Box>
            }

          {
            stepPosition === 1 && // ADD COLLATERAL
            <Box gap="large">

              <Box onClick={() => setStepPosition(0)}>
                <Text>Back</Text>
              </Box>

              <SectionWrap>
                <Box direction="row" gap="small" fill="horizontal" align="start">
                  <Box basis={mobile ? '50%' : '60%'}>
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
                  <Box basis={mobile ? '50%' : '40%'}>
                    <AssetSelector selectCollateral />
                  </Box>
                </Box>
              </SectionWrap>

              {
                !selectedSeries?.seriesIsMature &&
                <SectionWrap>
                  <Box gap="small" fill="horizontal">
                    <Box gap="xsmall">
                      <CheckBox
                        // reverse
                        disabled={matchingVaults.length < 1}
                        checked={!vaultIdToUse || !matchingVaults.find((v:IVault) => v.id === vaultIdToUse)}
                        label={<Text size="small">Create new vault</Text>}
                        onChange={() => setVaultIdToUse(undefined)}
                      />

                      <Box direction="row-responsive" gap="small" justify="between">
                        <CheckBox
                        // reverse
                          disabled={matchingVaults.length < 1}
                          checked={matchingVaults.length > 0 && !!vaultIdToUse}
                          label={<Text size="small">Use an exisiting vault </Text>}
                          onChange={(event:any) => setVaultIdToUse(matchingVaults[0].id)}
                        />

                        <Select
                          disabled={!vaultIdToUse}
                          options={matchingVaults.map((x:IVault) => x.id)}
                          // placeholder="or Borrow from an existing vault"
                          value={vaultIdToUse || ''}
                          // defaultValue={undefined}
                          onChange={({ option }) => setVaultIdToUse(option)}
                        />

                      </Box>

                    </Box>
                  </Box>
                </SectionWrap>
              }

              <SectionWrap>
                <Collateralization percent={50} />
              </SectionWrap>
            </Box>
            }

          {
            stepPosition === 2 && // REVIEW
            <Box gap="large">
              <Box onClick={() => setStepPosition(1)}>
                <Text>Back</Text>
              </Box>
              <ActiveTransaction txCode={getTxCode(ActionCodes.BORROW, selectedSeriesId)}>
                <SectionWrap title="Review your transaction">
                  <Text>Borrow {borrowInput}
                    {selectedBase?.symbol} from the {selectedSeries?.displayName} series.
                  </Text>
                </SectionWrap>
              </ActiveTransaction>
            </Box>
          }

          <ActionButtonGroup>
            {
              stepPosition === 0 &&
              <Button
                secondary
                label={<Text size={mobile ? 'small' : undefined}> Allocate collateral </Text>}
                onClick={() => setStepPosition(stepPosition + 1)}
                disabled={stepDisabled}
              />
              }

            {
              stepPosition === 1 &&
              <Button
                secondary
                label={<Text size={mobile ? 'small' : undefined}> Review transaction </Text>}
                onClick={() => setStepPosition(stepPosition + 1)}
                disabled={borrowDisabled}
              />
              }

            {
              stepPosition === 2 &&
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> {`Borrow  ${borrowInput || ''} ${selectedBase?.symbol || ''}`}</Text>}
                onClick={() => handleBorrow()}
                disabled={borrowDisabled}
              />
              }
          </ActionButtonGroup>

        </CenterPanelWrap>

        <PanelWrap right basis="40%">
          <YieldApr input={borrowInput} actionType={ActionType.BORROW} />
          {!mobile && <VaultSelector />}
        </PanelWrap>

      </MainViewWrap>

    </Keyboard>

  );
};

export default Borrow;

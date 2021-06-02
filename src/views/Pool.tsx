import React, { useContext, useEffect, useState } from 'react';
import { Box, Button, RadioButtonGroup, ResponsiveContext, Text, TextInput } from 'grommet';

import { ethers } from 'ethers';

import { cleanValue } from '../utils/displayUtils';
import AssetSelector from '../components/selectors/AssetSelector';
import MainViewWrap from '../components/wraps/MainViewWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import InputWrap from '../components/wraps/InputWrap';
import InfoBite from '../components/InfoBite';
import ActionButtonGroup from '../components/ActionButtonGroup';
import SectionWrap from '../components/wraps/SectionWrap';
import { UserContext } from '../contexts/UserContext';
import { ISeries, IUserContext } from '../types';
import { usePoolActions } from '../hooks/poolActions';
import MaxButton from '../components/MaxButton';
import PanelWrap from '../components/wraps/PanelWrap';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import StepperText from '../components/StepperText';
import PositionSelector from '../components/selectors/PositionSelector';

function Pool() {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */
  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, assetMap, seriesMap, selectedSeriesId, selectedBaseId } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */
  const [poolInput, setPoolInput] = useState<string>();
  const [removeInput, setRemoveInput] = useState<string>();
  const [rollInput, setRollInput] = useState<string>();

  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);

  const [maxPool, setMaxPool] = useState<string|undefined>();
  const [maxRemove, setMaxRemove] = useState<string|undefined>();

  const [poolError, setPoolError] = useState<string|null>(null);
  const [removeError, setRemoveError] = useState<string|null>(null);
  const [rollError, setRollError] = useState<string|null>(null);

  const [poolDisabled, setPoolDisabled] = useState<boolean>(true);
  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  const [strategy, setStrategy] = useState<'BUY'|'MINT'>('BUY');

  const [stepPosition, setStepPosition] = useState<number>(0);

  /* HOOK FNS */

  const { addLiquidity, removeLiquidity, rollLiquidity } = usePoolActions();

  /* LOCAL ACTION FNS */

  const handleAdd = () => {
    // !poolDisabled &&
    selectedSeries && addLiquidity(poolInput!, selectedSeries, strategy);
  };
  const handleRemove = () => {
    // !removeDisabled &&
    console.log(selectedSeries?.displayName);
    selectedSeries && removeLiquidity(removeInput!, selectedSeries);
  };
  const handleRoll = () => {
    // !rollDisabled &&
    selectedSeries && rollToSeries && rollLiquidity(rollInput!, selectedSeries, rollToSeries);
  };

  /* SET MAX VALUES */

  useEffect(() => {
    if (activeAccount) {
      /* Checks asset selection and sets the max available value */
      (async () => {
        const max = await selectedBase?.getBalance(activeAccount);
        if (max) setMaxPool(ethers.utils.formatEther(max).toString());
      })();
    }
  }, [activeAccount, poolInput, selectedBase, setMaxPool]);

  useEffect(() => {
    /* Checks the max available to roll or move */
    const max = selectedSeries?.poolTokens;
    if (max) setMaxRemove(ethers.utils.formatEther(max).toString());
  }, [rollInput, selectedSeries, setMaxRemove]);

  /* WATCH FOR WARNINGS AND ERRORS */

  useEffect(() => {
    /* CHECK for any lendInput errors */
    if (activeAccount && (poolInput || poolInput === '')) {
      /* 1. Check if input exceeds balance */
      if (maxPool && parseFloat(poolInput) > parseFloat(maxPool)) setPoolError('Amount exceeds balance');
      /* 2. Check if input is above zero */
      else if (parseFloat(poolInput) < 0) setPoolError('Amount should be expressed as a positive value');
      /* 2. next Check */
      else if (false) setPoolError('Insufficient');
      /* if all checks pass, set null error message */
      else {
        setPoolError(null);
      }
    }
  }, [activeAccount, poolInput, maxPool]);

  useEffect(() => {
    /* CHECK for any removeInput errors */
    if (activeAccount && (removeInput || removeInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxRemove && parseFloat(removeInput) > parseFloat(maxRemove)) setRemoveError('Amount exceeds liquidity token balance');
      /* 2. Check if there is a selected series */
      else if (removeInput && !selectedSeries) setRemoveError('No base series selected');
      /* 2. Check if input is above zero */
      else if (parseFloat(removeInput) < 0) setRemoveError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */
      else {
        setRemoveError(null);
      }
    }
  }, [activeAccount, removeInput, maxRemove, selectedSeries]);

  useEffect(() => {
    /* CHECK for any rollInput errors */
    if (activeAccount && (rollInput || rollInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxRemove && parseFloat(rollInput) > parseFloat(maxRemove)) setRollError('Amount exceeds liquidity token balance');
      /* 2. Check if there is a selected series */
      else if (rollInput && !selectedSeries) setRollError('No base series selected');
      /* 2. Check if input is above zero */
      else if (parseFloat(rollInput) < 0) setRollError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */
      else {
        setRollError(null);
      }
    }
  }, [activeAccount, rollInput, maxRemove, selectedSeries]);

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */

  useEffect(() => {
    (!activeAccount || !poolInput || !selectedSeries || poolError) ? setPoolDisabled(true) : setPoolDisabled(false);
  }, [poolInput, activeAccount, poolError, selectedSeries]);

  useEffect(() => {
    (!activeAccount || !removeInput || removeError) ? setRemoveDisabled(true) : setRemoveDisabled(false);
  }, [activeAccount, removeError, removeInput]);

  useEffect(() => {
    (!activeAccount || !rollInput || rollError) ? setRollDisabled(true) : setRollDisabled(false);
  }, [rollInput, activeAccount, rollError]);

  return (

    <MainViewWrap>

      <PanelWrap>

        <StepperText
          position={stepPosition}
          values={[['Choose an asset to', 'pool', ''], ['', 'Review', 'and transact']]}
        />

        <Box gap="small">
          <Text weight="bold">Information</Text>
          <Text size="small"> Some information </Text>
        </Box>

      </PanelWrap>

      <CenterPanelWrap>

        {
          stepPosition === 0 &&
          <Box gap="large">

            <SectionWrap title="Select an asset to Pool">
              <Box direction="row" gap="small" fill="horizontal" align="start">
                <Box basis={mobile ? '50%' : '65%'}>
                  <InputWrap action={() => console.log('maxAction')} isError={poolError}>
                    <TextInput
                      plain
                      type="number"
                      placeholder="Enter Amount"
                      value={poolInput || ''}
                      onChange={(event:any) => setPoolInput(cleanValue(event.target.value))}
                    />
                    <MaxButton
                      action={() => setPoolInput(maxPool)}
                      disabled={maxPool === '0'}
                    />
                  </InputWrap>
                </Box>

                <Box basis={mobile ? '50%' : '35%'}>
                  <AssetSelector />
                </Box>

              </Box>
            </SectionWrap>

            <SectionWrap title="Select a series to Pool to">
              <SeriesSelector />
            </SectionWrap>

            {selectedSeries?.seriesIsMature && <Text color="pink" size="small">This series has matured.</Text>}

          </Box>
          }

        {
          stepPosition === 1 &&
          <Box gap="large">
            <Box onClick={() => setStepPosition(0)}>
              <Text>Back</Text>
            </Box>

            {
            !selectedSeries?.seriesIsMature &&
              <SectionWrap>
                <Box direction="row" justify="between" fill align="center">
                  {!mobile && <Text size="small"> Pooling strategy: </Text>}
                  <RadioButtonGroup
                    name="strategy"
                    options={[
                      { label: <Text size="small"> Buy & Pool </Text>, value: 'BUY' },
                      { label: <Text size="small"> Mint & Pool </Text>, value: 'MINT', disabled: true },
                    ]}
                    value={strategy}
                    onChange={(event:any) => setStrategy(event.target.value)}
                    direction="row"
                    justify="between"
                  />
                </Box>
              </SectionWrap>
            }

            <SectionWrap title="Review your transaction">
              some transaction info
            </SectionWrap>
          </Box>
          }

        {/* <SectionWrap title="[ Remove Liquidity ]">

          <Box direction="row" gap="small" fill align="start">
            <Box fill="horizontal">
              <InputWrap action={() => console.log('maxAction')} isError={removeError}>
                <TextInput
                  plain
                  type="number"
                  placeholder="Tokens to remove"
                  value={removeInput || ''}
                  onChange={(event:any) => setRemoveInput(cleanValue(event.target.value))}
                />
                <MaxButton
                  action={() => setRemoveInput(maxRemove)}
                  disabled={maxRemove === '0.0'}
                />
              </InputWrap>
            </Box>
          </Box>

          <Box gap="small" fill direction="row" align="start">
            <ActionButtonGroup buttonList={[
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> Remove </Text>}
                key="primary"
                onClick={() => handleRemove()}
                disabled={removeDisabled}
              />,
            ]}
            />
          </Box>

        </SectionWrap> */}

        {/* <SectionWrap title="[ Roll Liquidity to ]">
          <Box direction="row" gap="small" fill="horizontal">

            <Box fill>
              <InputWrap action={() => console.log('maxAction')} isError={rollError}>
                <TextInput
                  plain
                  type="number"
                  placeholder="Tokens to roll"
                  value={rollInput || ''}
                  onChange={(event:any) => setRollInput(cleanValue(event.target.value))}
                />
                <MaxButton
                  action={() => setRollInput(maxRemove)}
                  disabled={maxRemove === '0.0'}
                />
              </InputWrap>
            </Box>

          </Box>

          <Box gap="small" fill="horizontal" direction="row">
            <SeriesSelector selectSeriesLocally={(series:ISeries) => setRollToSeries(series)} />
            <Box basis="35%">
              <ActionButtonGroup buttonList={[
                <Button
                  primary
                  label={<Text size={mobile ? 'small' : undefined}> Roll </Text>}
                  key="primary"
                  onClick={() => handleRoll()}
                />,
              ]}
              />
            </Box>
          </Box>
        </SectionWrap> */}

        <ActionButtonGroup>

          {
            stepPosition !== 1 &&
            !selectedSeries?.seriesIsMature &&
            <Button
              secondary
              label={<Text size={mobile ? 'small' : undefined}> continue to Review </Text>}
              onClick={() => setStepPosition(stepPosition + 1)}
            />
            }
          {
            stepPosition === 1 &&
            !selectedSeries?.seriesIsMature &&
              <Button
                primary
                label={<Text size={mobile ? 'small' : undefined}> {`Pool ${poolInput || ''} ${selectedBase?.symbol || ''}`} </Text>}
                onClick={() => handleAdd()}
                disabled={poolDisabled}
              />
            }
        </ActionButtonGroup>

      </CenterPanelWrap>

      <PanelWrap>
        <Box />
        <PositionSelector type="POOL" />
      </PanelWrap>

    </MainViewWrap>
  );
}

export default Pool;

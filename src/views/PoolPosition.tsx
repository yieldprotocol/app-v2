import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Tab, Tabs, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';

import ActionButtonGroup from '../components/ActionButtonGroup';
import InputWrap from '../components/wraps/InputWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { cleanValue } from '../utils/displayUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { useLendActions } from '../hooks/lendActions';
import { UserContext } from '../contexts/UserContext';
import { ActionType, ISeries, IUserContext } from '../types';
import MaxButton from '../components/MaxButton';
import InfoBite from '../components/InfoBite';
import { usePoolActions } from '../hooks/poolActions';

const PoolPosition = () => {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */

  // tab state + control
  const [tabIndex, setTabIndex] = React.useState(0);
  const onActive = (nextIndex: number) => setTabIndex(nextIndex);

  const [removeInput, setRemoveInput] = useState<string>();
  const [rollInput, setRollInput] = useState<string>();
  const [rollToSeries, setRollToSeries] = useState<ISeries|null>(null);
  const [maxRemove, setMaxRemove] = useState<string|undefined>();

  const [removeError, setRemoveError] = useState<string|null>(null);
  const [rollError, setRollError] = useState<string|null>(null);

  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  /* HOOK FNS */
  const { removeLiquidity, rollLiquidity } = usePoolActions();

  /* LOCAL FNS */
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
    /* Checks the max available to roll or move */
    const max = selectedSeries?.poolTokens;
    if (max) setMaxRemove(ethers.utils.formatEther(max).toString());
  }, [rollInput, selectedSeries, setMaxRemove]);

  /* WATCH FOR WARNINGS AND ERRORS */
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
    (!activeAccount || !removeInput || removeError) ? setRemoveDisabled(true) : setRemoveDisabled(false);
  }, [activeAccount, removeError, removeInput]);

  useEffect(() => {
    (!activeAccount || !rollInput || rollError) ? setRollDisabled(true) : setRollDisabled(false);
  }, [rollInput, activeAccount, rollError]);

  return (
    <>
      <Box>
        <Box height="150px" gap="medium">
          <Text size="large">  {selectedSeries?.id} </Text>
          <Box justify="between" gap="small" fill="horizontal" direction="row-responsive">
            {
                selectedSeries?.baseId === selectedBase?.id &&
                <>
                  <InfoBite label="Token balance" value={selectedSeries?.poolTokens_!} />
                  <InfoBite label="Pool total token supply" value={selectedSeries?.totalSupply?.toString() || ''} />
                  <InfoBite label="Pool percentage" value={selectedSeries?.poolTokens?.div(selectedSeries?.totalSupply).mul('100').toString() || ''} />
                </>
              }
          </Box>
        </Box>

        <Tabs justify="start" activeIndex={tabIndex} onActive={onActive}>
          <Tab title="Remove Liquidity">
            <Box direction="row" pad={{ vertical: 'small' }} align="start" fill="horizontal">
              <Box fill>
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
          </Tab>

          <Tab title="Roll Liquidity">
            <Box direction="row" pad={{ vertical: 'small' }} align="start" fill="horizontal">
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

            <Box gap="small" fill="horizontal" direction="row" align="center">
              <SeriesSelector
                selectSeriesLocally={(series:ISeries) => setRollToSeries(series)}
                action={ActionType.POOL}
              />
            </Box>

          </Tab>
        </Tabs>
      </Box>

      <ActionButtonGroup>
        {
          tabIndex === 0 &&
          <Button
            primary
            label={<Text size={mobile ? 'small' : undefined}>Remove Liquidity</Text>}
            onClick={() => handleRemove()}
            disabled={removeDisabled}
          />
          }
        {
          tabIndex === 1 &&
          <Button
            primary
            label={<Text size={mobile ? 'small' : undefined}>Roll Liquidity</Text>}
            onClick={() => handleRoll()}
            disabled={rollDisabled}
          />
}
      </ActionButtonGroup>
    </>
  );
};

export default PoolPosition;

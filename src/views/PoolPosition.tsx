import React, { useContext, useState, useEffect } from 'react';
import { Box, Button, ResponsiveContext, Select, Text, TextInput } from 'grommet';
import { ethers } from 'ethers';
import { FiClock, FiPercent } from 'react-icons/fi';
import { BiCoinStack } from 'react-icons/bi';

import ActionButtonGroup from '../components/wraps/ActionButtonWrap';
import InputWrap from '../components/wraps/InputWrap';
import SeriesSelector from '../components/selectors/SeriesSelector';
import { abbreviateHash, cleanValue, getTxCode, nFormatter } from '../utils/appUtils';
import SectionWrap from '../components/wraps/SectionWrap';

import { UserContext } from '../contexts/UserContext';
import { ActionCodes, ActionType, ISeries, IUserContext } from '../types';
import MaxButton from '../components/buttons/MaxButton';
import InfoBite from '../components/InfoBite';
import { usePoolActions } from '../hooks/poolHooks';
import ActiveTransaction from '../components/ActiveTransaction';
import TabWrap from '../components/wraps/TabWrap';
import BackButton from '../components/buttons/BackButton';
import PositionAvatar from '../components/PositionAvatar';
import CenterPanelWrap from '../components/wraps/CenterPanelWrap';
import NextButton from '../components/buttons/NextButton';

import YieldMark from '../components/logos/YieldMark';


const PoolPosition = () => {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  /* STATE FROM CONTEXT */

  const { userState } = useContext(UserContext) as IUserContext;
  const { activeAccount, selectedSeriesId, selectedBaseId, seriesMap, assetMap } = userState;

  const selectedSeries = seriesMap.get(selectedSeriesId!);
  const selectedBase = assetMap.get(selectedBaseId!);

  /* LOCAL STATE */

  const [removeInput, setRemoveInput] = useState<string>();
  const [rollInput, setRollInput] = useState<string>();
  const [rollToSeries, setRollToSeries] = useState<ISeries | null>(null);
  const [maxRemove, setMaxRemove] = useState<string | undefined>();

  const [removeError, setRemoveError] = useState<string | null>(null);
  const [rollError, setRollError] = useState<string | null>(null);

  const [removeDisabled, setRemoveDisabled] = useState<boolean>(true);
  const [rollDisabled, setRollDisabled] = useState<boolean>(true);

  // multi-tracking stepper
  const [actionActive, setActionActive] = useState<any>({ text: 'Close Position', index: 0 });
  const [stepPosition, setStepPosition] = useState<number[]>([0, 0, 0]);

  /* HOOK FNS */
  const { removeLiquidity, rollLiquidity } = usePoolActions();

  /* LOCAL FNS */
  const handleStepper = (back: boolean = false) => {
    const step = back ? -1 : 1;
    const newStepArray = stepPosition.map((x: any, i: number) => (i === actionActive.index ? x + step : x));
    setStepPosition(newStepArray);
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
    /* Checks the max available to roll or move */
    const max = selectedSeries?.poolTokens;
    if (max) setMaxRemove(ethers.utils.formatEther(max).toString());
  }, [rollInput, selectedSeries, setMaxRemove]);

  /* WATCH FOR WARNINGS AND ERRORS */
  useEffect(() => {
    /* CHECK for any removeInput errors */
    if (activeAccount && (removeInput || removeInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxRemove && parseFloat(removeInput) > parseFloat(maxRemove))
        setRemoveError('Amount exceeds liquidity token balance');
      /* 2. Check if there is a selected series */ else if (removeInput && !selectedSeries)
        setRemoveError('No base series selected');
      /* 2. Check if input is above zero */ else if (parseFloat(removeInput) < 0)
        setRemoveError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */ else {
        setRemoveError(null);
      }
    }
  }, [activeAccount, removeInput, maxRemove, selectedSeries]);

  useEffect(() => {
    /* CHECK for any rollInput errors */
    if (activeAccount && (rollInput || rollInput === '')) {
      /* 1. Check if input exceeds fyToken balance */
      if (maxRemove && parseFloat(rollInput) > parseFloat(maxRemove))
        setRollError('Amount exceeds liquidity token balance');
      /* 2. Check if there is a selected series */ else if (rollInput && !selectedSeries)
        setRollError('No base series selected');
      /* 2. Check if input is above zero */ else if (parseFloat(rollInput) < 0)
        setRollError('Amount should be expressed as a positive value');
      /* if all checks pass, set null error message */ else {
        setRollError(null);
      }
    }
  }, [activeAccount, rollInput, maxRemove, selectedSeries]);

  /* ACTION DISABLING LOGIC  - if ANY conditions are met: block action */

  useEffect(() => {
    !activeAccount || !removeInput || removeError ? setRemoveDisabled(true) : setRemoveDisabled(false);
  }, [activeAccount, removeError, removeInput]);

  useEffect(() => {
    !activeAccount || !rollInput || rollError ? setRollDisabled(true) : setRollDisabled(false);
  }, [rollInput, activeAccount, rollError]);

  return (
    <CenterPanelWrap>
      <Box fill pad="large" gap="medium">
        <Box height={{ min: '50%' }} gap="medium">
          <Box direction="row-responsive" justify="between" fill="horizontal" align="center">
            <Box direction="row" align="center" gap="medium">
              <PositionAvatar position={selectedSeries!} />
              <Box>
                <Text size={mobile ? 'large' : 'xlarge'}> {selectedSeries?.displayName} </Text>
                <Text size="small"> {abbreviateHash(selectedSeries?.fyTokenAddress!, 5)}</Text>
              </Box>
            </Box>
          </Box>

         
          <SectionWrap>
            <Box gap="xsmall" >
              {/* <InfoBite label="Vault debt + interest:" value={`${selectedVault?.art_} ${vaultBase?.symbol}`} icon={<FiTrendingUp />} /> */}

              <InfoBite 
                label="Liquidity Balance"
                value={cleanValue(selectedSeries?.poolTokens_, 6)}
                icon={<YieldMark height='1em' start={selectedSeries?.startColor} />}
              />
              {/* <InfoBite 
                label="Total Pool Liquidity"
                value={cleanValue(selectedSeries?.totalSupply_, 2)}
                icon={<BiCoinStack />}
              /> */}
              <InfoBite 
                label="Pool percentage"
                value={`${cleanValue(selectedSeries?.poolPercent, 4)} %  of ${nFormatter( parseFloat(selectedSeries?.totalSupply_!) , 2 )}`}
                icon={<FiPercent />}
              />
              <InfoBite
                label="Maturity date:"
                value={`${selectedSeries?.fullDate}`}
                icon={<FiClock />}
              />
            </Box>
          </SectionWrap>

        </Box>

        <SectionWrap title="Vault Actions">
          <Box elevation="xsmall" round="xsmall">
            <Select
              plain
              options={[
                { text: 'Remove Liquidity', index: 0 },
                { text: 'Roll Liquidiy', index: 1 },
              ]}
              labelKey="text"
              valueKey="index"
              value={actionActive}
              onChange={({ option }) => setActionActive(option)}
            />
          </Box>

          {actionActive.index === 0 && (
            <>
              {stepPosition[0] === 0 && (
                <Box pad={{ vertical: 'medium' }}>
                  <InputWrap action={() => console.log('maxAction')} isError={removeError}>
                    <TextInput
                      plain
                      type="number"
                      placeholder="Tokens to remove"
                      value={removeInput || ''}
                      onChange={(event: any) => setRemoveInput(cleanValue(event.target.value))}
                    />
                    <MaxButton action={() => setRemoveInput(maxRemove)} disabled={maxRemove === '0.0'} />
                  </InputWrap>
                </Box>
              )}

              {stepPosition[0] !== 0 && (
                <Box gap="large">
                  <ActiveTransaction txCode={getTxCode(ActionCodes.REMOVE_LIQUIDITY, selectedSeriesId)}>
                    <SectionWrap title="Review your transaction">
                      <Text>
                        Remove {removeInput} Liquidtity from the {selectedSeries?.displayName} series.{' '}
                      </Text>
                    </SectionWrap>
                  </ActiveTransaction>
                </Box>
              )}
            </>
          )}

          {actionActive.index === 1 && (
            <>
              {stepPosition[actionActive.index] === 0 && (
                <Box pad={{ vertical: 'medium' }}>
                  <InputWrap action={() => console.log('maxAction')} isError={rollError}>
                    <TextInput
                      plain
                      type="number"
                      placeholder="Tokens to roll"
                      value={rollInput || ''}
                      onChange={(event: any) => setRollInput(cleanValue(event.target.value))}
                    />
                    <MaxButton action={() => setRollInput(maxRemove)} disabled={maxRemove === '0.0'} />
                  </InputWrap>
                  <Box>
                    <SeriesSelector
                      selectSeriesLocally={(series: ISeries) => setRollToSeries(series)}
                      actionType={ActionType.POOL}
                      cardLayout={false}
                    />
                  </Box>
                </Box>
              )}

              {stepPosition[actionActive.index] !== 0 && (
                <Box gap="large">
                  <ActiveTransaction txCode={getTxCode(ActionCodes.ROLL_LIQUIDITY, selectedSeriesId)}>
                    <SectionWrap title="Review your transaction">
                      <Text>
                        Roll {rollInput} liquidity tokens from {selectedSeries?.displayName} to the{' '}
                        {rollToSeries?.displayName} series.
                      </Text>
                    </SectionWrap>
                  </ActiveTransaction>
                </Box>
              )}
            </>
          )}
        </SectionWrap>
      </Box>

      <ActionButtonGroup>
        {stepPosition[actionActive.index] === 0 && (
          <NextButton
            label={<Text size={mobile ? 'small' : undefined}> Next Step</Text>}
            onClick={() => handleStepper()}
            key="next"
          />
        )}

        {actionActive.index === 0 && stepPosition[actionActive.index] !== 0 && (
          <Box gap="small" direction="row-responsive" pad={{ horizontal: 'large' }}>
            <BackButton action={() => handleStepper(true)} />
            <Button
              primary
              label={<Text size={mobile ? 'small' : undefined}> {`Remove ${removeInput || ''} tokens`} </Text>}
              onClick={() => handleRemove()}
              disabled={removeDisabled}
            />
          </Box>
        )}

        {actionActive.index === 1 && stepPosition[actionActive.index] !== 0 && (
          <Box gap="small" direction="row" pad={{ horizontal: 'large' }}>
            <BackButton action={() => handleStepper(true)} />
            <Button
              primary
              label={<Text size={mobile ? 'small' : undefined}> {`Roll ${rollInput || ''} tokens`} </Text>}
              onClick={() => handleRoll()}
              disabled={rollDisabled}
            />
          </Box>
        )}
      </ActionButtonGroup>
    </CenterPanelWrap>
  );
};

export default PoolPosition;

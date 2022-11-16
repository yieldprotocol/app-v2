import { Box, Layer } from 'grommet';
import { FiX } from 'react-icons/fi';
import SeriesSelector from './SeriesSelector';
import { ActionType, ISeries } from '../../types';
import StrategySelector from './StrategySelector';

const SeriesOrStrategySelectorModal = ({
  seriesMap,
  inputValue,
  actionType,
  open,
  setOpen,
}: {
  seriesMap: Map<string, ISeries>;
  inputValue: string;
  actionType: ActionType;
  open: boolean;
  setOpen?: any;
}) => (
  <>
    {!open && (
      <Box onClick={() => setOpen(true)}>
        <SeriesSelector
          seriesMap={seriesMap}
          inputValue={inputValue}
          actionType={actionType}
          setOpen={setOpen}
          cardLayout={false}
        />
      </Box>
    )}
    {open && (
      <Layer>
        <Box gap="small" pad="medium" fill background="background">
          <Box alignSelf="end" onClick={() => setOpen(false)} pad="xsmall">
            <FiX size="1.5rem" />
          </Box>
          <Box justify="center" fill>
            {actionType === ActionType.POOL ? (
              <StrategySelector inputValue={inputValue} />
            ) : (
              <SeriesSelector seriesMap={seriesMap} inputValue={inputValue} actionType={actionType} setOpen={setOpen} />
            )}
          </Box>
        </Box>
      </Layer>
    )}
  </>
);

SeriesOrStrategySelectorModal.defaultProps = {
  setOpen: () => null,
};

export default SeriesOrStrategySelectorModal;

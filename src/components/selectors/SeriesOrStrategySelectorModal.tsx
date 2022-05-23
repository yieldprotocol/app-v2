import { Box, Layer } from 'grommet';
import { FiX } from 'react-icons/fi';
import SeriesSelector from './SeriesSelector';
import { ActionType, ISeries, IStrategy } from '../../types';
import StrategySelector from './StrategySelector';

const SeriesOrStrategySelectorModal = ({
  seriesMapProps,
  strategyMapProps,
  inputValue,
  actionType,
  open,
  setOpen,
}: {
  seriesMapProps: Map<string, ISeries>;
  strategyMapProps: Map<string, IStrategy>;
  inputValue: string;
  actionType: ActionType;
  open: boolean;
  setOpen?: any;
}) => (
  <>
    {!open && (
      <Box onClick={() => setOpen(true)}>
        <SeriesSelector
          seriesMapProps={seriesMapProps}
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
              <StrategySelector
                strategyMap={strategyMapProps}
                seriesMap={seriesMapProps}
                inputValue={inputValue}
                setOpen={setOpen}
              />
            ) : (
              <SeriesSelector
                seriesMapProps={seriesMapProps}
                inputValue={inputValue}
                actionType={actionType}
                setOpen={setOpen}
              />
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

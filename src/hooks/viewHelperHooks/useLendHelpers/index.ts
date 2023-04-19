// HOOKS
import { useLendHelpersFR } from './useLendHelpersFR';
import { useLendHelpersVR } from './useLendHelpersVR';

// TYPES
import { ISeries } from '../../../types';

export const useLendHelpers = (
  series: ISeries | null,
  input: string | undefined,
  rollToSeries: ISeries | undefined = undefined
) => {
  const lendHelpersVR = useLendHelpersVR(input);
  const lendHelpersFR = useLendHelpersFR(series, input, rollToSeries);

  return series ? lendHelpersFR : lendHelpersVR;
};

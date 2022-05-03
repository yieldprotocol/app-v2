import { Box } from 'grommet';
import { BorderType } from 'grommet/utils';
import AltText from '../texts/AltText';

interface ISectionWrap {
  title?: string | null;
  border?: BorderType | undefined;
  disabled?: boolean;
  rightAction?: any;
  children: any;
  icon?: any;
}

function SectionWrap({ icon, title, border, disabled, children, rightAction }: ISectionWrap) {
  return (
    <Box border={border} gap="0.75em">
      {title && (
        <Box pad={{ horizontal: 'small' }} direction="row" fill="horizontal" justify="between" align="center">
          <AltText size="xsmall" color={disabled ? 'text-xweak' : 'text-weak'} weight="lighter">
            {title}
          </AltText>
          {rightAction}
        </Box>
      )}
      {children}
    </Box>
  );
}

SectionWrap.defaultProps = {
  title: null,
  border: undefined,
  disabled: false,
  rightAction: undefined,
  icon: undefined,
};
export default SectionWrap;

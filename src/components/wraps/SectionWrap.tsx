import React, { useContext } from 'react';
import { Box, ResponsiveContext } from 'grommet';
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
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box border={border} justify="center" >
      {title && (
        <Box pad={{ top: 'xsmall', horizontal:'small' }} direction="row" fill="horizontal" justify="between" align="center">
          <Box direction="row" gap="xsmall" align="center">
            <AltText size={mobile ? 'xsmall' : 'xsmall'} color={disabled ? 'text-xweak' : 'text-weak'}>
              {title}
            </AltText>
          </Box>
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

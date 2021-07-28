import React, { useContext, useState } from 'react';
import { Box, Collapsible, Heading, ResponsiveContext, Text } from 'grommet';
import { BorderType } from 'grommet/utils';
import AltText from '../texts/AltText';

interface ISectionWrap {
  title?: string | null;
  border?: BorderType | undefined;
  disabled?: boolean;
  rightAction?: any;
  children: any;
}

function SectionWrap({ title, border, disabled, children, rightAction }: ISectionWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';

  return (
    <Box border={border} justify="center">
      {title && (
        <Box pad={{ vertical: 'small' }} direction="row" fill="horizontal" justify="between" align="center">
          <AltText size={mobile ? 'xsmall' : 'xsmall'} color={disabled ? 'text-xweak' : 'text-weak'}>
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
};
export default SectionWrap;

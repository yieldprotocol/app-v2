import React, { useContext } from 'react';
import { Box, Heading, ResponsiveContext, Text } from 'grommet';
import { BorderType } from 'grommet/utils';
import AltText from '../texts/AltText';

interface ISectionWrap {
  title?: string|null;
  subtitle?: string|null;
  border?: BorderType|undefined;
  disabled?: boolean;
  children: any;
}

function SectionWrap({ title, subtitle, border, disabled, children }: ISectionWrap) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  return (

    <Box gap="small" fill border={border}>
      { title && <AltText size={mobile ? 'small' : 'small'} color={disabled ? 'text-xweak' : 'text-weak'}> {title} </AltText>}
      { subtitle && <Text color={disabled ? 'text-xweak' : 'text-weak'} size={mobile ? 'xsmall' : 'small'}> {subtitle} </Text>}
      {children}
    </Box>
  );
}

SectionWrap.defaultProps = { title: null, subtitle: null, border: undefined, disabled: false };
export default SectionWrap;

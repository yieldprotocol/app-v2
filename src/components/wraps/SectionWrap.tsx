import React, { useContext } from 'react';
import { Box, Heading, ResponsiveContext, Text } from 'grommet';
import { BorderType } from 'grommet/utils';
import AltText from '../AltText';

interface ISectionWrap {
  title?: string|null;
  subtitle?: string|null;
  border?: BorderType|undefined;
  children: any;
}

function SectionWrap({ title, subtitle, border, children }: ISectionWrap) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  return (
    <Box gap="small" fill border={border}>
      { title && <AltText size={mobile ? 'small' : 'small'} color="text-weak"> {title} </AltText>}
      { subtitle && <Text color="text-weak" size={mobile ? 'xsmall' : 'small'}> {subtitle} </Text>}
      {children}
    </Box>
  );
}

SectionWrap.defaultProps = { title: null, subtitle: null, border: undefined };
export default SectionWrap;

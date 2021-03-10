import React, { useContext } from 'react';
import { Box, ResponsiveContext, Text } from 'grommet';

interface ISectionWrap {
  title?: string|null;
  subtitle?: string|null;
  children: any;
}
function SectionWrap({ title, subtitle, children }: ISectionWrap) {
  const mobile:boolean = useContext<any>(ResponsiveContext) === 'small';
  return (
    <Box align={mobile ? undefined : 'center'} gap="small" fill="horizontal">
      { title && <Text size={mobile ? 'small' : undefined}> {title} </Text>}
      { subtitle && <Text color="text-weak" size={mobile ? 'xsmall' : 'small'}> {subtitle} </Text>}
      {children}
    </Box>
  );
}

SectionWrap.defaultProps = { title: null, subtitle: null };
export default SectionWrap;

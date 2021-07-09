import React, { useContext, useState } from 'react';
import { Box, Collapsible, Heading, ResponsiveContext, Text } from 'grommet';
import { BorderType } from 'grommet/utils';
import AltText from '../texts/AltText';

interface ISectionWrap {
  title?: string | null;
  subtitle?: string | null;
  border?: BorderType | undefined;
  disabled?: boolean;
  collapsible?: boolean;
  children: any;
}

function SectionWrap({ title, subtitle, border, disabled, collapsible, children }: ISectionWrap) {
  const mobile: boolean = useContext<any>(ResponsiveContext) === 'small';
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Box border={border}>
      {title && (
        <Box
          pad="xsmall"
          direction="row"
          fill="horizontal"
          justify="between"
          onClick={() => collapsible && setOpen(!open)}
        >
          <AltText size={mobile ? 'small' : 'small'} color={disabled ? 'text-xweak' : 'text-weak'}>
            {' '}
            {title}{' '}
          </AltText>
          {collapsible && <Box> {open ? 'close' : 'open'} </Box>}
        </Box>
      )}
      {collapsible ? <Collapsible open={open}> {children} </Collapsible> : children}
    </Box>
  );
}

SectionWrap.defaultProps = { title: null, subtitle: null, border: undefined, disabled: false, collapsible: false };
export default SectionWrap;

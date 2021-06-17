import React from 'react';
import { Box, Text, Tab } from 'grommet';
import styled from 'styled-components';

const TabWrap = ({ title, disabled, children }:{ title: string, children: any, disabled?: boolean, }) => (
  <Tab title={<Text size="xsmall" style={{ textTransform: 'uppercase' }}>{title}</Text>}>
    {children}
  </Tab>
);

TabWrap.defaultProps = { disabled: false };
export default TabWrap;

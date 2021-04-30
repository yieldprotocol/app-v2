import React, { useContext, useState } from 'react';
import { Box, Button, Header, Layer, ResponsiveContext, Text } from 'grommet';
import styled, { CSSProperties, ThemeContext } from 'styled-components';
import { NavLink, useHistory } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { IVaultRoot } from '../types';
import { UserContext } from '../contexts/UserContext';
import YieldNavigation from '../components/YieldNavigation';
import YieldHeader from '../components/YieldHeader';

import YieldMenu from '../components/YieldMenu';
import YieldMobileMenu from '../components/YieldMobileMenu';

interface ILayerProps {
  toggleMenu: ()=>void;
  callback?: ()=>void;
}
enum View {
  account = 'ACCOUNT',
  vaults = 'VAULTS',
}

const MenuLayer = ({ toggleMenu, callback }: ILayerProps) => {
  const mobile:boolean = (useContext<any>(ResponsiveContext) === 'small');
  const [view, setView] = useState<View>(View.vaults);

  const { userState: { vaultMap }, userActions: { setActiveVault } } = useContext(UserContext);

  const routerHistory = useHistory();

  const theme = useContext<any>(ThemeContext);
  const textColor = theme.global.colors.brand;
  const textBack = theme.global.colors['light-1'];
  const activeStyle = {
    transform: 'scale(1.1)',
    // fontWeight: 'bold',
    color: `${textColor}`,
    background: `${textBack}`,
  } as CSSProperties;

  const handleSelect = (vaultId:string) => {
    setActiveVault(vaultMap.get(vaultId));
    routerHistory.push(`/vault/${vaultId}`);
    toggleMenu();
  };

  return (
    <Layer position="right" full="vertical" responsive modal>
      <Box flex fill style={mobile ? { minWidth: undefined, maxWidth: undefined } : { minWidth: '600px', maxWidth: '600px' }}>
        { mobile && <YieldMobileMenu toggleMenu={() => toggleMenu()} /> }
        { !mobile && <YieldMenu toggleMenu={() => toggleMenu()} /> }
      </Box>
    </Layer>
  );
};

MenuLayer.defaultProps = { callback: () => null };

export default MenuLayer;

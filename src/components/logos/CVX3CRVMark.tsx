import { Box } from 'grommet';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import CRVMark from './CRVMark';
import CVXMark from './CVXMark';
import Logo from './Logo';

const Outer = styled(Box)`
  position: relative;
  max-width: fit-content;
`;

const Inner = styled(Box)`
  position: absolute;
  z-index: 10;
  top: 10px;
  left: 10px;
`;

const TinyNum = styled(Box)`
  position: absolute;
  z-index: 11;
  top: -20px;
  left: 10px;
  font-size: 12px;
  color: black;
`;

const CVX3CRVMark = () => {
  const { pathname } = useRouter();
  const isDash = pathname.includes('dashboard');
  const bottomStackSize = isDash ? '16px' : '24px';
  const topStackSize = isDash ? '12px' : '14px';

  return (
    <Outer>
      <Logo image={<CVXMark />} height={bottomStackSize} width={bottomStackSize} />
      <Inner>
        <Outer>
          <Logo image={<CRVMark />} height={topStackSize} width={topStackSize} />
          <TinyNum>3</TinyNum>
        </Outer>
      </Inner>
    </Outer>
  );
};

export default CVX3CRVMark;

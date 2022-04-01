import { Box, BoxTypes } from 'grommet';

interface IPanelWrap extends BoxTypes {
  basis?: string;
  right?: boolean;
  children: any;
}

function PanelWrap({ background, basis, right, children }: IPanelWrap) {
  return (
    <Box
      basis={basis || '33%'}
      fill
      align={right ? 'end' : 'start'}
      pad="large"
      justify="between"
      background={background}
      width="400px"
    >
      {children}
    </Box>
  );
}

PanelWrap.defaultProps = { basis: undefined, right: false };
export default PanelWrap;

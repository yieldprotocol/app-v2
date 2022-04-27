import { Box } from 'grommet';

interface ILogoProps {
  image: any;
  height?: string;
  width?: string;
}

const Logo = ({ image, height, width }: ILogoProps) => (
  <Box height={height} width={width} align="center">
    {image}
  </Box>
);

Logo.defaultProps = { height: '24px', width: '24px' };

export default Logo;

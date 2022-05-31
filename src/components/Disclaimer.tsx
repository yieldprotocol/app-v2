import { Anchor, Box, CheckBox, Text } from 'grommet';

const Disclaimer = ({ checked, onChange }: { checked: boolean; onChange: any }) => (
  <Box pad="medium" justify="between" direction="row" gap="small">
    <CheckBox checked={checked} onChange={onChange} />
    <Text size="xsmall" weight="lighter">
      By connecting my wallet, I agree to the{' '}
      <Anchor href="https://yieldprotocol.com/terms/" target="_blank">
        Terms of Service
      </Anchor>{' '}
      and the{' '}
      <Anchor href="https://yieldprotocol.com/privacy/" target="_blank">
        Privacy Policy
      </Anchor>
      .
    </Text>
  </Box>
);

export default Disclaimer;

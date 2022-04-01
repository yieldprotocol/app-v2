import { useState, useEffect } from 'react';
import { Box } from 'grommet';
import { FiCheckCircle as Check, FiCopy as Copy } from 'react-icons/fi';
import { copyToClipboard } from '../../utils/appUtils';

const CopyWrap = ({ children, hash }: any) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copy = (e: any) => {
    e.stopPropagation();
    setCopied(true);
    copyToClipboard(hash);
  };

  useEffect(() => {
    copied && (async () => setTimeout(() => setCopied(false), 5000))();
  }, [copied]);

  return (
    <Box direction="row" gap="small" align="center" onClick={(e: any) => copy(e)}>
      {children}
      {copied ? <Check size="1rem" /> : <Copy size="1rem" />}
    </Box>
  );
};

export default CopyWrap;

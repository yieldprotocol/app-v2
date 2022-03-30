import { Box, Button, Layer, Text } from 'grommet';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertCircle } from 'react-icons/fi';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  // eslint-disable-next-line react/state-in-constructor
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Layer>
          <Box pad="medium" round="small" gap="small" align="center" width="600px">
            <FiAlertCircle size="2em" /> <Text size="large">Oops. There was an unrecognised app error.</Text>
            <Button
              label="Reload App"
              onClick={() => {
                window.localStorage.clear();
                window.location.reload();
              }}
            />
          </Box>
        </Layer>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

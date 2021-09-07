import React from 'react';
import { Box, Text } from 'grommet';

interface IErrorBoundaryState {
  hasError: boolean;
}

interface IErrorBoundaryProps {
  children: any;
}

class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error: any, info: any) {
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <Box
            background="#FCA5A5"
            style={{ position: 'fixed', zIndex: 1000, top: '5%', left: '40%' }}
            pad="small"
            round="xsmall"
          >
            <Text>Slow/limited network error. Please refresh.</Text>
          </Box>
          {this.props.children}
        </>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

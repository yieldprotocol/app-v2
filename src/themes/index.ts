import { LayerProps } from 'grommet';
import { css } from 'styled-components';

export const yieldTheme = {
  global: {
    focus: 'none',
    font: {
      family: 'Rubik',
      weight: '900',
    },

    colors: {
      brand: '#3f53d9',
      focus: '#3f53d999',
      selected: '#3f53d9',
      'accent-1': '#FFCA58',
      'accent-2': '#81FCED',
      text: {
        dark: '#EEEEEE',
        light: '#555555',
      },
      'text-weak': {
        dark: '#DDDDDD',
        light: '#999999',
      },
      'text-xweak': {
        dark: '#999999',
        light: '#DDDDDD',
      },
      placeholder: 'text-xweak',
      darkBackground: {
        text: '#AAAAAA',
      },
      background: {
        dark: '#DDDDDD',
        light: '#FFFFFF',
      },
    },
    input: { weight: 900 },

  },

  grommet: {
    // @ts-ignore
    extend: () => css`
        a { color: grey}
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
        overflow:auto;
        -ms-overflow-style: none;
        scrollbar-width: none;
        ::-webkit-scrollbar {
          display: none;
        }
      `,
  },

  textInput: {
    extend: ({ theme }: any) => (
      theme.dark
        ? `color: ${theme.global.colors.text.dark}`
        : `color: ${theme.global.colors.text.light}`
    ),
  },

  button: {
    border: {
      radius: '8px',
    },

    color: 'brand',

    primary: {
      extend: ({ theme }: any) => css`
      color: ${theme.global.colors.text.dark};
    `,
    },

    maxWidth: '300px',
    size: {
      large: {
        border: { radius: '8px' },
      },

    },
  },

  input: {
    border: {
      radius: '8px',
    },
  },
  table: {
    size: 'small',
  },
  list: {
    item: {
      pad: { horizontal: 'xsmall', vertical: undefined },
      background: 'background',
      border: false,
    },
  },

  layer: {
    container: {
      zIndex: '20',
    },
    zIndex: '15',
    overlay: {
      background: '#00000096', // 60%
    },
    border: {
      radius: 'small',
      // intelligentRounding: true,
    },

    // backdrop-filter: ${(props: LayerProps) => (props.plain === true ? 'blur(3px)' : 'none')};
    // -webkit-backdrop-filter: ${(props: LayerProps) => (props.plain === true ? 'blur(3px)' : 'none')};

    // @ts-ignore
    extend: () => css`
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    input[type='number'] {
      -moz-appearance: textfield;
    }
    overflow:auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
    ::-webkit-scrollbar {
      display: none;
    }
    `,
  },

  tab: {
    color: 'text-weak',
    active: {
      background: 'background-contrast',
    },
    border: {
      side: 'bottom',
      color: 'none',
      active: {
        color: 'brand',
      },
      disabled: {
        color: 'white',
      },
      hover: {
        color: 'border',
      },
    },
    disabled: {
      color: 'text-xweak',
    },
    hover: {
      background: 'background-contrast',
      color: 'text',
    },
    pad: 'small',
    margin: {
      horizontal: 'none',
    },
  },

};

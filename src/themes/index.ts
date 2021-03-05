import { css } from 'styled-components';

export const yieldTheme = {
  global: {
    font: {
      family: 'Fredoka One',
    },
    colors: {
      brand: '#3f53d9',
      focus: '#3f53d999',
      selected: '#3f53d9',
      'accent-1': '#FFCA58',
      'accent-2': '#81FCED',
      'text-weak': {
        dark: '#DDDDDD',
        light: '#AAAAAA',
      },
      'text-xweak': {
        dark: '#999999',
        light: '#DDDDDD',
      },
      placeholder: 'text-xweak',
      darkBackground: {
        text: '#AAAAAA',
      },
    },
    input: { weight: 100 },

  },
  textInput: {
    extend: ({ theme }: any) => (
      theme.dark
        ? `color: ${theme.global.colors.text.dark}`
        : `color: ${theme.global.colors.text.light}`
    ),
  },
  select: {
    options: {
      container: {
        pad: undefined,
      },
    },
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
    // font: {
    //   color: 'text-xweak',
    // },
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
};

import { LayerProps } from 'grommet';
import { css } from 'styled-components';

export const yieldTheme = {
  global: {
    focus: 'none',
    colors: {
      brand: '#3f53d9',
      focus: '#3f53d999',
      selected: '#3f53d9',

      'accent-1': '#FFCA58',
      'accent-2': '#81FCED',
      'tailwind-blue': '#2563EB',
      'tailwind-lightest-blue': '#EFF6FF',

      'yield-gradient': {
        dark: 'linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)',
        light: 'linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)',
      },

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
    // input: { weight: 700 },
  },

  grommet: {
    // @ts-ignore
    extend: () => css`
      a {
        color: grey;
      }
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type='number'] {
        -moz-appearance: textfield;
      }
      overflow: auto;
      -ms-overflow-style: none;
      scrollbar-width: none;
      ::-webkit-scrollbar {
        display: none;
      }
    `,
  },

  textInput: {
    extend: ({ theme }: any) =>
      theme.dark ? `color: ${theme.global.colors.text.dark}` : `color: ${theme.global.colors.text.light}`,
  },

  button: {
    border: {
      radius: '6px',
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
        border: { radius: '6px' },
      },
    },
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
      background: '#000000BF', // 60% - 96
    },
    border: {
      radius: 'xsmall',
      // intelligentRounding: true,
    },

    // @ts-ignore
    extend: () => css`
      backdrop-filter: ${(props: LayerProps) => (props.modal ? 'blur(3px)' : 'none')};
      -webkit-backdrop-filter: ${(props: LayerProps) => (props.modal ? 'blur(3px)' : 'none')};

      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type='number'] {
        -moz-appearance: textfield;
      }
      overflow: auto;
      -ms-overflow-style: none;
      scrollbar-width: none;
      ::-webkit-scrollbar {
        display: none;
      }
    `,
  },
};

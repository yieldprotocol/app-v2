import { LayerProps } from 'grommet';
import { css } from 'styled-components';

export const yieldTheme = {
  global: {
    focus: 'none',
    elevation: {
      dark: {
        xsmall: 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30',
        small: 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30',
        medium: 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30',
        large: 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30',
        xlarge: '0px 10px 24px rgba(255, 255, 255, 0.20)',
      },
    },
    colors: {
      // brand: '#3f53d9',
      // focus: '#3f53d999',
      // selected: '#3f53d9',
      pink: '#FECACA',
      green: '#10B981',
      orange: '#F59E0B',
      purple: '#8B5CF6',
      red: '#EF4444',
      brand: '#2563EB',
      focus: '#2563EB99',
      selected: '#2563EB',
      hover: {
        dark: 'gray-3',
        light: '#FFFFFF',
      },
      solid: {
        dark: 'gray-4',
        light: '#ffffff',
      },
      light: {
        dark: '#F1F5F9',
        light: '#ffffff',
      },
      gray: {
        dark: 'text-weak',
        light: 'gray',
      },
      'gray-1': '#64748B',
      'gray-2': '#292524',
      'gray-3': '#202A30',
      'gray-4': '#141a1e',

      'accent-1': {
        light: '#FFCA58',
        dark: 'brand',
      },
      'accent-2': '#81FCED',
      'tailwind-blue': '#2563EB',
      'tailwind-blue-50': {
        light: '#EFF6FF',
        dark: 'gray-3',
      },
      'tailwind-blue-100': {
        light: '#DBEAFE',
        dark: 'gray-3',
      },

      gradient: {
        dark: 'linear-gradient(135deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)',
        light: 'linear-gradient(135deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)',
      },

      'gradient-transparent': {
        dark: '-webkit-linear-gradient(135deg, #f7953380, #f3705580, #ef4e7b80, #a166ab80, #5073b880, #1098ad80, #07b39b80, #6fba8280)',
        light:
          '-webkit-linear-gradient(135deg, #f7953340, #f3705540, #ef4e7b40, #a166ab40, #5073b840, #1098ad40, #07b39b40, #6fba8240)',
      },

      text: {
        dark: '#FFFFFF',
        light: '#555555',
      },
      'text-weak': {
        dark: '#C7D2DA',
        light: '#999999',
      },
      'text-xweak': {
        dark: '#999999',
        light: '#DDDDDD',
      },
      placeholder: 'text-xweak',
      lightBackground: {
        dark: '#202A30',
        light: '#FFFFFF',
      },
      background: {
        dark: 'gray-4',
        light: '#FFFFFF',
      },
    },
    // input: { weight: 700 },
  },

  anchor: { color: 'brand' },
  select: { hover: { color: 'solid' } },

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
      color: 'brand',
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
    border: {
      radius: 'xsmall',
      // intelligentRounding: true,
    },

    // backdrop-filter: ${(props: LayerProps) => (true ? 'blur(3px)' : 'none')};
    // -webkit-backdrop-filter: ${(props: LayerProps) => (true ? 'blur(3px)' : 'none')};

    // @ts-ignore
    extend: () => css`
      backdrop-filter: ${(props: LayerProps) => (props.responsive ? 'blur(3px)' : 'none')};
      -webkit-backdrop-filter: ${(props: LayerProps) => (props.responsive ? 'blur(3px)' : 'none')};

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

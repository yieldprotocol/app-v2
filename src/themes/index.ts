import { LayerProps } from 'grommet';
import { css } from 'styled-components';

export const yieldTheme = {
  global: {
    focus: 'none',
    elevation: {
      // dark: {
      //   xsmall: 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30',
      //   small: 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30',
      //   medium: 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30',
      //   large: 'inset 1px 1px 1px #202A30, inset -0.25px -0.25px 0.25px #202A30',
      //   xlarge: '0px 10px 24px rgba(255, 255, 255, 0.20)',
      // },

      dark: {
        xsmall: '1px 1px 1px #202A30,  0.25px 0.25px 0.25px #202A30',
        small: '1px 1px 1px #202A30, 0.25px 0.25px 0.25px #202A30',
        medium: '1px 1px 1px #202A30, 0.25px 0.25px 0.25px #202A30',
        large: '1px 1px 1px #202A30, 0.25px 0.25px 0.25px #202A30',
        xlarge: '0px 10px 24px rgba(255, 255, 255, 0.20)',
      },
    },
    colors: {
      red: '#F87171',
      green: '#10B981',
      yellow: '#F59E0B',

      error: {
        light: '#FCA5A5',
        dark: '#F87171',
      },
      success: {
        light: '#34D399',
        dark: '#10B981',
      },
      warning: {
        light: '#F59E0B',
        dark: '#F59E0B',
      },
      brand: {
        light: '#2563EB',
        dark: '#8aacf4',
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
        dark: '#151515',
        light: '#FFFFFF',
      },
      background: {
        dark: '#222222',
        light: '#FFFFFF',
      },
      hoverBackground: {
        dark: '#181818',
        light: '#FFFFFF',
      },
      selected: {
        dark: '-webkit-linear-gradient(135deg, #f7953380, #f3705580, #ef4e7b80, #a166ab80, #5073b880, #1098ad80, #07b39b80, #6fba8280)',
        light:
          '-webkit-linear-gradient(135deg, #f7953340, #f3705540, #ef4e7b40, #a166ab40, #5073b840, #1098ad40, #07b39b40, #6fba8240)',
      },
    },

    drop: { border: { radius: '6px' }, elevation: 'xlarge' },
    anchor: { color: 'brand' },

    // hover: { background: 'red' }
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
      button:disabled {
        opacity: 0.5;
      }
    `,
  },

  textInput: {
    extend: ({ theme }: any) =>
      theme.dark ? `color: ${theme.global.colors.text.dark}` : `color: ${theme.global.colors.text.light}`,
  },

  tip: { 
    size:'xsmall',
    content: {
      background: "background", 
      pad: { vertical: "xsmall", horizontal: "xsmall" }, 
      round: "xsmall",
    }
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
      background: 'lightBackground',
      border: false,
    },
  },

  select: {
    options: {
      text: { size: 'small' },
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

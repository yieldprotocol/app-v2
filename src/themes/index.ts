import { LayerProps } from 'grommet';
import { css } from 'styled-components';

export const yieldTheme = {
  global: {
    focus: 'none',
    font: {
      family: 'FoundryGridnik',
      weight: '700',
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
    input: { weight: 700 },

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
        @font-face {
          font-family: FoundryGridnik;
          font-weight: bold;
          src: local(FoundryGridnik), url("./fonts/FoundryGridnik.otf") format("opentype");
          font-display: swap;
        }

      `,
  },

  // TODO marco fout issue

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
    margin: {
      horizontal: 'none',
    },
    pad: 'xsmall',
    extend: ({ theme } : { theme:any }) => css`

    text-decoration: none;
    /* padding: 8px; */
  
    -webkit-transition: background 0.3s ease-in-out;
    -moz-transition: background 0.3s ease-in-out;
    transition: background 0.3s ease-in-out;
  
    -webkit-transition: box-shadow 0.3s ease-in-out;
    -moz-transition: box-shadow 0.3s ease-in-out;
    transition: box-shadow 0.3s ease-in-out;
  
    -webkit-transition: transform 0.3s ease-in-out;
    -moz-transition: transform 0.3s ease-in-out;
    transition: transform 0.3s ease-in-out;
    :hover {
      transform: scale(1.1);
    }

      'box-shadow: ${theme.global.elevation.small}'
    `,
  },

  // tab: {
  //   active: {
  //     background: 'dark-1',
  //     color: 'accent-1',
  //   },
  //   // background: 'dark-3',
  //   border: undefined,
  //   color: 'white',
  //   hover: {
  //     background: 'dark-1',
  //   },
  //   margin: undefined,
  //   pad: {
  //     bottom: undefined,
  //     horizontal: 'small',
  //   },
  //   extend: ({ theme } : { theme:any }) => css`
  //     border-radius: ${theme.global.control.border.radius}
  //     box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.5);
  //     /* or 'box-shadow: ${theme.global.elevation.light.small}' */
  //   `,
  // },

  tabs: {
    gap: 'small',
  },
  //   panel: {
  //     gap: 'small',
  //   //   extend: ({ theme }: { theme:any }) => css`
  //   //   padding: ${theme.global.edgeSize.large}
  //   //    /* box-shadow: ${theme.global.elevation.light.medium} */
  //   // `,
  //   },
  // },

};

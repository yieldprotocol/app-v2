import * as React from 'react';


interface ISvgProps extends React.SVGProps<SVGSVGElement> {
  startColor?:string;
  endColor?:string;
}

function YieldLogo(props: ISvgProps) {
  return (
    <svg height={props.height || '2em'} viewBox="0 0 5282 1000" fill={props.fill} {...props}>

      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop stopColor={props.fill || props.startColor} offset="0%"/>
        <stop stopColor={props.fill || props.endColor} offset="100%"/>
      </linearGradient>
      <path fill="url(#gradient)" d="M0,0V1000H1000V0ZM951.6,490,490,951.61H320.51L951.6,320.51Zm0-237.9L252.08,951.61H82.61l869-869ZM500,465.79,82.61,48.39H917.39ZM465.78,500l-84.73,84.73L48.39,252.08V82.61ZM346.83,619,262.1,703.69,48.39,490V320.51ZM227.88,737.9,48.39,917.39v-359ZM558.41,951.61,951.6,558.41v393.2Z" />
      <polygon fill="url(#gradient)" points="1830.7 479.42 1591.59 82.09 1517.63 82.09 1799.69 550.53 1799.69 917.92 1864.12 917.92 1864.12 550.51 2144.93 82.09 2069.8 82.09 1830.7 479.42" />
      <polygon fill="url(#gradient)" points="2393.7 142.87 2577.23 142.87 2577.23 857.13 2393.7 857.13 2393.7 917.92 2825.18 917.92 2825.18 857.13 2640.43 857.13 2640.43 142.87 2825.18 142.87 2825.18 82.09 2393.7 82.09 2393.7 142.87" />
      <polygon fill="url(#gradient)" points="3169.79 917.92 3664.12 917.92 3664.12 853.5 3232.99 853.5 3232.99 531.61 3664.12 531.61 3664.12 468.4 3232.99 468.4 3232.99 145.3 3664.12 145.3 3664.12 82.09 3169.79 82.09 3169.79 917.92" />
      <polygon fill="url(#gradient)" points="4044.16 82.09 3980.96 82.09 3980.96 917.92 4475.29 917.92 4475.29 853.5 4044.16 853.5 4044.16 82.09" />
      <path fill="url(#gradient)" d="M5252.21,210.93l-99.31-99.3c-19.32-19.33-43.7-29.54-70.48-29.54H4713.55V917.92h368.87c26.78,0,51.15-10.22,70.48-29.55l99.31-99.3c19.32-19.33,29.53-43.71,29.53-70.48V281.41C5281.74,254.64,5271.53,230.27,5252.21,210.93Zm-33.67,59.59-1.21,460.18a12.41,12.41,0,0,1-3.16,7L5100.35,851.54a10.57,10.57,0,0,1-7,3.17H4776.75V145.3h317.78c1.07,0,3.82,1.16,7,4.36l113.84,113.83C5216.83,264.94,5218.54,268.74,5218.54,270.52Z" />
    </svg>
  );
}

YieldLogo.defaultProps ={ startColor : 'black', endColor: 'black' }
export default YieldLogo;

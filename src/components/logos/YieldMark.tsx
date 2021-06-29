/* eslint-disable react/style-prop-object */
import * as React from 'react';

interface YieldMarkProps extends React.SVGProps<SVGSVGElement> {
  start?:string;
  end?:string
}

const YieldMark = (props: YieldMarkProps) => (
  <svg height={props.height || '1em'} viewBox="0 0 1000 1000" {...props}>
    <linearGradient id={props.start} x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor={props.start} stopOpacity="1" />
      <stop offset="100%" stopColor={props.end} stopOpacity="1" />
    </linearGradient>
    <path fill={`url(#${props.start})`} d="M0,0V1000H1000V0ZM951.61,490,490,951.61H320.51l631.1-631.1Zm0-237.9L252.08,951.61H82.61l869-869ZM500,465.79,82.61,48.39H917.39ZM465.78,500l-84.73,84.73L48.39,252.08V82.61ZM346.84,619,262.1,703.69,48.39,490V320.51Zm-119,118.95L48.39,917.39v-359ZM558.41,951.61l393.2-393.19V951.61Z" />
  </svg>
);

YieldMark.defaultProps = { start: '#000', end: '#000' };

export default YieldMark;

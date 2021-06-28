import * as React from 'react';

function YieldMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="1em" height={props.height || '1em'} viewBox="0 0 1000 1000" fill={props.fill || '#000'} {...props}>
      <path d="M0,0V1000H1000V0ZM951.61,490,490,951.61H320.51l631.1-631.1Zm0-237.9L252.08,951.61H82.61l869-869ZM500,465.79,82.61,48.39H917.39ZM465.78,500l-84.73,84.73L48.39,252.08V82.61ZM346.84,619,262.1,703.69,48.39,490V320.51Zm-119,118.95L48.39,917.39v-359ZM558.41,951.61l393.2-393.19V951.61Z" />
    </svg>
  );
}

export default YieldMark;

import * as React from 'react';

interface ISvgProps extends React.SVGProps<SVGSVGElement> {
  colors?: string[];
}

function YieldMark(props: ISvgProps) {
  const getProportion = (i: number) => (i * 100) / (props.colors?.length! - 1) || 0;

  return (
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg" height={props.height || '1.75em'} viewBox="0 0 255 252">
      <g>
        <linearGradient id={props.colors![0]} x1="0%" y1="0%" x2="0%" y2="100%">
          {props.colors &&
            props.colors.map((c: string, i: number) => (
              <stop key={c.toString()} offset={`${getProportion(i)}%`} stopColor={c} stopOpacity="1" />
            ))}
        </linearGradient>
        <path
          fill={`url(#${props.colors![0]})`}
          d="M130.811 102.855C146.381 87.6554 164.458 75.8824 184.547 67.8345C203.561 60.2249 223.57 56.3005 244.077 56.1412V26.5592C202.028 27.117 160.636 41.2805 127.048 66.7189L124.46 68.6711L121.454 67.4361C118.308 66.1412 107.019 61.0217 93.7197 49.7268C78.3097 36.6191 65.8264 20.1847 56.5286 0.802032L37.1168 21.599C54.7567 60.9619 89.479 91.0817 130.811 102.855Z"
        />
        <path
          fill={`url(#${props.colors![0]}`}
          d="M126.033 120.544C81.4355 107.974 44.5231 77.4561 23.6579 36.0215L0.204376 61.1811C21.6072 98.771 55.2146 128.652 95.1532 145.564L95.193 145.584L98.3188 146.919L98.5179 148.433L98.7767 150.604C99.6527 158.034 102.321 195.385 75.5422 236.601H106.522C117.412 219.907 124.918 200.704 128.303 180.903C131.727 160.843 130.931 140.046 126.033 120.544Z"
        />
        <path
          fill={`url(#${props.colors![0]}`}
          d="M143.792 115.823C149.307 137.496 150.362 159.628 146.958 181.62C143.932 201.023 137.561 219.469 127.984 236.601H164.857C171.506 221.103 176.165 204.768 178.714 187.975C181.461 169.927 181.72 151.66 179.47 133.731L179.072 130.484L181.66 128.512C185.901 125.285 208.061 109.628 244.117 105.903V74.5676C206.687 75.0457 170.511 89.8865 143.792 115.823Z"
        />
      </g>
    </svg>
  );
}

YieldMark.defaultProps = { colors: ['#000000', '#000000'] };

export default YieldMark;

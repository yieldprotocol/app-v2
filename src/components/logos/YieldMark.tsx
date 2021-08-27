import * as React from 'react';

interface ISvgProps extends React.SVGProps<SVGSVGElement> {
  startColor?: string;
  endColor?: string;
}

function YieldMark(props: ISvgProps) {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      height={props.height || '1.75rem'}
      viewBox="955.8 577.8 1207.6 1183.6"
    >
      <g>
        <linearGradient id={props.startColor} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={props.startColor} stopOpacity="1" />
          <stop offset="100%" stopColor={props.endColor} stopOpacity="1" />
        </linearGradient>
        <path
          fill={`url(/#${props.startColor})`}
          d="M2158.8,719.8c-211.5-2.3-420.5,66.7-589.2,194.4c-26.2-10.8-201.6-90.7-304-327.4l-3.9-9l-130.8,140l1.7,3.8   c85.8,202.1,263.3,356.4,475,412.7l3.6,1l2.6-2.6c146.2-147,343.8-225.5,549.5-220V719.9L2158.8,719.8z"
        />
        <path
          fill={`url(/#${props.startColor})`}
          d="M1603.7,1170.6l-1-3.6l-3.6-1c-217.1-57.6-395.2-208.2-488.9-413.2l-4-8.7L955.8,905.4l2.2,4.1   c103.2,188.1,268.9,337.7,467.1,421.5l0.1,2.2h0.8c3.8,32.5,18,220.1-128.1,420.1l-5.9,8.1h211.3   C1620.5,1589.8,1658.2,1371.9,1603.7,1170.6z"
        />
        <path
          fill={`url(/#${props.startColor})`}
          d="M1637.2,1155.8l-2.6,2.6l1,3.6c55.5,205.3,21.5,421.3-92.9,599.4H1781c72.2-160,99.7-339.2,77.9-514   c17.7-13.5,126.4-91.1,304.5-103.1V945.8C1968,940.9,1775.8,1016.6,1637.2,1155.8z"
        />
      </g>
    </svg>
  );
}

YieldMark.defaultProps = { startColor: '#555', endColor: '#555' };

export default YieldMark;

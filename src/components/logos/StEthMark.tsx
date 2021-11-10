import * as React from 'react';

function StEthMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="1em" height="1em" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 25" {...props}>
      <path
        d="M7.007 0l4.95 7.748-4.95 2.884-4.95-2.884L7.007 0zM3.572 7.381l3.435-5.376 3.434 5.376-3.435 2.002L3.572 7.38z"
        fill="#00A3FF"
      />
      <path
        d="M7 12.335L1.257 8.99l-.157.245a6.998 6.998 0 00.95 8.716 7 7 0 009.899 0 6.998 6.998 0 00.95-8.716l-.158-.245L7 12.335z"
        fill="#00A3FF"
      />
    </svg>
  );
}

export default StEthMark;

import * as React from 'react';

function StEthMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" {...props}>
      <path
        d="m7.078 11.148-.135.206a5.788 5.788 0 0 0 .814 7.32 6.043 6.043 0 0 0 4.24 1.72l-4.92-9.246z"
        fill="#00A3FF"
      />
      <path
        opacity={0.6}
        d="m11.997 13.958-4.92-2.81 4.92 9.246v-6.436zm4.925-2.81.134.206a5.788 5.788 0 0 1-.813 7.32 6.043 6.043 0 0 1-4.24 1.72l4.92-9.246z"
        fill="#00A3FF"
      />
      <path
        opacity={0.2}
        d="m12.002 13.958 4.92-2.81-4.92 9.246v-6.436zm.001-6.278v4.847l4.238-2.422-4.238-2.425z"
        fill="#00A3FF"
      />
      <path opacity={0.6} d="m12.003 7.68-4.24 2.425 4.24 2.422V7.68z" fill="#00A3FF" />
      <path d="m12.003 3.604-4.24 6.502 4.24-2.431V3.604z" fill="#00A3FF" />
      <path opacity={0.6} d="m12.003 7.674 4.241 2.432-4.24-6.506v4.074z" fill="#00A3FF" />
    </svg>
  );
}

export default StEthMark;

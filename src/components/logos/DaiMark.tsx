import * as React from 'react';

function DaiMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="1em" height="1em" viewBox="0 0 332 283" fill="none" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M39.711 0H153.99c69.513 0 122.204 37.363 141.807 91.73h35.598v32.86h-28.102c.55 5.193.831 10.483.831 15.858v.807c0 6.051-.355 12-1.05 17.826h28.321v32.86h-36.276C275 245.552 222.717 282.558 153.99 282.558H39.711v-90.617H0v-32.86h39.711V124.59H0V91.73h39.711V0zm31.948 191.941v61.139h82.331c50.806 0 88.553-24.487 106.124-61.139H71.659zm198.242-32.86H71.659V124.59h198.293a124.167 124.167 0 011.11 16.665v.807c0 5.804-.392 11.486-1.161 17.019zM153.99 29.429c51.04 0 88.9 25.133 106.365 62.3H71.659v-62.3h82.331z"
        fill="#F4B731"
      />
    </svg>
  );
}

export default DaiMark;
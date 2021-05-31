import { Box, Text } from 'grommet';
import React from 'react';
import styled, { css } from 'styled-components';

const Div = styled.div`

  
  .box{
    height: 100px;
    width: 100px;
    top: 50%;
    left: 50%;
    border: 5px solid #4D6DE3;
    transform: translate(-50%, -50%);
    border-radius:100%;
    overflow: hidden; 

    .percent{
      left: 0;
      top: 0;
      z-index:3;
      width: 100%;
      height: 100%;
      display: flex;
      display: -webkit-flex;
      align-items:center;
      justify-content:center; 
      color:#333;
      font-size:24px;
    } 
    .water{
      left: 0;
      top: 0;
      z-index:2;
      width: 100%;
      height: 100%;
      transform:translate(0,100%);
      background: #020438;
      transition: all .3s;
      &_wave{
        width: 200%;
        position: absolute;
        bottom: 100%;
        &_back {
          right: 0;
          fill: #C7EEFF;
          animation: wave-back 1.4s infinite linear;
        }
        &_front {
          left: 0;
          fill: #4D6DE3;
          margin-bottom: -1px;
          animation: wave-front .7s infinite linear;
        }
      }
    }
  }
  @keyframes wave-front {
    100% {
      transform: translate(-50%, 0);
    }
  }
  @keyframes wave-back {
    100% {
      transform: translate(50%, 0);
    }
  }
`;

function Collateralization({ percent }: { percent:number }) {
  return (

    <Box pad="small" direction="row" align="center" border round>
      <svg viewBox="0 0 100 25">
        <defs>
          <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="red" />
            <stop offset="90%" stopColor="maroon" />
          </linearGradient>

          <linearGradient id="gradient2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="red" />
            <stop offset="90%" stopColor="maroon" />
          </linearGradient>

          <pattern id="wave" x="0" y={percent} width="100" height="40" patternUnits="userSpaceOnUse">
            <path id="wavePath" d="M-40 9 Q-30 7 -20 9 T0 9 T20 9 T40 9 T60 9 T80 9 T100 9 T120 9 V20 H-40z" mask="url(#mask)" fill="maroon">
              <animateTransform
                attributeName="transform"
                begin="0s"
                dur="3.0s"
                type="translate"
                from="0,0"
                to="40,0"
                repeatCount="indefinite"
              />
            </path>
            <path id="wavePath2" d="M-40 9 Q-30 7 -20 9 T0 9 T20 9 T40 9 T60 9 T80 9 T100 9 T120 9 V20 H-40z" mask="url(#mask)" fill="url(#gradient)">
              <animateTransform
                attributeName="transform"
                begin="0s"
                dur="3.5s"
                type="translate"
                from="0,0"
                to="40,0"
                repeatCount="indefinite"
                // width="200%"
              />
            </path>
          </pattern>

        </defs>

        <circle fill="url(#wave)" fillOpacity="0.6" cx="10" cy="10" r="10" />
        <circle fill="url(#gradient)" fillOpacity="0.6" cx="10" cy="10" r="10" />
        {/* <circle fill="url(#gradient)" fillOpacity="0.6" cx="16" cy="16" r="8" stroke="maroon" strokeWidth="0.5" /> */}
        {/* <text textAnchor="middle" x="16" y="16" fontSize="5">{percent}%</text> */}

        {/* <text textAnchor="middle" x="20" y="15" fontSize="17" fill="url(#wave)" fillOpacity="0.6">{percent}%</text>
        <text textAnchor="middle" x="20" y="15" fontSize="17" fill="url(#gradient)" fillOpacity="0.1">{percent}%</text>
        */}
      </svg>
      <Text> Collateralisation rate: {percent}% </Text>
    </Box>

  );
}

export default Collateralization;

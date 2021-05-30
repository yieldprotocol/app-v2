import { Box } from 'grommet';
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

    <Box>
      <Div>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px">
          <symbol id="wave">
            <path d="M420,20c21.5-0.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C514,6.5,518,4.7,528.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7c0,0,0,0,0,0v20H420z" />
            <path d="M420,20c-21.5-0.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C326,6.5,322,4.7,311.5,2.7C304.3,1.4,293.6-0.1,280,0c0,0,0,0,0,0v20H420z" />
            <path d="M140,20c21.5-0.4,38.8-2.5,51.1-4.5c13.4-2.2,26.5-5.2,27.3-5.4C234,6.5,238,4.7,248.5,2.7c7.1-1.3,17.9-2.8,31.5-2.7c0,0,0,0,0,0v20H140z" />
            <path d="M140,20c-21.5-0.4-38.8-2.5-51.1-4.5c-13.4-2.2-26.5-5.2-27.3-5.4C46,6.5,42,4.7,31.5,2.7C24.3,1.4,13.6-0.1,0,0c0,0,0,0,0,0l0,20H140z" />
          </symbol>
        </svg>

        <Box className="box">

          <div className="percent">
            <div className="percentNum" id="count">20</div>
            <div className="percentB">%</div>
          </div>

          <div id="water" className="water">
            <svg viewBox="0 0 560 20" className="water_wave water_wave_back">
              <use xlinkHref="#wave" />
            </svg>
            <svg viewBox="0 0 560 20" className="water_wave water_wave_front">
              <use xlinkHref="#wave" />
            </svg>
          </div>

        </Box>

        {/* <div className="box">
        <div className="percent">
          <div className="percentNum" id="count">0</div>
          <div className="percentB">%</div>
        </div>

        <div id="water" className="water">
          <svg viewBox="0 0 560 20" className="water_wave water_wave_back">
            <use xlinkHref="#wave" />
          </svg>
          <svg viewBox="0 0 560 20" className="water_wave water_wave_front">
            <use xlinkHref="#wave" />
          </svg>
        </div>

      </div> */}

      </Div>
    </Box>

  );
}

export default Collateralization;

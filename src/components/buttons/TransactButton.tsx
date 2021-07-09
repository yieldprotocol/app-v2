import { Box, Button, Text } from 'grommet';
import React, { useState } from 'react';
import styled from 'styled-components';

const StyledButton = styled(Button)``;

const TransactButton = (props: any) => (
  <Box pad="large">
    <StyledButton {...props} />
  </Box>
);

export default TransactButton;

// import { Box, Text } from 'grommet';
// import React, { useState } from 'react';
// import { FiArrowLeftCircle } from 'react-icons/fi';
// import styled from 'styled-components';

// const StyledBox = styled(Box)`
// $green: #1ECD97;
// $gray: #bbbbbb;
// * {
//   font-family: 'Roboto', sans-serif;
// }
// .container {
//   position: absolute;
//   top:50%;
//   left:50%;
//   margin-left: -65px;
//   margin-top: -20px;
//   width: 130px;
//   height: 40px;
//   text-align: center;
// }
// button {
//   outline:none;
//   height: 40px;
//   text-align: center;
//   width: 130px;
//   border-radius:40px;
//   background: #fff;
//   border: 2px solid $green;
//   color:$green;
//   letter-spacing:1px;
//   text-shadow:0;
//   font:{
//     size:12px;
//     weight:bold;
//   }
//   cursor: pointer;
//   transition: all 0.25s ease;
//   &:hover {
//     color:white;
//     background: $green;
//   }
//   &:active {
//     //letter-spacing: 2px;
//     letter-spacing: 2px ;
//   }
//   &:after {
//     content:"SUBMIT";
//   }
// }
// .onclic {
//   width: 40px;
//   border-color:$gray;
//   border-width:3px;
//   font-size:0;
//   border-left-color:$green;
//   animation: rotating 2s 0.25s linear infinite;

//   &:after {
//     content:"";
//   }
//   &:hover {
//     color:$green;
//     background: white;
//   }
// }
// .validate {
//   font-size:13px;
//   color: white;
//   background: $green;
//   &:after {
//     font-family:'FontAwesome';
//     content:"\f00c";
//   }
// }

// @keyframes rotating {
//   from {
//     transform: rotate(0deg);
//   }
//   to {
//     transform: rotate(360deg);
//   }
// }

// `;

// function TransactButton({ action }: { action:()=>void }) {
//   const [hover, setHover] = useState<boolean>();
//   return (
//     <StyledBox
//       direction="row"
//       onClick={() => action()}
//       gap="small"
//       align="center"
//       onMouseEnter={() => setHover(true)}
//       onMouseLeave={() => setHover(false)}
//     >
//       <FiArrowLeftCircle color={hover ? '#333333' : 'grey'} />
//       <Text size="small" color={hover ? 'text' : 'text-weak'}>
//         go back
//       </Text>
//     </StyledBox>
//   );
// }

// export default TransactButton;

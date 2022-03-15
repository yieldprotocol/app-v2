import * as React from 'react';

function NotionalMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="0.75em" height="0.75em" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.493 0h-1.954v19.376l1.954 1.954V0ZM17.585 0H15.63v15.468l1.954 1.954V0ZM13.677 0h-1.954v11.56l1.954 1.954V0Z"
        fill="#21B9BA"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.815 7.734V21.33H9.77V9.688L7.815 7.734ZM3.909 3.826V21.33h1.954V5.78L3.909 3.826ZM.082 0H0v21.33h1.954V1.872L.082 0Z"
        fill="#33F8FF"
      />
      <path
        d="M35.623 8.17h3.15v2.111h.055c.295-.658.801-1.234 1.52-1.728.736-.512 1.602-.768 2.597-.768.865 0 1.602.156 2.21.467a4.09 4.09 0 0 1 1.52 1.179c.404.493.699 1.06.883 1.7.184.64.276 1.298.276 1.975v8.227H44.52v-7.295c0-.384-.027-.786-.083-1.207a3.107 3.107 0 0 0-.359-1.124 2.294 2.294 0 0 0-.773-.85c-.313-.22-.737-.33-1.271-.33-.534 0-.995.11-1.381.33-.387.201-.71.466-.967.795-.24.33-.424.713-.553 1.152-.129.42-.193.85-.193 1.289v7.24h-3.316V8.169ZM51.206 14.696c0-1.042.184-1.983.552-2.825.387-.859.903-1.59 1.547-2.193a6.767 6.767 0 0 1 2.293-1.399 8.012 8.012 0 0 1 2.818-.494c.995 0 1.934.165 2.818.494.884.33 1.649.795 2.293 1.399a6.436 6.436 0 0 1 1.52 2.193c.386.841.58 1.783.58 2.825 0 1.042-.194 1.993-.58 2.852-.369.86-.875 1.6-1.52 2.222a7.132 7.132 0 0 1-2.293 1.425 7.635 7.635 0 0 1-2.818.522 7.635 7.635 0 0 1-2.818-.521 7.131 7.131 0 0 1-2.293-1.427 7.095 7.095 0 0 1-1.547-2.22c-.368-.86-.552-1.81-.552-2.853Zm3.37 0c0 .512.074 1.024.221 1.536.166.512.405.969.719 1.371.313.402.709.731 1.188.987.478.256 1.05.384 1.712.384.663 0 1.234-.128 1.713-.384a3.68 3.68 0 0 0 1.188-.987c.313-.402.544-.86.69-1.371a4.959 4.959 0 0 0 .25-1.536c0-.512-.083-1.014-.25-1.508a4.016 4.016 0 0 0-.69-1.371 3.392 3.392 0 0 0-1.188-.96c-.479-.256-1.05-.384-1.713-.384s-1.234.128-1.712.384a3.391 3.391 0 0 0-1.188.96c-.314.402-.553.859-.719 1.37a5.244 5.244 0 0 0-.22 1.51ZM67.211 10.802V8.169h2.32V4.357h3.26V8.17h3.316v2.633h-3.315v6.116c0 .585.101 1.069.304 1.453.22.384.7.576 1.436.576.221 0 .46-.018.719-.055.257-.055.488-.128.69-.22l.11 2.578c-.294.11-.644.192-1.049.247-.405.073-.792.11-1.16.11-.884 0-1.603-.119-2.155-.357-.553-.256-.995-.594-1.326-1.014a4.16 4.16 0 0 1-.663-1.481 9.451 9.451 0 0 1-.166-1.81v-6.143h-2.32ZM78.838 8.17h3.315v13.163h-3.315V8.169Zm-.47-4.47c0-.53.194-.988.58-1.372.406-.402.912-.603 1.52-.603s1.114.192 1.52.576c.423.365.635.832.635 1.398 0 .567-.212 1.042-.636 1.426-.405.366-.911.549-1.52.549-.607 0-1.114-.192-1.519-.576-.386-.402-.58-.868-.58-1.399ZM85.677 14.696c0-1.042.185-1.983.553-2.825a6.77 6.77 0 0 1 1.547-2.193 6.767 6.767 0 0 1 2.293-1.399 8.011 8.011 0 0 1 2.818-.494c.995 0 1.934.165 2.818.494.884.33 1.648.795 2.293 1.399a6.437 6.437 0 0 1 1.52 2.193c.386.841.58 1.783.58 2.825 0 1.042-.194 1.993-.58 2.852-.369.86-.875 1.6-1.52 2.222a7.131 7.131 0 0 1-2.293 1.425 7.635 7.635 0 0 1-2.818.522 7.634 7.634 0 0 1-2.818-.521 7.13 7.13 0 0 1-2.293-1.427 7.092 7.092 0 0 1-1.547-2.22c-.368-.86-.553-1.81-.553-2.853Zm3.371 0c0 .512.074 1.024.221 1.536.166.512.405.969.718 1.371.313.402.71.731 1.188.987.48.256 1.05.384 1.713.384s1.234-.128 1.713-.384a3.68 3.68 0 0 0 1.188-.987c.313-.402.543-.86.69-1.371a4.959 4.959 0 0 0 .25-1.536c0-.512-.084-1.014-.25-1.508a4.016 4.016 0 0 0-.69-1.371 3.391 3.391 0 0 0-1.188-.96c-.479-.256-1.05-.384-1.713-.384s-1.234.128-1.713.384a3.392 3.392 0 0 0-1.188.96c-.313.402-.552.859-.718 1.37a5.248 5.248 0 0 0-.221 1.51ZM103.589 8.17h3.15v2.111h.055c.295-.658.801-1.234 1.519-1.728.737-.512 1.603-.768 2.597-.768.866 0 1.603.156 2.21.467a4.086 4.086 0 0 1 1.52 1.179c.405.493.7 1.06.884 1.7a7.11 7.11 0 0 1 .276 1.975v8.227h-3.315v-7.295c0-.384-.028-.786-.083-1.207a3.107 3.107 0 0 0-.359-1.124 2.289 2.289 0 0 0-.774-.85c-.313-.22-.736-.33-1.27-.33s-.995.11-1.382.33a2.934 2.934 0 0 0-.967.795 3.733 3.733 0 0 0-.552 1.152c-.129.42-.194.85-.194 1.289v7.24h-3.315V8.169ZM128.178 19.66h-.083c-.332.585-.866 1.07-1.602 1.453-.737.366-1.575.549-2.514.549a7.007 7.007 0 0 1-1.686-.22 5.107 5.107 0 0 1-1.602-.658 4.44 4.44 0 0 1-1.216-1.261c-.313-.53-.469-1.18-.469-1.947 0-.988.276-1.774.829-2.359.571-.585 1.298-1.033 2.182-1.344.884-.31 1.86-.511 2.928-.603a31.647 31.647 0 0 1 3.178-.164v-.33c0-.822-.304-1.425-.912-1.81-.589-.402-1.299-.603-2.127-.603-.7 0-1.372.146-2.017.439-.645.293-1.179.649-1.602 1.07l-1.713-2.002a7.509 7.509 0 0 1 2.597-1.564 9.072 9.072 0 0 1 3.011-.52c1.179 0 2.146.164 2.901.493.773.33 1.381.759 1.823 1.289.442.53.746 1.124.912 1.783.184.658.276 1.316.276 1.974v8.008h-3.094V19.66Zm-.055-4.333h-.746c-.534 0-1.096.027-1.686.082a6.452 6.452 0 0 0-1.63.302c-.497.146-.911.365-1.243.658-.331.274-.497.658-.497 1.152 0 .31.064.576.193.795.148.201.332.366.553.494.221.128.47.22.746.274.276.055.552.082.829.082 1.142 0 2.007-.302 2.597-.905.589-.603.884-1.426.884-2.468v-.466ZM135.466.6h3.315v20.733h-3.315V.6Z"
        fill="#fff"
      />
    </svg>
  );
}

export default NotionalMark;

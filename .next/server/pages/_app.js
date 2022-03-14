"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/_app";
exports.ids = ["pages/_app"];
exports.modules = {

/***/ "./src/pages/_app.tsx":
/*!****************************!*\
  !*** ./src/pages/_app.tsx ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"react/jsx-dev-runtime\");\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! grommet */ \"grommet\");\n/* harmony import */ var grommet__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(grommet__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react */ \"react\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var react_toastify__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react-toastify */ \"react-toastify\");\n/* harmony import */ var react_toastify__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(react_toastify__WEBPACK_IMPORTED_MODULE_3__);\n\n\n\n\nconst App = ({ Component , pageProps  })=>{\n    const mobile = (0,react__WEBPACK_IMPORTED_MODULE_2__.useContext)(grommet__WEBPACK_IMPORTED_MODULE_1__.ResponsiveContext) === 'small';\n    /* LOCAL STATE */ const { 0: menuLayerOpen , 1: setMenuLayerOpen  } = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)(false);\n    return(/*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Box, {\n        fill: true,\n        background: \"background\",\n        children: [\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(YieldHeader, {\n                actionList: [\n                    ()=>setMenuLayerOpen(!menuLayerOpen)\n                ]\n            }, void 0, false, {\n                fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n                lineNumber: 14,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(NetworkBanner, {}, void 0, false, {\n                fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n                lineNumber: 15,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(TransactionWidget, {}, void 0, false, {\n                fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n                lineNumber: 16,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(NetworkError, {}, void 0, false, {\n                fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n                lineNumber: 17,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(TransactionError, {}, void 0, false, {\n                fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n                lineNumber: 18,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(react_toastify__WEBPACK_IMPORTED_MODULE_3__.ToastContainer, {\n                position: \"top-right\"\n            }, void 0, false, {\n                fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n                lineNumber: 19,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Box, {\n                flex: !mobile,\n                overflow: \"hidden\",\n                children: menuLayerOpen && /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(YieldMobileMenu, {\n                    toggleMenu: ()=>setMenuLayerOpen(!menuLayerOpen)\n                }, void 0, false, {\n                    fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n                    lineNumber: 22,\n                    columnNumber: 27\n                }, undefined)\n            }, void 0, false, {\n                fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n                lineNumber: 21,\n                columnNumber: 7\n            }, undefined),\n            /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Component, {\n                ...pageProps\n            }, void 0, false, {\n                fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n                lineNumber: 24,\n                columnNumber: 7\n            }, undefined)\n        ]\n    }, void 0, true, {\n        fileName: \"/Users/marcomariscal/Documents/yield/app-v2/src/pages/_app.tsx\",\n        lineNumber: 13,\n        columnNumber: 5\n    }, undefined));\n};\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (App);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvcGFnZXMvX2FwcC50c3guanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUEyQztBQUVDO0FBQ0c7QUFFL0MsS0FBSyxDQUFDSSxHQUFHLElBQUksQ0FBQyxDQUFDQyxTQUFTLEdBQUVDLFNBQVMsRUFBVyxDQUFDLEdBQUssQ0FBQztJQUNuRCxLQUFLLENBQUNDLE1BQU0sR0FBWUwsaURBQVUsQ0FBTUYsc0RBQWlCLE1BQU0sQ0FBTztJQUV0RSxFQUFpQixnQkFDakIsS0FBSyxNQUFFUSxhQUFhLE1BQUVDLGdCQUFnQixNQUFJUiwrQ0FBUSxDQUFVLEtBQUs7SUFFakUsTUFBTSw2RUFDSFMsR0FBRztRQUFDQyxJQUFJO1FBQUNDLFVBQVUsRUFBQyxDQUFZOzt3RkFDOUJDLFdBQVc7Z0JBQUNDLFVBQVUsRUFBRSxDQUFDO3dCQUFNTCxnQkFBZ0IsRUFBRUQsYUFBYTtnQkFBQyxDQUFDOzs7Ozs7d0ZBQ2hFTyxhQUFhOzs7Ozt3RkFDYkMsaUJBQWlCOzs7Ozt3RkFDakJDLFlBQVk7Ozs7O3dGQUNaQyxnQkFBZ0I7Ozs7O3dGQUNoQmYsMERBQWM7Z0JBQUNnQixRQUFRLEVBQUMsQ0FBVzs7Ozs7O3dGQUVuQ1QsR0FBRztnQkFBQ1UsSUFBSSxHQUFHYixNQUFNO2dCQUFFYyxRQUFRLEVBQUMsQ0FBUTswQkFDbENiLGFBQWEsZ0ZBQUtjLGVBQWU7b0JBQUNDLFVBQVUsTUFBUWQsZ0JBQWdCLEVBQUVELGFBQWE7Ozs7Ozs7Ozs7O3dGQUVyRkgsU0FBUzttQkFBS0MsU0FBUzs7Ozs7Ozs7Ozs7O0FBRzlCLENBQUM7QUFFRCxpRUFBZUYsR0FBRyxFQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYXBwLXYyLy4vc3JjL3BhZ2VzL19hcHAudHN4P2Y5ZDYiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVzcG9uc2l2ZUNvbnRleHQgfSBmcm9tICdncm9tbWV0JztcbmltcG9ydCB7IEFwcFByb3BzIH0gZnJvbSAnbmV4dC9hcHAnO1xuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUNvbnRleHQgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBUb2FzdENvbnRhaW5lciB9IGZyb20gJ3JlYWN0LXRvYXN0aWZ5JztcblxuY29uc3QgQXBwID0gKHsgQ29tcG9uZW50LCBwYWdlUHJvcHMgfTogQXBwUHJvcHMpID0+IHtcbiAgY29uc3QgbW9iaWxlOiBib29sZWFuID0gdXNlQ29udGV4dDxhbnk+KFJlc3BvbnNpdmVDb250ZXh0KSA9PT0gJ3NtYWxsJztcblxuICAvKiBMT0NBTCBTVEFURSAqL1xuICBjb25zdCBbbWVudUxheWVyT3Blbiwgc2V0TWVudUxheWVyT3Blbl0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XG5cbiAgcmV0dXJuIChcbiAgICA8Qm94IGZpbGwgYmFja2dyb3VuZD1cImJhY2tncm91bmRcIj5cbiAgICAgIDxZaWVsZEhlYWRlciBhY3Rpb25MaXN0PXtbKCkgPT4gc2V0TWVudUxheWVyT3BlbighbWVudUxheWVyT3BlbildfSAvPlxuICAgICAgPE5ldHdvcmtCYW5uZXIgLz5cbiAgICAgIDxUcmFuc2FjdGlvbldpZGdldCAvPlxuICAgICAgPE5ldHdvcmtFcnJvciAvPlxuICAgICAgPFRyYW5zYWN0aW9uRXJyb3IgLz5cbiAgICAgIDxUb2FzdENvbnRhaW5lciBwb3NpdGlvbj1cInRvcC1yaWdodFwiIC8+XG5cbiAgICAgIDxCb3ggZmxleD17IW1vYmlsZX0gb3ZlcmZsb3c9XCJoaWRkZW5cIj5cbiAgICAgICAge21lbnVMYXllck9wZW4gJiYgPFlpZWxkTW9iaWxlTWVudSB0b2dnbGVNZW51PXsoKSA9PiBzZXRNZW51TGF5ZXJPcGVuKCFtZW51TGF5ZXJPcGVuKX0gLz59XG4gICAgICA8L0JveD5cbiAgICAgIDxDb21wb25lbnQgey4uLnBhZ2VQcm9wc30gLz5cbiAgICA8L0JveD5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFwcDtcbiJdLCJuYW1lcyI6WyJSZXNwb25zaXZlQ29udGV4dCIsInVzZVN0YXRlIiwidXNlQ29udGV4dCIsIlRvYXN0Q29udGFpbmVyIiwiQXBwIiwiQ29tcG9uZW50IiwicGFnZVByb3BzIiwibW9iaWxlIiwibWVudUxheWVyT3BlbiIsInNldE1lbnVMYXllck9wZW4iLCJCb3giLCJmaWxsIiwiYmFja2dyb3VuZCIsIllpZWxkSGVhZGVyIiwiYWN0aW9uTGlzdCIsIk5ldHdvcmtCYW5uZXIiLCJUcmFuc2FjdGlvbldpZGdldCIsIk5ldHdvcmtFcnJvciIsIlRyYW5zYWN0aW9uRXJyb3IiLCJwb3NpdGlvbiIsImZsZXgiLCJvdmVyZmxvdyIsIllpZWxkTW9iaWxlTWVudSIsInRvZ2dsZU1lbnUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/pages/_app.tsx\n");

/***/ }),

/***/ "grommet":
/*!**************************!*\
  !*** external "grommet" ***!
  \**************************/
/***/ ((module) => {

module.exports = require("grommet");

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "react" ***!
  \************************/
/***/ ((module) => {

module.exports = require("react");

/***/ }),

/***/ "react-toastify":
/*!*********************************!*\
  !*** external "react-toastify" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("react-toastify");

/***/ }),

/***/ "react/jsx-dev-runtime":
/*!****************************************!*\
  !*** external "react/jsx-dev-runtime" ***!
  \****************************************/
/***/ ((module) => {

module.exports = require("react/jsx-dev-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./src/pages/_app.tsx"));
module.exports = __webpack_exports__;

})();
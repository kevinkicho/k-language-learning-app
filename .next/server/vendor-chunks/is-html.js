"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/is-html";
exports.ids = ["vendor-chunks/is-html"];
exports.modules = {

/***/ "(rsc)/./node_modules/is-html/index.js":
/*!***************************************!*\
  !*** ./node_modules/is-html/index.js ***!
  \***************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\nconst htmlTags = __webpack_require__(/*! html-tags */ \"(rsc)/./node_modules/html-tags/index.js\");\n\nconst basic = /\\s?<!doctype html>|(<html\\b[^>]*>|<body\\b[^>]*>|<x-[^>]+>)+/i;\nconst full = new RegExp(htmlTags.map(tag => `<${tag}\\\\b[^>]*>`).join('|'), 'i');\n\nmodule.exports = string => basic.test(string) || full.test(string);\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvaXMtaHRtbC9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBYTtBQUNiLGlCQUFpQixtQkFBTyxDQUFDLDBEQUFXOztBQUVwQztBQUNBLGdEQUFnRCxJQUFJOztBQUVwRCIsInNvdXJjZXMiOlsid2VicGFjazovL3NwYW5pc2gtbGFuZ3VhZ2UtbGVhcm5pbmctYXBwLy4vbm9kZV9tb2R1bGVzL2lzLWh0bWwvaW5kZXguanM/NTFhYiJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5jb25zdCBodG1sVGFncyA9IHJlcXVpcmUoJ2h0bWwtdGFncycpO1xuXG5jb25zdCBiYXNpYyA9IC9cXHM/PCFkb2N0eXBlIGh0bWw+fCg8aHRtbFxcYltePl0qPnw8Ym9keVxcYltePl0qPnw8eC1bXj5dKz4pKy9pO1xuY29uc3QgZnVsbCA9IG5ldyBSZWdFeHAoaHRtbFRhZ3MubWFwKHRhZyA9PiBgPCR7dGFnfVxcXFxiW14+XSo+YCkuam9pbignfCcpLCAnaScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0cmluZyA9PiBiYXNpYy50ZXN0KHN0cmluZykgfHwgZnVsbC50ZXN0KHN0cmluZyk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/is-html/index.js\n");

/***/ })

};
;
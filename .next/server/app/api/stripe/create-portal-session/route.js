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
exports.id = "app/api/stripe/create-portal-session/route";
exports.ids = ["app/api/stripe/create-portal-session/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute&page=%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute.ts&appDir=C%3A%5CUsers%5Cpalom%5CDev%5CTenderAI%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cpalom%5CDev%5CTenderAI&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute&page=%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute.ts&appDir=C%3A%5CUsers%5Cpalom%5CDev%5CTenderAI%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cpalom%5CDev%5CTenderAI&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_palom_Dev_TenderAI_app_api_stripe_create_portal_session_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/stripe/create-portal-session/route.ts */ \"(rsc)/./app/api/stripe/create-portal-session/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/stripe/create-portal-session/route\",\n        pathname: \"/api/stripe/create-portal-session\",\n        filename: \"route\",\n        bundlePath: \"app/api/stripe/create-portal-session/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\palom\\\\Dev\\\\TenderAI\\\\app\\\\api\\\\stripe\\\\create-portal-session\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_palom_Dev_TenderAI_app_api_stripe_create_portal_session_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/stripe/create-portal-session/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZzdHJpcGUlMkZjcmVhdGUtcG9ydGFsLXNlc3Npb24lMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnN0cmlwZSUyRmNyZWF0ZS1wb3J0YWwtc2Vzc2lvbiUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnN0cmlwZSUyRmNyZWF0ZS1wb3J0YWwtc2Vzc2lvbiUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNwYWxvbSU1Q0RldiU1Q1RlbmRlckFJJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDVXNlcnMlNUNwYWxvbSU1Q0RldiU1Q1RlbmRlckFJJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFBc0c7QUFDdkM7QUFDYztBQUNrQztBQUMvRztBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsZ0hBQW1CO0FBQzNDO0FBQ0EsY0FBYyx5RUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLGlFQUFpRTtBQUN6RTtBQUNBO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ3VIOztBQUV2SCIsInNvdXJjZXMiOlsid2VicGFjazovL3RlbmRlcmFpLz9kMGNiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9mdXR1cmUvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXFVzZXJzXFxcXHBhbG9tXFxcXERldlxcXFxUZW5kZXJBSVxcXFxhcHBcXFxcYXBpXFxcXHN0cmlwZVxcXFxjcmVhdGUtcG9ydGFsLXNlc3Npb25cXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL3N0cmlwZS9jcmVhdGUtcG9ydGFsLXNlc3Npb24vcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2FwaS9zdHJpcGUvY3JlYXRlLXBvcnRhbC1zZXNzaW9uXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9zdHJpcGUvY3JlYXRlLXBvcnRhbC1zZXNzaW9uL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiQzpcXFxcVXNlcnNcXFxccGFsb21cXFxcRGV2XFxcXFRlbmRlckFJXFxcXGFwcFxcXFxhcGlcXFxcc3RyaXBlXFxcXGNyZWF0ZS1wb3J0YWwtc2Vzc2lvblxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvc3RyaXBlL2NyZWF0ZS1wb3J0YWwtc2Vzc2lvbi9yb3V0ZVwiO1xuZnVuY3Rpb24gcGF0Y2hGZXRjaCgpIHtcbiAgICByZXR1cm4gX3BhdGNoRmV0Y2goe1xuICAgICAgICBzZXJ2ZXJIb29rcyxcbiAgICAgICAgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZVxuICAgIH0pO1xufVxuZXhwb3J0IHsgcm91dGVNb2R1bGUsIHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBvcmlnaW5hbFBhdGhuYW1lLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute&page=%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute.ts&appDir=C%3A%5CUsers%5Cpalom%5CDev%5CTenderAI%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cpalom%5CDev%5CTenderAI&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./app/api/stripe/create-portal-session/route.ts":
/*!*******************************************************!*\
  !*** ./app/api/stripe/create-portal-session/route.ts ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var stripe__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! stripe */ \"(rsc)/./node_modules/stripe/esm/stripe.esm.node.js\");\n\n\nconst stripeSecret = process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY;\nconst stripe = stripeSecret ? new stripe__WEBPACK_IMPORTED_MODULE_1__[\"default\"](stripeSecret, {\n    apiVersion: \"2023-10-16\"\n}) : null;\nasync function POST(req) {\n    if (!stripeSecret) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Stripe non configur\\xe9\"\n        }, {\n            status: 500\n        });\n    }\n    let body;\n    try {\n        body = await req.json();\n    } catch (err) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Requ\\xeate invalide\"\n        }, {\n            status: 400\n        });\n    }\n    const { email, userId } = body || {};\n    if (!email && !userId) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"email ou userId requis\"\n        }, {\n            status: 400\n        });\n    }\n    try {\n        // Trouver le customer par email (simple et sans stocker l'id côté app)\n        const customers = await stripe.customers.list({\n            email,\n            limit: 1\n        });\n        const customer = customers.data[0];\n        if (!customer) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Aucun client Stripe trouv\\xe9 pour cet email\"\n            }, {\n                status: 404\n            });\n        }\n        const origin = req.headers.get(\"origin\") || \"http://localhost:3000\";\n        const portal = await stripe.billingPortal.sessions.create({\n            customer: customer.id,\n            return_url: `${origin}/pricing`\n        });\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            url: portal.url\n        });\n    } catch (error) {\n        console.error(\"Stripe portal error\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"Impossible de cr\\xe9er la session portail\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3N0cmlwZS9jcmVhdGUtcG9ydGFsLXNlc3Npb24vcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQTJDO0FBQ2Y7QUFFNUIsTUFBTUUsZUFBZUMsUUFBUUMsR0FBRyxDQUFDQyxzQkFBc0IsSUFBSUYsUUFBUUMsR0FBRyxDQUFDRSxpQkFBaUI7QUFFeEYsTUFBTUMsU0FBU0wsZUFDWCxJQUFJRCw4Q0FBTUEsQ0FBQ0MsY0FBYztJQUFFTSxZQUFZO0FBQWEsS0FDbkQ7QUFFRSxlQUFlQyxLQUFLQyxHQUFZO0lBQ3JDLElBQUksQ0FBQ1IsY0FBYztRQUNqQixPQUFPRixxREFBWUEsQ0FBQ1csSUFBSSxDQUFDO1lBQUVDLE9BQU87UUFBdUIsR0FBRztZQUFFQyxRQUFRO1FBQUk7SUFDNUU7SUFFQSxJQUFJQztJQUNKLElBQUk7UUFDRkEsT0FBTyxNQUFNSixJQUFJQyxJQUFJO0lBQ3ZCLEVBQUUsT0FBT0ksS0FBSztRQUNaLE9BQU9mLHFEQUFZQSxDQUFDVyxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUFtQixHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUN4RTtJQUVBLE1BQU0sRUFBRUcsS0FBSyxFQUFFQyxNQUFNLEVBQUUsR0FBR0gsUUFBUSxDQUFDO0lBQ25DLElBQUksQ0FBQ0UsU0FBUyxDQUFDQyxRQUFRO1FBQ3JCLE9BQU9qQixxREFBWUEsQ0FBQ1csSUFBSSxDQUFDO1lBQUVDLE9BQU87UUFBeUIsR0FBRztZQUFFQyxRQUFRO1FBQUk7SUFDOUU7SUFFQSxJQUFJO1FBQ0YsdUVBQXVFO1FBQ3ZFLE1BQU1LLFlBQVksTUFBTVgsT0FBT1csU0FBUyxDQUFDQyxJQUFJLENBQUM7WUFBRUg7WUFBT0ksT0FBTztRQUFFO1FBQ2hFLE1BQU1DLFdBQVdILFVBQVVJLElBQUksQ0FBQyxFQUFFO1FBRWxDLElBQUksQ0FBQ0QsVUFBVTtZQUNiLE9BQU9yQixxREFBWUEsQ0FBQ1csSUFBSSxDQUFDO2dCQUFFQyxPQUFPO1lBQTRDLEdBQUc7Z0JBQUVDLFFBQVE7WUFBSTtRQUNqRztRQUVBLE1BQU1VLFNBQVNiLElBQUljLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLGFBQWE7UUFFNUMsTUFBTUMsU0FBUyxNQUFNbkIsT0FBT29CLGFBQWEsQ0FBQ0MsUUFBUSxDQUFDQyxNQUFNLENBQUM7WUFDeERSLFVBQVVBLFNBQVNTLEVBQUU7WUFDckJDLFlBQVksQ0FBQyxFQUFFUixPQUFPLFFBQVEsQ0FBQztRQUNqQztRQUVBLE9BQU92QixxREFBWUEsQ0FBQ1csSUFBSSxDQUFDO1lBQUVxQixLQUFLTixPQUFPTSxHQUFHO1FBQUM7SUFDN0MsRUFBRSxPQUFPcEIsT0FBTztRQUNkcUIsUUFBUXJCLEtBQUssQ0FBQyx1QkFBdUJBO1FBQ3JDLE9BQU9aLHFEQUFZQSxDQUFDVyxJQUFJLENBQUM7WUFBRUMsT0FBTztRQUF5QyxHQUFHO1lBQUVDLFFBQVE7UUFBSTtJQUM5RjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vdGVuZGVyYWkvLi9hcHAvYXBpL3N0cmlwZS9jcmVhdGUtcG9ydGFsLXNlc3Npb24vcm91dGUudHM/MGVhZCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UgfSBmcm9tICduZXh0L3NlcnZlcic7XG5pbXBvcnQgU3RyaXBlIGZyb20gJ3N0cmlwZSc7XG5cbmNvbnN0IHN0cmlwZVNlY3JldCA9IHByb2Nlc3MuZW52LlNUUklQRV9URVNUX1NFQ1JFVF9LRVkgfHwgcHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVk7XG5cbmNvbnN0IHN0cmlwZSA9IHN0cmlwZVNlY3JldFxuICA/IG5ldyBTdHJpcGUoc3RyaXBlU2VjcmV0LCB7IGFwaVZlcnNpb246ICcyMDIzLTEwLTE2JyB9KVxuICA6IChudWxsIGFzIHVua25vd24gYXMgU3RyaXBlKTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxOiBSZXF1ZXN0KSB7XG4gIGlmICghc3RyaXBlU2VjcmV0KSB7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdTdHJpcGUgbm9uIGNvbmZpZ3Vyw6knIH0sIHsgc3RhdHVzOiA1MDAgfSk7XG4gIH1cblxuICBsZXQgYm9keTogYW55O1xuICB0cnkge1xuICAgIGJvZHkgPSBhd2FpdCByZXEuanNvbigpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1JlcXXDqnRlIGludmFsaWRlJyB9LCB7IHN0YXR1czogNDAwIH0pO1xuICB9XG5cbiAgY29uc3QgeyBlbWFpbCwgdXNlcklkIH0gPSBib2R5IHx8IHt9O1xuICBpZiAoIWVtYWlsICYmICF1c2VySWQpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ2VtYWlsIG91IHVzZXJJZCByZXF1aXMnIH0sIHsgc3RhdHVzOiA0MDAgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIC8vIFRyb3V2ZXIgbGUgY3VzdG9tZXIgcGFyIGVtYWlsIChzaW1wbGUgZXQgc2FucyBzdG9ja2VyIGwnaWQgY8O0dMOpIGFwcClcbiAgICBjb25zdCBjdXN0b21lcnMgPSBhd2FpdCBzdHJpcGUuY3VzdG9tZXJzLmxpc3QoeyBlbWFpbCwgbGltaXQ6IDEgfSk7XG4gICAgY29uc3QgY3VzdG9tZXIgPSBjdXN0b21lcnMuZGF0YVswXTtcblxuICAgIGlmICghY3VzdG9tZXIpIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnQXVjdW4gY2xpZW50IFN0cmlwZSB0cm91dsOpIHBvdXIgY2V0IGVtYWlsJyB9LCB7IHN0YXR1czogNDA0IH0pO1xuICAgIH1cblxuICAgIGNvbnN0IG9yaWdpbiA9IHJlcS5oZWFkZXJzLmdldCgnb3JpZ2luJykgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCc7XG5cbiAgICBjb25zdCBwb3J0YWwgPSBhd2FpdCBzdHJpcGUuYmlsbGluZ1BvcnRhbC5zZXNzaW9ucy5jcmVhdGUoe1xuICAgICAgY3VzdG9tZXI6IGN1c3RvbWVyLmlkLFxuICAgICAgcmV0dXJuX3VybDogYCR7b3JpZ2lufS9wcmljaW5nYCxcbiAgICB9KTtcblxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IHVybDogcG9ydGFsLnVybCB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdTdHJpcGUgcG9ydGFsIGVycm9yJywgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnSW1wb3NzaWJsZSBkZSBjcsOpZXIgbGEgc2Vzc2lvbiBwb3J0YWlsJyB9LCB7IHN0YXR1czogNTAwIH0pO1xuICB9XG59XHJcbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJTdHJpcGUiLCJzdHJpcGVTZWNyZXQiLCJwcm9jZXNzIiwiZW52IiwiU1RSSVBFX1RFU1RfU0VDUkVUX0tFWSIsIlNUUklQRV9TRUNSRVRfS0VZIiwic3RyaXBlIiwiYXBpVmVyc2lvbiIsIlBPU1QiLCJyZXEiLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJib2R5IiwiZXJyIiwiZW1haWwiLCJ1c2VySWQiLCJjdXN0b21lcnMiLCJsaXN0IiwibGltaXQiLCJjdXN0b21lciIsImRhdGEiLCJvcmlnaW4iLCJoZWFkZXJzIiwiZ2V0IiwicG9ydGFsIiwiYmlsbGluZ1BvcnRhbCIsInNlc3Npb25zIiwiY3JlYXRlIiwiaWQiLCJyZXR1cm5fdXJsIiwidXJsIiwiY29uc29sZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/stripe/create-portal-session/route.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/stripe"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute&page=%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fstripe%2Fcreate-portal-session%2Froute.ts&appDir=C%3A%5CUsers%5Cpalom%5CDev%5CTenderAI%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Cpalom%5CDev%5CTenderAI&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();
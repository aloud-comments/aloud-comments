'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const index = require('./index-2fdbd65a.js');

/*
 Stencil Client Patch Esm v2.3.0 | MIT Licensed | https://stenciljs.com
 */
const patchEsm = () => {
    return index.promiseResolve();
};

const defineCustomElements = (win, options) => {
  if (typeof window === 'undefined') return Promise.resolve();
  return patchEsm().then(() => {
  return index.bootstrapLazy([["aloud-comments_4.cjs",[[1,"aloud-comments",{"_firebase":[1,"firebase"],"firebase":[1040],"firebaseui":[1040],"api":[1040],"parser":[1040],"debug":[4],"user":[32],"entries":[32]}],[2,"aloud-entry",{"user":[16],"entry":[16],"api":[16],"firebase":[16],"depth":[2],"parser":[16],"isEdit":[32],"isReply":[32],"maxDepth":[32],"children":[32]}],[2,"aloud-subentry",{"user":[16],"parent":[16],"entry":[16],"api":[16],"firebase":[16],"parser":[16],"isEdit":[32],"isReply":[32],"children":[32]}],[1,"aloud-editor",{"value":[1537],"firebase":[16],"parser":[16],"html":[32],"_isEdit":[32],"getValue":[64]}]]]], options);
  });
};

exports.defineCustomElements = defineCustomElements;

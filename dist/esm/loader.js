import { p as promiseResolve, b as bootstrapLazy } from './index-31ab7385.js';

/*
 Stencil Client Patch Esm v2.3.0 | MIT Licensed | https://stenciljs.com
 */
const patchEsm = () => {
    return promiseResolve();
};

const defineCustomElements = (win, options) => {
  if (typeof window === 'undefined') return Promise.resolve();
  return patchEsm().then(() => {
  return bootstrapLazy([["aloud-comments_4",[[1,"aloud-comments",{"_firebase":[1,"firebase"],"firebase":[1040],"firebaseui":[1040],"api":[1040],"parser":[1040],"maxChildrenAllowed":[2,"max-children-allowed"],"debug":[4],"user":[32],"entries":[32],"hasMore":[32]}],[2,"aloud-entry",{"user":[16],"entry":[16],"api":[16],"firebase":[16],"depth":[2],"parser":[16],"isEdit":[32],"isReply":[32],"maxDepth":[32],"children":[32],"hasMore":[32],"subEntries":[32]}],[2,"aloud-subentry",{"user":[16],"parent":[16],"entry":[16],"api":[16],"firebase":[16],"parser":[16],"countChangedListener":[16],"limit":[2],"totalSubEntriesLength":[2,"total-sub-entries-length"],"isEdit":[32],"isReply":[32],"children":[32],"hasMore":[32],"getChildren":[64]}],[1,"aloud-editor",{"value":[1537],"firebase":[16],"parser":[16],"html":[32],"_isEdit":[32],"getValue":[64]}]]]], options);
  });
};

export { defineCustomElements };

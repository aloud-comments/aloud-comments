'use strict';

const index = require('./index-9f010f3f.js');

/*
 Stencil Client Patch Browser v2.3.0 | MIT Licensed | https://stenciljs.com
 */
const patchBrowser = () => {
    const importMeta = (typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('aloud-comments.cjs.js', document.baseURI).href));
    const opts =  {};
    if ( importMeta !== '') {
        opts.resourcesUrl = new URL('.', importMeta).href;
    }
    return index.promiseResolve(opts);
};

patchBrowser().then(options => {
  return index.bootstrapLazy([["aloud-comments_4.cjs",[[1,"aloud-comments",{"_firebase":[1,"firebase"],"firebase":[1040],"firebaseui":[1040],"api":[1040],"parser":[1040],"maxChildrenAllowed":[2,"max-children-allowed"],"debug":[4],"user":[32],"entries":[32],"hasMore":[32]}],[2,"aloud-entry",{"user":[16],"entry":[16],"api":[16],"firebase":[16],"depth":[2],"parser":[16],"isEdit":[32],"isReply":[32],"maxDepth":[32],"children":[32],"hasMore":[32],"subEntries":[32]}],[2,"aloud-subentry",{"user":[16],"parent":[16],"entry":[16],"api":[16],"firebase":[16],"parser":[16],"countChangedListener":[16],"limit":[2],"totalSubEntriesLength":[2,"total-sub-entries-length"],"isEdit":[32],"isReply":[32],"children":[32],"hasMore":[32],"getChildren":[64]}],[1,"aloud-editor",{"value":[1537],"firebase":[16],"parser":[16],"html":[32],"_isEdit":[32],"getValue":[64]}]]]], options);
});

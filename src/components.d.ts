/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { IApi, IAuthor, IFirebaseConfig, IPost } from "./types";
export namespace Components {
    interface AloudComments {
        /**
          * Firebase configuration. Will be `JSON.parse()`  Requires either string version in HTML or Object version in JSX
         */
        "_firebase": string;
        /**
          * API configuration
         */
        "api": IApi;
        /**
          * CodeMirror theme
         */
        "cmTheme": string;
        /**
          * Whether to generate random entries  Requires `faker` to be installed.
         */
        "debug": boolean;
        /**
          * Firebase configuration  Actually is nullable in Debug mode.
         */
        "firebase": IFirebaseConfig;
        /**
          * Custom `firebaseui.auth.AuthUI` object
         */
        "firebaseui"?: firebaseui.auth.AuthUI;
        /**
          * Number of children to load by default
         */
        "maxChildrenAllowed": number;
        /**
          * Custom markdown parser
         */
        "parser": {
    parse: (md: string) => string;
  };
        /**
          * Allows theme to be set and updated
         */
        "theme"?: 'dark' | 'light';
        /**
          * URL to be used for the database
         */
        "url": string;
    }
    interface AloudEditor {
        "firebase": IFirebaseConfig;
        "getValue": () => Promise<string>;
        "parser": {
    parse: (md: string) => string;
  };
        "theme": string;
        /**
          * Markdown to be parsed in-and-out of the editor  Use `.getValue()` to get and update the value
         */
        "value": string;
    }
    interface AloudEntry {
        "api": IApi;
        "cmTheme": string;
        "depth": number;
        "entry": IPost;
        "firebase": IFirebaseConfig;
        "isSmallScreen": boolean;
        "parser": {
    parse: (md: string) => string;
  };
        "url": string;
        "user"?: IAuthor;
    }
    interface AloudSubentry {
        "api": IApi;
        "cmTheme": string;
        "countChangedListener": (change: {
    entryId: string;
    count: number;
  }) => void;
        "entry": IPost;
        "firebase": IFirebaseConfig;
        "getChildren": () => Promise<IPost[]>;
        "isSmallScreen": boolean;
        "limit": number;
        "parent": IAuthor;
        "parser": {
    parse: (md: string) => string;
  };
        "totalSubEntriesLength": number;
        "url": string;
        "user"?: IAuthor;
    }
}
declare global {
    interface HTMLAloudCommentsElement extends Components.AloudComments, HTMLStencilElement {
    }
    var HTMLAloudCommentsElement: {
        prototype: HTMLAloudCommentsElement;
        new (): HTMLAloudCommentsElement;
    };
    interface HTMLAloudEditorElement extends Components.AloudEditor, HTMLStencilElement {
    }
    var HTMLAloudEditorElement: {
        prototype: HTMLAloudEditorElement;
        new (): HTMLAloudEditorElement;
    };
    interface HTMLAloudEntryElement extends Components.AloudEntry, HTMLStencilElement {
    }
    var HTMLAloudEntryElement: {
        prototype: HTMLAloudEntryElement;
        new (): HTMLAloudEntryElement;
    };
    interface HTMLAloudSubentryElement extends Components.AloudSubentry, HTMLStencilElement {
    }
    var HTMLAloudSubentryElement: {
        prototype: HTMLAloudSubentryElement;
        new (): HTMLAloudSubentryElement;
    };
    interface HTMLElementTagNameMap {
        "aloud-comments": HTMLAloudCommentsElement;
        "aloud-editor": HTMLAloudEditorElement;
        "aloud-entry": HTMLAloudEntryElement;
        "aloud-subentry": HTMLAloudSubentryElement;
    }
}
declare namespace LocalJSX {
    interface AloudComments {
        /**
          * Firebase configuration. Will be `JSON.parse()`  Requires either string version in HTML or Object version in JSX
         */
        "_firebase"?: string;
        /**
          * API configuration
         */
        "api": IApi;
        /**
          * CodeMirror theme
         */
        "cmTheme"?: string;
        /**
          * Whether to generate random entries  Requires `faker` to be installed.
         */
        "debug"?: boolean;
        /**
          * Firebase configuration  Actually is nullable in Debug mode.
         */
        "firebase": IFirebaseConfig;
        /**
          * Custom `firebaseui.auth.AuthUI` object
         */
        "firebaseui"?: firebaseui.auth.AuthUI;
        /**
          * Number of children to load by default
         */
        "maxChildrenAllowed"?: number;
        /**
          * Custom markdown parser
         */
        "parser"?: {
    parse: (md: string) => string;
  };
        /**
          * Allows theme to be set and updated
         */
        "theme"?: 'dark' | 'light';
        /**
          * URL to be used for the database
         */
        "url"?: string;
    }
    interface AloudEditor {
        "firebase": IFirebaseConfig;
        "parser": {
    parse: (md: string) => string;
  };
        "theme": string;
        /**
          * Markdown to be parsed in-and-out of the editor  Use `.getValue()` to get and update the value
         */
        "value"?: string;
    }
    interface AloudEntry {
        "api": IApi;
        "cmTheme": string;
        "depth": number;
        "entry": IPost;
        "firebase": IFirebaseConfig;
        "isSmallScreen": boolean;
        "onDelete"?: (event: CustomEvent<{
    entryId: string;
    hasChildren: boolean;
  }>) => void;
        "parser": {
    parse: (md: string) => string;
  };
        "url": string;
        "user"?: IAuthor;
    }
    interface AloudSubentry {
        "api": IApi;
        "cmTheme": string;
        "countChangedListener": (change: {
    entryId: string;
    count: number;
  }) => void;
        "entry": IPost;
        "firebase": IFirebaseConfig;
        "isSmallScreen": boolean;
        "limit": number;
        "onChildrenCountChanged"?: (event: CustomEvent<{
    entryId: string;
    count: number;
  }>) => void;
        "onDelete"?: (event: CustomEvent<{
    entryId: string;
    hasChildren: boolean;
  }>) => void;
        "parent": IAuthor;
        "parser": {
    parse: (md: string) => string;
  };
        "totalSubEntriesLength": number;
        "url": string;
        "user"?: IAuthor;
    }
    interface IntrinsicElements {
        "aloud-comments": AloudComments;
        "aloud-editor": AloudEditor;
        "aloud-entry": AloudEntry;
        "aloud-subentry": AloudSubentry;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "aloud-comments": LocalJSX.AloudComments & JSXBase.HTMLAttributes<HTMLAloudCommentsElement>;
            "aloud-editor": LocalJSX.AloudEditor & JSXBase.HTMLAttributes<HTMLAloudEditorElement>;
            "aloud-entry": LocalJSX.AloudEntry & JSXBase.HTMLAttributes<HTMLAloudEntryElement>;
            "aloud-subentry": LocalJSX.AloudSubentry & JSXBase.HTMLAttributes<HTMLAloudSubentryElement>;
        }
    }
}

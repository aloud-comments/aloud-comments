import { Component, Prop, State, h } from '@stencil/core';
import S from 'jsonschema-definer';
import { randomAuthor, randomPost } from '../../utils/faker';
import { ShowdownParser } from '../../utils/parser';
export class AloudComments {
  constructor() {
    /**
     * API configuration
     */
    this.api = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get: null
    };
    /**
     * Number of children to load by default
     */
    this.maxChildrenAllowed = 3;
    /**
     * Whether to generate random entries
     *
     * Requires `faker` to be installed.
     */
    this.debug = false;
    this.entries = [];
    this.hasMore = true;
  }
  componentWillLoad() {
    if (!this.debug) {
      this.firebase
        = this.firebase || S.object().ensure(JSON.parse(this._firebase));
    }
    this.parser = this.parser || new ShowdownParser();
    this.api.get
      = this.api.get
        || (() => {
          const authors = {
            collection: [],
            new() {
              const a = randomAuthor();
              this.collection.push(a);
              return a;
            },
            random() {
              return this.collection[Math.floor(Math.random() * this.collection.length)];
            }
          };
          this.user = authors.new();
          Array(4)
            .fill(null)
            .map(() => authors.new());
          const posts = {
            collection: new Map(),
            children: new Map(),
            new(author, id, parent) {
              parent = parent || null;
              const a = Object.assign(Object.assign({}, randomPost(parent
                ? new Date(this.collection.get(parent).createdAt)
                : undefined)), { id,
                author });
              this.collection.set(a.id, a);
              const children = this.children.get(parent) || [];
              children.push(a);
              this.children.set(parent, children);
              return a;
            }
          };
          const genPost = (parents = [], minItems = 0, alwaysChild = 0) => {
            if (parents.length > 5) {
              return;
            }
            Array(Math.floor(Math.random() ** 2 * 10) + minItems)
              .fill(null)
              .map((_, i) => {
              posts.new(authors.random(), parents.map(j => j.toString()).join('') + i.toString(), parents.map(j => j.toString()).join(''));
              Array(alwaysChild)
                .fill(null)
                .map(() => {
                genPost([...parents, i]);
              });
              if (Math.random() ** 2 > 0.5) {
                genPost([...parents, i]);
              }
            });
          };
          genPost([], 3, 1);
          return async ({ parentId, after, limit = this.maxChildrenAllowed }) => {
            let out = (posts.children.get(parentId || null) || []).sort((i1, i2) => i2.createdAt - i1.createdAt);
            const i = after ? out.map(({ id }) => id).indexOf(after) : -1;
            if (i !== -1) {
              out = out.slice(i + 1);
            }
            return {
              hasMore: out.length > limit,
              result: out.slice(0, limit)
            };
          };
        })();
    /**
     * `null` just stress that it is absolutely no parent, yet can still be switch case'd and comparable
     */
    this.api.get({ parentId: null }).then(({ result, hasMore }) => {
      this.entries = result;
      this.hasMore = hasMore;
    });
  }
  doLoad() {
    var _a;
    /**
     * `null` just stress that it is absolutely no parent, yet can still be switch case'd and comparable
     */
    this.api
      .get({ parentId: null, after: (_a = this.entries[this.entries.length - 1]) === null || _a === void 0 ? void 0 : _a.id })
      .then(({ result, hasMore }) => {
      this.entries = [...this.entries, ...result];
      this.hasMore = hasMore;
    });
  }
  render() {
    return (h("main", null,
      h("article", { class: "media mb-4" },
        h("figure", { class: "media-left" },
          h("p", { class: "image is-64x64" }, this.user ? (h("img", { src: this.user.image, alt: this.user.name, title: this.user.name })) : (h("img", { src: "https://www.gravatar.com/avatar?d=mp" })))),
        h("div", { class: "media-content" },
          h("div", { class: "field" },
            h("p", { class: "control" },
              h("div", { class: "textarea" },
                h("aloud-editor", { parser: this.parser, firebase: this.firebase, ref: el => {
                    this.mainEditor = el;
                  } })))),
          h("nav", { class: "level" },
            h("div", { class: "level-left" },
              h("div", { class: "level-item" },
                h("button", { class: "button is-info", type: "button", onClick: () => {
                    this.mainEditor
                      .getValue()
                      .then(async (v) => {
                      if (!this.user) {
                        return;
                      }
                      if (this.api.post) {
                        return this.api
                          .post({
                          authorId: this.user.id,
                          markdown: v
                        })
                          .then(({ entryId }) => {
                          this.entries = [
                            {
                              id: entryId,
                              author: this.user,
                              markdown: v,
                              createdAt: +new Date(),
                              updatedAt: undefined
                            },
                            ...this.entries
                          ];
                        });
                      }
                      this.entries = [
                        {
                          id: Math.random().toString(36).substr(2),
                          author: this.user,
                          markdown: v,
                          createdAt: +new Date(),
                          updatedAt: undefined
                        },
                        ...this.entries
                      ];
                    })
                      .finally(() => {
                      this.mainEditor.value = '';
                    });
                  } }, "Submit")))))),
      this.entries.map(it => (h("aloud-entry", { key: it.id, parser: this.parser, user: this.user, entry: it, api: this.api, firebase: this.firebase, depth: 1 }))),
      this.hasMore ? (h("button", { class: "more", type: "button", onClick: () => this.doLoad() }, "Click for more")) : null));
  }
  static get is() { return "aloud-comments"; }
  static get encapsulation() { return "shadow"; }
  static get originalStyleUrls() { return {
    "$": ["aloud-comments.scss"]
  }; }
  static get styleUrls() { return {
    "$": ["aloud-comments.css"]
  }; }
  static get properties() { return {
    "_firebase": {
      "type": "string",
      "mutable": false,
      "complexType": {
        "original": "string",
        "resolved": "string",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Firebase configuration. Will be `JSON.parse()`\n\nRequires either string version in HTML or Object version in JSX"
      },
      "attribute": "firebase",
      "reflect": false
    },
    "firebase": {
      "type": "unknown",
      "mutable": true,
      "complexType": {
        "original": "IFirebaseConfig",
        "resolved": "{ [k: string]: unknown; }",
        "references": {
          "IFirebaseConfig": {
            "location": "local"
          }
        }
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Firebase configuration\n\nActually is nullable in Debug mode."
      }
    },
    "firebaseui": {
      "type": "unknown",
      "mutable": true,
      "complexType": {
        "original": "firebaseui.auth.AuthUI",
        "resolved": "AuthUI",
        "references": {
          "firebaseui": {
            "location": "global"
          }
        }
      },
      "required": false,
      "optional": true,
      "docs": {
        "tags": [],
        "text": "Custom `firebaseui.auth.AuthUI` object"
      }
    },
    "api": {
      "type": "unknown",
      "mutable": true,
      "complexType": {
        "original": "IApi",
        "resolved": "IApi",
        "references": {
          "IApi": {
            "location": "local"
          }
        }
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "API configuration"
      },
      "defaultValue": "{\n    // eslint-disable-next-line @typescript-eslint/no-explicit-any\n    get: null as any\n  }"
    },
    "parser": {
      "type": "unknown",
      "mutable": true,
      "complexType": {
        "original": "{\n    parse: (md: string) => string;\n  }",
        "resolved": "{ parse: (md: string) => string; }",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "maxChildrenAllowed": {
      "type": "number",
      "mutable": false,
      "complexType": {
        "original": "number",
        "resolved": "number",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Number of children to load by default"
      },
      "attribute": "max-children-allowed",
      "reflect": false,
      "defaultValue": "3"
    },
    "debug": {
      "type": "boolean",
      "mutable": false,
      "complexType": {
        "original": "boolean",
        "resolved": "boolean",
        "references": {}
      },
      "required": false,
      "optional": false,
      "docs": {
        "tags": [],
        "text": "Whether to generate random entries\n\nRequires `faker` to be installed."
      },
      "attribute": "debug",
      "reflect": false,
      "defaultValue": "false"
    }
  }; }
  static get states() { return {
    "user": {},
    "entries": {},
    "hasMore": {}
  }; }
}

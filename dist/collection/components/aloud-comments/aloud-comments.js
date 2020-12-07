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
     * Whether to generate random entries
     *
     * Requires `faker` to be installed.
     */
    this.debug = false;
    this.entries = [];
  }
  componentWillLoad() {
    if (!this.debug) {
      this.firebase
        = this.firebase
          || S.object().ensure(JSON.parse(this._firebase));
    }
    this.parser = this.parser || new ShowdownParser();
    this.api.get
      = this.api.get
        || (async ({ parentId }) => {
          const authors = {
            collection: [],
            new() {
              const a = randomAuthor();
              this.collection.push(a);
              return a;
            }
          };
          let out = [];
          const posts = {
            collection: new Map(),
            new(id, parent) {
              const a = randomPost(parent
                ? new Date(this.collection.get(parent).createdAt)
                : undefined);
              this.collection.set(id, Object.assign(Object.assign({}, a), { id }));
              return a;
            }
          };
          this.user = authors.new();
          switch (parentId) {
            case '111':
              out = [
                Object.assign(Object.assign({}, posts.new('1111', '111')), { author: this.user })
              ];
              break;
            case '11':
              out = [
                Object.assign(Object.assign({}, posts.new('111', '11')), { author: authors.new() })
              ];
              break;
            case '1':
              out = [
                Object.assign(Object.assign({}, posts.new('11', '1')), { author: authors.collection[0] }),
                Object.assign(Object.assign({}, posts.new('12', '1')), { author: authors.new() })
              ];
              break;
            case null:
              out = [
                Object.assign(Object.assign({}, posts.new('0')), { author: authors.new() }),
                Object.assign(Object.assign({}, posts.new('1')), { author: authors.new() }),
                Object.assign(Object.assign({}, posts.new('2')), { author: authors.collection[4] })
              ];
          }
          return out.sort((i1, i2) => i2.createdAt - i1.createdAt);
        });
    /**
     * `null` just stress that it is absolutely no parent, yet can still be switch case'd and comparable
     */
    this.api.get({ parentId: null }).then(data => {
      this.entries = data;
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
                          id: Math.random()
                            .toString(36)
                            .substr(2),
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
      this.entries.map(it => (h("aloud-entry", { key: it.id, parser: this.parser, user: this.user, entry: it, api: this.api, firebase: this.firebase, depth: 1 })))));
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
        "text": "Firebase configuration"
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
    "entries": {}
  }; }
}

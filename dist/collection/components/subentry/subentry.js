import { Component, Event, Host, Method, Prop, State, h } from '@stencil/core';
import { humanizeDurationToNow } from '../../utils/humanize';
/**
 * @internal
 */
export class AloudSubEntry {
  constructor() {
    this.isEdit = false;
    this.isReply = false;
    this.children = [];
    this.hasMore = true;
    this.doLoad(false);
  }
  async getChildren() {
    return this.children;
  }
  doLoad(forced) {
    var _a;
    if (!forced && !this.limit) {
      return;
    }
    this.api
      .get({
      parentId: this.entry.id,
      after: (_a = this.children[this.children.length - 1]) === null || _a === void 0 ? void 0 : _a.id,
      limit: this.limit
    })
      .then(({ result, hasMore }) => {
      this.children = [...this.children, ...result];
      this.hasMore = hasMore;
      this.childrenCountChanged.emit({
        entryId: this.entry.id,
        count: this.children.length
      });
    });
  }
  render() {
    var _a, _b;
    return (h(Host, null,
      this.isEdit ? (h("aloud-editor", { parser: this.parser, firebase: this.firebase, ref: el => {
          this.editor = el;
        }, value: this.entry.markdown })) : (h("small", { ref: () => {
          if (this.editor) {
            this.editor.getValue().then(async (v) => {
              if (this.api.update) {
                return this.api
                  .update({
                  entryId: this.entry.id,
                  markdown: v
                })
                  .then(() => {
                  this.entry = Object.assign(Object.assign({}, this.entry), { markdown: v });
                });
              }
              this.entry = Object.assign(Object.assign({}, this.entry), { markdown: v });
            });
          }
        }, innerHTML: this.parser.parse(`[**@${this.parent.name}**](#) ` + this.entry.markdown) })),
      h("small", { class: "dot-separated" },
        this.entry.author.id === ((_a = this.user) === null || _a === void 0 ? void 0 : _a.id) ? (h("span", null,
          h("a", { role: "button", onClick: () => {
              if (this.editor) {
                this.editor.getValue().then(async (v) => {
                  if (this.api.update) {
                    return this.api
                      .update({
                      entryId: this.entry.id,
                      markdown: v
                    })
                      .then(() => {
                      this.entry = Object.assign(Object.assign({}, this.entry), { markdown: v });
                    });
                  }
                  this.entry = Object.assign(Object.assign({}, this.entry), { markdown: v });
                });
              }
              this.isEdit = !this.isEdit;
            } }, this.isEdit ? 'Save' : 'Edit'))) : ([
          // eslint-disable-next-line react/jsx-key
          h("span", null,
            h("a", { role: "button", title: "Like" }, "\u2764\uFE0F")),
          // eslint-disable-next-line react/jsx-key
          h("span", null,
            h("a", { role: "button", title: "Dislike" }, "\uD83D\uDC4E")),
          // eslint-disable-next-line react/jsx-key
          h("span", null,
            h("a", { role: "button", title: "Bookmark" }, "\uD83D\uDD16"))
        ]),
        h("span", null,
          h("a", { role: "button", onClick: () => {
              if (this.replier) {
                this.replier
                  .getValue()
                  .then(async (v) => {
                  if (!v.trim()) {
                    return;
                  }
                  if (this.api.post) {
                    return this.api
                      .post({
                      authorId: this.entry.author.id,
                      parentId: this.entry.id,
                      markdown: v
                    })
                      .then(({ entryId }) => {
                      this.children = [
                        {
                          id: entryId,
                          author: this.entry.author,
                          markdown: v,
                          createdAt: +new Date(),
                          updatedAt: undefined
                        },
                        ...this.children
                      ];
                    });
                  }
                  this.children = [
                    {
                      id: Math.random().toString(36).substr(2),
                      author: this.entry.author,
                      markdown: v,
                      createdAt: +new Date(),
                      updatedAt: undefined
                    },
                    ...this.children
                  ];
                })
                  .finally(() => {
                  this.replier.value = '';
                });
              }
              this.isReply = !this.isReply;
            } }, this.isReply ? 'Post reply' : 'Reply')),
        h("span", null, humanizeDurationToNow(this.entry.createdAt)),
        h("span", { class: "small-author" },
          "by",
          ' ',
          this.entry.author.id === ((_b = this.user) === null || _b === void 0 ? void 0 : _b.id)
            ? 'me'
            : this.entry.author.name)),
      this.isReply ? (h("aloud-editor", { ref: el => {
          this.replier = el;
        }, parser: this.parser, firebase: this.firebase })) : null,
      this.children.map(it => (h("aloud-subentry", { key: it.id, parser: this.parser, user: this.user, parent: this.entry.author, entry: it, api: this.api, firebase: this.firebase, limit: this.totalSubEntriesLength > 5 ? 0 : this.limit, totalSubEntriesLength: this.totalSubEntriesLength, countChangedListener: this.countChangedListener, onChildrenCountChanged: evt => this.countChangedListener(evt.detail) }))),
      this.hasMore ? (h("button", { class: "more", type: "button", onClick: () => this.doLoad(true) }, "Click for more")) : null));
  }
  static get is() { return "aloud-subentry"; }
  static get encapsulation() { return "scoped"; }
  static get originalStyleUrls() { return {
    "$": ["subentry.scss"]
  }; }
  static get styleUrls() { return {
    "$": ["subentry.css"]
  }; }
  static get properties() { return {
    "user": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "IAuthor",
        "resolved": "{ id: string; name: string; image: string; gender: string; }",
        "references": {
          "IAuthor": {
            "location": "import",
            "path": "../../utils/faker"
          }
        }
      },
      "required": false,
      "optional": true,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "parent": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "IAuthor",
        "resolved": "{ id: string; name: string; image: string; gender: string; }",
        "references": {
          "IAuthor": {
            "location": "import",
            "path": "../../utils/faker"
          }
        }
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "entry": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "IPost",
        "resolved": "{ id: string; author: { id: string; name: string; image: string; gender: string; }; markdown: string; createdAt: number; updatedAt: number; }",
        "references": {
          "IPost": {
            "location": "import",
            "path": "../../utils/faker"
          }
        }
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "api": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "IApi",
        "resolved": "IApi",
        "references": {
          "IApi": {
            "location": "import",
            "path": "../aloud-comments/aloud-comments"
          }
        }
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "firebase": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "IFirebaseConfig",
        "resolved": "{ [k: string]: unknown; }",
        "references": {
          "IFirebaseConfig": {
            "location": "import",
            "path": "../aloud-comments/aloud-comments"
          }
        }
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "parser": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "{\n    parse: (md: string) => string;\n  }",
        "resolved": "{ parse: (md: string) => string; }",
        "references": {}
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "countChangedListener": {
      "type": "unknown",
      "mutable": false,
      "complexType": {
        "original": "(change: {\n    entryId: string;\n    count: number;\n  }) => void",
        "resolved": "(change: { entryId: string; count: number; }) => void",
        "references": {}
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      }
    },
    "limit": {
      "type": "number",
      "mutable": false,
      "complexType": {
        "original": "number",
        "resolved": "number",
        "references": {}
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      },
      "attribute": "limit",
      "reflect": false
    },
    "totalSubEntriesLength": {
      "type": "number",
      "mutable": false,
      "complexType": {
        "original": "number",
        "resolved": "number",
        "references": {}
      },
      "required": true,
      "optional": false,
      "docs": {
        "tags": [],
        "text": ""
      },
      "attribute": "total-sub-entries-length",
      "reflect": false
    }
  }; }
  static get states() { return {
    "isEdit": {},
    "isReply": {},
    "children": {},
    "hasMore": {}
  }; }
  static get events() { return [{
      "method": "childrenCountChanged",
      "name": "childrenCountChanged",
      "bubbles": true,
      "cancelable": true,
      "composed": true,
      "docs": {
        "tags": [],
        "text": ""
      },
      "complexType": {
        "original": "{\n    entryId: string;\n    count: number;\n  }",
        "resolved": "{ entryId: string; count: number; }",
        "references": {}
      }
    }]; }
  static get methods() { return {
    "getChildren": {
      "complexType": {
        "signature": "() => Promise<IPost[]>",
        "parameters": [],
        "references": {
          "Promise": {
            "location": "global"
          },
          "IPost": {
            "location": "import",
            "path": "../../utils/faker"
          }
        },
        "return": "Promise<{ id: string; author: { id: string; name: string; image: string; gender: string; }; markdown: string; createdAt: number; updatedAt: number; }[]>"
      },
      "docs": {
        "text": "",
        "tags": []
      }
    }
  }; }
}

import { Component, Host, Prop, State, h } from '@stencil/core';
import { humanizeDurationToNow } from '../../utils/humanize';
/**
 * @internal
 */
export class AloudEntry {
  constructor() {
    this.isEdit = false;
    this.isReply = false;
    this.maxDepth = 2;
    this.children = [];
    this.hasMore = true;
    this.subEntries = new Map();
    this.newSubEntriesAllowed = 2;
    this.subEntryCountListener = (p) => {
      this.subEntries.set(p.entryId, { count: p.count });
    };
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const cls = this;
    matchMedia('(max-width: 600px)').onchange = evt => {
      cls.maxDepth = evt.matches ? 1 : 2;
    };
    this.doLoad();
  }
  get subEntriesLength() {
    return Array.from(this.subEntries.values()).reduce((prev, c) => prev + c.count, 0);
  }
  doLoad() {
    var _a;
    this.api
      .get({
      parentId: this.entry.id,
      after: (_a = this.children[this.children.length - 1]) === null || _a === void 0 ? void 0 : _a.id
    })
      .then(({ result, hasMore }) => {
      this.children = [...this.children, ...result];
      this.hasMore = hasMore;
    });
  }
  render() {
    var _a;
    return (h(Host, { class: "media" },
      h("figure", { class: "media-left" },
        h("p", { class: "image is-48x48" },
          h("img", { src: this.entry.author.image, alt: this.entry.author.name, title: this.entry.author.name }))),
      h("div", { class: "media-content" },
        h("div", { class: "content" },
          h("h5", null, this.entry.author.name),
          this.isEdit ? (h("aloud-editor", { class: "textarea", parser: this.parser, firebase: this.firebase, ref: el => {
              this.editor = el;
            }, value: this.entry.markdown })) : (h("div", { innerHTML: this.parser.parse(this.entry.markdown) })),
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
                    this.replier.getValue().then(async (v) => {
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
                    });
                  }
                  this.isReply = !this.isReply;
                } }, this.isReply ? 'Post reply' : 'Reply')),
            h("span", null, humanizeDurationToNow(this.entry.createdAt)))),
        this.isReply ? (h("aloud-editor", { class: "textarea", parser: this.parser, ref: el => {
            this.replier = el;
          }, firebase: this.firebase })) : null,
        this.children.map(it => this.depth > this.maxDepth ? (h("aloud-subentry", { parser: this.parser, user: this.user, parent: this.entry.author, entry: it, api: this.api, firebase: this.firebase, limit: this.newSubEntriesAllowed, totalSubEntriesLength: this.subEntriesLength, countChangedListener: this.subEntryCountListener, onChildrenCountChanged: evt => this.subEntryCountListener(evt.detail) })) : (h("aloud-entry", { parser: this.parser, user: this.user, entry: it, api: this.api, firebase: this.firebase, depth: this.depth + 1 }))),
        this.hasMore ? (h("button", { class: "more", type: "button", onClick: () => this.doLoad() }, "Click for more")) : null)));
  }
  static get is() { return "aloud-entry"; }
  static get encapsulation() { return "scoped"; }
  static get originalStyleUrls() { return {
    "$": ["entry.scss"]
  }; }
  static get styleUrls() { return {
    "$": ["entry.css"]
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
    "depth": {
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
      "attribute": "depth",
      "reflect": false
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
    }
  }; }
  static get states() { return {
    "isEdit": {},
    "isReply": {},
    "maxDepth": {},
    "children": {},
    "hasMore": {},
    "subEntries": {}
  }; }
}

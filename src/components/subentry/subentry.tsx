import {
  Component,
  Event,
  EventEmitter,
  Host,
  Method,
  Prop,
  State,
  h
} from '@stencil/core'
import { HTMLStencilElement } from '@stencil/core/internal'

import { Entry, initEntry } from '../../base/Entry'
import { EntryViewer, initEntryViewer } from '../../base/EntryViewer'
import {
  IApi,
  IAuthor,
  IFirebaseConfig,
  IPost,
  IReactionType
} from '../../types'

/**
 * @internal
 */
@Component({
  tag: 'aloud-subentry',
  styleUrl: 'subentry.scss',
  scoped: true
})
export class AloudSubEntry implements EntryViewer, Entry {
  @Prop() user?: IAuthor;
  @Prop() parent!: IAuthor;
  @Prop({
    mutable: true
  })
  entry!: IPost;

  @Prop() api!: IApi;
  @Prop() firebase!: IFirebaseConfig;
  @Prop() parser!: {
    parse: (md: string) => string;
  };

  @Prop() countChangedListener!: (change: {
    entryId: string;
    count: number;
  }) => void;

  @Prop() limit!: number;
  @Prop() totalSubEntriesLength!: number;
  @Prop() isSmallScreen!: boolean;

  @Event() childrenCountChanged!: EventEmitter<{
    entryId: string;
    count: number;
  }>;

  @Event() delete!: EventEmitter<{
    entryId: string;
    hasChildren: boolean;
  }>;

  @State() isEdit = false;
  @State() isReply = false;
  @State() isExpanded = false;
  @State() children: IPost[] = [];
  @State() hasMore = true;

  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;
  getReaction: (r: IReactionType) => Set<string>;
  setReaction: (r: IReactionType) => Promise<void>;
  getSmallNav: (showAuthor: boolean) => HTMLElement;

  constructor () {
    initEntryViewer(this)
    initEntry(this)
    this.doLoad(false)
  }

  @Method()
  async getChildren (): Promise<IPost[]> {
    return this.children
  }

  render (): HTMLStencilElement {
    return (
      <Host>
        {this.isEdit ? (
          <aloud-editor
            parser={this.parser}
            firebase={this.firebase}
            ref={el => {
              this.editor = el
            }}
            value={this.entry.markdown}
          />
        ) : (
          <small
            role="button"
            onClick={() => {
              this.isExpanded = true
            }}
            innerHTML={(() => {
              const markdown
                = `[**@${this.parent.name}**](#) ` + this.entry.markdown

              if (this.isExpanded || !this.isSmallScreen) {
                return this.parser.parse(markdown)
              }

              const body = document.createElement('body')
              body.innerHTML = this.parser.parse(
                this.entry.markdown.slice(0, 80)
              )

              const { lastElementChild } = body.firstElementChild || {}
              if (lastElementChild instanceof HTMLParagraphElement) {
                lastElementChild.innerHTML += '...'
              } else {
                body.innerHTML += '...'
              }

              return body.innerHTML
            })()}
          />
        )}

        {this.getSmallNav(true)}

        {this.isReply ? (
          <aloud-editor
            ref={el => {
              this.replier = el
            }}
            parser={this.parser}
            firebase={this.firebase}
          ></aloud-editor>
        ) : null}

        {this.children.map(it => (
          <aloud-subentry
            key={it.id}
            parser={this.parser}
            user={this.user}
            parent={this.entry.author}
            entry={it}
            api={this.api}
            firebase={this.firebase}
            limit={this.totalSubEntriesLength > 5 ? 0 : this.limit}
            isSmallScreen={this.isSmallScreen}
            totalSubEntriesLength={this.totalSubEntriesLength}
            countChangedListener={this.countChangedListener}
            onDelete={evt => this.doDelete(evt.detail)}
            onChildrenCountChanged={evt =>
              this.countChangedListener(evt.detail)
            }
          ></aloud-subentry>
        ))}

        {this.hasMore ? (
          <button class="more" type="button" onClick={() => this.doLoad(true)}>
            Click for more (to @{this.parent.name})
          </button>
        ) : null}
      </Host>
    )
  }
}

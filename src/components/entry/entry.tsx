import {
  Component,
  Event,
  EventEmitter,
  Host,
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
  tag: 'aloud-entry',
  styleUrl: 'entry.scss',
  scoped: true
})
export class AloudEntry implements EntryViewer, Entry {
  @Prop() user?: IAuthor;
  @Prop({
    mutable: true
  })
  entry!: IPost;

  @Prop() api!: IApi;
  @Prop() firebase!: IFirebaseConfig;
  @Prop() depth!: number;
  @Prop() parser!: {
    parse: (md: string) => string;
  };

  @Prop() isSmallScreen!: boolean;

  @Event() delete!: EventEmitter<{
    entryId: string;
    hasChildren: boolean;
  }>;

  @State() isEdit = false;
  @State() isReply = false;
  @State() isExpanded = false;
  @State() children: IPost[] = [];
  @State() hasMore = true;
  @State() subEntries = new Map<
    string,
    {
      count: number;
    }
  >();

  readonly limit = 3;

  getReaction: (r: IReactionType) => Set<string>;
  setReaction: (r: IReactionType) => Promise<void>;
  getSmallNav: (showAuthor: boolean) => HTMLElement;

  subEntryCountListener = (p: { entryId: string; count: number }): void => {
    this.subEntries.set(p.entryId, { count: p.count })
  };

  editor: HTMLAloudEditorElement;
  replier: HTMLAloudEditorElement;

  doLoad: (forced: boolean) => void;
  doDelete: (p: { entryId: string; hasChildren: boolean }) => Promise<void>;

  get subEntriesLength (): number {
    return Array.from(this.subEntries.values()).reduce(
      (prev, c) => prev + c.count,
      0
    )
  }

  get maxDepth (): number {
    if (this.isSmallScreen) {
      return 1
    }

    return 2
  }

  constructor () {
    initEntryViewer(this)
    initEntry(this)
    this.doLoad(false)
  }

  render (): HTMLStencilElement {
    return (
      <Host class="media">
        <figure class="media-left">
          <p class="image is-48x48">
            <img
              src={this.entry.author.image}
              alt={this.entry.author.name}
              title={this.entry.author.name}
            />
          </p>
        </figure>
        <div class="media-content">
          <div class="content">
            <h5>
              {this.entry.author.name}
              {this.entry.author.id === this.user?.id ? <i>{' (me)'}</i> : null}
            </h5>
            {this.isEdit ? (
              <aloud-editor
                class="textarea"
                parser={this.parser}
                firebase={this.firebase}
                ref={el => {
                  this.editor = el
                }}
                value={this.entry.markdown}
              />
            ) : (
              <div
                role="button"
                onClick={() => {
                  this.isExpanded = true
                }}
                innerHTML={(() => {
                  if (this.isExpanded || !this.isSmallScreen) {
                    return this.parser.parse(this.entry.markdown)
                  }

                  const body = document.createElement('body')
                  body.innerHTML = this.parser.parse(
                    this.entry.markdown.slice(0, 140)
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

            {this.getSmallNav(false)}
          </div>

          {this.isReply ? (
            <aloud-editor
              class="textarea"
              parser={this.parser}
              ref={el => {
                this.replier = el
              }}
              firebase={this.firebase}
            ></aloud-editor>
          ) : null}

          {this.children.map(it =>
            this.depth > this.maxDepth ? (
              <aloud-subentry
                parser={this.parser}
                user={this.user}
                parent={this.entry.author}
                entry={it}
                api={this.api}
                firebase={this.firebase}
                limit={this.limit}
                isSmallScreen={this.isSmallScreen}
                totalSubEntriesLength={this.subEntriesLength}
                countChangedListener={this.subEntryCountListener}
                onDelete={evt => this.doDelete(evt.detail)}
                onChildrenCountChanged={evt =>
                  this.subEntryCountListener(evt.detail)
                }
              ></aloud-subentry>
            ) : (
              <aloud-entry
                parser={this.parser}
                user={this.user}
                entry={it}
                api={this.api}
                firebase={this.firebase}
                depth={this.depth + 1}
                isSmallScreen={this.isSmallScreen}
                onDelete={evt => this.doDelete(evt.detail)}
              ></aloud-entry>
            )
          )}

          {this.hasMore ? (
            <button
              class="more"
              type="button"
              onClick={() => this.doLoad(true)}
            >
              Click for more
            </button>
          ) : null}
        </div>
      </Host>
    )
  }
}

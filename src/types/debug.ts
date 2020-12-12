import { IApi, IAuthor, IAuthorNormalized, IPostNormalized } from './base'

export function cryptoRandomId (): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)

  return buf[0].toString(36)
}

export abstract class DebuggableAPI implements IApi {
  private notSoRecent = new Date(+new Date() - 1000 * 60 * 60);

  baseURL = this.cleanURL(
    location.href.replace(/#[^/].*$/, '').replace(/#\/.*$/, '')
  );

  authorIds: string[] = [];
  firstAuthor: IAuthor;

  // eslint-disable-next-line no-useless-constructor
  constructor (
    protected w: {
      faker: typeof import('faker');
      txtgen: typeof import('txtgen');
    }
  ) {}

  protected abstract getAuthorIds(): Promise<string[]>;

  public abstract addAuthor(
    a: Omit<IAuthorNormalized, 'id'> & { id?: string },
  ): Promise<IAuthorNormalized>;

  public abstract getAuthor(id: string): Promise<IAuthorNormalized | null>;

  protected abstract addPost(
    p: Omit<IPostNormalized, 'id'> & { id?: string },
  ): Promise<IPostNormalized>;

  protected abstract getPost(id: string): Promise<IPostNormalized | null>;

  protected abstract findPosts(
    p: Partial<IPostNormalized>,
    opts: {
      after?: string;
      limit: number;
    },
  ): Promise<{
    result: IPostNormalized[];
    hasMore: boolean;
  }>;

  protected abstract countPosts<O>(
    p: Partial<IPostNormalized>,
    opts?: O,
  ): Promise<number>;

  protected abstract updatePost(
    id: string,
    p: Partial<Omit<IPostNormalized, 'id'>>,
  ): Promise<boolean>;

  protected abstract deletePost(id: string): Promise<boolean>;

  private cleanURL (u: string) {
    return u
      .replace(/#[^/].*$/, '')
      .replace(/#\/$/, '')
      .replace(/\/$/, '')
  }

  public async populateDebug (urls: string[]): Promise<void> {
    const authorCount = 5
    const minItemsAtFirstLevel = 3

    urls = urls
      .map(u => this.cleanURL(u))
      .map(u =>
        /:\/\//.test(u)
          ? u
          : u.startsWith('/')
            ? this.baseURL + u
            : this.baseURL + '/' + u
      )

    if (!urls.includes(this.baseURL)) {
      urls.push(this.baseURL)
    }

    this.authorIds = await this.getAuthorIds()

    if (!this.authorIds.length) {
      this.authorIds = await Promise.all(
        Array(authorCount)
          .fill(null)
          .map(() => this.makeAuthor().then(a => a.id))
      )
    }

    this.firstAuthor = await this.getAuthor(this.authorIds[0])

    await Promise.all(
      urls.map(u =>
        this.countPosts({
          url: u
        }).then(async c => {
          if (!c) {
            return this.recurseGenPost(u, {
              depth: 0,
              minItems: minItemsAtFirstLevel
            })
          }
          return c
        })
      )
    )
  }

  private async recurseGenPost (
    url: string,
    {
      parentId = '',
      minItems = 1,
      depth
    }: {
      parentId?: string;
      minItems?: number;
      depth: number;
    }
  ): Promise<IPostNormalized[]> {
    if (depth > 5) {
      return []
    }

    let hasChildren = false

    let out: IPostNormalized[] = (
      await Promise.all(
        Array(Math.floor(Math.random() ** 2 * 9) + minItems)
          .fill(null)
          .map(async () => {
            const p = await this.makePost(url, parentId)

            const ps = [p]

            if (Math.random() > 0.5) {
              hasChildren = true
              return [
                ...ps,
                ...(await this.recurseGenPost(url, {
                  parentId: p.id,
                  depth: depth + 1
                }))
              ]
            }

            return ps
          })
      )
    ).reduce((prev, c) => [...prev, ...c], [])

    if (depth < 5 && !hasChildren) {
      const p = await this.makePost(url, parentId)
      out = [
        ...out,
        p,
        ...(await this.recurseGenPost(url, {
          parentId: p.id,
          depth: depth + 1
        }))
      ]
    }

    return out
  }

  private async makeAuthor (): Promise<IAuthor> {
    const gender = Math.random() > 0.5 ? 'female' : 'male'
    const out: IAuthorNormalized = {
      id: cryptoRandomId(),
      name: this.w.faker.internet.userName(),
      image: `https://joeschmoe.io/api/v1/${gender}/${Math.random()
        .toString(36)
        .substr(2)}`,
      gender
    }

    return this.addAuthor(out)
  }

  private async makePost (
    url: string,
    parentId?: string | null,
    id = cryptoRandomId()
  ): Promise<
    IPostNormalized & {
      id: string;
    }
  > {
    parentId = parentId || ''
    let parent: IPostNormalized | null = null
    if (parentId) {
      parent = await this.getPost(parentId)
    }

    if (!parent) {
      parentId = ''
    }

    const out: IPostNormalized = {
      id,
      url,
      parentId,
      authorId: this.authorIds[
        Math.floor(Math.random() ** 1.5 * this.authorIds.length)
      ],
      markdown: Array(Math.floor(Math.random() ** 1.5 * 3) + 1)
        .fill(null)
        .map(() => this.w.txtgen.paragraph(Math.floor(Math.random() * 3) + 1))
        .join('\n\n'),
      createdAt: +(parent
        ? this.w.faker.date.between(
            new Date(parent.createdAt),
            this.notSoRecent
          )
        : this.makeDate()),
      like: Array(Math.floor(Math.random() ** 3 * 10))
        .fill(null)
        .map(() => Math.random().toString(36).substr(2)),
      dislike: Array(Math.floor(Math.random() ** 3 * 5))
        .fill(null)
        .map(() => Math.random().toString(36).substr(2)),
      bookmark: Array(Math.floor(Math.random() ** 3 * 10))
        .fill(null)
        .map(() => Math.random().toString(36).substr(2))
    }

    return this.addPost(out)
  }

  private makeDate (seed = Math.random()): Date {
    if (seed < 0.5) {
      return this.w.faker.date.between(
        new Date(+this.notSoRecent - 1000 * 60 * 60 * 24),
        this.notSoRecent
      ) // within hours
    }
    if (seed < 0.8) {
      return this.w.faker.date.between(
        new Date(+this.notSoRecent - 1000 * 60 * 60 * 24 * 30),
        this.notSoRecent
      ) // within days
    }

    return this.w.faker.date.between(
      new Date(+this.notSoRecent - 1000 * 60 * 60 * 24 * 365),
      this.notSoRecent
    ) // within a years
  }

  public async get ({
    url,
    parentId,
    after,
    limit = 3
  }: Parameters<IApi['get']>[0]): ReturnType<IApi['get']> {
    parentId = parentId || ''

    const out = await this.findPosts(
      {
        parentId,
        url
      },
      {
        after,
        limit
      }
    )

    return {
      hasMore: out.hasMore,
      result: await Promise.all(
        out.result.map(async ({ authorId, ...a }) => ({
          ...a,
          author: await this.getAuthor(authorId)
        }))
      )
    }
  }

  public async post ({
    url,
    authorId,
    parentId = '',
    markdown
  }: Parameters<IApi['post']>[0]): ReturnType<IApi['post']> {
    const p = await this.addPost({
      id: cryptoRandomId(),
      url,
      authorId,
      parentId,
      markdown,
      createdAt: +new Date(),
      like: [],
      dislike: [],
      bookmark: []
    })

    return {
      entryId: p.id
    }
  }

  public async update ({
    entryId,
    markdown
  }: Parameters<IApi['update']>[0]): ReturnType<IApi['update']> {
    const n = await this.updatePost(entryId, {
      markdown,
      updatedAt: +new Date()
    })

    return {
      error: n ? undefined : 'not updated'
    }
  }

  public async delete ({
    entryId
  }: Parameters<IApi['delete']>[0]): ReturnType<IApi['delete']> {
    if (
      await this.countPosts({
        parentId: entryId
      })
    ) {
      await this.updatePost(entryId, {
        markdown: '*Deleted*',
        isDeleted: true
      })

      return {
        status: 'suppressed'
      }
    }

    const isDeleted = await this.deletePost(entryId)

    return isDeleted
      ? {
          status: 'deleted'
        }
      : {
          error: 'not deleted'
        }
  }

  public async reaction ({
    entryId,
    userId,
    reaction
  }: Parameters<IApi['reaction']>[0]): ReturnType<IApi['reaction']> {
    const entry = await this.getPost(entryId)

    switch (reaction) {
      case 'like':
        entry.dislike = entry.dislike.filter(el => el !== userId)
        break
      case 'dislike':
        entry.like = entry.like.filter(el => el !== userId)
    }

    if (!entry[reaction].includes(userId)) {
      entry[reaction].push(userId)
    } else {
      entry[reaction] = entry[reaction].filter(el => el !== userId)
    }

    const { like, dislike, bookmark } = entry

    await this.updatePost(entryId, {
      like,
      dislike,
      bookmark
    })

    return { like, dislike, bookmark }
  }
}

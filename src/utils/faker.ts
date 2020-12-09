import { IApi, IAuthor, IAuthorNormalized, IPostNormalized } from '../types'

export class FakeAPI implements IApi {
  user: IAuthor;

  private authors = new Map<string, IAuthorNormalized>();
  private posts = new Map<string, IPostNormalized>();

  constructor (public urls: string[], user?: IAuthor) {
    this.user = user || this.randomAuthor()

    const cleanURL = (u: string) =>
      u
        .replace(/#[^/].*$/, '')
        .replace(/#\/$/, '')
        .replace(/\/$/, '')

    const currentURL = cleanURL(
      location.href.replace(/#[^/].*$/, '').replace(/#\/.*$/, '')
    )

    this.urls = this.urls
      .map(cleanURL)
      .map(u =>
        /:\/\//.test(u)
          ? u
          : u.startsWith('/')
            ? currentURL + u
            : currentURL + '/' + u
      )

    if (!this.urls.includes(currentURL)) {
      this.urls.push(currentURL)
    }

    Array(10)
      .fill(null)
      .map(() => this.randomAuthor())

    this.urls.map(u => this.genPost(u, [], { minItems: 3 }))

    console.log(this.authors, this.posts)
  }

  /**
   * @type {IApi['get']}
   */
  async get ({
    url,
    parentId,
    after,
    limit = 3
  }: Parameters<IApi['get']>[0]): ReturnType<IApi['get']> {
    let out = Array.from(this.posts.values())
      .filter(
        el =>
          (parentId ? el.parentId === parentId : !el.parentId)
          && el.url === url
      )
      .sort((i1, i2) => (i1.createdAt < i2.createdAt ? 1 : -1))

    const i = after ? out.map(({ id }) => id).indexOf(after) : -1
    if (i !== -1) {
      out = out.slice(i + 1)
    }

    return {
      hasMore: out.length > limit,
      result: out.slice(0, limit).map(({ authorId, ...a }) => ({
        ...a,
        author: this.authors.get(authorId)
      }))
    }
  }

  private genPost (
    url: string,
    parents: number[] = [],
    {
      minItems = 1
    }: {
      minItems?: number;
    } = {}
  ): IPostNormalized[] {
    if (parents.length > 5) {
      return []
    }

    let hasChildren = false

    let out = Array(Math.floor(Math.random() ** 2 * 9) + minItems)
      .fill(null)
      .map((_, i) => {
        const ps = [
          this.randomPost(
            url,
            url + '--' + [...parents, i].map(j => j.toString()).join(''),
            parents.length
              ? url + '--' + parents.map(j => j.toString()).join('')
              : null
          )
        ]

        if (Math.random() ** 2 > 0.5) {
          hasChildren = true
          return [...ps, ...this.genPost(url, [...parents, i])]
        }

        return ps
      })
      .reduce((prev, c) => [...prev, ...c], [])

    if (parents.length < 5 && !hasChildren) {
      const i = 9
      out = [
        ...out,
        this.randomPost(
          url,
          url + '--' + [...parents, i].map(j => j.toString()).join(''),
          parents.length
            ? url + '--' + parents.map(j => j.toString()).join('')
            : null
        ),
        ...this.genPost(url, [...parents, i])
      ]
    }

    return out
  }

  private randomAuthor (): IAuthor {
    const gender = Math.random() > 0.5 ? 'female' : 'male'
    const out: IAuthor = {
      id: Math.random().toString(36).substr(2),
      name: window.faker.internet.userName(),
      image: `https://joeschmoe.io/api/v1/${gender}/${Math.random()
        .toString(36)
        .substr(2)}`,
      gender
    }

    this.authors.set(out.id, out)

    return out
  }

  private randomPost (
    url: string,
    id = Math.random().toString(36).substr(2),
    parentId?: string | null
  ): IPostNormalized {
    parentId = parentId || null
    const parent = parentId
      ? (this.posts.get(parentId) as IPostNormalized | null)
      : null
    if (!parent) {
      parentId = null
    }

    const out: IPostNormalized = {
      url,
      parentId,
      id,
      authorId: Array.from(this.authors.values())[
        Math.floor(Math.random() * this.authors.size)
      ].id,
      markdown: window.faker.lorem.paragraphs(Math.random() * 2, '\n\n'),
      createdAt: parent
        ? window.faker.date.between(parent.createdAt, new Date())
        : this.randomDate(),
      reaction: {
        like: new Set(
          Array(Math.floor(Math.random() ** 3 * 10))
            .fill(null)
            .map(() => Math.random().toString(36).substr(2))
        ),
        dislike: new Set(
          Array(Math.floor(Math.random() ** 2 * 3))
            .fill(null)
            .map(() => Math.random().toString(36).substr(2))
        ),
        bookmark: new Set(
          Array(Math.floor(Math.random() ** 3 * 10))
            .fill(null)
            .map(() => Math.random().toString(36).substr(2))
        )
      }
    }

    this.posts.set(out.id, out)

    return out
  }

  private randomDate (seed = Math.random()): Date {
    const now = new Date()

    // if (seed < 0.1) {
    //   return faker.date.between(new Date(+now - 1000 * 60), now); // within secs
    // }
    // if (seed < 0.3) {
    //   return faker.date.between(new Date(+now - 1000 * 60 * 60), now); // within mins
    // }
    if (seed < 0.5) {
      return window.faker.date.between(
        new Date(+now - 1000 * 60 * 60 * 24),
        now
      ) // within hours
    }
    if (seed < 0.8) {
      return window.faker.date.between(
        new Date(+now - 1000 * 60 * 60 * 24 * 30),
        now
      ) // within days
    }

    return window.faker.date.between(
      new Date(+now - 1000 * 60 * 60 * 24 * 365),
      now
    ) // within a years
  }
}

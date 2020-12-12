import { IAuthorNormalized, IPostNormalized } from '../types/base'
import { DebuggableAPI } from '../types/debug'

type Query = import('firebase').default.firestore.Query<
  import('firebase').default.firestore.DocumentData
>;

// function decodePath (str: string) {
//   return str.replace(/%(.+);/g, (_, p1) => {
//     return String.fromCharCode(parseInt(p1, 16))
//   })
// }

export class FirebaseAPI extends DebuggableAPI {
  firebase: typeof import('firebase').default = window.firebase;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  get colAuthor () {
    return this.firebase.firestore().collection('author')
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  get colPost () {
    return this.firebase.firestore().collection('post')
  }

  async getAuthorIds (): Promise<string[]> {
    const ids: string[] = []

    await this.colAuthor.get().then(rs =>
      rs.forEach(r => {
        ids.push(r.id)
      })
    )

    return ids
  }

  async addAuthor ({
    id,
    ...a
  }: Omit<IAuthorNormalized, 'id'> & {
    id?: string;
  }): Promise<IAuthorNormalized> {
    if (id) {
      await this.colAuthor.doc(id).set(a)

      return {
        ...a,
        id
      }
    }

    const r = await this.colAuthor.add(a)

    return {
      ...a,
      id: r.id
    }
  }

  async getAuthor (id: string): Promise<IAuthorNormalized | null> {
    const r = await this.colAuthor
      .doc(id)
      .get()
      .then(r => r.data() as Omit<IAuthorNormalized, 'id'>)
    if (!r) {
      return null
    }

    return {
      ...r,
      id
    }
  }

  async addPost ({
    id,
    ...a
  }: Omit<IPostNormalized, 'id'> & { id?: string }): Promise<IPostNormalized> {
    if (id) {
      await this.colPost.doc(encodeURIComponent(id)).set(a)

      return {
        ...a,
        id: encodeURIComponent(id)
      }
    }

    const r = await this.colPost.add(a)

    return {
      ...a,
      id: r.id
    }
  }

  async getPost (id: string): Promise<IPostNormalized | null> {
    const r = await this.colPost
      .doc(id)
      .get()
      .then(r => r.data() as Omit<IPostNormalized, 'id'>)
    if (!r) {
      return null
    }

    return {
      ...r,
      id
    }
  }

  public queryPosts (p: Partial<IPostNormalized>): Query {
    let q: Query = this.colPost

    for (const [k, v] of Object.entries<string>(
      (p as unknown) as Record<string, string>
    )) {
      if (k === 'url' || k === 'parentId') {
        q = q.where(k, '==', v)
      }
    }

    return q
  }

  async findPosts (
    p: Partial<IPostNormalized>,
    {
      after,
      limit = 3
    }: {
      after?: string;
      limit: number;
    }
  ): Promise<{
    result: IPostNormalized[];
    hasMore: boolean;
  }> {
    let q = this.queryPosts(p)

    q = q.orderBy('createdAt', 'desc')

    if (after) {
      q = q.startAfter(after)
    }

    let totalCountLeft = await q.get().then(r => r.docs.length)
    const result: IPostNormalized[] = []

    await q
      .limit(limit)
      .get()
      .then(rs => {
        rs.forEach(r => {
          totalCountLeft--
          const d = r.data() as IPostNormalized
          result.push({
            ...d,
            id: r.id
          })
        })
      })

    return {
      hasMore: totalCountLeft > 0,
      result
    }
  }

  async countPosts (p: Partial<IPostNormalized>): Promise<number> {
    return this.queryPosts(p)
      .get()
      .then(r => r.docs.length)
  }

  async updatePost (
    id: string,
    p: Partial<Omit<IPostNormalized, 'id'>>
  ): Promise<boolean> {
    try {
      await this.colPost.doc(id).update(p)
      return true
    } catch (e) {
      console.error(e)
    }

    return false
  }

  async deletePost (id: string): Promise<boolean> {
    try {
      await this.colPost.doc(id).delete()
      return true
    } catch (e) {
      console.error(e)
    }

    return false
  }
}

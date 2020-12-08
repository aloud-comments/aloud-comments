import {
  Boolean,
  Constraint,
  Literal,
  Partial,
  Record,
  Static,
  String,
  Union,
  Unknown
} from 'runtypes'

export const tAuthor = Record({
  id: String,
  name: String,
  image: String
}).And(
  Partial({
    gender: Union(Literal('male'), Literal('female'))
  })
)

export type IAuthor = Static<typeof tAuthor>;

export const ReactionTypes: Array<'like' | 'dislike' | 'bookmark'> = [
  'like',
  'dislike',
  'bookmark'
]

export const tReactionType = Union(
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ...ReactionTypes.slice(1).map(r => Literal(r))
)

export type IReactionType = Static<typeof tReactionType>;

export const tDate = Unknown.withConstraint<Date>(
  d => d instanceof Date && !isNaN(+d)
)

export const tSetString = Unknown.withConstraint<Set<string>>(
  d => d instanceof Set && Array.from(d).every(v => typeof v === 'string')
)

export const tPost = Record({
  id: String,
  author: tAuthor,
  markdown: String,
  createdAt: tDate
}).And(
  Partial({
    isDeleted: Boolean,
    updatedAt: tDate,
    reaction: Record<
      {
        [t in IReactionType]: Constraint<Unknown, Set<string>>;
      }
    >({
      like: tSetString,
      dislike: tSetString,
      bookmark: tSetString
    })
  })
)

export type IPost = Static<typeof tPost>;

export interface IApi {
  get: (p: {
    parentId: string | null;
    after?: string;
    limit?: number;
  }) => Promise<{
    result: IPost[];
    hasMore: boolean;
  }>;
  post?: (p: {
    authorId: string;
    parentId?: string;
    markdown: string;
  }) => Promise<{
    entryId: string;
  }>;
  update?: (p: { entryId: string; markdown: string }) => Promise<void>;
  reaction?: (p: {
    entryId: string;
    userId: string;
    reaction: IReactionType;
  }) => Promise<{
    changes: {
      [t in IReactionType]?: number;
    };
  }>;
  delete?: (p: {
    entryId: string;
  }) => Promise<{
    status: 'deleted' | 'suppressed';
  }>;
}

export type IFirebaseConfig = {
  [k: string]: unknown;
};

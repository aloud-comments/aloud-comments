import faker from 'faker'

import { IAuthor, IPost } from '../types'

export function randomAuthor (): IAuthor {
  const gender = Math.random() > 0.5 ? 'female' : 'male'

  return {
    id: Math.random().toString(36).substr(2),
    name: faker.internet.userName(),
    image: `https://joeschmoe.io/api/v1/${gender}/${Math.random()
      .toString(36)
      .substr(2)}`,
    gender
  }
}

export function randomPost (within?: Date): Omit<IPost, 'author'> {
  return {
    id: Math.random().toString(36).substr(2),
    markdown: faker.lorem.paragraphs(Math.random() * 2, '\n\n'),
    createdAt: within ? faker.date.between(within, new Date()) : randomDate(),
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
}

function randomDate (seed = Math.random()): Date {
  const now = new Date()

  // if (seed < 0.1) {
  //   return faker.date.between(new Date(+now - 1000 * 60), now); // within secs
  // }
  // if (seed < 0.3) {
  //   return faker.date.between(new Date(+now - 1000 * 60 * 60), now); // within mins
  // }
  if (seed < 0.5) {
    return faker.date.between(new Date(+now - 1000 * 60 * 60 * 24), now) // within hours
  }
  if (seed < 0.8) {
    return faker.date.between(new Date(+now - 1000 * 60 * 60 * 24 * 30), now) // within days
  }

  return faker.date.between(new Date(+now - 1000 * 60 * 60 * 24 * 365), now) // within a years
}

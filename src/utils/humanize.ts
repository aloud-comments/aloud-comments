import Duration from 'native-duration'

export function humanizeDurationToNow (since: Date): string {
  const now = new Date()
  const msec = +now - +since

  if (msec < 60000) {
    return 'Just posted'
  }

  return Duration.of(msec).toString({ maxUnit: 2 }) + ' ago'
}

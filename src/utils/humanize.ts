import Duration from 'native-duration'

export function humanizeDurationToNow (epoch: number): string {
  const now = new Date()
  const msec = +now - epoch

  if (msec < 300000) {
    return 'Just posted'
  }

  return Duration.of(msec).toString({ maxUnit: 2, granularity: 2 }) + ' ago'
}

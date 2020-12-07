import Duration from 'native-duration'

export function humanizeDurationToNow (epoch: number): string {
  const now = new Date()
  const msec = +now - epoch

  if (msec < 5000) {
    return 'Just posted'
  }

  return Duration.of(epoch).toString({ granularity: 2 }) + ' ago'
}

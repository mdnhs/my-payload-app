export type TimezoneEntry = { value: string; label: string; offset: string }

function formatOffset(tz: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    })
    const parts = formatter.formatToParts(now)
    const offsetPart = parts.find((p) => p.type === 'timeZoneName')
    return offsetPart?.value ?? ''
  } catch {
    return ''
  }
}

function buildTimezones(): TimezoneEntry[] {
  const zones = Intl.supportedValuesOf('timeZone')

  return zones.map((tz) => {
    const offset = formatOffset(tz)
    const city = tz.split('/').pop()?.replace(/_/g, ' ') ?? tz
    return {
      value: tz,
      label: `(${offset}) ${city} — ${tz}`,
      offset,
    }
  })
}

export const TIMEZONES: TimezoneEntry[] = buildTimezones()

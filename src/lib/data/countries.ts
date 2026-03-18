import countryList from 'country-list'

export type Country = { code: string; name: string }

const data: Country[] = countryList.getData()

export function getCountries(): Country[] {
  return data
}

export function getCountryName(code: string): string | undefined {
  return countryList.getName(code)
}

declare module 'world-universities' {
  interface University {
    major: string
    name: string
    link: string
  }
  export default function getUniversities(): Promise<University[]>
}

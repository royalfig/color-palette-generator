export function ManualHeader(id: string, title: string) {
  return (
    <li>
      <a href={`#${id}`}>{title}</a>
    </li>
  )
}

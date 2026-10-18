// A section heading in the style of the Laravel news site: a red label with a slanted edge on a gray bar.
// `children` is the title; `action` (optional) is a link or text at the right end of the bar; `as` is the heading tag.
export default function SectionTitle({ children, action = null, as: Tag = 'h2', id }) {
  return (
    <div className="section-title">
      <Tag id={id} className="section-title__label">
        {children}
      </Tag>
      <div className="section-title__bar">
        <span />
        {action}
      </div>
    </div>
  )
}

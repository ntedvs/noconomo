import Markdown from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

export function BulletinContent({
  content,
  format,
}: {
  content: string
  format?: "plain" | "markdown"
}) {
  if (format === "markdown") {
    return (
      <div className="space-y-3 text-base text-fg">
        <Markdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            p: (props) => <p {...props} className="text-base text-fg" />,
            a: (props) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage-hover underline underline-offset-2 hover:text-brown"
              />
            ),
            strong: (props) => (
              <strong {...props} className="font-semibold text-brown" />
            ),
            em: (props) => <em {...props} className="italic" />,
            ul: (props) => (
              <ul {...props} className="list-disc space-y-1 pl-5" />
            ),
            ol: (props) => (
              <ol {...props} className="list-decimal space-y-1 pl-5" />
            ),
            li: (props) => <li {...props} className="text-base" />,
            h1: (props) => (
              <h2 {...props} className="font-display text-xl text-brown" />
            ),
            h2: (props) => (
              <h2 {...props} className="font-display text-xl text-brown" />
            ),
            h3: (props) => (
              <h3 {...props} className="font-display text-lg text-brown" />
            ),
            h4: (props) => (
              <h4 {...props} className="font-display text-base text-brown" />
            ),
            h5: (props) => (
              <h5 {...props} className="font-display text-base text-brown" />
            ),
            h6: (props) => (
              <h6 {...props} className="font-display text-base text-brown" />
            ),
            blockquote: (props) => (
              <blockquote
                {...props}
                className="border-l-2 border-border-strong pl-3 text-fg-muted italic"
              />
            ),
            code: (props) => (
              <code
                {...props}
                className="rounded bg-bg-muted px-1 py-0.5 font-mono text-sm"
              />
            ),
            pre: (props) => (
              <pre
                {...props}
                className="overflow-x-auto rounded-md bg-bg-muted p-3 font-mono text-sm"
              />
            ),
            hr: (props) => <hr {...props} className="my-2 border-border" />,
          }}
        >
          {content}
        </Markdown>
      </div>
    )
  }
  return <p className="text-base whitespace-pre-wrap text-fg">{content}</p>
}

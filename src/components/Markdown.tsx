import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

/** Renders untrusted README markdown. HTML is not enabled and output is sanitized. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          img: ({ node: _node, ...props }) => <img {...props} loading="lazy" alt={props.alt ?? ""} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

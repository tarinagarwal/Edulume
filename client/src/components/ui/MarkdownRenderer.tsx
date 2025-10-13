import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div className={`prose-chat max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mt-4 mb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-white mt-4 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-white mt-3 mb-2">
              {children}
            </h3>
          ),
          // Paragraphs
          p: ({ children }) => <p className="mb-3 text-gray-300">{children}</p>,
          // Code blocks
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            return !inline ? (
              <pre className="bg-smoke-gray p-4 rounded-lg my-3 overflow-x-auto border border-smoke-light">
                <code
                  className={`text-sm ${
                    match ? `language-${match[1]}` : ""
                  } text-alien-green`}
                  {...props}
                >
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-smoke-gray px-2 py-0.5 rounded text-alien-green text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-gray-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-300">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="ml-4">{children}</li>,
          // Emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-alien-green hover:underline"
            >
              {children}
            </a>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-alien-green pl-4 italic my-3 text-gray-400">
              {children}
            </blockquote>
          ),
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-smoke-light">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-smoke-gray">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-smoke-light">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-white font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-gray-300">{children}</td>
          ),
          // Horizontal rule
          hr: () => <hr className="my-4 border-smoke-light" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

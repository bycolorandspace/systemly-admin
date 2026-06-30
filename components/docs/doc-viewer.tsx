"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocViewerProps {
  content: string;
}

export function DocViewer({ content }: DocViewerProps) {
  return (
    <div className="doc-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="doc-h1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="doc-h2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="doc-h3">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="doc-h4">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="doc-p">{children}</p>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="doc-link">
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="doc-strong">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="doc-em">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="doc-ul">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="doc-ol">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="doc-li">{children}</li>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = className?.startsWith("language-");
            if (isBlock) {
              return (
                <pre className="doc-pre">
                  <code className="doc-code-block">{children}</code>
                </pre>
              );
            }
            return <code className="doc-code-inline" {...props}>{children}</code>;
          },
          pre: ({ children }) => <>{children}</>,
          blockquote: ({ children }) => (
            <blockquote className="doc-blockquote">{children}</blockquote>
          ),
          hr: () => <hr className="doc-hr" />,
          table: ({ children }) => (
            <div className="doc-table-wrap">
              <table className="doc-table">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="doc-thead">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="doc-tr">{children}</tr>,
          th: ({ children }) => <th className="doc-th">{children}</th>,
          td: ({ children }) => <td className="doc-td">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

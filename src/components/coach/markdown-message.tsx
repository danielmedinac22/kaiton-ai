"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const components: Components = {
  h3: ({ children }) => (
    <h3 className="font-bold text-[#5af0b3] text-sm mb-1 mt-3 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-semibold text-[#d0e8d6] text-sm mb-1 mt-2">
      {children}
    </h4>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#d0e8d6]">{children}</strong>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc ml-4 space-y-0.5 mb-2 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal ml-4 space-y-0.5 mb-2 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="text-sm">{children}</li>,
  hr: () => <hr className="border-[#3c4a42] my-3" />,
};

export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

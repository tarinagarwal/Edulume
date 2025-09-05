import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    // Handle code blocks
    text = text.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-smoke-gray p-3 rounded-lg my-2 overflow-x-auto"><code>$1</code></pre>'
    );

    // Handle inline code
    text = text.replace(
      /`([^`]+)`/g,
      '<code class="bg-smoke-gray px-1 py-0.5 rounded text-alien-green">$1</code>'
    );

    // Handle bold text
    text = text.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-white">$1</strong>'
    );

    // Handle italic text
    text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Handle headers
    text = text.replace(
      /^### (.*$)/gm,
      '<h3 class="text-lg font-semibold text-white mt-3 mb-2">$1</h3>'
    );
    text = text.replace(
      /^## (.*$)/gm,
      '<h2 class="text-xl font-semibold text-white mt-4 mb-2">$1</h2>'
    );
    text = text.replace(
      /^# (.*$)/gm,
      '<h1 class="text-2xl font-bold text-white mt-4 mb-3">$1</h1>'
    );

    // Handle line breaks
    text = text.replace(/\n\n/g, '</p><p class="mb-2">');
    text = text.replace(/\n/g, "<br>");

    // Handle lists
    text = text.replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>');
    text = text.replace(/^- (.*$)/gm, '<li class="ml-4 mb-1">• $1</li>');

    // Wrap in paragraph if not already wrapped
    if (!text.startsWith("<")) {
      text = `<p class="mb-2">${text}</p>`;
    }

    return text;
  };

  return (
    <div
      className={`prose-chat max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}

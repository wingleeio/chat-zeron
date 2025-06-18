import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  createHighlighter,
  type BundledTheme,
  type BundledLanguage,
  type HighlighterGeneric,
} from "shiki";
import { createCssVariablesTheme } from "shiki/core";

const myTheme = createCssVariablesTheme({
  name: "css-variables",
  variablePrefix: "--shiki-",
  variableDefaults: {},
  fontStyle: true,
});

export type CodeBlockProps = {
  children?: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "not-prose flex w-full flex-col overflow-clip border",
        "border-border bg-card text-card-foreground rounded-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type CodeBlockCodeProps = {
  code: string;
  language?: string;
  theme?: string;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

let highlighter: HighlighterGeneric<BundledLanguage, BundledTheme> | null =
  null;

function CodeBlockCode({
  code,
  language = "tsx",
  theme = "css-variables",
  className,
  ...props
}: CodeBlockCodeProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    async function highlight() {
      if (!code) {
        setHighlightedHtml("<pre><code></code></pre>");
        return;
      }
      if (!highlighter) {
        highlighter = await createHighlighter({
          langs: [
            "typescript",
            "javascript",
            "tsx",
            "jsx",
            "rust",
            "python",
            "go",
            "java",
            "c",
            "cpp",
            "csharp",
            "ruby",
            "php",
            "swift",
            "kotlin",
            "scala",
            "html",
            "css",
            "json",
            "yaml",
            "markdown",
            "bash",
            "shell",
            "sql",
          ],
          themes: [myTheme],
        });
      }

      const html = highlighter.codeToHtml(code, {
        lang: language,
        theme,
      });

      setHighlightedHtml(html);
    }
    highlight();
  }, [code, language, theme]);

  function handleCopy() {
    if (isCopied) return;
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }

  const classNames = cn(
    "w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4 shadow-xl",
    className
  );

  return (
    <div className="relative">
      <div className="flex gap-2 items-center absolute right-2 top-2 bg-sidebar rounded-lg pl-3 pr-2 py-1">
        <div className="text-xs text-muted-foreground font-mono">
          {language}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="rounded-sm h-6 w-6 hover:bg-sidebar/50"
        >
          {isCopied ? (
            <Check className="size-3" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </div>
      {/* SSR fallback: render plain code if not hydrated yet */}
      {highlightedHtml ? (
        <div
          className={classNames}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          {...props}
        />
      ) : (
        <div className={classNames} {...props}>
          <pre>
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>;

function CodeBlockGroup({
  children,
  className,
  ...props
}: CodeBlockGroupProps) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { CodeBlockGroup, CodeBlockCode, CodeBlock };

"use client";

import { Markdown } from "@/components/chat/markdown";
import { cn } from "@/lib/utils";
import {
  closeReasoning,
  openReasoning,
  setReasoningDuration,
  useIsOpenReasoning,
  useReasoningDuration,
} from "@/stores/chat";
import type { ReasoningUIPart } from "@ai-sdk/ui-utils";
import { ChevronDownIcon } from "lucide-react";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ReasoningContextType = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

const ReasoningContext = createContext<ReasoningContextType | undefined>(
  undefined
);

function useReasoningContext() {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error(
      "useReasoningContext must be used within a Reasoning provider"
    );
  }
  return context;
}

export type ReasoningProps = {
  children: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function Reasoning({
  children,
  className,
  open,
  onOpenChange,
}: ReasoningProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <ReasoningContext.Provider
      value={{
        isOpen,
        onOpenChange: handleOpenChange,
      }}
    >
      <div className={className}>{children}</div>
    </ReasoningContext.Provider>
  );
}

export type ReasoningTriggerProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLButtonElement>;

function ReasoningTrigger({
  children,
  className,
  ...props
}: ReasoningTriggerProps) {
  const { isOpen, onOpenChange } = useReasoningContext();

  return (
    <button
      className={cn("flex cursor-pointer items-center gap-2", className)}
      onClick={() => onOpenChange(!isOpen)}
      {...props}
    >
      <span className="text-primary">{children}</span>
      <div
        className={cn(
          "transform transition-transform",
          isOpen ? "rotate-180" : ""
        )}
      >
        <ChevronDownIcon className="size-4" />
      </div>
    </button>
  );
}

export type ReasoningContentProps = {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

function ReasoningContent({
  children,
  className,
  ...props
}: ReasoningContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const { isOpen } = useReasoningContext();

  useEffect(() => {
    if (!contentRef.current || !innerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (contentRef.current && innerRef.current && isOpen) {
        contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`;
      }
    });

    observer.observe(innerRef.current);

    if (isOpen) {
      contentRef.current.style.maxHeight = `${innerRef.current.scrollHeight}px`;
    }

    return () => observer.disconnect();
  }, [isOpen]);

  return (
    <div
      ref={contentRef}
      className={cn(
        "overflow-hidden transition-[max-height] duration-300 ease-out",
        className
      )}
      style={{
        maxHeight: isOpen ? contentRef.current?.scrollHeight : "0px",
      }}
      {...props}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

function ReasoningPart({
  id,
  part,
  done,
}: {
  id: string;
  part: ReasoningUIPart;
  done: boolean;
}) {
  const isOpen = useIsOpenReasoning(id);
  const [isManuallyToggled, setIsManuallyToggled] = useState(false);
  const initialTextRef = useRef<string | null>(null);
  const thinkingTime = useReasoningDuration(id);
  const thinkingStartRef = useRef<number | null>(null);

  const text = useMemo(() => {
    return part.details
      .filter((detail) => detail.type === "text")
      .map((detail) => detail.text)
      .join("\n");
  }, [part.details]);

  useEffect(() => {
    if (initialTextRef.current === null) {
      initialTextRef.current = text;
      return;
    }

    if (text !== initialTextRef.current) {
      if (!thinkingStartRef.current) {
        thinkingStartRef.current = Date.now();
      }
      setReasoningDuration(
        id,
        (Date.now() - (thinkingStartRef.current || 0)) / 1000
      );

      if (!isManuallyToggled) {
        openReasoning(id);
      }
    }
  }, [text, isManuallyToggled, id]);

  useEffect(() => {
    if (isOpen && !isManuallyToggled && done) {
      closeReasoning(id);
    }
  }, [done, isOpen, isManuallyToggled, id]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      openReasoning(id);
    } else {
      closeReasoning(id);
    }
    setIsManuallyToggled(true);
  };

  return (
    <Reasoning className="px-2" open={isOpen} onOpenChange={handleOpenChange}>
      <ReasoningTrigger>
        <span className="text-sm">
          Reasoning
          <span className="text-muted-foreground">
            {thinkingTime > 0 ? ` (${thinkingTime}s)` : ""}
          </span>
        </span>
      </ReasoningTrigger>
      <ReasoningContent className="ml-2 border-l-1 pb-1 pl-2">
        <Markdown className="text-sm text-muted-foreground">{text}</Markdown>
      </ReasoningContent>
    </Reasoning>
  );
}

export { ReasoningPart };

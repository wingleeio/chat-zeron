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
  const _isOpen = useIsOpenReasoning(id);
  const isOpen = _isOpen === undefined ? !done : _isOpen;
  const thinkingTime = useReasoningDuration(id);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const text = useMemo(() => {
    return part.details
      .filter((detail) => detail.type === "text")
      .map((detail) => detail.text)
      .join("\n");
  }, [part.details]);

  useEffect(() => {
    if (done && thinkingTime > 0) {
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    if (!done) {
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          setReasoningDuration(id, elapsed);
        }
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (startTimeRef.current) {
        const finalTime = (Date.now() - startTimeRef.current) / 1000;
        setReasoningDuration(id, finalTime);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [done, id, thinkingTime]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      openReasoning(id);
    } else {
      closeReasoning(id);
    }
  };

  return (
    <Reasoning className="px-2" open={isOpen} onOpenChange={handleOpenChange}>
      <ReasoningTrigger>
        <span className="text-sm">
          Reasoning
          <span className="text-muted-foreground">
            {thinkingTime > 0 ? ` (${thinkingTime.toFixed(1)}s)` : ""}
          </span>
        </span>
      </ReasoningTrigger>
      <ReasoningContent
        className={cn("ml-2 pb-1 pl-2", isOpen && "border-l-1")}
      >
        <Markdown className="text-sm text-muted-foreground">{text}</Markdown>
      </ReasoningContent>
    </Reasoning>
  );
}

export { ReasoningPart };

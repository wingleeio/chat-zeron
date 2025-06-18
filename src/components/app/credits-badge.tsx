import { Badge } from "@/components/ui/badge";
import {
  TooltipContent,
  TooltipTrigger,
  Tooltip,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PRO_CREDITS, FREE_CREDITS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

import { IconDiamondsFilled } from "@tabler/icons-react";

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export function CreditsBadge({ isSidebar = false }: { isSidebar?: boolean }) {
  const { data: user } = useCurrentUser();
  const sidebar = useSidebar();

  const creditCount = Math.max(
    0,
    (user?.isPremium ? PRO_CREDITS : FREE_CREDITS) - (user?.creditsUsed ?? 0)
  );

  return (
    <Tooltip>
      <TooltipTrigger
        asChild
        className={cn(sidebar.open && !isSidebar && "hidden")}
      >
        <Badge className="px-3" variant="outline">
          <IconDiamondsFilled className="size-4 text-primary" />
          <span className="text-xs">
            <AnimatedNumber value={creditCount} />
          </span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Credits are reset daily.</p>
      </TooltipContent>
    </Tooltip>
  );
}

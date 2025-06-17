import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BrainIcon, ChevronsUpDownIcon, WrenchIcon } from "lucide-react";
import { IconPhoto } from "@tabler/icons-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import ModelIcon, { type ModelType } from "@/components/chat/model-icon";
import type { Doc } from "convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { match } from "ts-pattern";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ModelSelector() {
  const [open, setOpen] = useState(false);
  const [hoveredModel, setHoveredModel] = useState<Doc<"models"> | null>(null);
  const models = useQuery(api.models.list);
  const { data: user } = useCurrentUser();
  const selectModel = useMutation(api.models.select).withOptimisticUpdate(
    (store, args) => {
      const user = store.getQuery(api.users.getCurrent);

      if (!user) {
        return;
      }

      store.setQuery(
        api.users.getCurrent,
        {},
        {
          ...user,
          model: args.modelId,
        }
      );
    }
  );

  const selectedModel = models?.find((m) => m._id === user?.model);

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setHoveredModel(null);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between hover:text-foreground"
        >
          <span className="flex items-center gap-2 w-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {selectedModel && (
              <ModelIcon
                className="fill-primary"
                model={selectedModel.icon as ModelType}
              />
            )}
            {selectedModel?.name || "Select model..."}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0 border-none" align="start">
        <div className="absolute top-0 right-0 translate-x-full pl-2 hidden md:block">
          {hoveredModel && (
            <div className="rounded-md p-2 bg-sidebar flex flex-col gap-2 w-64">
              <div className="flex items-center gap-2">
                <ModelIcon
                  className="size-4 fill-primary"
                  model={hoveredModel.icon as ModelType}
                />
                <span className="text-sm">{hoveredModel.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {hoveredModel.description}
              </div>
              <div className="text-sm flex gap-2">
                {hoveredModel.capabilities?.map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="text-xs flex items-center gap-1"
                  >
                    {match(c)
                      .with("thinking", () => (
                        <BrainIcon className="size-4 text-pink-400" />
                      ))
                      .with("vision", () => (
                        <IconPhoto className="size-4 text-blue-400" />
                      ))
                      .with("tools", () => (
                        <WrenchIcon className="size-4 text-green-400" />
                      ))
                      .exhaustive()}
                    <span className="text-xs">
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        <Command className="bg-sidebar">
          <CommandInput placeholder="Search models..." className="h-9" />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            <CommandGroup>
              {models?.map((model) => (
                <CommandItem
                  key={model._id}
                  value={model.name}
                  className="data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                  onSelect={() => {
                    setOpen(false);
                    setHoveredModel(null);
                    selectModel({ modelId: model._id });
                  }}
                  onMouseEnter={() => {
                    setHoveredModel(model);
                  }}
                >
                  <span className="flex items-center gap-2 flex-1">
                    {model.icon && (
                      <ModelIcon
                        className="fill-primary"
                        model={model.icon as ModelType}
                      />
                    )}
                    <span className="truncate">{model.name}</span>
                  </span>
                  {model.isPremium && !user?.isPremium && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs px-2">
                          Pro
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>This model is only available to pro users.</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

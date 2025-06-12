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
import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import ModelIcon, { type ModelType } from "@/components/chat/model-icon";

export function ModelSelector() {
  const [open, setOpen] = useState(false);
  const models = useQuery(api.models.list);
  const user = useQuery(api.auth.current);
  const selectModel = useMutation(api.models.select).withOptimisticUpdate(
    (store, args) => {
      const user = store.getQuery(api.auth.current);

      if (!user) {
        return;
      }

      store.setQuery(
        api.auth.current,
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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            {selectedModel && (
              <ModelIcon model={selectedModel.icon as ModelType} />
            )}
            {selectedModel?.name || "Select model..."}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command className="bg-sidebar">
          <CommandInput placeholder="Search framework..." className="h-9" />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {models?.map((model) => (
                <CommandItem
                  key={model._id}
                  value={model._id}
                  className="data-[selected=true]:bg-muted data-[selected=true]:text-foreground"
                  onSelect={() => {
                    setOpen(false);
                    selectModel({ modelId: model._id });
                  }}
                >
                  <span className="flex items-center gap-2">
                    {model.icon && (
                      <ModelIcon model={model.icon as ModelType} />
                    )}
                    {model.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

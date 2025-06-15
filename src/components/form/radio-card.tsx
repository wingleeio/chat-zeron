import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export function RadioCard({
  id,
  value,
  children,
  className,
  ...props
}: {
  id: string;
  value: string;
  children?: React.ReactNode;
} & React.ComponentProps<typeof RadioGroupItem>) {
  return (
    <div className="flex items-center">
      <RadioGroupItem
        value={value}
        id={id}
        className="peer hidden"
        {...props}
      />
      <Label
        htmlFor={id}
        className={cn(
          "border-border peer-aria-checked:ring-primary/10 peer-disabled:bg-muted peer-disabled::cursor-not-allowed !mr-0 !ml-0 flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border p-8 font-normal peer-disabled:grayscale peer-aria-checked:ring-3",
          className
        )}
      >
        {children}
      </Label>
    </div>
  );
}

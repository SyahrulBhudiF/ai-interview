import { Checkbox } from "@ai-interview/ui/checkbox";

export function BehaviorToggle({
  id,
  checked,
  label,
  description,
  disabled,
  onToggle,
}: {
  id: string;
  checked: boolean;
  label: string;
  description: string;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-2 text-sm">
      <Checkbox
        id={id}
        className="mt-0.5"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onToggle(value === true)}
      />
      <span className="space-y-0.5">
        <span className="block font-medium">{label}</span>
        <span className="text-muted-foreground block">{description}</span>
      </span>
    </label>
  );
}

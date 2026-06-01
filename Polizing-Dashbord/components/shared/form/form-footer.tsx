import { Check } from "@/components/icons";
import { Button } from "@/components/ui/button";

type FormFooterProps = {
  onCancel: () => void;
  submitLabel: string;
  pending: boolean;
};

export function FormFooter({ onCancel, submitLabel, pending }: FormFooterProps) {
  return (
    <div className="-mx-4 -mb-4 mt-2 flex justify-end gap-2 border-t bg-muted/50 p-4 rounded-b-xl">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={pending}
      >
        Cancelar
      </Button>
      <Button type="submit" disabled={pending}>
        <Check className="w-3.5 h-3.5" />
        {submitLabel}
      </Button>
    </div>
  );
}

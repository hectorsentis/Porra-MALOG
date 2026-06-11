"use client";

import { Button } from "@/components/ui/button";

export function ConfirmButton({
  confirmMessage,
  ...props
}: React.ComponentProps<typeof Button> & { confirmMessage: string }) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        if (!confirm(confirmMessage)) event.preventDefault();
      }}
    />
  );
}

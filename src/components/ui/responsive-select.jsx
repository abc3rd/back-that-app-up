import React, { useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from './drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Radix Select on desktop, vaul bottom-sheet Drawer on mobile.
export function ResponsiveSelect({ value, onValueChange, placeholder, options, triggerClassName }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-11 w-44 items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm',
            triggerClassName
          )}
        >
          {current?.label || placeholder}
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{placeholder || 'Select'}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onValueChange(o.value); setOpen(false); }}
              className={cn(
                'rounded-lg px-3 py-3 text-left text-sm',
                o.value === value ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
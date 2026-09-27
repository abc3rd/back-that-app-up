import React from 'react';
import ProTag from './ProTag';

export default function SettingRow({ title, description, children, pro, locked }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm">{title}</p>
          {pro && <ProTag locked={locked} />}
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
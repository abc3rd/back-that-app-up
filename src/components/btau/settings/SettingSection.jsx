import React from 'react';

export default function SettingSection({ title, description, children }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <header className="mb-4">
        <h2 className="font-display text-lg">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}
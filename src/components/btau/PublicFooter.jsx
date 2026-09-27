import React from 'react';
import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
      <Link to="/about" className="transition-colors hover:text-foreground">About</Link>
      <span aria-hidden>·</span>
      <Link to="/contact" className="transition-colors hover:text-foreground">Contact</Link>
    </footer>
  );
}
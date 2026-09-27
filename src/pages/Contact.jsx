import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import PublicFooter from '@/components/btau/PublicFooter';

const CONTACT_EMAIL = 'hello@backthatappup.app';

export default function Contact() {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const send = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Back That App Up! contact from ${name || 'a visitor'}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-8 px-6 pb-[max(7rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to app
      </Link>
      <h1 className="text-2xl font-bold uppercase italic tracking-tight text-gradient-neon">Contact</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Questions, feedback, or press inquiries about Back That App Up! are welcome. Reach out and the team will get back to you.
      </p>
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 text-sm text-primary transition-opacity hover:opacity-80">
          <Mail className="h-4 w-4" /> {CONTACT_EMAIL}
        </a>
        <a href="tel:+19418820130" className="inline-flex items-center gap-2 text-sm text-primary transition-opacity hover:opacity-80">
          <Phone className="h-4 w-4" /> +1 941-882-0130
        </a>
        <a href="tel:+16266634287" className="inline-flex items-center gap-2 text-sm text-primary transition-opacity hover:opacity-80">
          <Phone className="h-4 w-4" /> +1 62-OMEGA-UCP
        </a>
      </div>
      <form onSubmit={send} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted-foreground">Your name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted-foreground">Message</span>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's on your mind?" rows={5} required />
        </label>
        <Button type="submit" className="w-full">Send message</Button>
      </form>
      <PublicFooter />
    </main>
  );
}
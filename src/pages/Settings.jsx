import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import BackButton from '@/components/BackButton';

export default function Settings() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const confirmDelete = async () => {
    setOpen(false);
    try {
      try {
        await base44.functions.invoke('deleteUserAccount');
      } catch (fnErr) {
        if (typeof base44.auth.deleteAccount === 'function') {
          await base44.auth.deleteAccount();
        } else {
          throw fnErr;
        }
      }
      logout(false);
      window.location.href = '/login';
    } catch (e) {
      toast({ variant: 'destructive', title: 'Deletion failed', description: e?.message || 'Could not delete account. Please contact support.' });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/80 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <BackButton />
        <h1 className="font-display text-2xl">Settings</h1>
      </header>
      <main className="mx-auto max-w-md px-6 py-8">
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            <h2 className="font-medium">Delete Account</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Permanently removes your account and signs you out. Saved captures stored in this browser are not erased by this action and must be deleted separately. This cannot be undone.
          </p>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
              <button className="mt-4 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
                Delete Account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove your account. You can't undo this. Local captures in this browser are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
    </div>
  );
}
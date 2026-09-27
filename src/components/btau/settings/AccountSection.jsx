import React, { useState } from 'react';
import { Trash2, GraduationCap } from 'lucide-react';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import SettingSection from './SettingSection';

export default function AccountSection() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const confirmDelete = async () => {
    setOpen(false);
    try {
      try {
        await base44.functions.invoke('deleteUserAccount');
      } catch (fnErr) {
        if (typeof base44.auth.deleteAccount === 'function') await base44.auth.deleteAccount();
        else throw fnErr;
      }
      logout(false);
      window.location.href = '/login';
    } catch (e) {
      toast({ variant: 'destructive', title: 'Deletion failed', description: e?.message || 'Could not delete account. Please contact support.' });
    }
  };

  return (
    <SettingSection title="Account" description="Account and data controls">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap className="h-4 w-4" />
          <h3 className="font-medium">Setup guide</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">New to the app? Walk through the quick setup and how-it-works explainer again.</p>
        <button
          onClick={() => { localStorage.removeItem('btau.onboarded'); window.location.href = '/'; }}
          className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Replay setup guide
        </button>
      </div>
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-4 w-4" />
          <h3 className="font-medium">Delete Account</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Permanently removes your account and signs you out. Local captures in this browser are not affected.</p>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <button className="mt-3 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">Delete Account</button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove your account. You can't undo this. Local captures in this browser are not affected.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingSection>
  );
}
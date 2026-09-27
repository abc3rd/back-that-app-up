import BackButton from '@/components/BackButton';

export default function ScreenHeader({ title, showBack = true, titleClassName = '' }) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/80 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
      {showBack && <BackButton />}
      <h1 className={`font-display text-2xl ${titleClassName}`}>{title}</h1>
    </header>
  );
}
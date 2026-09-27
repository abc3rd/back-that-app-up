import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      aria-label="Go back"
      onClick={() => navigate(-1)}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}
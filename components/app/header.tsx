import { ThemeToggle } from './theme-toggle';
import { LocaleSwitcher } from './locale-switcher';

interface Dict {
  theme: {
    title: string;
    description: string;
    system: string;
    light: string;
    dark: string;
    select: string;
  };
  locale: {
    title: string;
    description: string;
    english: string;
    persian: string;
    select: string;
  };
}

export function AppHeader({ dict }: { dict: Dict }) {
  return (
    <header className="max-w-screen-sm border-b  mx-auto bg-card ">
      <div className="flex justify-between items-center container gap-4 p-2">
        {/* Logo */}
        <div>
          <i className="icon-[streamline-flex--high-speed-train-front] size-8 text-primary"></i>
        </div>

        {/* Theme, Locale Switcher */}
        <div className="flex items-center gap-2">
          <ThemeToggle dict={dict} />
          <LocaleSwitcher dict={dict} />
        </div>
      </div>
    </header>
  )
}

'use client';

import { useRef } from 'react';
import { CaretDownIcon, GlobeIcon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { setLocale } from '@/actions/locale';
// Import the config directly: the `@/lib/i18n` barrel re-exports the dictionary
// loaders, which are server-only and cannot enter a client bundle.
import { i18n, type Locale } from '@/lib/i18n/i18n-config';

interface LanguageSwitcherProps {
  current: Locale;
  /** Translated strings — `t.common.language` from the page dictionary. */
  labels: {
    label: string;
    names: Record<string, string>;
    apply: string;
  };
  className?: string;
}

/**
 * Language switcher, shared by the auth screens and the profile card.
 *
 * A native `<select>` rather than a custom dropdown: it is one control, and the
 * platform one is keyboard- and screen-reader-correct for free and renders as
 * the OS picker on mobile. It is styled to match `Input` — same height, border,
 * and focus ring — with the chrome hidden so the caret is ours.
 */
export function LanguageSwitcher({ current, labels, className }: LanguageSwitcherProps) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={setLocale} ref={formRef} className={cn('relative', className)}>
      <label htmlFor="locale" className="sr-only">
        {labels.label}
      </label>

      <GlobeIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
      />

      <select
        id="locale"
        name="locale"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className={cn(
          'h-8 w-full appearance-none rounded-none border border-input bg-transparent py-1 pr-7 pl-7.5 text-xs',
          'transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-input/30'
        )}
      >
        {i18n.locales.map((locale) => (
          <option key={locale} value={locale}>
            {labels.names[locale] ?? locale}
          </option>
        ))}
      </select>

      <CaretDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 h-3 w-3 -translate-y-1/2 text-muted-foreground"
      />

      {/* The change handler needs JS; without it the form still submits. */}
      <noscript>
        <button type="submit" className="mt-1 text-xs underline">
          {labels.apply}
        </button>
      </noscript>
    </form>
  );
}

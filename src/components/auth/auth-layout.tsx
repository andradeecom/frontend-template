'use client';

import Link from 'next/link';
import { DictionaryTypes } from '@/lib/i18n';
import { GraduationCapIcon } from '@phosphor-icons/react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface AuthLayoutProps {
  children: React.ReactNode;
  t: DictionaryTypes;
}

const LogoIcon = (
  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
    <GraduationCapIcon className="h-6 w-6 text-primary-foreground" />
  </div>
);

const Divider = <div className="h-px w-full bg-border" />;

const ProductPlaceholder = (
  <div className="h-24 w-full overflow-hidden rounded-lg bg-primary/90">
    <div className="flex h-full items-center justify-center text-xs text-primary-foreground/60">
      Product image placeholder
    </div>
  </div>
);

export function AuthLayout({ children, t }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-[440px]">
        <Card className="shadow-lg shadow-black/5 ring-0 rounded-xl">
          <CardContent className="pt-10 pb-0">
            <div className="mb-6 flex flex-col items-center">
              {LogoIcon}
              <h1 className="font-playfair text-3xl font-bold text-foreground">{t.common.appName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t.common.tagline}</p>
            </div>
            {children}
          </CardContent>
          <CardFooter className="mt-4 flex-col gap-4 border-t-0 pt-0">
            {Divider}
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">{t.common.partOf}</p>
            {ProductPlaceholder}
          </CardFooter>
        </Card>

        <div className="mt-6 flex items-center justify-center gap-6">
          <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t.common.privacyPolicy}
          </Link>
          <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t.common.termsOfService}
          </Link>
          <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {t.common.support}
          </Link>
        </div>
      </div>
    </div>
  );
}

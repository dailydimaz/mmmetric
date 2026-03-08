import { useI18n, SUPPORTED_LOCALES, Locale } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: 'icon' | 'full' | 'compact';
  className?: string;
}

export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const { locale, setLocale, localeInfo } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'icon' ? (
          <Button variant="ghost" size="icon" className={className}>
            <Globe className="h-4 w-4" />
          </Button>
        ) : variant === 'full' ? (
          <Button variant="ghost" className={cn("gap-2 justify-start", className)}>
            <span className="text-base">{localeInfo.flag}</span>
            <span className="text-sm">{localeInfo.nativeName}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className={cn("gap-1.5 h-8 px-2", className)}>
            <span className="text-sm">{localeInfo.flag}</span>
            <span className="text-xs font-medium uppercase">{locale}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {SUPPORTED_LOCALES.map(l => (
          <DropdownMenuItem
            key={l.code}
            onSelect={() => setLocale(l.code)}
            className={cn("cursor-pointer gap-3", locale === l.code && "bg-primary/10 text-primary")}
          >
            <span className="text-base">{l.flag}</span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{l.nativeName}</span>
              <span className="text-xs text-muted-foreground">{l.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

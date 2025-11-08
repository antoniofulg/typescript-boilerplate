import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/src/test-utils';
import { LanguageToggle } from '@/components/language-toggle';

// Mock next-intl with importOriginal for partial mocking
vi.mock('next-intl', async () => {
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl');
  return {
    ...actual,
    useLocale: () => 'en',
    useTranslations: () => (key: string) => {
      const translations: Record<string, string> = {
        'language.select': 'Select Language',
        'language.english': 'English',
        'language.portuguese': 'Português (Brasil)',
      };
      return translations[key] || key;
    },
  };
});

// Mock i18n routing
vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  usePathname: () => '/en',
}));

describe('LanguageToggle', () => {
  it('renders language toggle button', () => {
    render(<LanguageToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<LanguageToggle />);
    // The button should have a screen reader only label
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Check for sr-only class which contains the label
    const srOnly = button.querySelector('.sr-only');
    expect(srOnly).toBeInTheDocument();
  });
});

import Link from 'next/link';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Quick Links',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Training Programs', href: '/training' },
      { label: 'Couture Shop', href: '/shop' },
      { label: 'Bespoke Design', href: '/bespoke' },
      { label: 'Journal', href: '/blog' },
    ],
  },
  {
    title: 'Couture Collections',
    links: [
      { label: 'Bridal', href: '/category/bridal' },
      { label: 'Native Wear', href: '/category/native-wear' },
      { label: 'Corporate', href: '/category/corporate' },
      { label: 'Casual', href: '/category/casual' },
    ],
  },
  {
    title: 'The Institute',
    links: [
      { label: 'Our Heritage', href: '/#heritage' },
      { label: 'Scholarships', href: '/training#scholarship' },
      { label: 'Contact', href: '/#contact' },
      { label: 'FAQ', href: '/training#faq' },
    ],
  },
];

export function Footer() {
  return (
    <footer id="contact" className="border-t border-ink-200 bg-ink-950 text-ink-300">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="mb-4 font-display text-2xl font-extrabold tracking-tight text-white">MESI</div>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-ink-400">
              Mother Elizabeth Sewing Institute — empowering lives through the art of fashion. Heritage craftsmanship meets modern innovation.
            </p>
            <div className="mb-6 space-y-1 text-sm text-ink-400">
              <div>123 Fashion Avenue</div>
              <div>Lagos, Nigeria</div>
              <div>info@mesi.com · +234 800 MESI</div>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">{col.title}</div>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-ink-400 transition-colors hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-6 text-xs text-ink-500 sm:flex-row">
          <div>© {new Date().getFullYear()} Mother Elizabeth Sewing Institute. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <a href="mailto:info@mesi.com" className="chip border border-ink-700 text-ink-300 transition-colors hover:border-brand-500 hover:text-white">
              Email us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

import Link from 'next/link'
import { Logo } from './logo'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Live demo', href: '/home' },
    ],
  },
  {
    title: 'App',
    links: [
      { label: 'Calendar', href: '/calendar' },
      { label: 'Tasks', href: '/tasks' },
      { label: 'Bookings', href: '/bookings' },
      { label: 'Connections', href: '/connections' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { label: 'Security', href: '#security' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Privacy', href: '#security' },
      { label: 'Log in', href: '/login' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-[84rem] px-5 py-14 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
              An AI calendar that drafts the change, shows you the diff, and waits for your
              approval before touching anything.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3.5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {column.title}
              </p>
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-[13.5px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-muted-foreground">
            © {new Date().getFullYear()} Timeflow. Demo mode — no data leaves your browser.
          </p>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            Built for people who guard their time
          </p>
        </div>
      </div>
    </footer>
  )
}

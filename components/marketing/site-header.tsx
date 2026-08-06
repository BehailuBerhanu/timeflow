'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react'
import { Logo } from './logo'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Security', href: '#security' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Changelog', href: '#faq' },
]

function ThemeToggle() {
  const { state, toggleTheme } = useStore()
  const isDark = state.theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {isDark ? (
        <Sun className="size-4" strokeWidth={1.9} />
      ) : (
        <Moon className="size-4" strokeWidth={1.9} />
      )}
    </button>
  )
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // lock the page while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-b border-border bg-background/85 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[84rem] items-center gap-4 px-5 sm:px-8">
        <Link href="/" className="shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo />
          <span className="sr-only">Timeflow home</span>
        </Link>

        <nav aria-label="Main" className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden h-9 items-center rounded-full px-3.5 text-[13.5px] font-medium text-foreground transition-colors hover:bg-secondary sm:flex"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="group hidden h-9 items-center gap-1.5 rounded-full bg-primary pl-4 pr-3.5 text-[13.5px] font-semibold text-primary-foreground transition-[filter,transform] hover:brightness-110 active:translate-y-px sm:flex"
          >
            Try the live demo
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              strokeWidth={2.4}
            />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="flex size-9 items-center justify-center rounded-full border border-border text-foreground lg:hidden"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* mobile sheet */}
      {open ? (
        <div className="border-t border-border bg-background lg:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-[84rem] flex-col px-5 py-3 sm:px-8">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border py-3.5 text-[15px] font-medium text-foreground last:border-0"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2 pb-2">
              <Link
                href="/signup"
                className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary text-[14px] font-semibold text-primary-foreground"
              >
                Try the live demo
                <ArrowRight className="size-4" strokeWidth={2.4} />
              </Link>
              <Link
                href="/login"
                className="flex h-11 items-center justify-center rounded-full border border-border text-[14px] font-medium text-foreground"
              >
                Log in
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

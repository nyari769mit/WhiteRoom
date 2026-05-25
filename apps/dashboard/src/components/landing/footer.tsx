export function Footer() {
  return (
    <footer className="border-t border-accent-green/10 py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight">
            White<span className="text-accent-green neon-text-subtle">Room</span>
          </span>
          <span className="text-xs text-navy-600 font-mono">
            &copy; {new Date().getFullYear()} Guideage Inc.
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-navy-400 font-mono">
          <a href="mailto:hello@whiteroom.tech" className="hover:text-accent-green transition-colors cursor-pointer">
            Contact
          </a>
          <a href="/docs" className="hover:text-accent-green transition-colors cursor-pointer">
            Docs
          </a>
          <a
            href="https://github.com/guideage/whiteroom"
            className="hover:text-accent-green transition-colors cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

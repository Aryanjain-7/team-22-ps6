"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChatProvider } from "./ChatProvider";
import { Icon, type IconName } from "./Icon";

const links: { href: string; label: string; short: string; icon: IconName }[] = [
  { href: "/", label: "Job Search Chat", short: "Job Search", icon: "chat" },
  { href: "/profile", label: "My Profile", short: "My Profile", icon: "user" },
  { href: "/shortlist", label: "My Shortlist", short: "Shortlist", icon: "bookmark" },
];

export function CareerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [logoutError, setLogoutError] = useState(false);
  return (
    <ChatProvider>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div className="workspace">
        <aside className="navigation glass">
          <Link href="/" className="brand" aria-label="CareerMatch home">
            <span className="brand-mark"><Icon name="spark" size={19} /></span>
            <span>Career<span className="brand-accent">Match</span></span>
          </Link>
          <nav aria-label="Main navigation">
            {links.map(({ href, label, short, icon }) => (
              <Link href={href} key={href} className="nav-link"
                aria-current={pathname === href ? "page" : undefined} aria-label={label}>
                <Icon name={icon} size={18} />
                <span className="nav-long">{label}</span>
                <span className="nav-short">{short}</span>
              </Link>
            ))}
          </nav>
          <form action="/api/logout" method="post" onSubmit={async (event) => {
            event.preventDefault();
            const response = await fetch("/api/logout", { method: "POST" }).catch(() => null);
            if (response?.ok || response?.status === 401) window.location.assign("/login");
            else setLogoutError(true);
          }}>
            <button className="nav-link logout" type="submit" aria-label="Log out">
              <Icon name="logout" size={18} /><span>Log out</span>
            </button>
            {logoutError && <p className="error text-sm" role="alert">Could not log out. Try again.</p>}
          </form>
        </aside>
        <main id="main-content" tabIndex={-1} className="workspace-main">{children}</main>
      </div>
    </ChatProvider>
  );
}

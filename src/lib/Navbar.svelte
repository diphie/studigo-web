<script>
  import { getSession, isReady, goToLogin, goToSignup, logout } from "../auth.svelte.js";

  let mobileOpen = $state(false);
  let searchQuery = $state("");

  const basePath = import.meta.env.BASE_URL;

  const navLinks = [
    { label: "Projects", href: "/projects" },
    { label: "Modpacks", href: "/modpacks" },
    { label: "Plugins", href: "/plugins" },
    { label: "Resources", href: "/resources" },
  ];

  function toggleMobile() {
    mobileOpen = !mobileOpen;
  }

  function handleSearch(e) {
    e.preventDefault();
  }

  function handleLogout() {
    logout();
  }
</script>

<nav class="navbar">
  <div class="nav-inner">
    <a href="/" class="nav-brand">
      <img class="nav-logo" src="{basePath}studigo-logo.png" alt="Studigo" />
      <span class="nav-name">Studigo</span>
    </a>

    <div class="nav-links">
      {#each navLinks as link}
        <a href={link.href} class="nav-link">{link.label}</a>
      {/each}
    </div>

    <form class="nav-search" onsubmit={handleSearch} role="search">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="search"
        placeholder="Search projects..."
        bind:value={searchQuery}
        class="search-input"
      />
    </form>

    <div class="nav-actions">
      {#if isReady() && getSession()}
        <div class="nav-user">
          <span class="nav-user-name">{getSession().name || "User"}</span>
          <button class="nav-btn nav-btn-ghost" onclick={handleLogout}>Log out</button>
        </div>
      {:else}
        <button class="nav-btn nav-btn-ghost" onclick={goToLogin}>Log in</button>
        <button class="nav-btn nav-btn-primary" onclick={goToSignup}>Sign up</button>
      {/if}
    </div>

    <button class="hamburger" onclick={toggleMobile} aria-label="Toggle menu">
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
  </div>

  {#if mobileOpen}
    <div class="mobile-menu">
      {#each navLinks as link}
        <a href={link.href} class="mobile-link">{link.label}</a>
      {/each}
      <form class="mobile-search" onsubmit={handleSearch} role="search">
        <input
          type="search"
          placeholder="Search projects..."
          bind:value={searchQuery}
          class="search-input"
        />
      </form>
      <div class="mobile-actions">
        {#if isReady() && getSession()}
          <span class="mobile-user-name">{getSession().name || "User"}</span>
          <button class="nav-btn nav-btn-ghost" onclick={handleLogout}>Log out</button>
        {:else}
          <button class="nav-btn nav-btn-ghost" onclick={goToLogin}>Log in</button>
          <button class="nav-btn nav-btn-primary" onclick={goToSignup}>Sign up</button>
        {/if}
      </div>
    </div>
  {/if}
</nav>

<style>
  .navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: color-mix(in srgb, var(--card) 96%, black);
    border-bottom: 1px solid var(--line);
    backdrop-filter: blur(12px);
  }

  .nav-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    height: var(--nav-height);
  }

  .nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .nav-logo {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    object-fit: cover;
    background: white;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .nav-name {
    font-size: 20px;
    font-weight: 900;
    letter-spacing: -0.3px;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;
  }

  .nav-link {
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    color: var(--muted);
    transition: color 150ms, background 150ms;
  }

  .nav-link:hover {
    color: var(--ink);
    background: var(--card-soft);
  }

  .nav-search {
    position: relative;
    flex: 1;
    max-width: 320px;
    margin-left: auto;
  }

  .search-icon {
    position: absolute;
    left: 13px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    pointer-events: none;
  }

  .search-input {
    width: 100%;
    height: 40px;
    padding: 0 13px 0 38px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: #0f141b;
    color: var(--ink);
    font-size: 14px;
    outline: none;
    transition: border-color 150ms, box-shadow 150ms;
  }

  .search-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }

  .search-input::placeholder {
    color: var(--muted);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .nav-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .nav-user-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 38px;
    padding: 0 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 800;
    transition: background 150ms, border-color 150ms, opacity 150ms;
    white-space: nowrap;
    cursor: pointer;
  }

  .nav-btn-ghost {
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
  }

  .nav-btn-ghost:hover {
    border-color: #44505e;
  }

  .nav-btn-primary {
    border: 0;
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    color: #fff;
    box-shadow: 0 8px 20px rgba(255, 59, 18, 0.2);
  }

  .nav-btn-primary:hover {
    opacity: 0.9;
  }

  .hamburger {
    display: none;
    flex-direction: column;
    gap: 5px;
    padding: 8px;
    border: 0;
    background: transparent;
    cursor: pointer;
  }

  .hamburger-line {
    display: block;
    width: 22px;
    height: 2.5px;
    border-radius: 2px;
    background: var(--ink);
  }

  .mobile-menu {
    display: none;
    padding: 12px 20px 20px;
    border-top: 1px solid var(--line);
    background: color-mix(in srgb, var(--card) 98%, black);
  }

  .mobile-link {
    display: block;
    padding: 12px 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--muted);
    border-bottom: 1px solid var(--line);
  }

  .mobile-link:last-of-type {
    border-bottom: 0;
  }

  .mobile-search {
    margin: 12px 0;
  }

  .mobile-actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
    align-items: center;
  }

  .mobile-actions .nav-btn {
    flex: 1;
  }

  .mobile-user-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
    padding: 8px 0;
  }

  @media (max-width: 768px) {
    .nav-links,
    .nav-search,
    .nav-actions {
      display: none;
    }

    .hamburger {
      display: flex;
      margin-left: auto;
    }

    .mobile-menu {
      display: block;
    }
  }
</style>
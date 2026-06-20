<script>
  import { getSession, isReady, goToLogin, goToSignup } from "../auth.svelte.js";

  let mobileOpen = $state(false);

  const basePath = import.meta.env.BASE_URL;

  const navLinks = [
    { label: "Dashboard", href: `${basePath}dashboard` },
    { label: "Courses", href: `${basePath}courses` },
    { label: "Worlds", href: `${basePath}worlds` },
    { label: "Quests", href: `${basePath}quests` },
    { label: "Social", href: `${basePath}social` },
    { label: "Rankings", href: `${basePath}rankings` },
  ];

  function toggleMobile() {
    mobileOpen = !mobileOpen;
  }

  function getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
</script>

<nav class="navbar">
  <div class="nav-inner">
    <a href={basePath} class="nav-brand">
      <img class="nav-logo" src="{basePath}studigo-logo.png" alt="Studigo" />
      <span class="nav-name">Studigo</span>
    </a>

    <div class="nav-links">
      {#each navLinks as link}
        <a href={link.href} class="nav-link">{link.label}</a>
      {/each}
    </div>

    <div class="nav-actions">
      {#if isReady() && getSession()}
        <a href="{basePath}profile" class="nav-profile">
          <span class="nav-avatar">{getInitials(getSession().name)}</span>
          <span class="nav-username">{getSession().name || "User"}</span>
        </a>
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
      <div class="mobile-actions">
        {#if isReady() && getSession()}
          <a href="{basePath}profile" class="mobile-profile">
            <span class="nav-avatar">{getInitials(getSession().name)}</span>
            <span class="nav-username">{getSession().name || "User"}</span>
          </a>
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
    flex: 1;
  }

  .nav-link {
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    color: var(--muted);
    transition: color 150ms, background 150ms;
    white-space: nowrap;
  }

  .nav-link:hover {
    color: var(--ink);
    background: var(--card-soft);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .nav-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px;
    border-radius: 10px;
    transition: background 150ms;
    cursor: pointer;
  }

  .nav-profile:hover {
    background: var(--card-soft);
  }

  .nav-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    color: #fff;
    font-size: 13px;
    font-weight: 800;
    flex-shrink: 0;
  }

  .nav-username {
    font-size: 14px;
    font-weight: 700;
    color: var(--ink);
    max-width: 120px;
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
    border: 0;
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

  .mobile-actions {
    margin-top: 12px;
  }

  .mobile-profile {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
  }

  @media (max-width: 768px) {
    .nav-links,
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

    .mobile-actions .nav-btn {
      width: 100%;
    }
  }
</style>
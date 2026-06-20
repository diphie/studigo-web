<script>
  import Navbar from "./lib/Navbar.svelte";
  import Footer from "./lib/Footer.svelte";
  import Profile from "./lib/Profile.svelte";

  const basePath = import.meta.env.BASE_URL;

  // Simple path-based routing for static SPA
  let currentPath = $state(window.location.pathname);

  function handleNav() {
    currentPath = window.location.pathname;
  }

  // Listen for popstate (back/forward) and click navigation
  $effect(() => {
    const onPop = () => { currentPath = window.location.pathname; };
    window.addEventListener("popstate", onPop);

    // Intercept clicks on internal links for SPA-like navigation
    const onClick = (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("//") || href.startsWith("#") || link.hasAttribute("download") || link.target === "_blank") return;
      e.preventDefault();
      if (href !== window.location.pathname) {
        history.pushState(null, "", href);
        currentPath = href;
      }
    };
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("click", onClick);
    };
  });

  function isProfilePage() {
    return currentPath === basePath + "profile" || currentPath === basePath + "profile/";
  }
</script>

<Navbar />

<main class="main-content">
  {#if isProfilePage()}
    <Profile />
  {:else}
    <div class="hero">
      <h1 class="hero-title">Welcome to Studigo</h1>
      <p class="hero-subtitle">
        The open-source platform for discovering, sharing, and managing educational resources.
      </p>
      <div class="hero-actions">
        <a href="{basePath}signup" class="hero-btn hero-btn-primary">Get started</a>
        <a href="{basePath}projects" class="hero-btn hero-btn-secondary">Browse projects</a>
      </div>
    </div>
  {/if}
</main>

<Footer />

<style>
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .hero {
    text-align: center;
    max-width: 600px;
    padding: 40px 20px;
  }

  .hero-title {
    margin: 0 0 16px;
    font-size: 42px;
    font-weight: 900;
    line-height: 1.15;
    letter-spacing: -0.5px;
  }

  .hero-subtitle {
    margin: 0 0 32px;
    font-size: 18px;
    line-height: 1.6;
    color: var(--muted);
  }

  .hero-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .hero-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 48px;
    padding: 0 28px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 800;
    transition: background 150ms, border-color 150ms, opacity 150ms;
  }

  .hero-btn-primary {
    border: 0;
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    color: #fff;
    box-shadow: 0 12px 24px rgba(255, 59, 18, 0.2);
  }

  .hero-btn-primary:hover {
    opacity: 0.9;
  }

  .hero-btn-secondary {
    border: 1px solid var(--line);
    background: transparent;
    color: var(--ink);
  }

  .hero-btn-secondary:hover {
    border-color: #44505e;
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 30px;
    }

    .hero-subtitle {
      font-size: 16px;
    }
  }
</style>
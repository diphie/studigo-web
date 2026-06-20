<script>
  import Navbar from "./lib/Navbar.svelte";
  import Footer from "./lib/Footer.svelte";
</script>

<Navbar />

<main class="main-content">
  <div class="hero">
    <h1 class="hero-title">Welcome to Studigo</h1>
    <p class="hero-subtitle">
      The open-source platform for discovering, sharing, and managing educational resources.
    </p>
    <div class="hero-actions">
      <a href="/signup" class="hero-btn hero-btn-primary">Get started</a>
      <a href="/projects" class="hero-btn hero-btn-secondary">Browse projects</a>
    </div>
  </div>
</main>

<Footer />

<style>
  .main-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
  }

  .hero {
    text-align: center;
    max-width: 600px;
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
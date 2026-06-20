<script>
  import { getSession, isReady } from "../auth.svelte.js";

  const basePath = import.meta.env.BASE_URL;
  const session = getSession();
  const ready = isReady();

  let profile = $state(null);
  let loading = $state(true);
  let saving = $state(false);
  let editingBio = $state(false);
  let showPresetPicker = $state(false);
  let selectedBio = $state("");
  let error = $state(null);
  let activeTab = $state("overview");

  const presetBios = [
    "Learning something new every day 🚀",
    "Building the future of education",
    "Code. Learn. Repeat.",
    "Full-stack developer & educator",
    "Making the world a better place one line at a time",
    "Just here for the quests 🎮",
    "Math, science, and everything in between",
    "Creative problem solver",
    "On a journey to master every subject",
    "Studigo enthusiast 💡",
  ];

  const config = window.STUDIGO_CONFIG || {};
  const SUPABASE_URL = config.SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY || "";

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "worlds", label: "Worlds" },
    { id: "quests", label: "Quests" },
    { id: "courses", label: "Courses" },
    { id: "leaderboard", label: "Leaderboard" },
  ];

  const sampleBadges = [
    { name: "Early Adopter", icon: "🌟", color: "#ffd700" },
    { name: "Quest Master", icon: "⚔️", color: "#ff3b12" },
    { name: "Top Contributor", icon: "🏆", color: "#00bfff" },
    { name: "Speed Runner", icon: "⚡", color: "#9b59b6" },
    { name: "Team Player", icon: "🤝", color: "#2ecc71" },
  ];

  function getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function fetchProfile() {
    if (!session?.userId || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      loading = false;
      return;
    }

    try {
      const [profileRes, allRes] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.userId}&select=*`,
          {
            headers: {
              apiKey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        ),
        fetch(
          `${SUPABASE_URL}/rest/v1/profiles?select=level`,
          {
            headers: {
              apiKey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        ),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.length > 0) {
          profile = data[0];
        } else {
          profile = {
            id: session.userId,
            name: session.name || "User",
            bio: "",
            level: 1,
            xp: 0,
            xp_next: 100,
            worlds_created: 0,
            worlds_completed: 0,
            courses_enrolled: 0,
            courses_completed: 0,
            quests_completed: 0,
            rank: 9999,
            total_points: 0,
            banner_url: null,
            avatar_url: null,
            badges: [],
          };
          await saveProfile(profile, true);
        }
      } else {
        console.warn("Profile fetch failed:", profileRes.status, await profileRes.text());
        error = "Could not load profile. Make sure the profiles table exists in Supabase.";
        profile = {
          id: session.userId,
          name: session.name || "User",
          bio: "",
          level: 1,
          xp: 0,
          xp_next: 100,
          worlds_created: 0,
          worlds_completed: 0,
          courses_enrolled: 0,
          courses_completed: 0,
          quests_completed: 0,
          rank: 9999,
          total_points: 0,
          banner_url: null,
          avatar_url: null,
          badges: [],
        };
      }

      if (allRes.ok) {
        const allProfiles = await allRes.json();
        const myLevel = profile?.level ?? 1;
        const rank = allProfiles.filter((p) => (p.level ?? 1) > myLevel).length + 1;
        if (profile && profile.rank !== rank) {
          profile.rank = rank;
          saveProfile({ ...profile, rank }, false);
        }
      }
    } catch (err) {
      console.warn("Profile fetch error:", err);
      error = "Could not connect to profile database.";
      profile = {
        id: session.userId,
        name: session.name || "User",
        bio: "",
        level: 1,
        xp: 0,
        xp_next: 100,
        worlds_created: 0,
        worlds_completed: 0,
        courses_enrolled: 0,
        courses_completed: 0,
        quests_completed: 0,
        rank: 9999,
        total_points: 0,
        banner_url: null,
        avatar_url: null,
        badges: [],
      };
    }

    loading = false;
  }

  async function saveProfile(data, isNew = false) {
    if (!session?.userId || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    saving = true;
    try {
      const payload = {
        id: session.userId,
        name: data.name || session.name || "User",
        bio: data.bio || "",
        level: data.level ?? 1,
        xp: data.xp ?? 0,
        xp_next: data.xp_next ?? 100,
        worlds_created: data.worlds_created ?? 0,
        worlds_completed: data.worlds_completed ?? 0,
        courses_enrolled: data.courses_enrolled ?? 0,
        courses_completed: data.courses_completed ?? 0,
        quests_completed: data.quests_completed ?? 0,
        rank: data.rank ?? 9999,
        total_points: data.total_points ?? 0,
        banner_url: data.banner_url ?? null,
        avatar_url: data.avatar_url ?? null,
        badges: data.badges ?? [],
        updated_at: new Date().toISOString(),
      };

      const method = isNew ? "POST" : "PATCH";
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.userId}`,
        {
          method,
          headers: {
            apiKey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const result = await res.json();
        if (result.length > 0) {
          profile = result[0];
        }
      } else {
        console.warn("Profile save failed:", res.status, await res.text());
      }
    } catch (err) {
      console.warn("Profile save error:", err);
    } finally {
      saving = false;
    }
  }

  function startEditBio() {
    selectedBio = profile?.bio || "";
    editingBio = true;
    showPresetPicker = true;
  }

  function selectPreset(text) {
    selectedBio = text;
    saveBio();
  }

  async function saveBio() {
    if (!profile) return;
    profile.bio = selectedBio;
    await saveProfile(profile);
    editingBio = false;
    showPresetPicker = false;
  }

  function cancelBio() {
    editingBio = false;
    showPresetPicker = false;
    selectedBio = "";
  }

  async function changeBanner() {
    const colors = [
      "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
      "linear-gradient(135deg, #2d132c, #801336, #c72c41)",
      "linear-gradient(135deg, #0a3d2e, #1b5e3a, #2d8a4e)",
      "linear-gradient(135deg, #3d1a1a, #5c2a2a, #8b3a3a)",
      "linear-gradient(135deg, #1a2a3d, #2a4a6d, #3a6a9d)",
    ];
    const randomBanner = colors[Math.floor(Math.random() * colors.length)];
    if (profile) {
      profile.banner_url = randomBanner;
      await saveProfile(profile);
    }
  }

  async function changeAvatar() {
    if (profile) {
      profile.avatar_url = null;
      await saveProfile(profile);
    }
  }

  function handleLogout() {
    import("../auth.svelte.js").then(({ logout }) => logout());
  }

  $effect(() => {
    if (ready && session?.userId) {
      fetchProfile();
    }
  });

  let xpProgress = $derived(
    profile ? ((profile.xp ?? 0) / (profile.xp_next ?? 100)) * 100 : 0
  );
</script>

{#if session && !loading}
  <div class="profile-page">
    {#if error}
      <div class="profile-content" style="padding-top: 40px;">
        <div class="alert warning">
          <strong>Profile not loaded</strong>
          <p>{error}</p>
          <p class="muted" style="margin-top: 8px;">
            Run the SQL in <code>supabase.sql</code> in your Supabase project to set up the profiles table.
          </p>
        </div>
      </div>
    {:else}
      <div
        class="profile-banner"
        role="button"
        tabindex="0"
        title="Click to change banner"
        onclick={changeBanner}
        onkeydown={(e) => { if (e.key === "Enter") changeBanner(); }}
        style="background: {profile?.banner_url || 'linear-gradient(135deg, var(--accent-dark), var(--accent), var(--accent-hot))'}"
      >
        <div class="banner-overlay"></div>
        <div class="banner-content">
          <span class="banner-username">{profile?.name || session?.name || "User"}</span>
          <div class="banner-socials">
            <span class="banner-social">🌐</span>
            <span class="banner-social">🐦</span>
          </div>
        </div>
      </div>

      <div class="profile-content">
        <div class="profile-header">
          <div class="profile-left">
            <div class="profile-identity">
              <span
                class="profile-avatar"
                role="button"
                tabindex="0"
                title="Click to change profile picture"
                onclick={changeAvatar}
                onkeydown={(e) => { if (e.key === "Enter") changeAvatar(); }}
              >
                {profile?.avatar_url
                  ? `<img src="${profile.avatar_url}" alt="Avatar" class="avatar-img" />`
                  : getInitials(profile?.name || session?.name || "User")}
                <span class="change-avatar-hint">Change</span>
              </span>
              <div class="profile-meta">
                <h1 class="profile-username">{profile?.name || session?.name || "User"}</h1>
                <div class="profile-badges">
                  {#each (profile?.badges || sampleBadges) as badge}
                    <span class="profile-badge" style="background: {badge.color}20; color: {badge.color}; border-color: {badge.color}40;">
                      {badge.icon} {badge.name}
                    </span>
                  {/each}
                </div>
              </div>
            </div>

            <div class="quick-stats">
              <div class="quick-stat">
                <span class="quick-stat-value">{profile?.worlds_completed ?? 0}</span>
                <span class="quick-stat-label">Worlds</span>
              </div>
              <div class="quick-stat">
                <span class="quick-stat-value">{profile?.quests_completed ?? 0}</span>
                <span class="quick-stat-label">Quests</span>
              </div>
              <div class="quick-stat">
                <span class="quick-stat-value">{(profile?.total_points ?? 0).toLocaleString()}</span>
                <span class="quick-stat-label">Points</span>
              </div>
            </div>

            <div class="badges-row">
              {#each sampleBadges as badge}
                <div class="badge-item" style="background: {badge.color}15; border-color: {badge.color}30;">
                  <span class="badge-icon">{badge.icon}</span>
                </div>
              {/each}
            </div>

            <div class="profile-bottom-bar">
              <div class="level-circle">
                <span class="level-number">{profile?.level ?? 1}</span>
              </div>
              <div class="xp-section">
                <div class="xp-bar-track">
                  <div class="xp-bar-fill" style="width: {xpProgress}%"></div>
                </div>
                <span class="xp-text">{profile?.xp ?? 0} / {profile?.xp_next ?? 100} XP</span>
              </div>
              <div class="bottom-actions">
                <button class="bottom-btn">💬</button>
                <button class="bottom-btn">ℹ️</button>
              </div>
            </div>
          </div>

          <div class="profile-right">
            <div class="rankings">
              <div class="ranking-item">
                <span class="ranking-label">Global Ranking</span>
                <span class="ranking-value">#{profile?.rank ?? 9999}</span>
              </div>
            </div>

            <div class="detailed-stats">
              <div class="stat-row">
                <span class="stat-label">Ranked Score</span>
                <span class="stat-value">{(profile?.total_points ?? 0).toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Hit Accuracy</span>
                <span class="stat-value">98.66%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Play Count</span>
                <span class="stat-value">{profile?.quests_completed ?? 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Total Score</span>
                <span class="stat-value">{(profile?.total_points ?? 0).toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Total Hits</span>
                <span class="stat-value">{(profile?.quests_completed ?? 0) * 12}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Hits per Play</span>
                <span class="stat-value">{(profile?.quests_completed ?? 0) > 0 ? Math.round((profile?.quests_completed ?? 0) * 12 / (profile?.quests_completed ?? 1)) : 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Maximum Combo</span>
                <span class="stat-value">{Math.max(10, (profile?.quests_completed ?? 0) * 3)}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Replays Watched</span>
                <span class="stat-value">{profile?.worlds_completed ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="profile-tabs">
          {#each tabs as tab}
            <button
              class="profile-tab"
              class:active={activeTab === tab.id}
              onclick={() => activeTab = tab.id}
            >
              {tab.label}
            </button>
          {/each}
        </div>

        <div class="tab-content">
          {#if activeTab === "overview"}
            <div class="tab-panel">
              <p class="muted">Welcome to {profile?.name || session?.name || "User"}'s profile!</p>
            </div>
          {:else if activeTab === "worlds"}
            <div class="tab-panel">
              <div class="stat-card">
                <h3 class="stat-title">Worlds Created</h3>
                <p class="stat-value">{profile?.worlds_created ?? 0}</p>
              </div>
              <div class="stat-card">
                <h3 class="stat-title">Worlds Completed</h3>
                <p class="stat-value">{profile?.worlds_completed ?? 0}</p>
              </div>
            </div>
          {:else if activeTab === "quests"}
            <div class="tab-panel">
              <div class="stat-card">
                <h3 class="stat-title">Quests Completed</h3>
                <p class="stat-value">{profile?.quests_completed ?? 0}</p>
              </div>
            </div>
          {:else if activeTab === "courses"}
            <div class="tab-panel">
              <div class="stat-card">
                <h3 class="stat-title">Courses Enrolled</h3>
                <p class="stat-value">{profile?.courses_enrolled ?? 0}</p>
              </div>
              <div class="stat-card">
                <h3 class="stat-title">Courses Completed</h3>
                <p class="stat-value">{profile?.courses_completed ?? 0}</p>
              </div>
            </div>
          {:else if activeTab === "leaderboard"}
            <div class="tab-panel">
              <div class="stat-card">
                <h3 class="stat-title">Global Rank</h3>
                <p class="stat-value">#{profile?.rank ?? 9999}</p>
              </div>
              <div class="stat-card">
                <h3 class="stat-title">Total Points</h3>
                <p class="stat-value">{(profile?.total_points ?? 0).toLocaleString()}</p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{:else if ready && !session}
  <div class="profile-page">
    <div class="profile-content" style="padding-top: 60px; text-align: center;">
      <p class="muted">Redirecting to login...</p>
    </div>
  </div>
{/if}

<style>
  .profile-page {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .profile-banner {
    position: relative;
    width: 100%;
    height: 240px;
    overflow: hidden;
    cursor: pointer;
  }

  .banner-overlay {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 20px,
      rgba(255, 255, 255, 0.03) 20px,
      rgba(255, 255, 255, 0.03) 40px
    );
  }

  .banner-content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    z-index: 1;
  }

  .banner-username {
    font-size: 36px;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    letter-spacing: 2px;
  }

  .banner-socials {
    display: flex;
    gap: 16px;
  }

  .banner-social {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
    cursor: pointer;
  }

  .change-banner-hint {
    position: absolute;
    bottom: 12px;
    right: 16px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    opacity: 0;
    transition: opacity 150ms;
    z-index: 2;
  }

  .profile-banner:hover .change-banner-hint {
    opacity: 1;
  }

  .profile-content {
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    padding: 0 24px 40px;
  }

  .profile-header {
    display: flex;
    justify-content: space-between;
    gap: 24px;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  .profile-left {
    flex: 1;
    min-width: 300px;
  }

  .profile-right {
    width: 280px;
    flex-shrink: 0;
  }

  .profile-identity {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .profile-avatar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    color: #fff;
    font-size: 36px;
    font-weight: 900;
    flex-shrink: 0;
    border: 3px solid var(--bg);
    box-shadow: 0 0 0 1px var(--line);
    cursor: pointer;
    overflow: hidden;
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .change-avatar-hint {
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    opacity: 0;
    transition: opacity 150ms;
    white-space: nowrap;
  }

  .profile-avatar:hover .change-avatar-hint {
    opacity: 1;
  }

  .profile-meta {
    flex: 1;
  }

  .profile-username {
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 900;
    line-height: 1.2;
  }

  .profile-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 6px;
  }

  .profile-badge {
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid;
  }

  .quick-stats {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: color-mix(in srgb, var(--card) 94%, black);
  }

  .quick-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .quick-stat-value {
    font-size: 22px;
    font-weight: 900;
    color: var(--ink);
  }

  .quick-stat-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badges-row {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .badge-item {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    cursor: pointer;
    transition: transform 150ms;
  }

  .badge-item:hover {
    transform: scale(1.1);
  }

  .profile-bottom-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: color-mix(in srgb, var(--card) 94%, black);
  }

  .level-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 18px;
    font-weight: 900;
    flex-shrink: 0;
  }

  .level-number {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .xp-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .xp-bar-track {
    height: 10px;
    border-radius: 5px;
    background: var(--card-soft);
    overflow: hidden;
  }

  .xp-bar-fill {
    height: 100%;
    border-radius: 5px;
    background: linear-gradient(90deg, var(--accent), var(--accent-hot));
    transition: width 300ms ease;
  }

  .xp-text {
    font-size: 12px;
    font-weight: 700;
    color: var(--muted);
  }

  .bottom-actions {
    display: flex;
    gap: 8px;
  }

  .bottom-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--line);
    background: var(--card-soft);
    color: var(--muted);
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 150ms, color 150ms;
  }

  .bottom-btn:hover {
    border-color: #44505e;
    color: var(--ink);
  }

  .rankings {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .ranking-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ranking-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ranking-value {
    font-size: 28px;
    font-weight: 900;
    color: var(--ink);
  }

  .detailed-stats {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: color-mix(in srgb, var(--card) 94%, black);
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    font-size: 13px;
    color: var(--muted);
    font-weight: 600;
  }

  .stat-value {
    font-size: 15px;
    font-weight: 800;
    color: var(--ink);
  }

  .profile-tabs {
    display: flex;
    gap: 4px;
    margin-top: 24px;
    border-bottom: 1px solid var(--line);
    overflow-x: auto;
  }

  .profile-tab {
    padding: 10px 20px;
    border: 0;
    background: transparent;
    color: var(--muted);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 150ms, border-color 150ms;
    white-space: nowrap;
    font-family: inherit;
  }

  .profile-tab:hover {
    color: var(--ink);
  }

  .profile-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .tab-content {
    margin-top: 20px;
  }

  .tab-panel {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .stat-card {
    padding: 20px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: color-mix(in srgb, var(--card) 94%, black);
  }

  .stat-title {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--muted);
  }

  .alert {
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .alert.warning {
    background: var(--amber-bg);
    border: 1px solid var(--amber-line);
    color: var(--ink);
  }

  .alert code {
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
  }

  @media (max-width: 768px) {
    .profile-banner {
      height: 180px;
    }

    .banner-content {
      padding: 0 16px;
    }

    .banner-username {
      font-size: 24px;
    }

    .profile-header {
      flex-direction: column;
    }

    .profile-right {
      width: 100%;
    }

    .profile-identity {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .profile-badges {
      justify-content: center;
    }

    .quick-stats {
      justify-content: center;
    }

    .badges-row {
      justify-content: center;
    }

    .rankings {
      flex-direction: row;
      justify-content: center;
      gap: 32px;
    }

    .ranking-item {
      align-items: center;
    }

    .profile-bottom-bar {
      flex-wrap: wrap;
      justify-content: center;
    }
  }
</style>
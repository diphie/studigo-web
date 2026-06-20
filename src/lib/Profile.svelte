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
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.userId}&select=*`,
        {
          headers: {
            apiKey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          profile = data[0];
        } else {
          // No profile yet — create one with session name
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
          };
          await saveProfile(profile, true);
        }
      } else {
        // Table might not exist or permission denied
        console.warn("Profile fetch failed:", res.status, await res.text());
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
        };
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
        <span class="change-banner-hint">Change banner</span>
      </div>

      <div class="profile-content">
        <div class="profile-header">
          <div class="profile-info">
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
            <div class="profile-name-section">
              <h1 class="profile-username">{profile?.name || session?.name || "User"}</h1>
              <div class="profile-bio-area">
                {#if editingBio}
                  <div class="bio-edit">
                    <div class="preset-bios">
                      <p class="preset-label">Choose a bio:</p>
                      <div class="preset-grid">
                        {#each presetBios as preset}
                          <button
                            class="preset-btn"
                            class:selected={selectedBio === preset}
                            onclick={() => selectPreset(preset)}
                          >
                            {preset}
                          </button>
                        {/each}
                      </div>
                    </div>
                    <div class="bio-actions">
                      <button class="bio-save-btn" onclick={saveBio} disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button class="bio-cancel-btn" onclick={cancelBio}>Cancel</button>
                    </div>
                  </div>
                {:else}
                  <button class="profile-bio" onclick={startEditBio}>
                    {profile?.bio || "No bio set yet"}
                    <span class="edit-icon">✎</span>
                  </button>
                {/if}
              </div>
              <div class="level-section">
                <span class="level-badge">Level {profile?.level ?? 1}</span>
                <div class="xp-bar-track">
                  <div class="xp-bar-fill" style="width: {((profile?.xp ?? 0) / (profile?.xp_next ?? 100)) * 100}%"></div>
                </div>
                <span class="xp-text">{profile?.xp ?? 0} / {profile?.xp_next ?? 100} XP</span>
              </div>
            </div>
          </div>

          <div class="profile-actions">
            <button class="action-btn action-options">Options</button>
            <button class="action-btn action-logout" onclick={handleLogout}>Log out</button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <h3 class="stat-title">Worlds</h3>
            <div class="stat-rows">
              <div class="stat-row">
                <span class="stat-label">Created</span>
                <span class="stat-value">{profile?.worlds_created ?? 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Completed</span>
                <span class="stat-value">{profile?.worlds_completed ?? 0}</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <h3 class="stat-title">Courses</h3>
            <div class="stat-rows">
              <div class="stat-row">
                <span class="stat-label">Enrolled</span>
                <span class="stat-value">{profile?.courses_enrolled ?? 0}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Completed</span>
                <span class="stat-value">{profile?.courses_completed ?? 0}</span>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <h3 class="stat-title">Leaderboard</h3>
            <div class="stat-rows">
              <div class="stat-row">
                <span class="stat-label">Rank</span>
                <span class="stat-value">#{profile?.rank ?? 9999}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Points</span>
                <span class="stat-value">{(profile?.total_points ?? 0).toLocaleString()}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Quests</span>
                <span class="stat-value">{profile?.quests_completed ?? 0}</span>
              </div>
            </div>
          </div>
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
    height: 220px;
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
    align-items: flex-start;
    margin-top: -50px;
    gap: 20px;
    flex-wrap: wrap;
  }

  .profile-info {
    display: flex;
    align-items: flex-end;
    gap: 20px;
  }

  .profile-avatar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    color: #fff;
    font-size: 40px;
    font-weight: 900;
    flex-shrink: 0;
    border: 4px solid var(--bg);
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

  .profile-name-section {
    padding-bottom: 4px;
  }

  .profile-username {
    margin: 0 0 6px;
    font-size: 30px;
    font-weight: 900;
    line-height: 1.2;
  }

  .profile-bio-area {
    margin-bottom: 12px;
  }

  .profile-bio {
    margin: 0;
    font-size: 15px;
    color: var(--muted);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 8px;
    transition: background 150ms;
    background: transparent;
    border: 0;
    font-family: inherit;
  }

  .profile-bio:hover {
    background: var(--card-soft);
  }

  .edit-icon {
    font-size: 13px;
    opacity: 0;
    transition: opacity 150ms;
  }

  .profile-bio:hover .edit-icon {
    opacity: 1;
  }

  .bio-edit {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .preset-bios {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .preset-label {
    margin: 0;
    font-size: 12px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .preset-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .preset-btn {
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--card);
    color: var(--muted);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 150ms, color 150ms;
    text-align: left;
    font-family: inherit;
  }

  .preset-btn:hover,
  .preset-btn.selected {
    border-color: var(--accent);
    color: var(--ink);
  }

  .bio-actions {
    display: flex;
    gap: 8px;
  }

  .bio-save-btn,
  .bio-cancel-btn {
    padding: 6px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    border: 0;
    font-family: inherit;
  }

  .bio-save-btn {
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    color: #fff;
  }

  .bio-save-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .bio-cancel-btn {
    background: var(--card-soft);
    color: var(--muted);
    border: 1px solid var(--line);
  }

  .level-section {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .level-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 10px;
    border-radius: 8px;
    background: var(--accent-soft);
    color: var(--accent-hot);
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
  }

  .xp-bar-track {
    flex: 1;
    max-width: 180px;
    height: 8px;
    border-radius: 4px;
    background: var(--card-soft);
    overflow: hidden;
  }

  .xp-bar-fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--accent), var(--accent-hot));
    transition: width 300ms ease;
  }

  .xp-text {
    font-size: 12px;
    font-weight: 700;
    color: var(--muted);
    white-space: nowrap;
  }

  .profile-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    margin-top: 56px;
  }

  .action-btn {
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    border: 0;
    transition: background 150ms, opacity 150ms;
    font-family: inherit;
  }

  .action-options {
    background: var(--card-soft);
    color: var(--ink);
    border: 1px solid var(--line);
  }

  .action-options:hover {
    border-color: #44505e;
  }

  .action-logout {
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    color: #fff;
    box-shadow: 0 8px 20px rgba(255, 59, 18, 0.2);
  }

  .action-logout:hover {
    opacity: 0.9;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 32px;
  }

  .stat-card {
    padding: 20px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: color-mix(in srgb, var(--card) 94%, black);
  }

  .stat-title {
    margin: 0 0 14px;
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--muted);
  }

  .stat-rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-label {
    font-size: 14px;
    color: var(--muted);
    font-weight: 600;
  }

  .stat-value {
    font-size: 16px;
    font-weight: 800;
    color: var(--ink);
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
      height: 160px;
    }

    .profile-header {
      flex-direction: column;
      align-items: stretch;
      margin-top: -40px;
    }

    .profile-info {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .profile-avatar {
      width: 90px;
      height: 90px;
      font-size: 32px;
    }

    .profile-username {
      font-size: 24px;
    }

    .level-section {
      justify-content: center;
      flex-wrap: wrap;
    }

    .profile-actions {
      margin-top: 12px;
      justify-content: center;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
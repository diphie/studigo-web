<script>
  import { getSession, isReady } from "../auth.svelte.js";
  import { fly } from "svelte/transition";

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
  let badgesData = $state([]);
  let hoveredBadge = $state(null);
  let searchQuery = $state("");
  let searchResults = $state([]);
  let searching = $state(false);
  let searchTimeout = $state(null);

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

  const MAX_BANNER_SIZE = 2 * 1024 * 1024; // 2MB
  const MAX_AVATAR_SIZE = 500 * 1024; // 500KB

  async function loadBadges() {
    try {
      const res = await fetch(`${basePath}assets/badges/badges.json`);
      if (res.ok) {
        badgesData = await res.json();
      }
    } catch {
      // Use empty array if badges fail to load
    }
  }

  $effect(() => {
    loadBadges();
  });

  function getBadgeById(id) {
    return badgesData.find((b) => b.id === id);
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
          `${SUPABASE_URL}/rest/v1/profiles?select=level,xp,created_at`,
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
          const totalUsers = allRes.ok ? (await allRes.json()).length : 1;
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
            rank: totalUsers + 1,
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
        // Sort by XP DESC, then created_at ASC (earlier = better rank on tie)
        const sorted = [...allProfiles].sort((a, b) => {
          const xpDiff = (b.xp ?? 0) - (a.xp ?? 0);
          if (xpDiff !== 0) return xpDiff;
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        });
        const myXp = profile?.xp ?? 0;
        const myCreated = profile?.created_at || new Date().toISOString();
        const rank = sorted.filter((p) => {
          const pXp = p.xp ?? 0;
          const pCreated = p.created_at || new Date().toISOString();
          if (pXp > myXp) return true;
          if (pXp === myXp && pCreated < myCreated) return true;
          return false;
        }).length + 1;
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

  async function uploadToSupabase(file, bucket, path) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !session?.access_token) return null;

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only PNG, JPEG, and WEBP images are allowed.");
      return null;
    }

    const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
    console.log("[Upload] POST", url);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apiKey: SUPABASE_ANON_KEY,
      },
      body: file,
    });

    console.log("[Upload] Status:", res.status, res.statusText);
    const text = await res.text();
    console.log("[Upload] Response:", text);

    if (res.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    }
    return null;
  }

  async function changeBanner() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!session?.userId) {
        alert("You must be logged in to upload a banner.");
        return;
      }
      if (file.size > MAX_BANNER_SIZE) {
        alert("Banner image must be under 2MB.");
        return;
      }
      console.log("[Banner] session:", session);
      const userId = session?.userId;
      if (!userId) {
        alert("User ID not found. Please log in again.");
        return;
      }
      const path = `${userId}/banners/${Date.now()}.png`;
      console.log("[Banner] Uploading to path:", path);
      const url = await uploadToSupabase(file, "profiles", path);
      if (url && profile) {
        profile.banner_url = url;
        await saveProfile(profile);
      }
    };
    input.click();
  }

  async function changeAvatar() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!session?.userId) {
        alert("You must be logged in to upload a profile picture.");
        return;
      }
      if (file.size > MAX_AVATAR_SIZE) {
        alert("Profile picture must be under 500KB.");
        return;
      }
      console.log("[Avatar] session:", session);
      const userId = session?.userId;
      if (!userId) {
        alert("User ID not found. Please log in again.");
        return;
      }
      const path = `${userId}/avatars/${Date.now()}.png`;
      console.log("[Avatar] Uploading to path:", path);
      const url = await uploadToSupabase(file, "profiles", path);
      if (url && profile) {
        profile.avatar_url = url;
        await saveProfile(profile);
      }
    };
    input.click();
  }

  function handleLogout() {
    import("../auth.svelte.js").then(({ logout }) => logout());
  }

  $effect(() => {
    if (ready && session?.userId) {
      fetchProfile();
    }
  });

  async function searchProfiles() {
    const query = searchQuery.trim();
    if (!query || query.length < 1) {
      searchResults = [];
      searching = false;
      return;
    }

    searching = true;
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=id,name,level,xp,total_points,avatar_url,badges&name=ilike.*${encodeURIComponent(query)}*&order=level.desc`,
        {
          headers: {
            apiKey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        // Filter out the current user
        searchResults = data.filter((p) => p.id !== session.userId).slice(0, 20);
      } else {
        searchResults = [];
      }
    } catch {
      searchResults = [];
    }
    searching = false;
  }

  function handleSearchInput(e) {
    searchQuery = e.target.value;
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchProfiles();
    }, 300);
  }

  let xpProgress = $derived(
    profile ? ((profile.xp ?? 0) / (profile.xp_next ?? 100)) * 100 : 0
  );

  let tabBarStyle = $state("");
  let tabsContainerEl = $state(null);

  function updateTabIndicator() {
    if (!tabsContainerEl) return;
    const activeBtn = tabsContainerEl.querySelector(".profile-tab.active");
    if (!activeBtn) return;
    const containerRect = tabsContainerEl.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const left = btnRect.left - containerRect.left;
    const width = btnRect.width;
    tabBarStyle = `transform: translateX(${left}px); width: ${width}px;`;
  }

  $effect(() => {
    // Update indicator whenever activeTab changes
    activeTab;
    requestAnimationFrame(updateTabIndicator);
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
        style="background: {profile?.banner_url ? `url(${profile.banner_url}) center/cover no-repeat` : 'linear-gradient(135deg, var(--accent-dark), var(--accent), var(--accent-hot))'}"
      >
        <div class="banner-overlay"></div>
        <span class="change-banner-hint">Change banner</span>
      </div>

      <div class="profile-content">
        <div class="profile-header">
          <div class="profile-identity">
            <span
              class="profile-avatar"
              role="button"
              tabindex="0"
              title="Click to change profile picture"
              onclick={changeAvatar}
              onkeydown={(e) => { if (e.key === "Enter") changeAvatar(); }}
            >
              {#if profile?.avatar_url}
                <img src="{profile.avatar_url}" alt="Avatar" class="avatar-img" />
              {:else}
                {getInitials(profile?.name || session?.name || "User")}
              {/if}
              <span class="change-avatar-hint">Change</span>
            </span>
            <div class="profile-meta">
              <h1 class="profile-username">{profile?.name || session?.name || "User"}</h1>
              <div class="profile-badges">
                {#each (profile?.badges || badgesData) as badge}
                  {@const badgeInfo = typeof badge === 'string' ? getBadgeById(badge) : badge}
                  {#if badgeInfo}
                    <span
                      class="profile-badge"
                      style="background: {badgeInfo.color}20; color: {badgeInfo.color}; border-color: {badgeInfo.color}40;"
                      role="button"
                      tabindex="0"
                      onmouseenter={() => hoveredBadge = badgeInfo.id}
                      onmouseleave={() => hoveredBadge = null}
                    >
                      {#if badgeInfo.image}
                        <img src="{basePath}assets/badges/{badgeInfo.image}" alt="{badgeInfo.name}" class="badge-img" />
                      {:else if badgeInfo.icon}
                        <i class="bi bi-{badgeInfo.icon} badge-icon"></i>
                      {/if}
                      {#if hoveredBadge === badgeInfo.id}
                        <span class="badge-tooltip">
                          <strong>{badgeInfo.name}</strong>
                          <span>{badgeInfo.description}</span>
                        </span>
                      {/if}
                    </span>
                  {/if}
                {/each}
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

            <div class="friends-section">
              <span class="friends-label">Find Friends</span>
              <div class="friends-search">
                <input
                  type="text"
                  class="friends-search-input"
                  placeholder="Search by username..."
                  value={searchQuery}
                  oninput={handleSearchInput}
                />
                {#if searching}
                  <span class="friends-search-spinner"></span>
                {/if}
              </div>
              {#if searchResults.length > 0}
                <div class="friends-results">
                  {#each searchResults as result}
                    <div class="friend-result">
                      <span class="friend-result-avatar">
                        {getInitials(result.name)}
                      </span>
                      <div class="friend-result-info">
                        <span class="friend-result-name">{result.name}</span>
                        <span class="friend-result-level">Lv.{result.level ?? 1}</span>
                      </div>
                      <span class="friend-result-xp">{(result.total_points ?? 0).toLocaleString()} pts</span>
                    </div>
                  {/each}
                </div>
              {:else if searchQuery.trim().length > 0 && !searching}
                <div class="friends-no-results">No users found</div>
              {/if}
            </div>
          </div>
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

        <div class="profile-tabs" bind:this={tabsContainerEl}>
          {#each tabs as tab}
            <button
              class="profile-tab"
              class:active={activeTab === tab.id}
              onclick={() => activeTab = tab.id}
            >
              {tab.label}
            </button>
          {/each}
          <div class="tab-indicator" style={tabBarStyle}></div>
        </div>

        <div class="tab-content">
          {#key activeTab}
            {#if activeTab === "overview"}
              <div class="tab-panel" transition:fly={{ y: 12, duration: 200 }}>
                <p class="muted">Profile overview</p>
              </div>
            {:else if activeTab === "worlds"}
              <div class="tab-panel" transition:fly={{ y: 12, duration: 200 }}>
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
              <div class="tab-panel" transition:fly={{ y: 12, duration: 200 }}>
                <div class="stat-card">
                  <h3 class="stat-title">Quests Completed</h3>
                  <p class="stat-value">{profile?.quests_completed ?? 0}</p>
                </div>
              </div>
            {:else if activeTab === "courses"}
              <div class="tab-panel" transition:fly={{ y: 12, duration: 200 }}>
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
              <div class="tab-panel" transition:fly={{ y: 12, duration: 200 }}>
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
          {/key}
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
    max-width: 1100px;
    height: 220px;
    margin: 0 auto;
    overflow: hidden;
    cursor: pointer;
    background-size: cover;
    background-position: center;
    border-radius: 0 0 16px 16px;
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
    align-items: flex-start;
    gap: 24px;
    margin-top: 24px;
    flex-wrap: wrap;
  }

  .profile-identity {
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .profile-avatar {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    max-width: 100px;
    max-height: 100px;
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
    margin: 0 0 10px;
    font-size: 26px;
    font-weight: 900;
    line-height: 1.2;
  }

  .profile-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    position: relative;
  }

  .profile-badge {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    cursor: pointer;
    transition: transform 150ms;
    position: relative;
  }

  .profile-badge:hover {
    transform: scale(1.1);
  }

  .badge-icon {
    line-height: 1;
    font-size: 20px;
  }

  .badge-img {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .badge-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: #1a1a2e;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px 12px;
    width: 220px;
    z-index: 100;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: none;
  }

  .badge-tooltip strong {
    font-size: 13px;
    font-weight: 800;
    color: var(--ink);
  }

  .badge-tooltip span {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.4;
  }

  .profile-right {
    flex-shrink: 0;
    width: 260px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .rankings {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ranking-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: color-mix(in srgb, var(--card) 94%, black);
  }

  .ranking-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ranking-value {
    font-size: 22px;
    font-weight: 900;
    color: var(--ink);
  }

  .friends-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border: 1px solid var(--line);
    border-radius: 12px;
    padding: 12px;
    background: color-mix(in srgb, var(--card) 94%, black);
  }

  .friends-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .friends-search {
    position: relative;
    display: flex;
    align-items: center;
  }

  .friends-search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--card-soft);
    color: var(--ink);
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 150ms;
  }

  .friends-search-input:focus {
    border-color: var(--accent);
  }

  .friends-search-input::placeholder {
    color: var(--muted);
  }

  .friends-search-spinner {
    position: absolute;
    right: 10px;
    width: 14px;
    height: 14px;
    border: 2px solid var(--line);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: friends-spin 600ms linear infinite;
  }

  @keyframes friends-spin {
    to { transform: rotate(360deg); }
  }

  .friends-results {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 240px;
    overflow-y: auto;
  }

  .friend-result {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--card-soft);
    transition: background 150ms;
    cursor: default;
  }

  .friend-result:hover {
    background: color-mix(in srgb, var(--card-soft) 90%, var(--accent));
  }

  .friend-result-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .friend-result-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    flex: 1;
  }

  .friend-result-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .friend-result-level {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
  }

  .friend-result-xp {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .friends-no-results {
    padding: 12px 0;
    text-align: center;
    font-size: 13px;
    color: var(--muted);
  }

  .profile-bottom-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 20px;
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

  .profile-tabs {
    position: relative;
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
    white-space: nowrap;
    font-family: inherit;
    transition: color 150ms;
  }

  .profile-tab:hover {
    color: var(--ink);
  }

  .profile-tab.active {
    color: var(--accent);
  }

  .tab-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: var(--accent);
    transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
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

    .rankings {
      align-items: center;
    }

    .profile-bottom-bar {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
  }
</style>

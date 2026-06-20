<script>
  import { getSession, goToLogin, logout } from "../auth.svelte.js";

  const basePath = import.meta.env.BASE_URL;
  const session = getSession();

  let bio = $state(session?.bio || "No bio set yet");
  let editingBio = $state(false);
  let showPresetPicker = $state(false);

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

  const level = 7;
  const xp = 2340;
  const xpNext = 3000;
  const xpProgress = (xp / xpNext) * 100;

  const stats = {
    worldsCreated: 3,
    worldsCompleted: 12,
    coursesEnrolled: 8,
    coursesCompleted: 5,
    questsCompleted: 47,
    rank: 142,
    totalPoints: 8920,
  };

  function getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function startEditBio() {
    editingBio = true;
    showPresetPicker = true;
  }

  function selectPreset(text) {
    bio = text;
    editingBio = false;
    showPresetPicker = false;
  }

  function saveBio() {
    editingBio = false;
    showPresetPicker = false;
  }

  function handleLogout() {
    logout();
  }

  if (!session) {
    goToLogin();
  }
</script>

{#if session}
  <div class="profile-page">
    <!-- Banner -->
    <div class="profile-banner">
      <div class="banner-overlay"></div>
    </div>

    <div class="profile-content">
      <!-- Profile header row -->
      <div class="profile-header">
        <div class="profile-info">
          <span class="profile-avatar">{getInitials(session.name)}</span>
          <div class="profile-name-section">
            <h1 class="profile-username">{session.name || "User"}</h1>
            <div class="profile-bio-area">
              {#if editingBio}
                <div class="bio-edit">
                  <input
                    type="text"
                    bind:value={bio}
                    class="bio-input"
                    placeholder="Write something about yourself..."
                    onkeydown={(e) => { if (e.key === "Enter") saveBio(); }}
                  />
                  {#if showPresetPicker}
                    <div class="preset-bios">
                      <p class="preset-label">Quick bios:</p>
                      <div class="preset-grid">
                        {#each presetBios as preset}
                          <button class="preset-btn" onclick={() => selectPreset(preset)}>
                            {preset}
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                  <div class="bio-actions">
                    <button class="bio-save-btn" onclick={saveBio}>Save</button>
                    <button class="bio-cancel-btn" onclick={() => { editingBio = false; showPresetPicker = false; }}>Cancel</button>
                  </div>
                </div>
              {:else}
                <p class="profile-bio" onclick={startEditBio} role="button" tabindex="0" onkeydown={(e) => { if (e.key === "Enter") startEditBio(); }}>
                  {bio}
                  <span class="edit-icon">✎</span>
                </p>
              {/if}
            </div>
            <!-- Level + XP bar -->
            <div class="level-section">
              <span class="level-badge">Level {level}</span>
              <div class="xp-bar-track">
                <div class="xp-bar-fill" style="width: {xpProgress}%"></div>
              </div>
              <span class="xp-text">{xp} / {xpNext} XP</span>
            </div>
          </div>
        </div>

        <!-- Right actions -->
        <div class="profile-actions">
          <button class="action-btn action-options">Options</button>
          <button class="action-btn action-logout" onclick={handleLogout}>Log out</button>
        </div>
      </div>

      <!-- Stats grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <h3 class="stat-title">Worlds</h3>
          <div class="stat-rows">
            <div class="stat-row">
              <span class="stat-label">Created</span>
              <span class="stat-value">{stats.worldsCreated}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Completed</span>
              <span class="stat-value">{stats.worldsCompleted}</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <h3 class="stat-title">Courses</h3>
          <div class="stat-rows">
            <div class="stat-row">
              <span class="stat-label">Enrolled</span>
              <span class="stat-value">{stats.coursesEnrolled}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Completed</span>
              <span class="stat-value">{stats.coursesCompleted}</span>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <h3 class="stat-title">Leaderboard</h3>
          <div class="stat-rows">
            <div class="stat-row">
              <span class="stat-label">Rank</span>
              <span class="stat-value">#{stats.rank}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Points</span>
              <span class="stat-value">{stats.totalPoints.toLocaleString()}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Quests</span>
              <span class="stat-value">{stats.questsCompleted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .profile-page {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .profile-banner {
    position: relative;
    width: 100%;
    height: 200px;
    background: linear-gradient(135deg, var(--accent-dark), var(--accent), var(--accent-hot));
    overflow: hidden;
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

  .profile-content {
    max-width: 1000px;
    width: 100%;
    margin: 0 auto;
    padding: 0 20px 40px;
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
    border: 4px solid var(--bg);
    box-shadow: 0 0 0 1px var(--line);
  }

  .profile-name-section {
    padding-bottom: 4px;
  }

  .profile-username {
    margin: 0 0 6px;
    font-size: 28px;
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

  .bio-input {
    width: 100%;
    max-width: 400px;
    min-height: 40px;
    padding: 8px 12px;
    border: 1px solid var(--accent);
    border-radius: 10px;
    background: #0f141b;
    color: var(--ink);
    font-size: 14px;
    outline: none;
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
  }

  .preset-btn:hover {
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
  }

  .bio-save-btn {
    background: linear-gradient(135deg, var(--accent), var(--accent-hot));
    color: #fff;
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
    max-width: 160px;
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

  @media (max-width: 768px) {
    .profile-banner {
      height: 140px;
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
      width: 80px;
      height: 80px;
      font-size: 28px;
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
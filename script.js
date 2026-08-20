const BACKEND_URL = 'https://aalsi-backed.vercel.app/api'; 

let visibleEpisodesLimit = 10;
let currentAnimeId = null;
let allEpisodesList = [];

// 🌐 Navigation & Home Feed (Renime API /home se data aayega)
async function switchNav(el, type) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    if(el) el.classList.add('active');

    const container = document.getElementById('main-container');
    if (!container) return;

    if (type === 'search') {
        container.innerHTML = `
            <div style="padding:20px; text-align:center;">
                <h2 style="color:#fff; font-size:18px; margin-bottom:15px;">Search Anime & Cartoons</h2>
                <input type="text" id="search-input" placeholder="Type name (e.g. Naruto, Doraemon)..." style="width:100%; max-width:500px; padding:12px; background:#16161a; border:1px solid #444; color:white; border-radius:8px; font-size:14px; outline:none;" oninput="handleSearch(this.value)">
                <div id="search-results" class="poster-container" style="margin-top:20px; display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;"></div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div id="movie-rows-container" style="padding-top:15px;">
            <p style="text-align:center; color:#aaa; padding:20px;">Loading Anime Feed...</p>
        </div>
    `;

    try {
        // Renime API ka /home endpoint call karenge
        let res = await fetch(`${BACKEND_URL}/home`);
        let data = await res.json();
        
        const rows = document.getElementById('movie-rows-container');
        rows.innerHTML = `
            <div class="category-section">
                <div class="section-header-flex"><h2 class="section-title">🔥 AnimeSalt & WatchAnimeWorld Feed</h2></div>
                <div class="poster-container" id="home-poster-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; padding:10px;"></div>
            </div>
        `;

        const pCont = document.getElementById('home-poster-grid');
        let items = data.results || data.anime || data;

        if (Array.isArray(items) && items.length > 0) {
            items.forEach(anime => {
                const card = document.createElement('div');
                card.className = 'poster-card';
                card.style.cursor = 'pointer';
                card.innerHTML = `
                    <img src="${anime.image || anime.poster || 'https://via.placeholder.com/150'}" alt="${anime.title}" style="width:100%; border-radius:6px; aspect-ratio:3/4; object-fit:cover;">
                    <div class="poster-title" style="color:#fff; font-size:12px; margin-top:5px; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${anime.title}</div>
                `;
                card.onclick = () => openDedicatedPage(anime);
                pCont.appendChild(card);
            });
        } else {
            pCont.innerHTML = `<p style="color:#aaa; text-align:center;">No anime found.</p>`;
        }

    } catch (err) {
        console.error("Home Load Error:", err);
        document.getElementById('movie-rows-container').innerHTML = `<p style="text-align:center; color:#ff4444;">Failed to load anime feed.</p>`;
    }
}

async function loadAllRows(type = 'home') {
    switchNav(null, type);
}

// 🔍 Search Functionality (Renime API /search)
async function handleSearch(query) {
    const resBox = document.getElementById('search-results');
    if(!query || query.trim() === '') {
        if(resBox) resBox.innerHTML = '';
        return;
    }
    
    resBox.innerHTML = `<p style="color:#aaa; font-size:12px; grid-column:span 3; text-align:center;">Searching...</p>`;

    try {
        let res = await fetch(`${BACKEND_URL}/search?q=${encodeURIComponent(query)}`);
        let data = await res.json();
        let results = data.results || data.data || data;

        resBox.innerHTML = '';
        if(Array.isArray(results) && results.length > 0) {
            results.forEach(anime => {
                const card = document.createElement('div');
                card.className = 'poster-card';
                card.style.cursor = 'pointer';
                card.innerHTML = `
                    <img src="${anime.image || anime.poster || 'https://via.placeholder.com/150'}" alt="${anime.title}" style="width:100%; border-radius:6px; aspect-ratio:3/4; object-fit:cover;">
                    <div class="poster-title" style="color:#fff; font-size:12px; margin-top:5px; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${anime.title}</div>
                `;
                card.onclick = () => openDedicatedPage(anime);
                resBox.appendChild(card);
            });
        } else {
            resBox.innerHTML = `<p style="color:#aaa; font-size:12px; grid-column:span 3; text-align:center;">No results found.</p>`;
        }
    } catch (err) {
        resBox.innerHTML = `<p style="color:#ff4444; font-size:12px; grid-column:span 3; text-align:center;">Search failed.</p>`;
    }
}

// 📄 Dedicated Page to show Episodes list directly from Renime API
async function openDedicatedPage(anime) {
    currentAnimeId = anime.id || anime.slug || anime.animeId;
    const container = document.getElementById('main-container');
    
    container.innerHTML = `<p style="text-align:center; padding:40px; color:#aaa;">Loading Episodes...</p>`;

    try {
        let res = await fetch(`${BACKEND_URL}/episodes?id=${encodeURIComponent(currentAnimeId)}`);
        let data = await res.json();
        allEpisodesList = data.episodes || data.data || data;
        visibleEpisodesLimit = 15;

        container.innerHTML = `
            <div class="dedicated-page" style="padding:15px;">
                <button class="back-btn" onclick="loadAllRows('home')" style="background:#222; color:#fff; border:none; padding:8px 15px; border-radius:6px; margin-bottom:15px; cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <div class="anime-header-box" style="display:flex; gap:15px; margin-bottom:15px; align-items:flex-start;">
                    <img src="${anime.image || anime.poster || 'https://via.placeholder.com/150'}" style="width:110px; height:160px; object-fit:cover; border-radius:8px; flex-shrink:0;" alt="${anime.title}">
                    <div class="anime-meta">
                        <h1 style="font-size:16px; margin-bottom:5px; color:#fff;">${anime.title}</h1>
                        <p style="color:#aaa; font-size:11px;">Tap an episode below to start streaming instantly!</p>
                    </div>
                </div>

                <div id="episodes-grid-box" class="episodes-grid-box" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; margin-top:15px;"></div>
                <button class="view-more-btn" id="vm-btn" onclick="loadMoreEpisodes()" style="width:100%; margin-top:15px; padding:10px; background:#f59e0b; border:none; font-weight:bold; border-radius:6px; cursor:pointer;">View More Episodes</button>
            </div>
        `;

        renderEpisodesList();
    } catch (e) {
        console.error("Episodes Error:", e);
        container.innerHTML = `<p style="text-align:center; padding:40px; color:#ff4444;">Failed to load episodes.</p>`;
    }
}

function renderEpisodesList() {
    const grid = document.getElementById('episodes-grid-box');
    grid.innerHTML = '';

    if (Array.isArray(allEpisodesList) && allEpisodesList.length > 0) {
        const epsToDisplay = allEpisodesList.slice(0, visibleEpisodesLimit);
        epsToDisplay.forEach((ep, index) => {
            const div = document.createElement('div');
            div.className = 'ep-box-card';
            div.style.background = '#16161a';
            div.style.padding = '10px';
            div.style.borderRadius = '8px';
            div.style.cursor = 'pointer';
            div.style.border = '1px solid #333';
            div.innerHTML = `
                <div class="ep-num" style="color:#f59e0b; font-weight:bold; font-size:12px;">Episode ${ep.number || ep.episode_number || (index + 1)}</div>
                <div class="ep-title" style="color:#fff; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ep.title || 'Sub/Dub Episode'}</div>
            `;
            div.onclick = () => playVideo(ep);
            grid.appendChild(div);
        });

        const vmBtn = document.getElementById('vm-btn');
        if(vmBtn) {
            vmBtn.style.display = (visibleEpisodesLimit >= allEpisodesList.length) ? 'none' : 'block';
        }
    } else {
        grid.innerHTML = '<p style="color:#aaa; font-size:12px;">No episodes available.</p>';
    }
}

function loadMoreEpisodes() {
    visibleEpisodesLimit += 15;
    renderEpisodesList();
}

// 🎬 Video Player & Direct Embed Fetching
async function playVideo(episode) {
    const container = document.getElementById('main-container');
    const epId = episode.id || episode.episodeId;
    const epTitle = episode.title || `Episode`;

    container.innerHTML = `
        <div class="video-player-section" style="padding:15px;">
            <button class="back-btn" onclick="openDedicatedPage({id: currentAnimeId})" style="background:#222; color:#fff; border:none; padding:8px 15px; border-radius:6px; margin-bottom:10px; cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back to Episodes</button>
            <h2 style="font-size:14px; margin-bottom:5px; color:#fff;">Streaming: ${epTitle}</h2>
            <p id="player-status" style="color:#f59e0b; font-size:11px; margin-bottom:8px;">⏳ Fetching video stream...</p>
            
            <div class="embed-container" style="position:relative; width:100%; aspect-ratio:16/9; background:#000; border-radius:10px; overflow:hidden; border:1px solid #333;">
                <video id="custom-video-player" controls style="width:100%; height:100%; outline:none; background:black;"></video>
            </div>
        </div>
    `;

    const statusText = document.getElementById('player-status');
    const videoElement = document.getElementById('custom-video-player');

    try {
        let res = await fetch(`${BACKEND_URL}/embed?id=${encodeURIComponent(epId)}`);
        let data = await res.json();
        let videoUrl = data.embedUrl || data.url || data.videoUrl || data.stream;

        if (videoUrl) {
            statusText.innerText = `✅ Streaming live from AnimeSalt/Renime Source!`;
            statusText.style.color = "#00ff88";

            if (typeof Hls !== 'undefined' && Hls.isSupported() && videoUrl.includes('.m3u8')) {
                const hls = new Hls();
                hls.loadSource(videoUrl);
                hls.attachMedia(videoElement);
                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                    videoElement.play();
                });
            } else {
                videoElement.src = videoUrl;
                videoElement.play().catch(e => console.log("Auto-play blocked"));
            }
        } else {
            statusText.innerText = `❌ Stream link not found for this episode.`;
            statusText.style.color = "#ff4444";
        }
    } catch (err) {
        console.error("Stream Error:", err);
        statusText.innerText = "❌ Failed to connect to stream server.";
        statusText.style.color = "#ff4444";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadAllRows('home');
});

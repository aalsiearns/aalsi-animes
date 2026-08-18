const API_KEY = 'fb0b6730bbe491d60fd75002a8cfc63f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let currentShowData = null;
let currentSeasonNum = 1;
let visibleEpisodesLimit = 10;
let activeServer = 0;

// Cloudflare Proxy और डायरेक्ट स्ट्रीमिंग सर्वर्स का सेटअप
const SMART_SERVERS = [
    (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    (id, s, e) => `https://player.vidsrc.nl/embed/tv/${id}/${s}/${e}`
];

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
        <div class="filter-section">
            <div class="filter-label">Selected language: ● Hindi</div>
            <div class="lang-grid">
                <button class="lang-btn active">Hindi<br><span style="font-size:9px; color:#aaa;">हिंदी</span></button>
                <button class="lang-btn">Tamil<br><span style="font-size:9px; color:#aaa;">தமிழ்</span></button>
                <button class="lang-btn">Telugu<br><span style="font-size:9px; color:#aaa;">తెలుగు</span></button>
                <button class="lang-btn">English<br><span style="font-size:9px; color:#aaa;">English</span></button>
                <button class="lang-btn">Japanese<br><span style="font-size:9px; color:#aaa;">日本語</span></button>
                <button class="lang-btn">Korean<br><span style="font-size:9px; color:#aaa;">한국어</span></button>
            </div>
        </div>
        <div id="movie-rows-container"></div>
    `;

    const rows = document.getElementById('movie-rows-container');
    let cats = [];

    if (type === 'anime') {
        cats = [
            { title: "🔥 Japanese Anime Series", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc` }
        ];
    } else if (type === 'cartoon') {
        cats = [
            { title: "🧸 Cartoon Favorites", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=en&sort_by=popularity.desc` }
        ];
    } else if (type === 'movies') {
        cats = [
            { title: "🎬 Anime & Cartoon Movies", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc` }
        ];
    } else if (type === 'series') {
        cats = [
            { title: "📺 All Animation Series", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc` }
        ];
    } else {
        cats = [
            { title: "🔥 Trending Core Anime (Naruto, DBZ, AOT)", isManual: true, queryList: ["Naruto Shippuden", "Naruto", "Dragon Ball Z", "Attack on Titan", "Jujutsu Kaisen", "Demon Slayer", "Tokyo Revengers"] },
            { title: "⭐ Most-Watched Anime Series", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc` },
            { title: "🧸 Cartoon Favorites", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=en&sort_by=popularity.desc` }
        ];
    }

    for (let cat of cats) {
        try {
            const sec = document.createElement('div');
            sec.className = "category-section";
            sec.innerHTML = `
                <div class="section-header-flex"><h2 class="section-title">${cat.title}</h2></div>
                <div class="poster-container"></div>
            `;
            rows.appendChild(sec);
            const pCont = sec.querySelector('.poster-container');

            if (cat.isManual) {
                for (let qName of cat.queryList) {
                    try {
                        const sRes = await fetch(`${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(qName)}`);
                        const sData = await sRes.json();
                        if (sData.results && sData.results.length > 0) {
                            const item = sData.results[0];
                            if (item.poster_path) {
                                const card = document.createElement('div');
                                card.className = 'poster-card';
                                card.innerHTML = `
                                    <img src="${IMG_URL + item.poster_path}" alt="${item.name}">
                                    <div class="poster-title">${item.name}</div>
                                `;
                                card.onclick = () => openDedicatedPage(item);
                                pCont.appendChild(card);
                            }
                        }
                    } catch (err) {
                        console.error("Manual fetch error:", err);
                    }
                }
            } else {
                const res = await fetch(cat.url);
                const data = await res.json();
                if (data.results) {
                    data.results.forEach(i => {
                        if (i.poster_path) {
                            const card = document.createElement('div');
                            card.className = 'poster-card';
                            card.innerHTML = `
                                <img src="${IMG_URL + i.poster_path}" alt="${i.name || i.title}">
                                <div class="poster-title">${i.name || i.title}</div>
                            `;
                            card.onclick = () => openDedicatedPage(i);
                            pCont.appendChild(card);
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Load Error:", e);
        }
    }
}

async function loadAllRows(type = 'home') {
    switchNav(null, type);
}

async function openDedicatedPage(item) {
    const isMovie = !item.name;
    if (isMovie) {
        playVideo(item, 1, 1, item.title || "Full Movie");
        return;
    }

    const container = document.getElementById('main-container');
    container.innerHTML = `<p style="text-align:center; padding:40px; color:#aaa;">Loading Details...</p>`;

    try {
        const res = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}`);
        const data = await res.json();
        currentShowData = data;
        currentSeasonNum = data.seasons.find(s => s.season_number > 0)?.season_number || 1;
        visibleEpisodesLimit = 10;

        container.innerHTML = `
            <div class="dedicated-page">
                <button class="back-btn" onclick="loadAllRows('home')"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <div class="anime-header-box" style="display:flex; gap:15px; margin-bottom:15px; align-items:flex-start;">
                    <img src="${IMG_URL + data.poster_path}" style="width:110px; height:160px; object-fit:cover; border-radius:8px; flex-shrink:0;" alt="${data.name}">
                    <div class="anime-meta">
                        <h1 style="font-size:18px; margin-bottom:5px;">${data.name}</h1>
                        <p style="color:#aaa; font-size:11px; margin-bottom:5px;">⭐ ${data.vote_average ? data.vote_average.toFixed(1) : 'N/A'} | Seasons: ${data.number_of_seasons}</p>
                        <p style="font-size:11px; line-height:1.3; color:#ccc; max-height:80px; overflow-y:auto;">${data.overview || 'No description available.'}</p>
                    </div>
                </div>

                <div class="seasons-bar" id="seasons-chips-box"></div>
                <div id="episodes-grid-box" class="episodes-grid-box"></div>
                <button class="view-more-btn" id="vm-btn" onclick="loadMoreEpisodes()">View More Episodes</button>
            </div>
        `;

        const sBox = document.getElementById('seasons-chips-box');
        data.seasons.forEach(s => {
            if (s.season_number > 0) {
                const btn = document.createElement('button');
                btn.className = `season-chip ${s.season_number === currentSeasonNum ? 'active' : ''}`;
                btn.innerText = s.name;
                btn.onclick = () => {
                    currentSeasonNum = s.season_number;
                    visibleEpisodesLimit = 10;
                    document.querySelectorAll('.season-chip').forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    fetchEpisodesForDedicatedPage();
                };
                sBox.appendChild(btn);
            }
        });

        fetchEpisodesForDedicatedPage();
    } catch (e) {
        console.error("Details Error:", e);
    }
}

async function fetchEpisodesForDedicatedPage() {
    const grid = document.getElementById('episodes-grid-box');
    grid.innerHTML = '<p style="color:#aaa; font-size:12px;">Loading episodes...</p>';

    try {
        const res = await fetch(`${BASE_URL}/tv/${currentShowData.id}/season/${currentSeasonNum}?api_key=${API_KEY}`);
        const data = await res.json();

        grid.innerHTML = '';
        if (data.episodes && data.episodes.length > 0) {
            const epsToDisplay = data.episodes.slice(0, visibleEpisodesLimit);
            epsToDisplay.forEach(e => {
                const div = document.createElement('div');
                div.className = 'ep-box-card';
                div.innerHTML = `
                    <img src="${e.still_path ? IMG_URL + e.still_path : IMG_URL + currentShowData.poster_path}" alt="Ep">
                    <div class="ep-box-info">
                        <div class="ep-num">Ep ${e.episode_number}</div>
                        <div class="ep-title">${e.name}</div>
                    </div>
                `;
                div.onclick = () => playVideo(currentShowData, currentSeasonNum, e.episode_number, e.name);
                grid.appendChild(div);
            });

            const vmBtn = document.getElementById('vm-btn');
            vmBtn.style.display = (visibleEpisodesLimit >= data.episodes.length) ? 'none' : 'block';
        } else {
            grid.innerHTML = '<p style="color:#aaa; font-size:12px;">No episodes found.</p>';
        }
    } catch (err) {
        grid.innerHTML = '<p style="color:#ff4500; font-size:12px;">Failed to load episodes.</p>';
    }
}

function loadMoreEpisodes() {
    visibleEpisodesLimit += 10;
    fetchEpisodesForDedicatedPage();
}

function playVideo(show, s, e, name) {
    const container = document.getElementById('main-container');
    const showName = show.name || show.title;

    const initialUrl = SMART_SERVERS[activeServer](show.id, s, e);

    container.innerHTML = `
        <div class="video-player-section" style="padding:15px;">
            <button class="back-btn" onclick="openDedicatedPage(currentShowData)" style="background:#222; color:#fff; border:none; padding:8px 15px; border-radius:6px; margin-bottom:10px; cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <h2 style="font-size:14px; margin-bottom:5px; color:#fff;">${showName} - S${s} E${e}: ${name}</h2>
            <p style="color:#00ff88; font-size:10px; margin-bottom:8px;">⚡ Cloudflare Proxy Stream Active (Switch servers if black screen)</p>
            
            <div id="s-gallery" class="server-gallery" style="margin-bottom:10px; display:flex; gap:5px;"></div>
            
            <div class="embed-container" style="position:relative; width:100%; aspect-ratio:16/9; background:#000; border-radius:10px; overflow:hidden; border:1px solid #333;">
                <iframe id="vid" src="${initialUrl}" width="100%" height="100%" frameborder="0" allowfullscreen="true" scrolling="no" allow="autoplay; fullscreen; encrypted-media"></iframe>
            </div>
        </div>
    `;

    const sBox = document.getElementById('s-gallery');
    SMART_SERVERS.forEach((srvFn, idx) => {
        const b = document.createElement('button');
        b.className = `server-btn ${idx === activeServer ? 'active' : ''}`;
        b.innerText = `Server ${idx + 1}`;
        b.style.cssText = `padding:5px 10px; background:${idx === activeServer ? '#f59e0b' : '#222'}; color:#fff; border:none; border-radius:4px; font-size:11px; cursor:pointer;`;
        b.onclick = () => {
            activeServer = idx;
            document.getElementById('vid').src = srvFn(show.id, s, e);
            document.querySelectorAll('.server-btn').forEach(x => {
                x.style.background = '#222';
            });
            b.style.background = '#f59e0b';
        };
        sBox.appendChild(b);
    });
}

async function handleSearch(query) {
    const resBox = document.getElementById('search-results');
    if(!query || query.trim() === '') {
        if(resBox) resBox.innerHTML = '';
        return;
    }
    
    try {
        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await res.json();
        if(!resBox) return;
        resBox.innerHTML = '';
        
        if(data.results && data.results.length > 0) {
            data.results.forEach(i => {
                if(i.poster_path && (i.media_type === 'tv' || i.media_type === 'movie')) {
                    const card = document.createElement('div');
                    card.className = 'poster-card';
                    card.style.width = '100%';
                    card.innerHTML = `
                        <img src="${IMG_URL + i.poster_path}" alt="${i.name || i.title}">
                        <div class="poster-title">${i.name || i.title}</div>
                    `;
                    card.onclick = () => openDedicatedPage(i);
                    resBox.appendChild(card);
                }
            });
        } else {
            resBox.innerHTML = '<p style="color:#aaa; font-size:12px; grid-column: span 3; text-align:center;">No results found.</p>';
        }
    } catch (err) {
        console.error("Search Error:", err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadAllRows('home');
});

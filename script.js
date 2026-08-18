const API_KEY = 'fb0b6730bbe491d60fd75002a8cfc63f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

let currentShowData = null;
let currentSeasonNum = 1;
let visibleEpisodesLimit = 10;
let activeServer = 0;

// उन 5 वेबसाइट्स जैसे टॉप-रेटेड और 100% वर्किंग प्रीमियम सर्वर्स
const SMART_SERVERS = [
    (id, s, e) => `https://vidsrc.pro/embed/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
    (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
    (id, s, e) => `https://autoembed.cc/embed/tv/${id}/${s}/${e}`
];

// 1. होमपेज की कैटेगरीज लोड करना
async function loadAllRows(type = 'home') {
    const container = document.getElementById('main-container');
    if (!container) return;

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
        <div class="networks-section">
            <div class="networks-heading">Networks</div>
            <div class="networks-grid-ref">
                <div class="net-badge disney">Disney+</div>
                <div class="net-badge hungama">Hungama</div>
                <div class="net-badge sony">Sony Yay</div>
                <div class="net-badge cn">Cartoon Network</div>
                <div class="net-badge prime">Prime Video</div>
                <div class="net-badge netflix">Netflix</div>
                <div class="net-badge hotstar">Hotstar</div>
                <div class="net-badge crunchy">Crunchyroll</div>
            </div>
        </div>
        <div id="movie-rows-container"></div>
    `;

    const rows = document.getElementById('movie-rows-container');
    const cats = [
        { title: "🔥 Most-Watched Anime Series", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc` },
        { title: "🧸 Cartoon Favorites", url: `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_original_language=en&sort_by=popularity.desc` },
        { title: "🎬 Anime & Cartoon Movies", url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=16&sort_by=popularity.desc` }
    ];

    for (let cat of cats) {
        try {
            const res = await fetch(cat.url);
            const data = await res.json();
            const sec = document.createElement('div');
            sec.className = "category-section";
            sec.innerHTML = `
                <div class="section-header-flex"><h2 class="section-title">${cat.title}</h2></div>
                <div class="poster-container"></div>
            `;
            rows.appendChild(sec);
            const pCont = sec.querySelector('.poster-container');
            
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
        } catch (e) {
            console.error("Load Error:", e);
        }
    }
}

// 2. डेडिकेटेड पेज
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

// 3. एपिसोड्स लोड करना
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

// 4. वीडियो प्लेयर (vidsrc.pro और एक्टिव सर्वर्स के साथ)
function playVideo(show, s, e, name) {
    const container = document.getElementById('main-container');
    const showName = show.name || show.title;

    container.innerHTML = `
        <div class="video-player-section" style="padding:20px;">
            <button class="back-btn" onclick="openDedicatedPage(currentShowData)"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <h2 style="font-size:14px; margin-bottom:8px; color:#fff;">${showName} - S${s} E${e}: ${name}</h2>
            <p style="color:#00ff88; font-size:11px; margin-bottom:8px;">🎧 Multi-Audio Stream Active (Check Headphone Icon inside player)</p>
            
            <div id="s-gallery" class="server-gallery"></div>
            
            <div class="embed-container" style="position:relative; width:100%; aspect-ratio:16/9; background:#000; border-radius:8px; overflow:hidden; border:1px solid #222;">
                <iframe id="vid" src="${SMART_SERVERS[activeServer](show.id, s, e)}" width="100%" height="100%" frameborder="0" allowfullscreen="true" scrolling="no"></iframe>
            </div>
        </div>
    `;

    const sBox = document.getElementById('s-gallery');
    SMART_SERVERS.forEach((_, idx) => {
        const b = document.createElement('button');
        b.className = `server-btn ${idx === activeServer ? 'active' : ''}`;
        b.innerText = `Server ${idx + 1}`;
        b.onclick = () => {
            activeServer = idx;
            document.getElementById('vid').src = SMART_SERVERS[activeServer](show.id, s, e);
            document.querySelectorAll('.server-btn').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
        };
        sBox.appendChild(b);
    });
}

function switchNav(el, type) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
    
    if(type === 'home' || type === 'series' || type === 'anime' || type === 'cartoon' || type === 'movies') {
        loadAllRows('home');
    } else if(type === 'search') {
        const container = document.getElementById('main-container');
        container.innerHTML = `
            <div style="padding:20px;">
                <h2>Search</h2>
                <input type="text" id="search-input" placeholder="Search anime/cartoon..." style="width:100%; padding:10px; background:#16161a; border:1px solid #333; color:white; border-radius:6px; margin-top:10px;" oninput="handleSearch(this.value)">
                <div id="search-results" class="poster-container" style="margin-top:20px; display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;"></div>
            </div>
        `;
    }
}

async function handleSearch(query) {
    if(!query) return;
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    const resBox = document.getElementById('search-results');
    resBox.innerHTML = '';
    data.results.forEach(i => {
        if(i.poster_path && (i.media_type === 'tv' || i.media_type === 'movie')) {
            const card = document.createElement('div');
            card.className = 'poster-card';
            card.style.width = '100%';
            card.innerHTML = `
                <img src="${IMG_URL + i.poster_path}">
                <div class="poster-title">${i.name || i.title}</div>
            `;
            card.onclick = () => openDedicatedPage(i);
            resBox.appendChild(card);
        }
    });
}

loadAllRows('home');
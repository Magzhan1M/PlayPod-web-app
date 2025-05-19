document.addEventListener('DOMContentLoaded', async () => {
    
    const audioElement = document.getElementById('audio-element');
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const durationEl = document.getElementById('duration');
    const playerTitle = document.getElementById('player-title');
    const playerArtist = document.getElementById('player-artist');
    const playerCover = document.getElementById('player-cover');
    const playerFavoriteBtn = document.getElementById('player-favorite-btn');
    
    // Навигация
    const navBtns = document.querySelectorAll('.nav-btn');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Поиск
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    // Списки песен
    const featuredTracks = document.getElementById('featured-tracks');
    const favoritesTracks = document.getElementById('favorites-tracks');
    const historyTracks = document.getElementById('history-tracks');
    const albumTracks = document.getElementById('album-tracks');
    
    // Списки альбомов
    const featuredAlbums = document.getElementById('featured-albums');
    const allAlbums = document.getElementById('all-albums');
    
    // Альбом
    const albumHeader = document.getElementById('album-header');
    const albumDetailSection = document.getElementById('album-detail-section');

    // Состояние приложения
    const API_BASE_URL = 'https://playpod-web-app.onrender.com';
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let history = JSON.parse(localStorage.getItem('history')) || [];
    let currentTrackList = [];
    let albumsList = [];
    let currentPlayingTrackObject = null;

    
    async function initApp() {
        try {
            //Популярных песни и альбомы
            const [popularTracks, popularAlbums] = await Promise.all([
                fetchPopularTracks(),
                fetchPopularAlbums()
            ]);
            
            currentTrackList = popularTracks;
            albumsList = popularAlbums;
            
            
            renderTracks(featuredTracks, currentTrackList);
            renderAlbums(featuredAlbums, albumsList.slice(0, 4));
            renderAlbums(allAlbums, albumsList);
            updateFavoritesList();
            updateHistoryList();
            
            // Загрузка первого трека
            if (currentTrackList.length > 0) {
                loadTrack(currentTrackList[0]);
            }
        } catch (error) {
            console.error("Ошибка инициализации:", error);
            featuredTracks.innerHTML = '<p class="error-message">Ошибка загрузки данных. Попробуйте позже.</p>';
        }
    }

    //API 
    async function fetchPopularTracks() {
        const response = await fetch(`${API_BASE_URL}/popular`);
        if (!response.ok) throw new Error('Ошибка загрузки популярных треков');
        return await response.json();
    }

    async function fetchPopularAlbums() {
        const response = await fetch(`${API_BASE_URL}/albums`);
        if (!response.ok) throw new Error('Ошибка загрузки популярных альбомов');
        return await response.json();
    }

    async function fetchAlbumTracks(albumId) {
        const response = await fetch(`${API_BASE_URL}/album/${albumId}`);
        if (!response.ok) throw new Error('Ошибка загрузки треков альбома');
        const data = await response.json();
        return data.tracks || [];
    }

    async function searchTracks(query) {
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Ошибка поиска');
        return await response.json();
    }

    // Загрузка трека в плеер
    function loadTrack(track) {
        if (!track) {
            clearPlayerInfo();
            return;
        }
        
        currentPlayingTrackObject = track;
        playerTitle.textContent = track.title;
        playerArtist.textContent = track.artist.name || track.artist;
        playerCover.src = track.album?.cover_medium || track.cover || 'placeholder-cover.png';
        audioElement.src = track.preview;
        
        // Обновление времени
        durationEl.textContent = formatTime(track.duration || 30);
        currentTimeEl.textContent = "0:00";
        
        // Обновление кнопки избранного
        updatePlayerFavoriteButtonState(track.id);
        
        
        addToHistory(track);
        
        
        if (isPlaying) {
            audioElement.play().catch(e => console.error("Ошибка воспроизведения:", e));
        }
    }

    // Воспроизведение
    function playAudio() {
        if (!audioElement.src) {
            if (currentTrackList.length > 0) {
                loadTrack(currentTrackList[currentTrackIndex]);
            }
            return;
        }
        
        isPlaying = true;
        audioElement.play().catch(e => console.error("Ошибка воспроизведения:", e));
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        updatePlayButtons();
    }

    // Пауза
    function pauseAudio() {
        isPlaying = false;
        audioElement.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        updatePlayButtons();
    }

    // Следующий трек
    function nextTrack() {
        if (currentTrackList.length === 0) return;
        
        if (isShuffle) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * currentTrackList.length);
            } while (currentTrackList.length > 1 && randomIndex === currentTrackIndex);
            currentTrackIndex = randomIndex;
        } else {
            currentTrackIndex = (currentTrackIndex + 1) % currentTrackList.length;
        }
        
        loadTrack(currentTrackList[currentTrackIndex]);
    }

    // Предыдущий трек
    function prevTrack() {
        if (currentTrackList.length === 0) return;
        
        if (audioElement.currentTime > 3) {
            audioElement.currentTime = 0;
            return;
        }
        
        if (isShuffle) {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * currentTrackList.length);
            } while (currentTrackList.length > 1 && randomIndex === currentTrackIndex);
            currentTrackIndex = randomIndex;
        } else {
            currentTrackIndex = (currentTrackIndex - 1 + currentTrackList.length) % currentTrackList.length;
        }
        
        loadTrack(currentTrackList[currentTrackIndex]);
    }

    // Форматирование времени
    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    // Обновление прогресс-бара
    function updateProgress() {
        const { duration, currentTime } = audioElement;
        if (duration) {
            progressBar.style.width = `${(currentTime / duration) * 100}%`;
            currentTimeEl.textContent = formatTime(currentTime);
        }
    }

    // Перемотка
    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioElement.duration;
        if (duration) {
            audioElement.currentTime = (clickX / width) * duration;
        }
    }

    
    function clearPlayerInfo() {
        playerTitle.textContent = "Название трека";
        playerArtist.textContent = "Исполнитель";
        playerCover.src = "placeholder-cover.png";
        audioElement.src = "";
        durationEl.textContent = "0:00";
        currentTimeEl.textContent = "0:00";
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playerFavoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        playerFavoriteBtn.classList.remove('active');
        currentPlayingTrackObject = null;
    }

    // Обновление кнопки избранного в плеере
    function updatePlayerFavoriteButtonState(trackId) {
        const isFav = favorites.some(fav => fav.id === trackId);
        playerFavoriteBtn.innerHTML = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
        playerFavoriteBtn.classList.toggle('active', isFav);
        playerFavoriteBtn.setAttribute('data-track-id', trackId);
    }

    // Добавление в избранное
    function toggleMainPlayerFavorite() {
        const trackId = playerFavoriteBtn.getAttribute('data-track-id');
        if (!trackId) return;
        
        const track = currentPlayingTrackObject || 
                     currentTrackList.find(t => t.id == trackId) || 
                     favorites.find(t => t.id == trackId) || 
                     history.find(t => t.id == trackId);
        
        if (!track) return;
        
        handleFavoriteLogic(track, playerFavoriteBtn);
        updateAllTrackLists();
    }

  

    function handleFavoriteLogic(track, buttonElement) {
        const index = favorites.findIndex(fav => fav.id == track.id);
        if (index === -1) {
            favorites.push(track);
            if (buttonElement) {
                buttonElement.innerHTML = '<i class="fas fa-heart"></i>';
                buttonElement.classList.add('active');
            }
        } else {
            favorites.splice(index, 1);
            if (buttonElement) {
                buttonElement.innerHTML = '<i class="far fa-heart"></i>';
                buttonElement.classList.remove('active');
            }
        }
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }

    // Добавление в историю
    function addToHistory(track) {
        if (!track || !track.id) return;
        history = history.filter(item => item.id != track.id);
        history.unshift(track);
        if (history.length > 20) history.pop();
        localStorage.setItem('history', JSON.stringify(history));
        updateHistoryList();
    }

    // Обновление списка избранного
    function updateFavoritesList() {
        renderTracks(favoritesTracks, favorites, { context: 'favorites' });
    }

    // Обновление истории
    function updateHistoryList() {
        renderTracks(historyTracks, history, { context: 'history' });
    }

    // Обновление всех списков песен
    function updateAllTrackLists() {
        if (featuredTracks.closest('.content-section.active')) {
            renderTracks(featuredTracks, currentTrackList, { context: 'featured' });
        }
        updateFavoritesList();
        updateHistoryList();
        
        if (currentPlayingTrackObject) {
            updatePlayerFavoriteButtonState(currentPlayingTrackObject.id);
        }
    }

    // Рендер треков
    function renderTracks(container, tracksToRender, options = { context: 'unknown' }) {
        container.innerHTML = '';
        
        if (!tracksToRender || tracksToRender.length === 0) {
            let message = "Нет треков для отображения.";
            if (options.context === 'favorites') message = "У вас пока нет избранных треков.";
            else if (options.context === 'history') message = "Ваша история прослушиваний пуста.";
            else if (options.context === 'featured' && searchInput.value) message = `Ничего не найдено по запросу "${searchInput.value}".`;
            else if (options.context === 'featured') message = "Используйте поиск или найдите похожие треки.";
            
            container.innerHTML = `<p class="empty-message">${message}</p>`;
            return;
        }

        tracksToRender.forEach((track, index) => {
            const isFavorite = favorites.some(fav => fav.id == track.id);
            const displayDuration = formatTime(track.duration || 30);
            const isCurrentPlaying = currentPlayingTrackObject?.id == track.id && isPlaying;

            const trackElement = document.createElement('div');
            trackElement.className = 'track-card';
            trackElement.setAttribute('data-track-id', track.id);
            trackElement.setAttribute('data-track-index-in-list', index);

            trackElement.innerHTML = `
                <img src="${track.album?.cover_medium || track.cover || 'placeholder-cover.png'}" alt="${track.title}" class="track-cover">
                <div class="track-info">
                    <h3 class="track-title">${track.title}</h3>
                    <p class="track-artist">${track.artist.name || track.artist}</p>
                    <div class="track-controls">
                        <button class="play-btn-sm" title="Воспроизвести">
                            <i class="fas ${isCurrentPlaying ? 'fa-pause' : 'fa-play'}"></i>
                        </button>
                        <button class="favorite-btn ${isFavorite ? 'active' : ''}" title="В избранное">
                            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
                        </button>
                        <span class="track-duration">${displayDuration}</span>
                    </div>
                </div>
            `;
            
            trackElement.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                currentTrackList = tracksToRender;
                currentTrackIndex = parseInt(trackElement.getAttribute('data-track-index-in-list'));
                loadTrack(currentTrackList[currentTrackIndex]);
                playAudio();
            });

            trackElement.querySelector('.play-btn-sm').addEventListener('click', (e) => {
                e.stopPropagation();
                currentTrackList = tracksToRender;
                currentTrackIndex = parseInt(trackElement.getAttribute('data-track-index-in-list'));
                
                if (currentPlayingTrackObject?.id == track.id && isPlaying) {
                    pauseAudio();
                } else {
                    loadTrack(currentTrackList[currentTrackIndex]);
                    playAudio();
                }
            });

            const favBtnCard = trackElement.querySelector('.favorite-btn');
            favBtnCard.addEventListener('click', (e) => {
                e.stopPropagation();
                handleFavoriteLogic(track, favBtnCard);
                
                if (options.context === 'favorites' && !favorites.some(f => f.id == track.id)) {
                    trackElement.remove();
                    if (favoritesTracks.childElementCount === 0) {
                        favoritesTracks.innerHTML = '<p class="empty-message">У вас пока нет избранных треков.</p>';
                    }
                }
                
                updatePlayerFavoriteButtonState(currentPlayingTrackObject ? currentPlayingTrackObject.id : null);
            });
            
            container.appendChild(trackElement);
        });
    }

    // Рендер альбомов
    function renderAlbums(container, albumsToRender) {
        container.innerHTML = '';
        if (!albumsToRender || albumsToRender.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет альбомов для отображения.</p>';
            return;
        }
        
        albumsToRender.forEach(album => {
            const albumElement = document.createElement('div');
            albumElement.className = 'album-card';
            albumElement.innerHTML = `
                <img src="${album.cover_medium || album.cover || 'placeholder-cover.png'}" alt="${album.title}" class="album-cover">
                <div class="album-info">
                    <h3 class="album-title">${album.title}</h3>
                    <p class="album-artist">${album.artist?.name || album.artist}</p>
                </div>
            `;
            
            albumElement.addEventListener('click', async () => {
                try {
                    contentSections.forEach(s => s.classList.remove('active'));
                    albumDetailSection.classList.add('active');
                    navBtns.forEach(b => b.classList.remove('active'));
                    document.querySelector('.nav-btn[data-section="albums"]')?.classList.add('active');
                    
                    albumHeader.innerHTML = `
                        <div class="album-detail-header">
                            <img src="${album.cover_medium || album.cover || 'placeholder-cover.png'}" alt="${album.title}" class="album-detail-cover">
                            <div class="album-detail-info">
                                <h2>${album.title}</h2>
                                <p>${album.artist?.name || album.artist} • ${album.release_date?.substring(0, 4) || ''}</p>
                            </div>
                        </div>
                    `;
                    
                    albumTracks.innerHTML = '<p class="loading-message">Загрузка треков альбома...</p>';
                    
                    const tracks = await fetchAlbumTracks(album.id);
                    currentTrackList = tracks;
                    renderTracks(albumTracks, tracks, { context: 'album' });
                    
                } catch (error) {
                    console.error("Ошибка загрузки альбома:", error);
                    albumTracks.innerHTML = '<p class="error-message">Ошибка загрузки треков альбома</p>';
                }
            });
            
            container.appendChild(albumElement);
        });
    }

    // Поиск песен
    async function performSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            featuredTracks.innerHTML = '<p class="empty-message">Введите название песни или исполнителя.</p>';
            currentTrackList = [];
            return;
        }
        
        featuredTracks.innerHTML = '<p class="loading-message">Идет поиск...</p>';
        navigateToSection('home');

        try {
            currentTrackList = await searchTracks(query);
            renderTracks(featuredTracks, currentTrackList, { context: 'featured' });
            
            
            featuredAlbums.style.display = 'none';
            featuredAlbums.previousElementSibling.style.display = 'none';
        } catch (error) {
            console.error("Ошибка поиска:", error);
            featuredTracks.innerHTML = `<p class="error-message">Ошибка поиска: ${error.message}. Попробуйте еще раз.</p>`;
            currentTrackList = [];
        }
    }

    // Перемещение по разделам
    function navigateToSection(sectionId) {
        contentSections.forEach(s => s.classList.remove('active'));
        navBtns.forEach(b => b.classList.remove('active'));

        const targetSection = document.getElementById(sectionId + '-section');
        const targetNavBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);

        if (targetSection) targetSection.classList.add('active');
        if (targetNavBtn) targetNavBtn.classList.add('active');

        
        if (sectionId === 'home' && !searchInput.value.trim()) {
            featuredAlbums.style.display = 'grid';
            featuredAlbums.previousElementSibling.style.display = 'block';
        }

        if (sectionId === 'favorites') updateFavoritesList();
        if (sectionId === 'history') updateHistoryList();
        if (sectionId === 'albums') {
            renderAlbums(allAlbums, albumsList);
        }
    }

    // Обновление кнопки воспроизведения
    function updatePlayButtons() {
        const playingTrackId = currentPlayingTrackObject?.id;
        document.querySelectorAll('.play-btn-sm i').forEach(icon => {
            const trackId = parseInt(icon.closest('.track-card').getAttribute('data-track-id'));
            if (isPlaying && trackId === playingTrackId) {
                icon.classList.remove('fa-play');
                icon.classList.add('fa-pause');
            } else {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        });
    }

   
    function addEventListeners() {
        playBtn.addEventListener('click', () => isPlaying ? pauseAudio() : playAudio());
        nextBtn.addEventListener('click', nextTrack);
        prevBtn.addEventListener('click', prevTrack);
        
        shuffleBtn.addEventListener('click', () => {
            isShuffle = !isShuffle;
            shuffleBtn.classList.toggle('active', isShuffle);
        });
        
        repeatBtn.addEventListener('click', () => {
            isRepeat = !isRepeat;
            repeatBtn.classList.toggle('active', isRepeat);
            audioElement.loop = isRepeat;
        });
        
        audioElement.addEventListener('ended', () => {
            if (isRepeat && currentPlayingTrackObject) {
                audioElement.currentTime = 0;
                audioElement.play();
            } else {
                nextTrack();
            }
        });
        
        audioElement.addEventListener('timeupdate', updateProgress);
        audioElement.addEventListener('loadedmetadata', updateProgress);
        progressBar.parentElement.addEventListener('click', setProgress);
        
        playerFavoriteBtn.addEventListener('click', toggleMainPlayerFavorite);
        
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });

        navBtns.forEach(btn => {
            btn.addEventListener('click', () => navigateToSection(btn.getAttribute('data-section')));
        });
    }

    // Запуск приложения
    initApp();
    addEventListeners();

    //Темный режим
const themeToggleBtn = document.getElementById('theme-toggle-btn');

themeToggleBtn.addEventListener('click', () => {
  const isDark = document.documentElement.toggleAttribute('data-dark');
  localStorage.setItem('darkMode', isDark);
  updateThemeIcon(isDark);
});

// Обновление иконки
function updateThemeIcon(isDark) {
  const icon = themeToggleBtn.querySelector('i');
  icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}


if (localStorage.getItem('darkMode') === 'true') {
  document.documentElement.setAttribute('data-dark', '');
  updateThemeIcon(true);
}

const themeBtn = document.getElementById('theme-toggle-btn');
let isDark = localStorage.getItem('darkMode') === 'true';

function toggleTheme() {
  isDark = !isDark;
  document.documentElement.toggleAttribute('data-dark', isDark);
  localStorage.setItem('darkMode', isDark);
  updateThemeIcon();
}

function updateThemeIcon() {
  themeBtn.innerHTML = isDark 
    ? '<i class="fas fa-sun"></i>' 
    : '<i class="fas fa-moon"></i>';
  themeBtn.title = isDark ? 'Light Mode' : 'Dark Mode';
}


document.documentElement.toggleAttribute('data-dark', isDark);
updateThemeIcon();
themeBtn.addEventListener('click', toggleTheme);

});
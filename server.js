
const express = require('express');
const axios = require('axios');
const cors = require('cors'); 
const app = express();
const PORT = 3000;
const DEEZER_API_BASE_URL = 'https://api.deezer.com/';


app.use(cors());

app.use(express.json());

function formatDeezerTrackForFrontend(deezerTrack) {
    if (!deezerTrack) return null;    
    return {
        id: deezerTrack.id,
        title: deezerTrack.title,
        artist: deezerTrack.artist ? { id: deezerTrack.artist.id, name: deezerTrack.artist.name, picture: deezerTrack.artist.picture } : { name: 'Unknown Artist' },
        album: deezerTrack.album ? {
             id: deezerTrack.album.id,
             title: deezerTrack.album.title,
             cover: deezerTrack.album.cover, 
             cover_small: deezerTrack.album.cover_small,
             cover_medium: deezerTrack.album.cover_medium,
             cover_big: deezerTrack.album.cover_big,
             cover_xl: deezerTrack.album.cover_xl,
             release_date: deezerTrack.album.release_date 
         } : { title: 'Unknown Album' },
        preview: deezerTrack.preview, 
        duration: deezerTrack.duration, 
        
        genre_id: deezerTrack.genre_id || null, 
        
    };
}


function formatDeezerAlbumForFrontend(deezerAlbum) {
     if (!deezerAlbum) return null;
     return {
         id: deezerAlbum.id,
         title: deezerAlbum.title,
         artist: deezerAlbum.artist ? { id: deezerAlbum.artist.id, name: deezerAlbum.artist.name, picture: deezerAlbum.artist.picture } : { name: 'Unknown Artist' },
         cover: deezerAlbum.cover, 
         cover_small: deezerAlbum.cover_small,
         cover_medium: deezerAlbum.cover_medium, 
         cover_big: deezerAlbum.cover_big,
         cover_xl: deezerAlbum.cover_xl,
         release_date: deezerAlbum.release_date, 
         
     };
}


//Получение популярных треков 
app.get('/popular', async (req, res) => {
    console.log("Received request for /popular");
    try {
        const response = await axios.get(`${DEEZER_API_BASE_URL}chart/0/tracks`);
        const deezerTracks = response.data.data; 
        const formattedTracks = deezerTracks.map(formatDeezerTrackForFrontend);
        res.json(formattedTracks); 
    } catch (error) {
        console.error('Error fetching popular tracks from Deezer:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch popular tracks' });
    }
});

// Получение всех альбомов 
app.get('/albums', async (req, res) => {
     console.log("Received request for /albums");
     try {
         //Топ альбомы
         const response = await axios.get(`${DEEZER_API_BASE_URL}chart/0/albums`);
         const deezerAlbums = response.data.data; 

         
         const formattedAlbums = deezerAlbums.map(formatDeezerAlbumForFrontend);

         res.json(formattedAlbums); 
     } catch (error) {
         console.error('Error fetching albums from Deezer:', error.message);
         
         res.status(error.response?.status || 500).json({ error: 'Failed to fetch albums' });
     }
});


app.get('/album/:id', async (req, res) => {
    const albumId = req.params.id;
    console.log(`Received request for album details with ID: ${albumId}`);
    try {
        
        const response = await axios.get(`${DEEZER_API_BASE_URL}album/${albumId}`);
        const albumData = response.data; 

        if (albumData && albumData.tracks && Array.isArray(albumData.tracks.data)) {
             
             const formattedTracks = albumData.tracks.data.map(formatDeezerTrackForFrontend);             
             const formattedAlbumMeta = formatDeezerAlbumForFrontend(albumData);

             res.json({ ...formattedAlbumMeta, tracks: formattedTracks });

        } else if (albumData && albumData.error) {
             //Альбом не найден
             console.warn(`Deezer API returned error for album ID ${albumId}:`, albumData.error);
             res.status(albumData.error.code || 404).json({ error: albumData.error.message || 'Album not found in Deezer API' });
        }
        else {
             console.warn(`Album data for ID ${albumId} not found or missing tracks array in Deezer response.`, albumData);
             res.status(404).json({ error: 'Album or tracks not found' });
        }

    } catch (error) {
         console.error(`Error fetching album details for ID ${albumId} from Deezer:`, error.message);
         
         res.status(error.response?.status || 500).json({ error: error.message || 'Failed to fetch album details' });
    }
});


app.get('/search', async (req, res) => {
    const query = req.query.query;
    console.log(`Received search query: "${query}"`);
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        
        const response = await axios.get(`${DEEZER_API_BASE_URL}search/track?q=${encodeURIComponent(query)}`);
        const deezerTracks = response.data.data; 

        
        const formattedTracks = deezerTracks.map(formatDeezerTrackForFrontend);

        res.json(formattedTracks); 
    } catch (error) {
        console.error('Error searching tracks on Deezer:', error.message);
         
        res.status(error.response?.status || 500).json({ error: error.message || 'Failed to perform search' });
    }
});

// Запускать сервер
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Deezer API proxy is active, formatting data for your PlayPod frontend.');
}); 
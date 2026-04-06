import axios from 'axios';

// TMDB API configuration
const TMDB_API_KEY = 'YOUR_TMDB_API_KEY'; // Replace with your actual API key
const TMDB_READ_ACCESS_TOKEN = 'YOUR_TMDB_READ_ACCESS_TOKEN'; // Replace with your actual token

const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  headers: {
    'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Search for a movie or TV show by title
export const searchTmdb = async (query: string, type: 'movie' | 'tv', year?: string) => {
  try {
    let url = `/search/${type}?query=${encodeURIComponent(query)}`;
    if (year) {
      url += `&year=${year}`;
    }
    
    const response = await tmdbClient.get(url);
    return response.data.results;
  } catch (error) {
    console.error(`Error searching TMDB for ${query}:`, error);
    return null;
  }
};

// Get detailed information about a movie or TV show
export const getTmdbDetails = async (id: number, type: 'movie' | 'tv') => {
  try {
    const response = await tmdbClient.get(`/${type}/${id}?append_to_response=credits`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching TMDB details for ${type} ${id}:`, error);
    return null;
  }
};

// Extract year from date string (YYYY-MM-DD)
const extractYear = (dateString?: string) => {
  if (!dateString) return '';
  const match = dateString.match(/^(\d{4})/);
  return match ? match[1] : '';
};

// Find the best match from search results
const findBestMatch = (results: any[], title: string, year?: string) => {
  if (!results || results.length === 0) return null;
  
  if (year) {
    const exactMatch = results.find((item) => {
      const itemYear = extractYear(item.release_date || item.first_air_date);
      return (
        (item.title?.toLowerCase() === title.toLowerCase() || 
         item.name?.toLowerCase() === title.toLowerCase()) && 
        itemYear === year
      );
    });
    
    if (exactMatch) return exactMatch;
  }
  
  return results[0];
};

// Main function to fetch TMDB details for a title
export const fetchTmdbDetails = async (title: string, year?: string, type: 'movie' | 'tv' = 'movie') => {
  try {
    const searchResults = await searchTmdb(title, type, year);
    
    if (!searchResults || searchResults.length === 0) {
      return null;
    }
    
    const bestMatch = findBestMatch(searchResults, title, year);
    
    if (!bestMatch) {
      return null;
    }
    
    const details = await getTmdbDetails(bestMatch.id, type);
    
    if (!details) {
      return null;
    }
    
    // Step 4: Format the response
    return {
      id: details.id,
      title: details.title || details.name,
      overview: details.overview,
      poster_path: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '',
      backdrop_path: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '',
      vote_average: details.vote_average,
      release_date: details.release_date || details.first_air_date,
      genres: details.genres || [],
      cast: details.credits?.cast?.slice(0, 10).map((actor: any) => ({
        id: actor.id,
        name: actor.name,
        character: actor.character,
        profile_path: actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : '',
      })) || [],
    };
  } catch (error) {
    console.error(`Error in fetchTmdbDetails for ${title}:`, error);
    return null;
  }
};

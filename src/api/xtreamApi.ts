import axios from 'axios';

// Create a reusable axios instance
const createXtreamClient = (serverUrl: string) => {
  // Check if the URL already has a protocol
  const baseURL = serverUrl.startsWith('http://') || serverUrl.startsWith('https://') 
    ? serverUrl 
    : `http://${serverUrl}`;
    
  return axios.create({
    baseURL,
    timeout: 10000,
  });
};

// Login and get user info
export const loginXtream = async (serverUrl: string, username: string, password: string) => {
  try {
    const client = createXtreamClient(serverUrl);
    const response = await client.get(`/player_api.php?username=${username}&password=${password}`);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Get live TV categories
export const getLiveCategories = async (serverUrl: string, username: string, password: string) => {
  try {
    const client = createXtreamClient(serverUrl);
    const response = await client.get(`/player_api.php?username=${username}&password=${password}&action=get_live_categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching live categories:', error);
    throw error;
  }
};

// Get live streams (all or by category)
export const getLiveStreams = async (serverUrl: string, username: string, password: string, categoryId?: string) => {
  try {
    const client = createXtreamClient(serverUrl);
    let url = `/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching live streams:', error);
    throw error;
  }
};

// Get VOD categories
export const getVodCategories = async (serverUrl: string, username: string, password: string) => {
  try {
    const client = createXtreamClient(serverUrl);
    const response = await client.get(`/player_api.php?username=${username}&password=${password}&action=get_vod_categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching VOD categories:', error);
    throw error;
  }
};

// Get VOD streams (all or by category)
export const getVodStreams = async (serverUrl: string, username: string, password: string, categoryId?: string) => {
  try {
    const client = createXtreamClient(serverUrl);
    let url = `/player_api.php?username=${username}&password=${password}&action=get_vod_streams`;
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching VOD streams:', error);
    throw error;
  }
};

// Get VOD info
export const getVodInfo = async (serverUrl: string, username: string, password: string, vodId: number) => {
  try {
    const client = createXtreamClient(serverUrl);
    const response = await client.get(`/player_api.php?username=${username}&password=${password}&action=get_vod_info&vod_id=${vodId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching VOD info for ID ${vodId}:`, error);
    throw error;
  }
};

// Get series categories
export const getSeriesCategories = async (serverUrl: string, username: string, password: string) => {
  try {
    const client = createXtreamClient(serverUrl);
    const response = await client.get(`/player_api.php?username=${username}&password=${password}&action=get_series_categories`);
    return response.data;
  } catch (error) {
    console.error('Error fetching series categories:', error);
    throw error;
  }
};

// Get series (all or by category)
export const getSeries = async (serverUrl: string, username: string, password: string, categoryId?: string) => {
  try {
    const client = createXtreamClient(serverUrl);
    let url = `/player_api.php?username=${username}&password=${password}&action=get_series`;
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    const response = await client.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching series:', error);
    throw error;
  }
};

// Get series info (seasons and episodes)
export const getSeriesInfo = async (serverUrl: string, username: string, password: string, seriesId: number) => {
  try {
    const client = createXtreamClient(serverUrl);
    const response = await client.get(`/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${seriesId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching series info for ID ${seriesId}:`, error);
    throw error;
  }
};

// Get short EPG for a channel
export const getShortEpg = async (serverUrl: string, username: string, password: string, streamId: number, limit = 4) => {
  try {
    const client = createXtreamClient(serverUrl);
    const response = await client.get(`/player_api.php?username=${username}&password=${password}&action=get_short_epg&stream_id=${streamId}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching EPG for stream ID ${streamId}:`, error);
    throw error;
  }
};

// Get stream URL for playback
export const getStreamUrl = (serverUrl: string, username: string, password: string, streamId: number, streamType: 'live' | 'movie' | 'series', containerExtension = 'm3u8') => {
  let type;
  switch (streamType) {
    case 'live':
      type = 'live';
      break;
    case 'movie':
      type = 'movie';
      break;
    case 'series':
      type = 'series';
      break;
    default:
      type = 'live';
  }
  
  // Check if the URL already has a protocol
  const baseURL = serverUrl.startsWith('http://') || serverUrl.startsWith('https://') 
    ? serverUrl 
    : `http://${serverUrl}`;
    
  return `${baseURL}/${type}/${username}/${password}/${streamId}.${containerExtension}`;
};

// Get live stream URL
export const getLiveStreamUrl = (serverUrl: string, username: string, password: string, streamId: number, containerExtension = 'm3u8') => {
  return getStreamUrl(serverUrl, username, password, streamId, 'live', containerExtension);
};

// Get VOD stream URL
export const getVodStreamUrl = (serverUrl: string, username: string, password: string, streamId: number, containerExtension = 'm3u8') => {
  return getStreamUrl(serverUrl, username, password, streamId, 'movie', containerExtension);
};

// Get series stream URL
export const getSeriesStreamUrl = (serverUrl: string, username: string, password: string, streamId: number, containerExtension = 'm3u8') => {
  return getStreamUrl(serverUrl, username, password, streamId, 'series', containerExtension);
};

// Parse content from API response
export const parseContent = (data: any) => {
  if (!data || !Array.isArray(data)) {
    return {};
  }
  
  const result: { [categoryId: string]: any[] } = {};
  
  data.forEach((item) => {
    const categoryId = item.category_id;
    if (!result[categoryId]) {
      result[categoryId] = [];
    }
    result[categoryId].push(item);
  });
  
  return result;
};
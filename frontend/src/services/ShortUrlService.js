import axios from 'axios';

/**
 * Aligned with ShortUrlService.java
 * Encapsulates backend REST API interactions for URLs and profiles.
 */
export const ShortUrlService = {
  async shortenUrl(url, expiredAt = null) {
    const response = await axios.post('/api/shorten', {
      url,
      expiredAt
    });
    return response.data;
  },

  async getUserUrls() {
    const response = await axios.get('/api/urls');
    return response.data;
  },

  async getCurrentUser() {
    const response = await axios.get('/api/auth/me');
    return response.data;
  },

  async deleteUrl(shortCode) {
    const response = await axios.delete(`/api/urls/${shortCode}`);
    return response.data;
  }
};

export default ShortUrlService;

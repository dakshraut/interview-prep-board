/**
 * Token Manager - Handles JWT token validation and storage
 */

// Check if a token is expired
const isTokenExpired = (token) => {
  try {
    if (!token) return true;
    
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode payload (add padding if needed)
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(padded));
    
    if (!decoded.exp) return true;
    
    // Check if token expires within 1 minute
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;
    
    return timeUntilExpiry < 60000; // Expired or expires in less than 1 minute
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Clear all auth tokens
const clearAuthTokens = () => {
  console.log('🧹 Clearing all authentication tokens');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

// Get valid token or refresh if needed
const getValidToken = async () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // If no token, return null
  if (!token) {
    return null;
  }
  
  // If token is not expired, return it
  if (!isTokenExpired(token)) {
    return token;
  }
  
  // Token is expired, try to refresh it
  if (refreshToken) {
    try {
      console.log('🔄 Token expired, attempting refresh...');
      const response = await fetch('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.token) {
          localStorage.setItem('token', data.token);
          console.log('✅ Token refreshed successfully');
          return data.token;
        }
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
    }
  }
  
  // Refresh failed or no refresh token, clear everything
  clearAuthTokens();
  return null;
};

// Initialize token validation on app startup
const initializeTokens = () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // If no tokens exist, nothing to do
  if (!token && !refreshToken) {
    console.log('ℹ️ No stored tokens found');
    return;
  }
  
  // Check if token is expired
  if (token && isTokenExpired(token)) {
    console.warn('⚠️ Stored token is expired');
    
    // Only keep refresh token to attempt refresh
    if (!refreshToken) {
      console.log('❌ No refresh token available, clearing auth');
      clearAuthTokens();
    }
  }
};

export { isTokenExpired, clearAuthTokens, getValidToken, initializeTokens };

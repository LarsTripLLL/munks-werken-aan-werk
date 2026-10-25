let accessToken: string | null = null;

// Ruim tokens van oudere appversies onmiddellijk op. Nieuwe sessies worden
// uitsluitend in geheugen en in de HttpOnly-cookie op de server bewaard.
localStorage.removeItem('munks-werkt-access-token');
localStorage.removeItem('munks-werkt-refresh-token');

export const getAccessToken = () => accessToken;
export const setAccessToken = (token: string | null) => { accessToken = token; };
export const clearAccessToken = () => { accessToken = null; };

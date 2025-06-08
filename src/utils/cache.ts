// src/utils/cache.ts
export const setCache = (key: string, data: any, ttl: number = 180000) => {
    const item = {
        data,
        timestamp: Date.now(),
        ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
};

export const getCache = (key: string) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
        const item = JSON.parse(itemStr);
        if (Date.now() - item.timestamp > item.ttl) {
            localStorage.removeItem(key);
            return null;
        }
        return item.data;
    } catch {
        return null;
    }
};

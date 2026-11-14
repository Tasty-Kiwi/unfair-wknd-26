// Cloud is an explicit build-time opt-in. Browser-only builds never probe the API.
export const CLOUD_ENABLED = import.meta.env.VITE_CLOUD_ENABLED === "true";

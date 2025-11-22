// Determine if running locally
const isLocalhost = true || ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Use HTTP and port 8080 for local dev, otherwise use HTTPS and default port
const protocol = isLocalhost ? 'http' : 'https';
const port = isLocalhost ? ':80' : ':80'; // Only include port 8080 locally
const hostname = `${protocol}://${window.location.hostname}${port}/api`;

// Example usage:
// fetch(`${hostname}/api/check`)

export { hostname };

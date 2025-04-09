// Determine if running locally
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Use HTTP and port 8080 for local dev, otherwise use HTTPS and default port
const protocol = isLocalhost ? 'http' : 'https';
const port = isLocalhost ? ':8080' : ''; // Only include port 8080 locally
const hostname = `${protocol}://${window.location.hostname}${port}`;

// Example usage:
// fetch(`${hostname}/api/check`)

export { hostname };

function getHostnameWithoutPort() {
    const hostname = window.location.hostname;
    return hostname.split(':')[0]; // Split on ':' and take the first part (hostname)
  }

const hostnameWithoutPort = getHostnameWithoutPort()
// const hostname = `http://${hostnameWithoutPort}:3005`;
const hostname = '/api'

  export {getHostnameWithoutPort, hostname}
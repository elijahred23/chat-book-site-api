import dns from 'dns/promises';
import net from 'net';

export const isPrivateIpAddress = (address) => {
  if (net.isIPv4(address)) {
    const [a, b] = address.split('.').map(Number);
    return a === 0
      || a === 10
      || a === 127
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168)
      || (a === 198 && (b === 18 || b === 19))
      || a >= 224;
  }

  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    const mappedIpv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
    if (mappedIpv4) return isPrivateIpAddress(mappedIpv4);
    return normalized === '::'
      || normalized === '::1'
      || normalized.startsWith('fc')
      || normalized.startsWith('fd')
      || /^fe[89ab]/.test(normalized)
      || normalized.startsWith('ff');
  }

  return true;
};

export const validatePublicPageUrl = async (value) => {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only HTTP and HTTPS pages are supported.');
  if (parsed.username || parsed.password) throw new Error('URLs containing credentials are not supported.');
  if (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.localhost')) throw new Error('Local addresses are not supported.');

  const addresses = net.isIP(parsed.hostname)
    ? [{ address: parsed.hostname }]
    : await dns.lookup(parsed.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateIpAddress(address))) {
    throw new Error('Private or local network addresses are not supported.');
  }
  return parsed;
};

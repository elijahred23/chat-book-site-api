import functools
import os
import sys
import time
import json
from collections import OrderedDict
import re
from urllib.parse import parse_qs, urlparse

import requests
from requests.adapters import HTTPAdapter
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig

# Lightweight session with connection pooling to avoid recreating sockets on every call
_session = requests.Session()
_session.mount("https://", HTTPAdapter(pool_connections=8, pool_maxsize=8))

# Pre-compiled regex for filename sanitization
_ILLEGAL_FILENAME_CHARS = re.compile(r'[\\/*?:"<>|]')

# Preferred transcript languages in order
_PREFERRED_LANGS = ["en", "en-US", "en-GB"]

# Simple in-memory LRU cache for transcripts
_TRANSCRIPT_CACHE: OrderedDict[str, str] = OrderedDict()
_MAX_TRANSCRIPT_CACHE = 50

# ----------------------------
#   Proxy-Enabled API Client
# ----------------------------
def create_api():
  proxy_user = os.getenv("WEBSHARE_USER", "mbrbdnsi")
  proxy_pass = os.getenv("WEBSHARE_PASS", "qlxjwi1vboda")
  return YouTubeTranscriptApi(
    proxy_config=WebshareProxyConfig(
      proxy_username=proxy_user,
      proxy_password=proxy_pass,
      filter_ip_locations=["us"]   # ensures fast & reliable US-based residential IPs
    )
  )


# Cache the API client so we do not rebuild it for every request
create_api = functools.lru_cache(maxsize=1)(create_api)


# ----------------------------
#   Extract Video ID
# ----------------------------
def get_video_id(url: str) -> str:
  if not url:
    raise ValueError("Missing YouTube URL or ID")

  # allow bare 11-char IDs
  if re.fullmatch(r"[a-zA-Z0-9_-]{11}", url):
    return url

  parsed = urlparse(url)
  hostname = parsed.hostname or ""

  if "youtu.be" in hostname:
    # Short link format: https://youtu.be/<id>
    video_id = parsed.path.lstrip("/")
    if video_id:
      return video_id

  if "youtube.com" in hostname:
    # Standard format: https://www.youtube.com/watch?v=<id>
    qs = parse_qs(parsed.query)
    video_id = qs.get("v", [None])[0]
    if video_id:
      return video_id
    # embed/shorts paths
    path_parts = parsed.path.split("/")
    for part in path_parts:
      if re.fullmatch(r"[a-zA-Z0-9_-]{11}", part):
        return part

  raise ValueError("Invalid YouTube URL")


# ----------------------------
#   Get Video Title
# ----------------------------
def get_video_title(video_id: str):
  oembed = f"https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v={video_id}&format=json"

  try:
    r = _session.get(oembed, timeout=10)
    r.raise_for_status()
    return r.json().get("title", f"Video_{video_id}")
  except Exception:
    return f"Video_{video_id}"


# Title lookup is cacheable; titles do not change often and it avoids repeated network calls
get_video_title = functools.lru_cache(maxsize=128)(get_video_title)


# ----------------------------
#   Remove illegal filename chars
# ----------------------------
def sanitize_filename(title: str) -> str:
  return _ILLEGAL_FILENAME_CHARS.sub("", title)


def _cache_transcript(video_id: str, transcript: str) -> None:
  # Keep a tiny in-process LRU of the last few transcripts to avoid refetching
  if video_id in _TRANSCRIPT_CACHE:
    _TRANSCRIPT_CACHE.move_to_end(video_id)
  _TRANSCRIPT_CACHE[video_id] = transcript
  if len(_TRANSCRIPT_CACHE) > _MAX_TRANSCRIPT_CACHE:
    _TRANSCRIPT_CACHE.popitem(last=False)


def _get_cached_transcript(video_id: str):
  if video_id in _TRANSCRIPT_CACHE:
    return _TRANSCRIPT_CACHE[video_id]
  return None


# ----------------------------
#   Fetch Transcript (ONE STRING)
# ----------------------------
def fetch_transcript(video_id: str):
  cached = _get_cached_transcript(video_id)
  if cached is not None:
    return cached

  def _fetch_once():
    ytt = create_api()

    # List all available transcripts for the video
    transcript_list = ytt.list(video_id)

    # Prefer English; fallback to first available
    try:
      transcript = transcript_list.find_transcript(_PREFERRED_LANGS)
    except Exception:
      available = list(transcript_list)
      if not available:
        return {"error": "No transcripts available for this video."}
      transcript = available[0]

    # Fetch transcript data and handle both dict and object forms
    fetched = transcript.fetch()

    def _extract_text(snippet):
      if snippet is None:
        return ""
      # Newer youtube_transcript_api returns objects with .text
      text_attr = getattr(snippet, "text", None)
      if text_attr:
        return text_attr
      # Older versions return dicts
      if isinstance(snippet, dict):
        return snippet.get("text", "")
      return ""

    combined = " ".join(filter(None, (_extract_text(s) for s in fetched))).strip()
    return combined

  attempts = 0
  last_error = None
  while attempts < 4:  # initial attempt + up to 3 retries
    try:
      result = _fetch_once()
      if isinstance(result, dict) and result.get("error"):
        # Don't retry for deterministic errors like no transcripts
        return result
      _cache_transcript(video_id, result)
      return result
    except Exception as e:
      last_error = e
      attempts += 1
      if attempts >= 4:
        break
      # simple linear backoff
      time.sleep(0.5 * attempts)

  return {"error": f"{last_error}" if last_error else "Failed to fetch transcript"}


def _main():
  if len(sys.argv) < 2:
    print(json.dumps({"error": "Missing URL or video ID"}))
    sys.exit(1)
  url_or_id = sys.argv[1]
  try:
    vid = get_video_id(url_or_id)
  except Exception as exc:
    print(json.dumps({"error": str(exc)}))
    sys.exit(1)

  result = fetch_transcript(vid)
  if isinstance(result, dict) and result.get("error"):
    print(json.dumps(result))
    sys.exit(1)

  title = get_video_title(vid)
  payload = {
    "videoId": vid,
    "title": title,
    "filename": sanitize_filename(title),
    "transcript": result,
  }
  print(json.dumps(payload))


if __name__ == "__main__":
  _main()

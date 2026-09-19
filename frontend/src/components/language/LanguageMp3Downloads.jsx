import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FaDownload } from "react-icons/fa";

const slug = (value) => String(value || "language-lesson").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export default function LanguageMp3Downloads({ language, languageCode, scriptKey, sourceName, collections, className = "language-mp3-downloads" }) {
  const [collectionId, setCollectionId] = useState(collections[0]?.id || "");
  const [speechOrder, setSpeechOrder] = useState("target");
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState("");
  const collection = useMemo(() => collections.find((item) => item.id === collectionId) || collections[0], [collectionId, collections]);
  const items = collection?.items?.filter((item) => item?.[scriptKey]) || [];

  const download = async () => {
    if (!items.length || downloading) return;
    setDownloading(true); setStatus(`Generating ${items.length} ${collection.label}…`);
    try {
      const batch = speechOrder === "english-target"
        ? items.flatMap((item) => [{ text: String(item.en || "").trim(), lang: "en-US" }, { text: String(item[scriptKey]).trim(), lang: languageCode }]).filter((item) => item.text)
        : items.map((item) => ({ text: String(item[scriptKey]).trim(), lang: languageCode }));
      const response = await fetch("/api/tts/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: batch }) });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || `MP3 generation failed (${response.status}).`); }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url; link.download = `${slug(sourceName)}-${collection.id}${speechOrder === "english-target" ? `-english-${language.toLowerCase()}` : ""}.mp3`;
      document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus(`Downloaded ${items.length} ${collection.label}.`);
    } catch (error) { setStatus(error.message || "MP3 generation failed."); } finally { setDownloading(false); }
  };

  return (
    <section className={className}>
      <div><strong className="language-mp3-downloads__eyebrow">Google {language} speech</strong><h1>Download {language} as MP3</h1><p>Create one audio file from the selected lesson or collection.</p></div>
      <div className="language-mp3-downloads__settings">
        <label><strong>Audio collection</strong><select value={collection?.id || ""} onChange={(event) => { setCollectionId(event.target.value); setStatus(""); }}>{collections.map((item) => <option value={item.id} disabled={!item.items.length} key={item.id}>{item.label} ({item.items.length})</option>)}</select></label>
        <label><strong>Speech order</strong><select value={speechOrder} onChange={(event) => { setSpeechOrder(event.target.value); setStatus(""); }}><option value="target">{language} only</option><option value="english-target">English → {language}</option></select></label>
      </div>
      <div className="language-mp3-downloads__summary"><strong>{items.length} items</strong><span>{items.slice(0, 4).map((item) => speechOrder === "english-target" ? `${item.en} → ${item[scriptKey]}` : item[scriptKey]).join(" · ")}{items.length > 4 ? " …" : ""}</span></div>
      <button className="language-mp3-downloads__button" disabled={!items.length || downloading} onClick={download}><FaDownload /> {downloading ? "Generating MP3…" : `Download ${collection?.label || "collection"} MP3`}</button>
      {status && <div className="language-mp3-downloads__status" role="status">{status}</div>}
      <small>Requires configured Google Cloud Text-to-Speech credentials on the API.</small>
    </section>
  );
}

LanguageMp3Downloads.propTypes = {
  language: PropTypes.string.isRequired,
  languageCode: PropTypes.string.isRequired,
  scriptKey: PropTypes.string.isRequired,
  sourceName: PropTypes.string.isRequired,
  collections: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, items: PropTypes.arrayOf(PropTypes.object).isRequired })).isRequired,
  className: PropTypes.string,
};

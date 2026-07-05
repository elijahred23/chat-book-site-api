import { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaRedo, FaServer } from 'react-icons/fa';
import './ApiCheck.css';
import Button from './ui/Button';
import { getGeminiModel, getGeminiModelList, updateGeminiModel } from './utils/callGemini';
import { hostname } from './utils/hostname';

const formatTokenLimit = (limit) => {
    if (!limit) return null;
    return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(limit);
};

export default function ApiCheck() {
    const [apiStatus, setApiStatus] = useState({ loading: true, online: false, message: 'Checking API…' });
    const [currentModel, setCurrentModel] = useState('');
    const [selectedModel, setSelectedModel] = useState('');
    const [models, setModels] = useState([]);
    const [query, setQuery] = useState('');
    const [loadingModels, setLoadingModels] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const checkApi = async () => {
        setApiStatus((status) => ({ ...status, loading: true }));
        try {
            const response = await fetch(`${hostname}/check`);
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'The API did not respond successfully.');
            setApiStatus({ loading: false, online: true, message: data.message || 'API is online.' });
        } catch (requestError) {
            setApiStatus({ loading: false, online: false, message: requestError.message || 'The API is unavailable.' });
        }
    };

    const loadModelSettings = async (refresh = false) => {
        setLoadingModels(true);
        setError('');
        setNotice('');
        const [currentResult, modelsResult] = await Promise.allSettled([
            getGeminiModel(),
            getGeminiModelList({ refresh }),
        ]);

        if (currentResult.status === 'fulfilled') {
            setCurrentModel(currentResult.value || '');
            setSelectedModel(currentResult.value || '');
        }
        if (modelsResult.status === 'fulfilled') {
            setModels(modelsResult.value);
            if (refresh) setNotice('Available models refreshed from Gemini.');
        } else {
            setModels([]);
            setError(modelsResult.reason?.message || 'Could not load available Gemini models.');
        }
        if (currentResult.status === 'rejected' && modelsResult.status === 'fulfilled') {
            setError(currentResult.reason?.message || 'Could not load the current Gemini model.');
        }
        setLoadingModels(false);
    };

    useEffect(() => {
        checkApi();
        loadModelSettings();
    }, []);

    const filteredModels = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return models;
        return models.filter((model) => (
            model.name.toLowerCase().includes(normalizedQuery)
            || model.id.toLowerCase().includes(normalizedQuery)
            || model.description.toLowerCase().includes(normalizedQuery)
        ));
    }, [models, query]);

    const currentModelAvailable = models.some((model) => model.id === currentModel);

    const saveModel = async (event) => {
        event.preventDefault();
        if (!selectedModel || selectedModel === currentModel) return;
        setSaving(true);
        setError('');
        setNotice('');
        try {
            const updatedModel = await updateGeminiModel(selectedModel);
            setCurrentModel(updatedModel);
            setSelectedModel(updatedModel);
            setNotice(`Gemini model changed to ${updatedModel}.`);
        } catch (requestError) {
            setError(requestError.message || 'Could not update the Gemini model.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ui-page api-settings">
            <header className="ui-page__header">
                <div>
                    <p className="ui-page__eyebrow">Configuration</p>
                    <h1 className="ui-page__title">API settings</h1>
                    <p className="ui-page__description">Check the server connection and choose the Gemini text model used across the workspace.</p>
                </div>
            </header>

            <section className="ui-card api-settings__status" aria-labelledby="api-status-title">
                <div className={`api-settings__status-icon ${apiStatus.online ? 'is-online' : 'is-offline'}`} aria-hidden="true">
                    <FaServer />
                </div>
                <div>
                    <h2 id="api-status-title">API status</h2>
                    <p className="api-settings__status-label">
                        {apiStatus.loading ? 'Checking connection' : apiStatus.online ? 'Connected' : 'Unavailable'}
                    </p>
                    <p>{apiStatus.message}</p>
                </div>
                <Button onClick={checkApi} disabled={apiStatus.loading}>Check again</Button>
            </section>

            <form className="ui-card api-settings__models" onSubmit={saveModel} aria-labelledby="gemini-model-title">
                <div className="api-settings__models-header">
                    <div>
                        <p className="ui-page__eyebrow">Gemini</p>
                        <h2 id="gemini-model-title">Text generation model</h2>
                        <p>Models are loaded from Gemini and limited to those that support text content generation.</p>
                    </div>
                    <Button type="button" onClick={() => loadModelSettings(true)} disabled={loadingModels || saving}>
                        <FaRedo aria-hidden="true" /> Refresh models
                    </Button>
                </div>

                <div className="api-settings__current">
                    <span>Currently active</span>
                    <code>{currentModel || 'Not available'}</code>
                    {currentModel && currentModelAvailable && <span className="ui-badge"><FaCheckCircle aria-hidden="true" /> Available</span>}
                </div>

                {!loadingModels && currentModel && !currentModelAvailable && !error && (
                    <p className="api-settings__warning"><FaExclamationTriangle aria-hidden="true" /> The active model is no longer in Gemini’s available model list. Choose a replacement below.</p>
                )}

                <div className="api-settings__messages" aria-live="polite" aria-atomic="true">
                    {error && <p className="api-settings__error" role="alert">{error}</p>}
                    {notice && <p className="api-settings__notice">{notice}</p>}
                </div>

                <div className="ui-field api-settings__search">
                    <label className="ui-field__label" htmlFor="gemini-model-search">Filter available models</label>
                    <input
                        className="ui-input"
                        id="gemini-model-search"
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by name, ID, or description"
                        disabled={loadingModels || !models.length}
                    />
                    <p className="ui-field__hint">{loadingModels ? 'Loading models from Gemini…' : `${filteredModels.length} of ${models.length} models shown`}</p>
                </div>

                <fieldset className="api-settings__model-list" disabled={loadingModels || saving}>
                    <legend className="ui-sr-only">Choose a Gemini model</legend>
                    {filteredModels.map((model) => (
                        <label className={`api-settings__model ${selectedModel === model.id ? 'is-selected' : ''}`} key={model.id}>
                            <input
                                type="radio"
                                name="gemini-model"
                                value={model.id}
                                checked={selectedModel === model.id}
                                onChange={(event) => setSelectedModel(event.target.value)}
                            />
                            <span className="api-settings__model-content">
                                <span className="api-settings__model-title">
                                    <strong>{model.name}</strong>
                                    {model.id === currentModel && <span className="ui-badge">Active</span>}
                                    {model.thinking && <span className="ui-badge">Thinking</span>}
                                </span>
                                <code>{model.id}</code>
                                <span>{model.description}</span>
                                {(model.inputTokenLimit || model.outputTokenLimit) && (
                                    <small>
                                        {model.inputTokenLimit && `${formatTokenLimit(model.inputTokenLimit)} input`}
                                        {model.inputTokenLimit && model.outputTokenLimit && ' · '}
                                        {model.outputTokenLimit && `${formatTokenLimit(model.outputTokenLimit)} output`}
                                        {' tokens'}
                                    </small>
                                )}
                            </span>
                        </label>
                    ))}
                    {!loadingModels && models.length > 0 && filteredModels.length === 0 && (
                        <p className="api-settings__empty">No models match “{query}”.</p>
                    )}
                </fieldset>

                <div className="api-settings__actions">
                    <p>{selectedModel && selectedModel !== currentModel ? <><span>Ready to use</span> <code>{selectedModel}</code></> : 'Select a different model to make a change.'}</p>
                    <Button variant="primary" type="submit" disabled={!selectedModel || selectedModel === currentModel || loadingModels || saving}>
                        {saving ? 'Applying…' : 'Use selected model'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

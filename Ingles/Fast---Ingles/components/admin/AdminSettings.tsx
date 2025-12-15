
import React, { useState, useEffect } from 'react';
import { AIConfig, AIProviderType, AIProviderConfig, AI_MODELS } from '../../types';
import { Button } from '../ui/Button';

// Storage key for AI config
const AI_CONFIG_KEY = 'fast_ingles_ai_config';

// Default configuration
const getDefaultConfig = (): AIConfig => ({
    currentProvider: 'gemini',
    providers: {
        gemini: { apiKey: '', model: 'gemini-1.5-flash' },
        claude: { apiKey: '', model: 'claude-3-5-sonnet-20241022' },
        chatgpt: { apiKey: '', model: 'gpt-4o-mini' },
        deepseek: { apiKey: '', model: 'deepseek-chat' }
    }
});

// Provider info for display
const PROVIDER_INFO: Record<AIProviderType, { name: string; icon: string; color: string }> = {
    gemini: { name: 'Google Gemini', icon: '✨', color: 'bg-blue-500' },
    claude: { name: 'Anthropic Claude', icon: '🤖', color: 'bg-orange-500' },
    chatgpt: { name: 'OpenAI ChatGPT', icon: '💬', color: 'bg-green-500' },
    deepseek: { name: 'DeepSeek', icon: '🔮', color: 'bg-purple-500' }
};

export const AdminSettings: React.FC = () => {
    const [config, setConfig] = useState<AIConfig>(getDefaultConfig());
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const [showApiKey, setShowApiKey] = useState<Record<AIProviderType, boolean>>({
        gemini: false, claude: false, chatgpt: false, deepseek: false
    });

    // Load config on mount
    useEffect(() => {
        const saved = localStorage.getItem(AI_CONFIG_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig({ ...getDefaultConfig(), ...parsed });
            } catch (e) {
                console.error('Error loading AI config:', e);
            }
        }
    }, []);

    // Save config
    const handleSave = () => {
        try {
            localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            setSaveStatus('error');
        }
    };

    // Update provider API key
    const updateApiKey = (provider: AIProviderType, apiKey: string) => {
        setConfig(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                [provider]: { ...prev.providers[provider], apiKey }
            }
        }));
    };

    // Update provider model
    const updateModel = (provider: AIProviderType, model: string) => {
        setConfig(prev => ({
            ...prev,
            providers: {
                ...prev.providers,
                [provider]: { ...prev.providers[provider], model }
            }
        }));
    };

    // Select current provider
    const selectProvider = (provider: AIProviderType) => {
        setConfig(prev => ({ ...prev, currentProvider: provider }));
    };

    // Toggle API key visibility
    const toggleShowApiKey = (provider: AIProviderType) => {
        setShowApiKey(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Configuración de IA</h1>
                <p className="text-slate-500">Configura las API keys y modelos para los proveedores de inteligencia artificial.</p>
            </div>

            {/* Current Provider Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Proveedor Activo</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(Object.keys(PROVIDER_INFO) as AIProviderType[]).map(provider => (
                        <button
                            key={provider}
                            onClick={() => selectProvider(provider)}
                            className={`p-4 rounded-xl border-2 transition-all ${config.currentProvider === provider
                                ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                        >
                            <div className="text-2xl mb-2">{PROVIDER_INFO[provider].icon}</div>
                            <div className={`text-sm font-bold ${config.currentProvider === provider ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {PROVIDER_INFO[provider].name}
                            </div>
                            {config.currentProvider === provider && (
                                <div className="text-xs text-emerald-600 mt-1">✓ Activo</div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Provider Configurations */}
            <div className="space-y-4">
                {(Object.keys(PROVIDER_INFO) as AIProviderType[]).map(provider => (
                    <div
                        key={provider}
                        className={`bg-white rounded-xl border p-6 transition-all ${config.currentProvider === provider
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'border-slate-200'
                            }`}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-lg ${PROVIDER_INFO[provider].color} flex items-center justify-center text-white text-xl`}>
                                {PROVIDER_INFO[provider].icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{PROVIDER_INFO[provider].name}</h3>
                                <p className="text-xs text-slate-500">Configura tu API key y modelo</p>
                            </div>
                            {config.currentProvider === provider && (
                                <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">
                                    ACTIVO
                                </span>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* API Key Field */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                                <div className="relative">
                                    <input
                                        type={showApiKey[provider] ? 'text' : 'password'}
                                        value={config.providers[provider].apiKey}
                                        onChange={(e) => updateApiKey(provider, e.target.value)}
                                        placeholder={`Ingresa tu ${PROVIDER_INFO[provider].name} API Key`}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 pr-12 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleShowApiKey(provider)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showApiKey[provider] ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            {/* Model Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
                                <select
                                    value={config.providers[provider].model}
                                    onChange={(e) => updateModel(provider, e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    {AI_MODELS[provider].map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Save Button */}
            <div className="mt-8 flex items-center gap-4">
                <Button onClick={handleSave} className="px-8">
                    💾 Guardar Configuración
                </Button>
                {saveStatus === 'saved' && (
                    <span className="text-emerald-600 font-medium animate-pulse">✓ Guardado correctamente</span>
                )}
                {saveStatus === 'error' && (
                    <span className="text-red-600 font-medium">Error al guardar</span>
                )}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                        <h4 className="font-bold text-amber-800 mb-1">Nota Importante</h4>
                        <p className="text-sm text-amber-700">
                            Las API keys se almacenan localmente en tu navegador. Para producción,
                            se recomienda manejar las claves en el servidor por seguridad.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Export helper to get current AI config
export const getAIConfig = (): AIProviderConfig => {
    const saved = localStorage.getItem(AI_CONFIG_KEY);
    if (saved) {
        try {
            const config: AIConfig = JSON.parse(saved);
            return {
                provider: config.currentProvider,
                apiKey: config.providers[config.currentProvider].apiKey,
                model: config.providers[config.currentProvider].model
            };
        } catch (e) {
            console.error('Error reading AI config:', e);
        }
    }
    // Default fallback
    return {
        provider: 'gemini',
        apiKey: '',
        model: 'gemini-1.5-flash'
    };
};

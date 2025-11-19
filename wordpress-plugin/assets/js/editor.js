/**
 * Ecdotica AI Assistant - Editor Integration
 * Integra el asistente de IA con el editor de WordPress (Gutenberg)
 */

(function(wp) {
    const { registerPlugin } = wp.plugins;
    const { PluginSidebar, PluginSidebarMoreMenuItem } = wp.editPost;
    const { PanelBody, Button, Spinner, TextareaControl } = wp.components;
    const { useState, useEffect } = wp.element;
    const { useSelect } = wp.data;
    const { __ } = wp.i18n;

    // Componente principal del sidebar
    const EcdoticaAISidebar = () => {
        const [analyzing, setAnalyzing] = useState(false);
        const [gettingSuggestions, setGettingSuggestions] = useState(false);
        const [registeringBlockchain, setRegisteringBlockchain] = useState(false);
        const [analysis, setAnalysis] = useState(null);
        const [suggestions, setSuggestions] = useState([]);
        const [blockchainHash, setBlockchainHash] = useState(null);

        // Obtener el contenido del post
        const postContent = useSelect((select) => {
            const editor = select('core/editor');
            return editor.getEditedPostContent();
        }, []);

        const postId = useSelect((select) => {
            return select('core/editor').getCurrentPostId();
        }, []);

        // Analizar texto
        const handleAnalyze = async () => {
            setAnalyzing(true);
            setAnalysis(null);

            try {
                const response = await fetch(ecdoticaAI.ajaxUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'ecdotica_analyze_text',
                        nonce: ecdoticaAI.nonce,
                        text: postContent
                    })
                });

                const data = await response.json();
                if (data.success) {
                    setAnalysis(data.data);
                } else {
                    alert('Error al analizar el texto');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            } finally {
                setAnalyzing(false);
            }
        };

        // Obtener sugerencias
        const handleGetSuggestions = async () => {
            setGettingSuggestions(true);
            setSuggestions([]);

            try {
                const response = await fetch(ecdoticaAI.ajaxUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'ecdotica_get_suggestions',
                        nonce: ecdoticaAI.nonce,
                        text: postContent
                    })
                });

                const data = await response.json();
                if (data.success && data.data.suggestions) {
                    setSuggestions(data.data.suggestions);
                } else {
                    alert('Error al obtener sugerencias');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            } finally {
                setGettingSuggestions(false);
            }
        };

        // Registrar en blockchain
        const handleRegisterBlockchain = async () => {
            if (!postId) {
                alert('Guarda el borrador antes de registrar en blockchain');
                return;
            }

            setRegisteringBlockchain(true);
            setBlockchainHash(null);

            try {
                const response = await fetch(ecdoticaAI.ajaxUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        action: 'ecdotica_register_blockchain',
                        nonce: ecdoticaAI.nonce,
                        post_id: postId
                    })
                });

                const data = await response.json();
                if (data.success && data.data.transaction_hash) {
                    setBlockchainHash(data.data.transaction_hash);
                    alert('¡Documento registrado en blockchain exitosamente!');
                } else {
                    alert('Error al registrar en blockchain');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            } finally {
                setRegisteringBlockchain(false);
            }
        };

        return (
            <>
                <PanelBody title="Análisis de Texto" initialOpen={true}>
                    <p>
                        <Button 
                            isPrimary 
                            onClick={handleAnalyze}
                            disabled={analyzing || !postContent}
                        >
                            {analyzing ? <Spinner /> : 'Analizar Texto'}
                        </Button>
                    </p>
                    {analysis && (
                        <div className="ecdotica-analysis">
                            <p><strong>Palabras:</strong> {analysis.word_count}</p>
                            <p><strong>Caracteres:</strong> {analysis.char_count}</p>
                            {analysis.message && (
                                <p><em>{analysis.message}</em></p>
                            )}
                        </div>
                    )}
                </PanelBody>

                <PanelBody title="Sugerencias Editoriales" initialOpen={false}>
                    <p>
                        <Button 
                            isPrimary 
                            onClick={handleGetSuggestions}
                            disabled={gettingSuggestions || !postContent}
                        >
                            {gettingSuggestions ? <Spinner /> : 'Obtener Sugerencias'}
                        </Button>
                    </p>
                    {suggestions.length > 0 && (
                        <div className="ecdotica-suggestions">
                            {suggestions.map((suggestion, index) => (
                                <div key={index} className="ecdotica-suggestion-item">
                                    <p><strong>{suggestion.type}:</strong></p>
                                    <p>{suggestion.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </PanelBody>

                <PanelBody title="Registro Blockchain" initialOpen={false}>
                    <p>
                        Registra este documento en blockchain para certificar su autoría y fecha de creación.
                    </p>
                    <p>
                        <Button 
                            isPrimary 
                            onClick={handleRegisterBlockchain}
                            disabled={registeringBlockchain || !postId}
                        >
                            {registeringBlockchain ? <Spinner /> : 'Registrar en Blockchain'}
                        </Button>
                    </p>
                    {blockchainHash && (
                        <div className="ecdotica-blockchain">
                            <p><strong>¡Registrado!</strong></p>
                            <p style={{wordBreak: 'break-all', fontSize: '0.8em'}}>
                                Hash: {blockchainHash.substring(0, 20)}...
                            </p>
                        </div>
                    )}
                </PanelBody>
            </>
        );
    };

    // Registrar el plugin
    registerPlugin('ecdotica-ai-assistant', {
        render: () => (
            <>
                <PluginSidebarMoreMenuItem target="ecdotica-ai-sidebar">
                    Asistente IA Ecdotica
                </PluginSidebarMoreMenuItem>
                <PluginSidebar
                    name="ecdotica-ai-sidebar"
                    title="Asistente IA Ecdotica"
                    icon="lightbulb"
                >
                    <EcdoticaAISidebar />
                </PluginSidebar>
            </>
        ),
    });

})(window.wp);

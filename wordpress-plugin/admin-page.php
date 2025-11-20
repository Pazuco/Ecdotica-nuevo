<?php
/**
 * Página administrativa para análisis de manuscritos
 * Editorial Nuevo Milenio
 */

if (!defined('ABSPATH')) {
    exit;
}

function ecdotica_render_admin_page() {
    // Procesar análisis si se envió un archivo
    $analysis_result = null;
    $error_message = null;
    
    if (isset($_POST['ecdotica_analyze']) && isset($_FILES['manuscript_file'])) {
        if (!isset($_POST['ecdotica_nonce']) || !wp_verify_nonce($_POST['ecdotica_nonce'], 'ecdotica_analyze_action')) {
            $error_message = 'Error de seguridad. Por favor recarga la página.';
        } else {
            $analysis_result = ecdotica_process_manuscript($_FILES['manuscript_file']);
            if (is_wp_error($analysis_result)) {
                $error_message = $analysis_result->get_error_message();
                $analysis_result = null;
            }
        }
    }
    
    ?>
    <div class="wrap">
        <h1>📚 Análisis de Manuscritos - Editorial Nuevo Milenio</h1>
        
        <?php if ($error_message): ?>
            <div class="notice notice-error">
                <p><strong>Error:</strong> <?php echo esc_html($error_message); ?></p>
            </div>
        <?php endif; ?>
        
        <?php if ($analysis_result): ?>
            <div class="notice notice-success">
                <p><strong>✓ Análisis completado exitosamente</strong></p>
            </div>
            
            <div class="ecdotica-results" style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; border-radius: 4px; margin: 20px 0;">
                <h2>Resultado del Análisis</h2>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0;">
                    <div style="background: #f0f0f1; padding: 15px; border-radius: 4px;">
                        <h3 style="margin-top: 0; color: #1d2327;">📄 Palabras</h3>
                        <p style="font-size: 24px; font-weight: bold; margin: 0;"><?php echo number_format($analysis_result['statistics']['word_count']); ?></p>
                    </div>
                    
                    <div style="background: #f0f0f1; padding: 15px; border-radius: 4px;">
                        <h3 style="margin-top: 0; color: #1d2327;">📝 Oraciones</h3>
                        <p style="font-size: 24px; font-weight: bold; margin: 0;"><?php echo number_format($analysis_result['statistics']['sentence_count']); ?></p>
                    </div>
                    
                    <div style="background: #f0f0f1; padding: 15px; border-radius: 4px;">
                        <h3 style="margin-top: 0; color: #1d2327;">¶ Párrafos</h3>
                        <p style="font-size: 24px; font-weight: bold; margin: 0;"><?php echo number_format($analysis_result['statistics']['paragraph_count']); ?></p>
                    </div>
                    
                    <div style="background: <?php 
                        $score = $analysis_result['quality_score'];
                        if ($score >= 80) echo '#d4edda';
                        elseif ($score >= 60) echo '#fff3cd';
                        else echo '#f8d7da';
                    ?>; padding: 15px; border-radius: 4px;">
                        <h3 style="margin-top: 0; color: #1d2327;">⭐ Calidad</h3>
                        <p style="font-size: 24px; font-weight: bold; margin: 0;"><?php echo $score; ?>/100</p>
                    </div>
                </div>
                
                <div style="margin: 20px 0; padding: 15px; background: <?php
                    $status = $analysis_result['editorial_status'];
                    if ($status === 'ACCEPTED') echo '#d4edda; color: #155724;';
                    elseif ($status === 'REVIEW_NEEDED') echo '#fff3cd; color: #856404;';
                    else echo '#f8d7da; color: #721c24;';
                ?>; border-radius: 4px;">
                    <h3 style="margin-top: 0;">📋 Decisión Editorial</h3>
                    <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">
                        <?php 
                        $status_text = [
                            'ACCEPTED' => '✓ ACEPTADO',
                            'REVIEW_NEEDED' => '⚠ REQUIERE REVISIÓN',
                            'REJECTED' => '✗ RECHAZADO'
                        ];
                        echo $status_text[$status] ?? $status;
                        ?>
                    </p>
                    <p><?php echo esc_html($analysis_result['recommendation']); ?></p>
                </div>
                
                <?php if (!empty($analysis_result['issues'])): ?>
                    <div style="margin: 20px 0;">
                        <h3>⚠️ Problemas Detectados</h3>
                        <ul style="background: #fff3cd; padding: 15px 15px 15px 35px; border-radius: 4px;">
                            <?php foreach ($analysis_result['issues'] as $issue): ?>
                                <li><?php echo esc_html($issue); ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endif; ?>
                
                <div style="margin: 20px 0;">
                    <h3>📊 Detalles Estadísticos</h3>
                    <table class="widefat" style="margin-top: 10px;">
                        <tbody>
                            <tr>
                                <td><strong>Palabras por oración (promedio):</strong></td>
                                <td><?php echo round($analysis_result['statistics']['avg_words_per_sentence'], 1); ?></td>
                            </tr>
                            <tr>
                                <td><strong>Oraciones por párrafo (promedio):</strong></td>
                                <td><?php echo round($analysis_result['statistics']['avg_sentences_per_paragraph'], 1); ?></td>
                            </tr>
                            <tr>
                                <td><strong>Longitud promedio de palabra:</strong></td>
                                <td><?php echo round($analysis_result['statistics']['avg_word_length'], 1); ?> caracteres</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        <?php endif; ?>
        
        <div class="ecdotica-upload-form" style="background: #fff; padding: 20px; border: 1px solid #ccd0d4; border-radius: 4px; margin: 20px 0;">
            <h2>Subir Manuscrito para Análisis</h2>
            <p>Selecciona un archivo PDF o Word (.docx) para analizar. Tamaño máximo: 10MB</p>
            
            <form method="post" enctype="multipart/form-data" style="margin-top: 20px;">
                <?php wp_nonce_field('ecdotica_analyze_action', 'ecdotica_nonce'); ?>
                
                <p>
                    <input type="file" name="manuscript_file" accept=".pdf,.docx" required style="font-size: 14px;" />
                </p>
                
                <p>
                    <button type="submit" name="ecdotica_analyze" class="button button-primary button-large" style="padding: 8px 20px;">
                        🔍 Analizar Manuscrito
                    </button>
                </p>
            </form>
        </div>
        
        <div class="ecdotica-info" style="background: #f0f6fc; padding: 15px; border: 1px solid #0969da; border-radius: 4px; margin: 20px 0;">
            <h3 style="margin-top: 0;">ℹ️ Información</h3>
            <ul style="margin: 0;">
                <li><strong>API Status:</strong> <span id="ecdotica-api-status">Verificando...</span></li>
                <li><strong>Formatos soportados:</strong> PDF, Microsoft Word (.docx)</li>
                <li><strong>Tamaño máximo:</strong> 10MB</li>
                <li><strong>Uso interno:</strong> Solo para el equipo editorial de Nuevo Milenio</li>
            </ul>
        </div>
    </div>
    
    <script>
    // Verificar estado de la API
    fetch('<?php echo esc_url(ECDOTICA_API_URL); ?>/health')
        .then(response => response.json())
        .then(data => {
            document.getElementById('ecdotica-api-status').innerHTML = '<span style="color: green;">✓ Conectado</span>';
        })
        .catch(error => {
            document.getElementById('ecdotica-api-status').innerHTML = '<span style="color: red;">✗ No disponible</span>';
        });
    </script>
    <?php
}

function ecdotica_process_manuscript($file) {
    // Validar archivo
    $allowed_types = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    $max_size = 10 * 1024 * 1024; // 10MB
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return new WP_Error('upload_error', 'Error al subir el archivo.');
    }
    
    if ($file['size'] > $max_size) {
        return new WP_Error('file_too_large', 'El archivo es demasiado grande. Máximo 10MB.');
    }
    
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime_type, $allowed_types)) {
        return new WP_Error('invalid_type', 'Tipo de archivo no válido. Solo PDF o DOCX.');
    }
    
    // Enviar a la API
    $api_url = ECDOTICA_API_URL . '/api/v1/manuscripts/upload';
    
    $boundary = wp_generate_password(24);
    $body = '';
    
    // Construir multipart form data
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Disposition: form-data; name=\"file\"; filename=\"{$file['name']}\"\r\n";
    $body .= "Content-Type: {$mime_type}\r\n\r\n";
    $body .= file_get_contents($file['tmp_name']) . "\r\n";
    $body .= "--{$boundary}--\r\n";
    
    $response = wp_remote_post($api_url, [
        'timeout' => 30,
        'headers' => [
            'Content-Type' => "multipart/form-data; boundary={$boundary}",
        ],
        'body' => $body,
    ]);
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Error al conectar con la API: ' . $response->get_error_message());
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    if ($response_code !== 200) {
        return new WP_Error('api_error', 'Error de la API (código ' . $response_code . ')');
    }
    
    $result = json_decode(wp_remote_retrieve_body($response), true);
    
    if (!$result || !isset($result['statistics'])) {
        return new WP_Error('api_error', 'Respuesta inválida de la API.');
    }
    
    return $result;
}
?>

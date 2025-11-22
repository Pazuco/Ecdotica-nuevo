<?php
/**
 * Plugin Name: Ecdotica AI Assistant
 * Plugin URI: https://github.com/Pazuco/Ecdotica-nuevo
 * Description: Asistente de IA para análisis textual, sugerencias editoriales y registro blockchain
 * Version: 1.1.0
 * Author: Editorial Nuevo Milenio
 * Author URI: https://ecdotica.com
 * License: GPL v2 or later
 * Text Domain: ecdotica-ai
 */

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Constantes
define('ECDOTICA_AI_VERSION', '1.1.0');
define('ECDOTICA_AI_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ECDOTICA_AI_PLUGIN_URL', plugin_dir_url(__FILE__));

// Incluir archivos del plugin
require_once ECDOTICA_AI_PLUGIN_DIR . '/config.php';
require_once ECDOTICA_AI_PLUGIN_DIR . '/database-setup.php';
require_once ECDOTICA_AI_PLUGIN_DIR . '/manuscript-manager.php';
require_once ECDOTICA_AI_PLUGIN_DIR . '/admin-page.php';

// Registrar página de administración
add_action('admin_menu', 'ecdotica_add_admin_menu');

function ecdotica_add_admin_menu() {
    add_menu_page(
        'Ecdotica - Análisis de Manuscritos',
        'Ecdotica',
        'edit_posts',
        'ecdotica-analyzer',
        'ecdotica_render_admin_page',
        'dashicons-analytics',
        30
    );
}

class Ecdotica_AI_Assistant {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('enqueue_block_editor_assets', array($this, 'enqueue_editor_assets'));
        add_action('wp_ajax_ecdotica_analyze_text', array($this, 'ajax_analyze_text'));
        add_action('wp_ajax_ecdotica_get_suggestions', array($this, 'ajax_get_suggestions'));
        add_action('wp_ajax_ecdotica_register_blockchain', array($this, 'ajax_register_blockchain'));
        add_action('publish_post', array($this, 'on_publish_post'), 10, 2);
        
        // Verificar y actualizar esquema de base de datos si es necesario
        add_action('admin_init', array($this, 'check_database_update'));
    }
    
    /**
     * Verificar si la base de datos necesita actualización
     */
    public function check_database_update() {
        $current_version = get_option('ecdotica_db_version', '1.0.0');
        $target_version = '1.1.0';
        
        if (version_compare($current_version, $target_version, '<')) {
            // Actualizar esquema
            Ecdotica_Database::update_schema();
            update_option('ecdotica_db_version', $target_version);
            
            error_log('Ecdotica: Base de datos actualizada a versión ' . $target_version);
        }
    }
    
    public function enqueue_editor_assets() {
        wp_enqueue_script(
            'ecdotica-ai-editor',
            ECDOTICA_AI_PLUGIN_URL . 'assets/js/editor.js',
            array('wp-blocks', 'wp-element', 'wp-editor'),
            ECDOTICA_AI_VERSION,
            true
        );
        
        wp_enqueue_style(
            'ecdotica-ai-editor',
            ECDOTICA_AI_PLUGIN_URL . 'assets/css/editor.css',
            array(),
            ECDOTICA_AI_VERSION
        );
        
        wp_localize_script('ecdotica-ai-editor', 'ecdoticaAI', array(
            'apiUrl' => ECDOTICA_API_URL,
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('ecdotica_ai_nonce')
        ));
    }
    
    public function ajax_analyze_text() {
        check_ajax_referer('ecdotica_ai_nonce', 'nonce');
        $text = isset($_POST['text']) ? sanitize_textarea_field($_POST['text']) : '';
        $response = $this->call_api('/api/v1/text/analyze', array('text' => $text));
        wp_send_json($response);
    }
    
    public function ajax_get_suggestions() {
        check_ajax_referer('ecdotica_ai_nonce', 'nonce');
        $text = isset($_POST['text']) ? sanitize_textarea_field($_POST['text']) : '';
        $response = $this->call_api('/api/v1/review/suggest', array('text' => $text));
        wp_send_json($response);
    }
    
    public function ajax_register_blockchain() {
        check_ajax_referer('ecdotica_ai_nonce', 'nonce');
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $post = get_post($post_id);
        $data = array(
            'content' => $post->post_content,
            'title' => $post->post_title
        );
        $response = $this->call_api('/api/v1/blockchain/register', $data);
        if (isset($response['transaction_hash'])) {
            update_post_meta($post_id, '_ecdotica_blockchain_hash', $response['transaction_hash']);
        }
        wp_send_json($response);
    }
    
    private function call_api($endpoint, $data) {
        $response = wp_remote_post(ECDOTICA_API_URL . $endpoint, array(
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode($data),
            'timeout' => 30
        ));
        return json_decode(wp_remote_retrieve_body($response), true);
    }
    
    public function on_publish_post($post_id, $post) {
        $auto = get_option('ecdotica_ai_auto_blockchain', 'no');
        if ($auto === 'yes' && !get_post_meta($post_id, '_ecdotica_blockchain_hash', true)) {
            $this->ajax_register_blockchain();
        }
    }
}

function ecdotica_ai_init() {
    return Ecdotica_AI_Assistant::get_instance();
}
add_action('plugins_loaded', 'ecdotica_ai_init');

// Hook de activación del plugin
register_activation_hook(__FILE__, function() {
    // Crear tablas de base de datos
    Ecdotica_Database::create_tables();
    
    // Configuración por defecto
    add_option('ecdotica_ai_auto_blockchain', 'no');
    
    error_log('Ecdotica: Plugin activado y base de datos inicializada');
});

// Hook de desactivación del plugin (opcional)
register_deactivation_hook(__FILE__, function() {
    error_log('Ecdotica: Plugin desactivado');
});

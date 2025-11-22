<?php
/**
 * Database Setup for Ecdotica Analyzer
 * Creates tables for manuscript management and analysis history
 */

if (!defined('ABSPATH')) {
    exit;
}

class Ecdotica_Database {
    
    public static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        
        // Table for manuscripts
        $table_manuscripts = $wpdb->prefix . 'ecdotica_manuscripts';
        $sql_manuscripts = "CREATE TABLE IF NOT EXISTS $table_manuscripts (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            author varchar(255) DEFAULT NULL,
            original_filename varchar(255) NOT NULL,
            file_path varchar(500) NOT NULL,
            file_type varchar(50) NOT NULL,
            file_size bigint(20) NOT NULL,
            upload_date datetime NOT NULL,
            uploaded_by bigint(20) NOT NULL,
            status varchar(50) DEFAULT 'pending',
            notes text DEFAULT NULL,
            media_id bigint(20) DEFAULT NULL COMMENT 'ID del attachment en WordPress Media Library',
            PRIMARY KEY (id),
            KEY status (status),
            KEY upload_date (upload_date),
            KEY media_id (media_id)
        ) $charset_collate;";
        
        // Table for analysis results
        $table_analyses = $wpdb->prefix . 'ecdotica_analyses';
        $sql_analyses = "CREATE TABLE IF NOT EXISTS $table_analyses (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            manuscript_id bigint(20) NOT NULL,
            analysis_date datetime NOT NULL,
            word_count int(11) NOT NULL,
            sentence_count int(11) NOT NULL,
            paragraph_count int(11) NOT NULL,
            quality_score int(11) NOT NULL,
            editorial_decision varchar(50) NOT NULL,
            editorial_message text NOT NULL,
            problems_detected text DEFAULT NULL,
            avg_words_per_sentence decimal(10,2) DEFAULT NULL,
            avg_words_per_paragraph decimal(10,2) DEFAULT NULL,
            readability_score decimal(10,2) DEFAULT NULL,
            analyzed_by bigint(20) NOT NULL,
            PRIMARY KEY (id),
            KEY manuscript_id (manuscript_id),
            KEY analysis_date (analysis_date),
            KEY editorial_decision (editorial_decision)
        ) $charset_collate;";
        
        // Table for editorial notes
        $table_notes = $wpdb->prefix . 'ecdotica_editorial_notes';
        $sql_notes = "CREATE TABLE IF NOT EXISTS $table_notes (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            manuscript_id bigint(20) NOT NULL,
            analysis_id bigint(20) DEFAULT NULL,
            note_type varchar(50) NOT NULL,
            note_content text NOT NULL,
            created_date datetime NOT NULL,
            created_by bigint(20) NOT NULL,
            is_internal tinyint(1) DEFAULT 1,
            PRIMARY KEY (id),
            KEY manuscript_id (manuscript_id),
            KEY created_date (created_date)
        ) $charset_collate;";
        
        // Table for version history
        $table_versions = $wpdb->prefix . 'ecdotica_manuscript_versions';
        $sql_versions = "CREATE TABLE IF NOT EXISTS $table_versions (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            manuscript_id bigint(20) NOT NULL,
            version_number int(11) NOT NULL,
            file_path varchar(500) NOT NULL,
            upload_date datetime NOT NULL,
            uploaded_by bigint(20) NOT NULL,
            version_notes text DEFAULT NULL,
            PRIMARY KEY (id),
            KEY manuscript_id (manuscript_id),
            KEY version_number (version_number)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_manuscripts);
        dbDelta($sql_analyses);
        dbDelta($sql_notes);
        dbDelta($sql_versions);
        
        // Set database version
        update_option('ecdotica_db_version', '1.1.0');
    }
    
    /**
     * Update database schema to add media_id field if it doesn't exist
     */
    public static function update_schema() {
        global $wpdb;
        $table_manuscripts = $wpdb->prefix . 'ecdotica_manuscripts';
        
        // Check if media_id column exists
        $column_exists = $wpdb->get_results(
            $wpdb->prepare(
                "SHOW COLUMNS FROM `{$table_manuscripts}` LIKE %s",
                'media_id'
            )
        );
        
        // Add media_id column if it doesn't exist
        if (empty($column_exists)) {
            $wpdb->query(
                "ALTER TABLE `{$table_manuscripts}` 
                ADD COLUMN media_id bigint(20) DEFAULT NULL COMMENT 'ID del attachment en WordPress Media Library' AFTER notes,
                ADD KEY media_id (media_id)"
            );
            
            error_log('Ecdotica: Campo media_id agregado a la tabla de manuscritos');
        }
    }
    
    public static function drop_tables() {
        global $wpdb;
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}ecdotica_manuscript_versions");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}ecdotica_editorial_notes");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}ecdotica_analyses");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}ecdotica_manuscripts");
        delete_option('ecdotica_db_version');
    }
}

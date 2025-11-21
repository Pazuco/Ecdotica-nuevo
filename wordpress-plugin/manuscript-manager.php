<?php
/**
 * Manuscript Manager
 * Handles all database operations for manuscripts and analyses
 */

if (!defined('ABSPATH')) {
    exit;
}

class Ecdotica_Manuscript_Manager {
    
    private $wpdb;
    private $manuscripts_table;
    private $analyses_table;
    private $notes_table;
    private $versions_table;
    
    public function __construct() {
        global $wpdb;
        $this->wpdb = $wpdb;
        $this->manuscripts_table = $wpdb->prefix . 'ecdotica_manuscripts';
        $this->analyses_table = $wpdb->prefix . 'ecdotica_analyses';
        $this->notes_table = $wpdb->prefix . 'ecdotica_editorial_notes';
        $this->versions_table = $wpdb->prefix . 'ecdotica_manuscript_versions';
    }
    
    /**
     * Save a new manuscript
     */
    public function save_manuscript($data) {
        $result = $this->wpdb->insert(
            $this->manuscripts_table,
            array(
                'title' => sanitize_text_field($data['title']),
                'author' => sanitize_text_field($data['author']),
                'original_filename' => sanitize_file_name($data['original_filename']),
                'file_path' => sanitize_text_field($data['file_path']),
                'file_type' => sanitize_text_field($data['file_type']),
                'file_size' => intval($data['file_size']),
                'upload_date' => current_time('mysql'),
                'uploaded_by' => get_current_user_id(),
                'status' => 'pending',
                'notes' => wp_kses_post($data['notes'])
            ),
            array('%s', '%s', '%s', '%s', '%s', '%d', '%s', '%d', '%s', '%s')
        );
        
        if ($result) {
            return $this->wpdb->insert_id;
        }
        return false;
    }
    
    /**
     * Save analysis results
     */
    public function save_analysis($manuscript_id, $analysis_data) {
        $result = $this->wpdb->insert(
            $this->analyses_table,
            array(
                'manuscript_id' => intval($manuscript_id),
                'analysis_date' => current_time('mysql'),
                'word_count' => intval($analysis_data['word_count']),
                'sentence_count' => intval($analysis_data['sentence_count']),
                'paragraph_count' => intval($analysis_data['paragraph_count']),
                'quality_score' => intval($analysis_data['quality_score']),
                'editorial_decision' => sanitize_text_field($analysis_data['decision']),
                'editorial_message' => wp_kses_post($analysis_data['message']),
                'problems_detected' => wp_kses_post($analysis_data['problems']),
                'avg_words_per_sentence' => floatval($analysis_data['avg_words_per_sentence']),
                'avg_words_per_paragraph' => floatval($analysis_data['avg_words_per_paragraph']),
                'readability_score' => floatval($analysis_data['readability_score']),
                'analyzed_by' => get_current_user_id()
            ),
            array('%d', '%s', '%d', '%d', '%d', '%d', '%s', '%s', '%s', '%f', '%f', '%f', '%d')
        );
        
        if ($result) {
            // Update manuscript status
            $this->update_manuscript_status($manuscript_id, $analysis_data['decision']);
            return $this->wpdb->insert_id;
        }
        return false;
    }
    
    /**
     * Get manuscript by ID
     */
    public function get_manuscript($id) {
        return $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->manuscripts_table} WHERE id = %d",
                $id
            )
        );
    }
    
    /**
     * Get all manuscripts
     */
    public function get_all_manuscripts($limit = 100, $offset = 0) {
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->manuscripts_table} 
                ORDER BY upload_date DESC 
                LIMIT %d OFFSET %d",
                $limit,
                $offset
            )
        );
    }
    
    /**
     * Get analyses for a manuscript
     */
    public function get_manuscript_analyses($manuscript_id) {
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->analyses_table} 
                WHERE manuscript_id = %d 
                ORDER BY analysis_date DESC",
                $manuscript_id
            )
        );
    }
    
    /**
     * Get latest analysis for a manuscript
     */
    public function get_latest_analysis($manuscript_id) {
        return $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->analyses_table} 
                WHERE manuscript_id = %d 
                ORDER BY analysis_date DESC 
                LIMIT 1",
                $manuscript_id
            )
        );
    }
    
    /**
     * Search manuscripts
     */
    public function search_manuscripts($search_term, $status = null) {
        $query = "SELECT * FROM {$this->manuscripts_table} WHERE 1=1";
        $params = array();
        
        if (!empty($search_term)) {
            $query .= " AND (title LIKE %s OR author LIKE %s)";
            $like_term = '%' . $this->wpdb->esc_like($search_term) . '%';
            $params[] = $like_term;
            $params[] = $like_term;
        }
        
        if ($status) {
            $query .= " AND status = %s";
            $params[] = $status;
        }
        
        $query .= " ORDER BY upload_date DESC";
        
        if (!empty($params)) {
            return $this->wpdb->get_results(
                $this->wpdb->prepare($query, $params)
            );
        }
        return $this->wpdb->get_results($query);
    }
    
    /**
     * Update manuscript status
     */
    public function update_manuscript_status($manuscript_id, $decision) {
        $status_map = array(
            'ACCEPTED' => 'accepted',
            'REVIEW_NEEDED' => 'review',
            'REJECTED' => 'rejected'
        );
        
        $status = isset($status_map[$decision]) ? $status_map[$decision] : 'pending';
        
        return $this->wpdb->update(
            $this->manuscripts_table,
            array('status' => $status),
            array('id' => intval($manuscript_id)),
            array('%s'),
            array('%d')
        );
    }
    
    /**
     * Add editorial note
     */
    public function add_note($manuscript_id, $note_content, $note_type = 'general', $analysis_id = null) {
        return $this->wpdb->insert(
            $this->notes_table,
            array(
                'manuscript_id' => intval($manuscript_id),
                'analysis_id' => $analysis_id ? intval($analysis_id) : null,
                'note_type' => sanitize_text_field($note_type),
                'note_content' => wp_kses_post($note_content),
                'created_date' => current_time('mysql'),
                'created_by' => get_current_user_id(),
                'is_internal' => 1
            ),
            array('%d', '%d', '%s', '%s', '%s', '%d', '%d')
        );
    }
    
    /**
     * Get manuscript notes
     */
    public function get_manuscript_notes($manuscript_id) {
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->notes_table} 
                WHERE manuscript_id = %d 
                ORDER BY created_date DESC",
                $manuscript_id
            )
        );
    }
    
    /**
     * Get statistics
     */
    public function get_statistics() {
        $stats = array();
        
        // Total manuscripts
        $stats['total_manuscripts'] = $this->wpdb->get_var(
            "SELECT COUNT(*) FROM {$this->manuscripts_table}"
        );
        
        // By status
        $stats['by_status'] = $this->wpdb->get_results(
            "SELECT status, COUNT(*) as count 
            FROM {$this->manuscripts_table} 
            GROUP BY status"
        );
        
        // Average quality score
        $stats['avg_quality'] = $this->wpdb->get_var(
            "SELECT AVG(quality_score) FROM {$this->analyses_table}"
        );
        
        // Recent analyses
        $stats['recent_count'] = $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->analyses_table} 
                WHERE analysis_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            )
        );
        
        return $stats;
    }
    
    /**
     * Delete manuscript and related data
     */
    public function delete_manuscript($manuscript_id) {
        // Delete notes
        $this->wpdb->delete(
            $this->notes_table,
            array('manuscript_id' => intval($manuscript_id)),
            array('%d')
        );
        
        // Delete analyses
        $this->wpdb->delete(
            $this->analyses_table,
            array('manuscript_id' => intval($manuscript_id)),
            array('%d')
        );
        
        // Delete versions
        $this->wpdb->delete(
            $this->versions_table,
            array('manuscript_id' => intval($manuscript_id)),
            array('%d')
        );
        
        // Delete manuscript
        return $this->wpdb->delete(
            $this->manuscripts_table,
            array('id' => intval($manuscript_id)),
            array('%d')
        );
    }
}

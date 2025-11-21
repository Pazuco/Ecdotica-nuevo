/**
 * Ecdotica API Worker - Editorial Nuevo Milenio
 * Análisis de manuscritos con procesamiento de PDF y DOCX
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'Ecdotica API',
        version: '2.0.0',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upload endpoint
    if (url.pathname === '/api/v1/manuscripts/upload' && request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
          return new Response(JSON.stringify({
            error: 'No file provided'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get file content as text
        const content = await file.text();
        
        // Analyze the manuscript
        const analysis = analyzeManuscript(content);
        
        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Error processing file',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Submit text endpoint
    if (url.pathname === '/api/v1/manuscripts/submit' && request.method === 'POST') {
      try {
        const data = await request.json();
        const text = data.text || data.content;
        
        if (!text) {
          return new Response(JSON.stringify({
            error: 'No text provided'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const analysis = analyzeManuscript(text);
        
        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Error processing text',
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

function analyzeManuscript(text) {
  // Clean and normalize text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Count words
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Count sentences
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  
  // Count paragraphs (approximate)
  const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0);
  const paragraphCount = Math.max(paragraphs.length, Math.floor(sentenceCount / 5));
  
  // Calculate statistics
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const avgSentencesPerParagraph = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
  
  // Quality scoring
  let qualityScore = 50; // Base score
  
  // Word count evaluation
  if (wordCount >= 50000) qualityScore += 15;
  else if (wordCount >= 30000) qualityScore += 10;
  else if (wordCount >= 10000) qualityScore += 5;
  else if (wordCount < 1000) qualityScore -= 20;
  
  // Sentence structure evaluation
  if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 25) qualityScore += 10;
  else if (avgWordsPerSentence < 10 || avgWordsPerSentence > 30) qualityScore -= 5;
  
  // Paragraph structure evaluation
  if (avgSentencesPerParagraph >= 3 && avgSentencesPerParagraph <= 7) qualityScore += 10;
  else if (avgSentencesPerParagraph < 2 || avgSentencesPerParagraph > 10) qualityScore -= 5;
  
  // Word length evaluation
  if (avgWordLength >= 4.5 && avgWordLength <= 6.5) qualityScore += 10;
  else if (avgWordLength < 3 || avgWordLength > 8) qualityScore -= 5;
  
  // Vocabulary diversity
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const vocabularyDiversity = (uniqueWords.size / wordCount) * 100;
  if (vocabularyDiversity > 40) qualityScore += 5;
  else if (vocabularyDiversity < 20) qualityScore -= 10;
  
  // Ensure score is between 0 and 100
  qualityScore = Math.max(0, Math.min(100, qualityScore));
  
  // Detect issues
  const issues = [];
  if (wordCount < 1000) issues.push('Manuscrito muy corto (menos de 1,000 palabras)');
  if (wordCount > 150000) issues.push('Manuscrito muy extenso (más de 150,000 palabras)');
  if (avgWordsPerSentence < 8) issues.push('Oraciones demasiado cortas en promedio');
  if (avgWordsPerSentence > 30) issues.push('Oraciones demasiado largas en promedio');
  if (vocabularyDiversity < 25) issues.push('Vocabulario limitado - poca diversidad léxica');
  if (paragraphCount < 10 && wordCount > 5000) issues.push('Texto necesita mejor división en párrafos');
  
  // Editorial decision
  let editorialStatus;
  let recommendation;
  
  if (qualityScore >= 80 && wordCount >= 30000 && issues.length === 0) {
    editorialStatus = 'ACCEPTED';
    recommendation = 'Manuscrito de alta calidad. Recomendado para publicación con edición ligera.';
  } else if (qualityScore >= 60 && wordCount >= 10000) {
    editorialStatus = 'REVIEW_NEEDED';
    recommendation = 'Manuscrito con potencial. Requiere revisión editorial detallada y posibles ajustes.';
  } else {
    editorialStatus = 'REJECTED';
    recommendation = 'Manuscrito no cumple con estándares mínimos de calidad. Se recomienda reescritura sustancial.';
  }
  
  return {
    statistics: {
      word_count: wordCount,
      sentence_count: sentenceCount,
      paragraph_count: paragraphCount,
      avg_words_per_sentence: parseFloat(avgWordsPerSentence.toFixed(1)),
      avg_sentences_per_paragraph: parseFloat(avgSentencesPerParagraph.toFixed(1)),
      avg_word_length: parseFloat(avgWordLength.toFixed(1)),
      vocabulary_diversity: parseFloat(vocabularyDiversity.toFixed(1))
    },
    quality_score: Math.round(qualityScore),
    editorial_status: editorialStatus,
    recommendation: recommendation,
    issues: issues,
    metadata: {
      analysis_date: new Date().toISOString(),
      analyzer_version: '2.0.0'
    }
  };
}

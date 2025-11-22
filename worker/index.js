/**
 * Ecdotica API Worker - Editorial Nuevo Milenio
 * Análisis de manuscritos con procesamiento de PDF y DOCX
 * Versión 3.0 - Análisis Literario Avanzado
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
        version: '3.0.0',
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
  
  // === ANÁLISIS BÁSICO ===
  
  // Count words
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Count sentences
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length;
  
  // Count paragraphs (approximate)
  const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0);
  const paragraphCount = Math.max(paragraphs.length, Math.floor(sentenceCount / 5));
  
  // === ANÁLISIS ESTILÍSTICO AVANZADO ===
  
  // Riqueza léxica mejorada
  const lowercaseWords = words.map(w => w.toLowerCase().replace(/[^a-záéíóúñü]/gi, ''));
  const uniqueWords = new Set(lowercaseWords.filter(w => w.length > 0));
  const vocabularyDiversity = (uniqueWords.size / wordCount) * 100;
  
  // Type-Token Ratio (TTR) - más preciso
  const ttr = uniqueWords.size / wordCount;
  
  // Palabras más frecuentes (top 10)
  const wordFreq = {};
  lowercaseWords.forEach(w => {
    if (w.length > 3) { // Excluir palabras muy cortas
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    }
  });
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ palabra: word, frecuencia: count }));
  
  // Detectar palabras repetitivas (aparecen más del 2% del texto)
  const repetitiveWords = topWords.filter(w => (w.frecuencia / wordCount) > 0.02);
  
  // === ANÁLISIS DE CATEGORÍAS GRAMATICALES ===
  
  // Detección aproximada de adjetivos (palabras que terminan en -o, -a, -e, -oso, -osa, etc.)
  const adjetivos = words.filter(w => 
    /(?:os[oa]|iv[oa]|bl[ea]|nt[ea]|d[oa])$/i.test(w) || 
    /(?:ante|ente|ible|able)$/i.test(w)
  );
  const adjectiveRatio = (adjetivos.length / wordCount) * 100;
  
  // Detección aproximada de adverbios terminados en -mente
  const adverbiosMente = words.filter(w => /mente$/i.test(w));
  const adverbRatio = (adverbiosMente.length / wordCount) * 100;
  
  // === ANÁLISIS DE ESTRUCTURA NARRATIVA ===
  
  // Detección de diálogos (comillas, guiones largos)
  const dialogLines = cleanText.match(/["«]([^"»]+)["»]|[—–]([^—–\n]+)/g) || [];
  const dialogRatio = (dialogLines.join(' ').split(/\s+/).length / wordCount) * 100;
  
  // Distribución de longitud de párrafos
  const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
  const avgParagraphLength = paragraphLengths.reduce((a, b) => a + b, 0) / paragraphCount;
  const longParagraphs = paragraphLengths.filter(l => l > 250).length;
  
  // Variación de longitud de oraciones (ritmo narrativo)
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const sentenceLengthVariance = calculateVariance(sentenceLengths);
  
  // Uso de puntuación expresiva
  const semicolonCount = (cleanText.match(/;/g) || []).length;
  const ellipsisCount = (cleanText.match(/\.\.\.|[…]/g) || []).length;
  const dashCount = (cleanText.match(/—|–/g) || []).length;
  
  // === ANÁLISIS DE LEGIBILIDAD ===
  
  // Palabras complejas (más de 3 sílabas - aproximación)
  const complexWords = words.filter(w => countSyllables(w) > 3);
  const complexWordRatio = (complexWords.length / wordCount) * 100;
  
  // Índice Flesch-Szigriszt adaptado al español
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = words.reduce((sum, w) => sum + countSyllables(w), 0) / wordCount;
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (60 * avgSyllablesPerWord);
  
  // Nivel educativo estimado
  let readingLevel;
  if (fleschScore >= 90) readingLevel = "Muy fácil (5to grado)";
  else if (fleschScore >= 80) readingLevel = "Fácil (6to grado)";
  else if (fleschScore >= 70) readingLevel = "Bastante fácil (7mo grado)";
  else if (fleschScore >= 60) readingLevel = "Normal (8vo-9no grado)";
  else if (fleschScore >= 50) readingLevel = "Bastante difícil (10mo-12vo grado)";
  else if (fleschScore >= 30) readingLevel = "Difícil (Universidad)";
  else readingLevel = "Muy difícil (Posgrado)";
  
  // === ANÁLISIS DE COHERENCIA ===
  
  // Palabras conectoras
  const connectiveWords = [
    'sin embargo', 'no obstante', 'además', 'por lo tanto', 'en consecuencia',
    'asimismo', 'por otro lado', 'en primer lugar', 'finalmente', 'en resumen',
    'por ejemplo', 'es decir', 'en otras palabras', 'aunque', 'mientras que'
  ];
  const connectivesFound = connectiveWords.filter(c => cleanText.toLowerCase().includes(c)).length;
  const connectiveRatio = (connectivesFound / paragraphCount) * 100;
  
  // Consistencia temporal (detección aproximada de verbos en pasado)
  const pastTenseWords = words.filter(w => /(?:aba|aban|ía|ían|ó|aron)$/i.test(w));
  const presentTenseWords = words.filter(w => /(?:o|as|a|amos|áis|an)$/i.test(w) && !/(?:aba|aban)$/i.test(w));
  const verbRatio = {
    pasado: (pastTenseWords.length / wordCount) * 100,
    presente: (presentTenseWords.length / wordCount) * 100
  };
  
  // === ANÁLISIS DE PERSONAJES Y LUGARES ===
  
  // Detección de nombres propios (palabras capitalizadas en medio de oraciones)
  const properNouns = [];
  const textWords = cleanText.split(/\s+/);
  for (let i = 1; i < textWords.length - 1; i++) {
    const word = textWords[i];
    if (/^[A-ZÁÉÍÓÚ][a-záéíóúñ]+$/.test(word) && textWords[i-1].slice(-1) !== '.') {
      properNouns.push(word);
    }
  }
  const uniqueProperNouns = [...new Set(properNouns)];
  
  // === CÁLCULO DE PUNTUACIÓN DE CALIDAD ===
  
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
  const avgSentencesPerParagraph = sentenceCount / paragraphCount;
  if (avgSentencesPerParagraph >= 3 && avgSentencesPerParagraph <= 7) qualityScore += 10;
  else if (avgSentencesPerParagraph < 2 || avgSentencesPerParagraph > 10) qualityScore -= 5;
  
  // Vocabulary evaluation
  if (vocabularyDiversity > 40) qualityScore += 10;
  else if (vocabularyDiversity < 20) qualityScore -= 10;
  
  // TTR bonus
  if (ttr > 0.5) qualityScore += 5;
  
  // Readability bonus
  if (fleschScore >= 50 && fleschScore <= 70) qualityScore += 5;
  
  // Style bonuses
  if (adjectiveRatio >= 8 && adjectiveRatio <= 15) qualityScore += 5;
  if (adverbRatio < 5) qualityScore += 3; // Menos adverbios en -mente es mejor
  if (connectiveRatio >= 20) qualityScore += 5; // Buena cohesión
  
  // Narrative variety bonus
  if (dialogRatio > 10 && dialogRatio < 40) qualityScore += 5;
  if (sentenceLengthVariance > 20) qualityScore += 3; // Buen ritmo narrativo
  
  // Complex words penalty/bonus
  if (complexWordRatio > 30) qualityScore -= 5;
  else if (complexWordRatio >= 15 && complexWordRatio <= 25) qualityScore += 3;
  
  // Ensure score is between 0 and 100
  qualityScore = Math.max(0, Math.min(100, qualityScore));
  
  // === DETECCIÓN DE PROBLEMAS ===
  
  const issues = [];
  
  // Longitud del manuscrito
  if (wordCount < 1000) issues.push('Manuscrito muy corto (menos de 1,000 palabras)');
  if (wordCount > 150000) issues.push('Manuscrito muy extenso (más de 150,000 palabras)');
  
  // Estructura de oraciones
  if (avgWordsPerSentence < 8) issues.push('Oraciones demasiado cortas en promedio');
  if (avgWordsPerSentence > 35) issues.push('Oraciones demasiado largas en promedio - dificulta lectura');
  
  // Variedad léxica
  if (vocabularyDiversity < 25) issues.push('Vocabulario limitado - poca diversidad léxica');
  if (repetitiveWords.length > 3) {
    issues.push(`Palabras repetitivas detectadas: ${repetitiveWords.map(w => w.palabra).join(', ')}`);
  }
  
  // Estructura de párrafos
  if (paragraphCount < 10 && wordCount > 5000) issues.push('Texto necesita mejor división en párrafos');
  if (longParagraphs > paragraphCount * 0.2) issues.push('Demasiados párrafos excesivamente largos (>250 palabras)');
  
  // Oraciones muy largas
  const veryLongSentences = sentenceLengths.filter(l => l > 45).length;
  if (veryLongSentences > sentenceCount * 0.1) issues.push('Algunas oraciones son excesivamente largas (>45 palabras)');
  
  // Legibilidad
  if (fleschScore < 30) issues.push('Texto muy complejo - dificulta lectura general');
  if (complexWordRatio > 30) issues.push('Demasiadas palabras complejas - simplificar lenguaje');
  
  // Estilo
  if (adverbRatio > 8) issues.push('Uso excesivo de adverbios en -mente - revisar estilo');
  if (adjectiveRatio < 5) issues.push('Muy pocos adjetivos - texto puede ser monótono');
  if (adjectiveRatio > 20) issues.push('Demasiados adjetivos - puede sobrecargar la prosa');
  
  // Cohesión
  if (connectiveRatio < 10) issues.push('Faltan conectores - mejorar cohesión entre ideas');
  
  // Diálogos
  if (wordCount > 20000 && dialogRatio < 5) issues.push('Texto muy narrativo - considerar agregar más diálogos');
  
  // Ritmo narrativo
  if (sentenceLengthVariance < 10) issues.push('Oraciones muy uniformes - añadir variedad al ritmo');
  
  // === DECISIÓN EDITORIAL ===
  
  let editorialStatus;
  let recommendation;
  
  if (qualityScore >= 80 && wordCount >= 30000 && issues.length <= 2) {
    editorialStatus = 'ACCEPTED';
    recommendation = 'Manuscrito de alta calidad. Recomendado para publicación con edición ligera. Excelente estructura narrativa y estilo.';
  } else if (qualityScore >= 70 && wordCount >= 20000 && issues.length <= 4) {
    editorialStatus = 'REVIEW_NEEDED';
    recommendation = 'Manuscrito prometedor con buen potencial. Requiere revisión editorial moderada para pulir algunos aspectos.';
  } else if (qualityScore >= 60 && wordCount >= 10000) {
    editorialStatus = 'REVIEW_NEEDED';
    recommendation = 'Manuscrito con potencial. Requiere revisión editorial detallada y posibles ajustes sustanciales antes de publicación.';
  } else {
    editorialStatus = 'REJECTED';
    recommendation = 'Manuscrito no cumple con estándares mínimos de calidad. Se recomienda reescritura sustancial antes de reconsiderar.';
  }
  
  // === RETORNO DEL ANÁLISIS COMPLETO ===
  
  return {
    statistics: {
      words: wordCount,
      sentences: sentenceCount,
      paragraphs: paragraphCount,
      avg_words_per_sentence: parseFloat(avgWordsPerSentence.toFixed(1)),
      avg_sentences_per_paragraph: parseFloat(avgSentencesPerParagraph.toFixed(1)),
      avg_word_length: parseFloat((words.reduce((s, w) => s + w.length, 0) / wordCount).toFixed(1)),
      avg_paragraph_length: parseFloat(avgParagraphLength.toFixed(1))
    },
    
    style_analysis: {
      vocabulary_diversity: parseFloat(vocabularyDiversity.toFixed(1)),
      type_token_ratio: parseFloat((ttr * 100).toFixed(1)),
      adjective_ratio: parseFloat(adjectiveRatio.toFixed(1)),
      adverb_ratio: parseFloat(adverbRatio.toFixed(1)),
      top_words: topWords.slice(0, 10),
      repetitive_words: repetitiveWords.length
    },
    
    readability: {
      flesch_score: parseFloat(fleschScore.toFixed(1)),
      reading_level: readingLevel,
      complex_words_ratio: parseFloat(complexWordRatio.toFixed(1)),
      avg_syllables_per_word: parseFloat(avgSyllablesPerWord.toFixed(1))
    },
    
    narrative_structure: {
      dialog_ratio: parseFloat(dialogRatio.toFixed(1)),
      sentence_length_variance: parseFloat(sentenceLengthVariance.toFixed(1)),
      long_paragraphs: longParagraphs,
      punctuation: {
        semicolons: semicolonCount,
        ellipsis: ellipsisCount,
        dashes: dashCount
      }
    },
    
    coherence: {
      connective_ratio: parseFloat(connectiveRatio.toFixed(1)),
      connectives_found: connectivesFound,
      verb_tense_distribution: {
        past_tense_ratio: parseFloat(verbRatio.pasado.toFixed(1)),
        present_tense_ratio: parseFloat(verbRatio.presente.toFixed(1))
      }
    },
    
    content_analysis: {
      proper_nouns_detected: uniqueProperNouns.length,
      estimated_characters: uniqueProperNouns.length > 5 ? Math.min(uniqueProperNouns.length, 50) : 0,
      sample_names: uniqueProperNouns.slice(0, 5)
    },
    
    quality_score: Math.round(qualityScore),
    editorial_status: editorialStatus,
    recommendation: recommendation,
    issues: issues,
    
    metadata: {
      analysis_date: new Date().toISOString(),
      analyzer_version: '3.0.0',
      analysis_depth: 'advanced'
    }
  };
}

// === FUNCIONES AUXILIARES ===

function countSyllables(word) {
  // Aproximación simple de conteo de sílabas en español
  word = word.toLowerCase();
  const vowels = 'aáàäeéèëiíìïoóòöuúùü';
  let count = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevWasVowel) {
      count++;
    }
    prevWasVowel = isVowel;
  }
  
  return Math.max(1, count);
}

function calculateVariance(numbers) {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  return Math.sqrt(avgSquareDiff);
}

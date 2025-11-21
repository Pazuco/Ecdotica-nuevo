var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.js
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (url.pathname === "/health" || url.pathname === "/") {
      return new Response(JSON.stringify({
        status: "healthy",
        service: "Ecdotica API",
        version: "2.0.0",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (url.pathname === "/api/v1/manuscripts/upload" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file) {
          return new Response(JSON.stringify({
            error: "No file provided"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const content = await file.text();
        const analysis = analyzeManuscript(content);
        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: "Error processing file",
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (url.pathname === "/api/v1/manuscripts/submit" && request.method === "POST") {
      try {
        const data = await request.json();
        const text = data.text || data.content;
        if (!text) {
          return new Response(JSON.stringify({
            error: "No text provided"
          }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
        const analysis = analyzeManuscript(text);
        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: "Error processing text",
          details: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    return new Response("Not Found", { status: 404 });
  }
};
function analyzeManuscript(text) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const wordCount = words.length;
  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length;
  const paragraphs = cleanText.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(paragraphs.length, Math.floor(sentenceCount / 5));
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  const avgSentencesPerParagraph = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / wordCount;
  let qualityScore = 50;
  if (wordCount >= 5e4) qualityScore += 15;
  else if (wordCount >= 3e4) qualityScore += 10;
  else if (wordCount >= 1e4) qualityScore += 5;
  else if (wordCount < 1e3) qualityScore -= 20;
  if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 25) qualityScore += 10;
  else if (avgWordsPerSentence < 10 || avgWordsPerSentence > 30) qualityScore -= 5;
  if (avgSentencesPerParagraph >= 3 && avgSentencesPerParagraph <= 7) qualityScore += 10;
  else if (avgSentencesPerParagraph < 2 || avgSentencesPerParagraph > 10) qualityScore -= 5;
  if (avgWordLength >= 4.5 && avgWordLength <= 6.5) qualityScore += 10;
  else if (avgWordLength < 3 || avgWordLength > 8) qualityScore -= 5;
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const vocabularyDiversity = uniqueWords.size / wordCount * 100;
  if (vocabularyDiversity > 40) qualityScore += 5;
  else if (vocabularyDiversity < 20) qualityScore -= 10;
  qualityScore = Math.max(0, Math.min(100, qualityScore));
  const issues = [];
  if (wordCount < 1e3) issues.push("Manuscrito muy corto (menos de 1,000 palabras)");
  if (wordCount > 15e4) issues.push("Manuscrito muy extenso (m\xE1s de 150,000 palabras)");
  if (avgWordsPerSentence < 8) issues.push("Oraciones demasiado cortas en promedio");
  if (avgWordsPerSentence > 30) issues.push("Oraciones demasiado largas en promedio");
  if (vocabularyDiversity < 25) issues.push("Vocabulario limitado - poca diversidad l\xE9xica");
  if (paragraphCount < 10 && wordCount > 5e3) issues.push("Texto necesita mejor divisi\xF3n en p\xE1rrafos");
  let editorialStatus;
  let recommendation;
  if (qualityScore >= 80 && wordCount >= 3e4 && issues.length === 0) {
    editorialStatus = "ACCEPTED";
    recommendation = "Manuscrito de alta calidad. Recomendado para publicaci\xF3n con edici\xF3n ligera.";
  } else if (qualityScore >= 60 && wordCount >= 1e4) {
    editorialStatus = "REVIEW_NEEDED";
    recommendation = "Manuscrito con potencial. Requiere revisi\xF3n editorial detallada y posibles ajustes.";
  } else {
    editorialStatus = "REJECTED";
    recommendation = "Manuscrito no cumple con est\xE1ndares m\xEDnimos de calidad. Se recomienda reescritura sustancial.";
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
    recommendation,
    issues,
    metadata: {
      analysis_date: (/* @__PURE__ */ new Date()).toISOString(),
      analyzer_version: "2.0.0"
    }
  };
}
__name(analyzeManuscript, "analyzeManuscript");

// ../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-4ncTOU/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-4ncTOU/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map

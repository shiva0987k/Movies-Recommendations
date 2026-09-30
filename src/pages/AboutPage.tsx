import React from 'react';
import { Cpu, Database, Globe, CheckCircle2, Layers } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Title */}
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold block mb-1">
          Technical Overview &bull; Viva / Portfolio Reference
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Movie Recommendation & Discovery System
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2 leading-relaxed">
          An end-to-end full-stack movie platform implementing mathematical content-based machine learning (TF-IDF Vectorization & Cosine Similarity) paired with the TMDB global movie database.
        </p>
      </div>

      {/* 3 Core Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#111724] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Machine Learning</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Content-based filtering using Scikit-Learn. Features (genres, plot synopsis, keywords, cast, and directors) are tokenized, weighted via TF-IDF, and compared using high-dimensional cosine angle metrics.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#111724] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Global Cinema & TMDB</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Live integration with TMDB API covering Indian regional cinema (Telugu, Tamil, Hindi, Malayalam, Kannada, Bengali, etc.), international world cinema, and eras from 1930s classics to contemporary 2020s releases.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#111724] border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">Full-Stack Architecture</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Express/Node.js edge server with in-memory caching and secure proxying, paired with Python Flask microservice executing Scikit-Learn vector calculations, and React SPA client.
          </p>
        </div>
      </div>

      {/* Deep Dive into the ML Algorithm */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#111724] border border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white tracking-tight">
          How the Content-Based Machine Learning Engine Works
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-amber-400">1. Feature Engineering & Token Aggregation</h4>
            <p className="text-slate-400">
              Each movie in the dataset is represented as a composite textual document combining genres, overview, keywords, cast members, and directors. To reflect human recommendation tendencies, directors and genres are given higher frequency weighting:
            </p>
            <code className="block bg-slate-950 px-3 py-2 rounded text-emerald-400 text-xs font-mono">
              Features = (Genre * 2) + Keywords + Plot_Overview + Cast + (Director * 2)
            </code>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-amber-400">2. Term Frequency - Inverse Document Frequency (TF-IDF)</h4>
            <p className="text-slate-400">
              The continuous text is transformed using Scikit-Learn's <code>TfidfVectorizer</code> into a sparse matrix with sublinear term scaling and unigram/bigram n-grams:
            </p>
            <code className="block bg-slate-950 px-3 py-2 rounded text-cyan-400 text-xs font-mono">
              TF-IDF(t, d) = (1 + log(TF)) * log((1 + N) / (1 + DF))
            </code>
            <p className="text-xs text-slate-400">
              Common terms (e.g. "movie", "man", "the") are penalized, while salient distinctive words (e.g. "wormhole", "joker", "mafia", "time-dilation") receive high feature coefficients.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-amber-400">3. Cosine Similarity Measurement</h4>
            <p className="text-slate-400">
              When a target movie vector <i>A</i> is queried, the engine computes its directional cosine angle with every other candidate vector <i>B</i>:
            </p>
            <code className="block bg-slate-950 px-3 py-2 rounded text-amber-400 text-xs font-mono">
              Cosine Similarity(A, B) = (A &bull; B) / (||A|| * ||B||)
            </code>
            <p className="text-xs text-slate-400">
              Values strictly range from 0.0 to 1.0. Candidate titles are ranked in descending order, and the target film itself is excluded.
            </p>
          </div>
        </div>
      </section>

      {/* Viva / Interview Checklist */}
      <section className="p-6 sm:p-8 rounded-2xl bg-[#111724] border border-slate-800">
        <h3 className="text-base font-bold text-white mb-4">
          Key Engineering Highlights for Viva & Project Review
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Real Scikit-Learn TF-IDF vectorizer (no hardcoded or fake recommendations)</span>
          </div>
          <div className="flex items-start gap-2.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Mathematical cosine similarity ranking with percentage match display</span>
          </div>
          <div className="flex items-start gap-2.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>TMDB global movie metadata, poster CDNs, and backdrop artwork</span>
          </div>
          <div className="flex items-start gap-2.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Full coverage across Indian regional cinema (Telugu, Tamil, Hindi, etc.)</span>
          </div>
          <div className="flex items-start gap-2.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Historical era support from 1930s classics to modern 2020s releases</span>
          </div>
          <div className="flex items-start gap-2.5 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>Automated Pytest test suite (6/6 tests passing) verifying data pipeline</span>
          </div>
        </div>
      </section>
    </div>
  );
};

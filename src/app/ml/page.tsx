"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type Category = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  meta: string;
  href: string;
  available: boolean;
};

type Group = { title: string; emoji: string; items: Category[] };

const GROUPS: Group[] = [
  {
    title: "Foundations",
    emoji: "🌱",
    items: [
      { id: "use-cases", icon: "🌍", name: "AI/ML in the Real World", desc: "Face unlock, Netflix, fraud blocking, ChatGPT — where AI already runs your life, mapped to this track's concepts.", meta: "10 sections · see the WHY", href: "/ml/use-cases", available: true },
      { id: "intro", icon: "🤖", name: "What is ML?", desc: "Rules vs learning, the 3 types, fit/predict/score vocabulary — and your first model with zero libraries.", meta: "9 sections · start here", href: "/ml/intro", available: true },
      { id: "data-prep", icon: "🧹", name: "Data Preparation", desc: "Load CSVs, kill NaNs, encode text to numbers, scale features — the 80% of ML nobody tells you about.", meta: "9 sections · pandas hands-on", href: "/ml/data-prep", available: true },
      { id: "train-test", icon: "✂️", name: "Train / Test Split", desc: "Why models must be graded on unseen data — overfitting, leakage, stratify, the cheating demo.", meta: "10 sections · exam analogy", href: "/ml/train-test", available: true },
    ],
  },
  {
    title: "Training Models",
    emoji: "🏋️",
    items: [
      { id: "linear-regression", icon: "📈", name: "Linear Regression", desc: "Your first real model: fit a line, read coef_ and intercept_, predict house prices.", meta: "predict NUMBERS", href: "/ml/linear-regression", available: true },
      { id: "gradient-descent", icon: "⛰️", name: "Training From Scratch", desc: "Gradient descent with pure Python — watch w walk downhill epoch by epoch until loss ≈ 0.", meta: "the engine, exposed ⭐", href: "/ml/gradient-descent", available: true },
      { id: "logistic-regression", icon: "🚦", name: "Logistic Regression", desc: "Despite the name: CLASSIFICATION. Sigmoid, probabilities, decision boundary, predict_proba.", meta: "predict CATEGORIES", href: "/ml/logistic-regression", available: true },
    ],
  },
  {
    title: "More Algorithms",
    emoji: "🧠",
    items: [
      { id: "decision-trees", icon: "🌳", name: "Decision Trees & Forests", desc: "If/else questions learned from data, why one tree overfits, and how 100 trees vote it away.", meta: "trees → random forest", href: "/ml/decision-trees", available: true },
      { id: "clustering", icon: "🫧", name: "Clustering — KMeans", desc: "No labels at all: let the machine discover groups by itself. Centroids, inertia, the elbow method.", meta: "unsupervised", href: "/ml/clustering", available: true },
    ],
  },
  {
    title: "Ship It",
    emoji: "🚀",
    items: [
      { id: "evaluation", icon: "📊", name: "Model Evaluation", desc: "Accuracy lies on imbalanced data — confusion matrix, precision, recall, F1, MAE/MSE/R².", meta: "trust your numbers", href: "/ml/evaluation", available: true },
      { id: "project", icon: "🏁", name: "End-to-End Project", desc: "One complete project: raw CSV → clean → split → train → evaluate → save → predict on new data.", meta: "everything combined ⭐", href: "/ml/project", available: true },
    ],
  },
];

export default function MLPage() {
  return (
    <main className="hero-gradient grid-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-sky-400">
            🏠 Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-300">Machine Learning</span>
        </nav>

        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/80 text-5xl shadow-[0_0_50px_-10px_rgba(168,85,247,0.5)]"
          >
            🤖
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-extrabold tracking-tight sm:text-5xl"
            >
              <span className="animated-gradient-text">Machine Learning</span> — train it yourself
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base"
            >
              From a raw CSV to a trained, evaluated, saved model — every stage as its own card.
              Follow them in order: each page ends where the next one begins, so by the last card
              you&apos;ve trained a model from scratch to end.
            </motion.p>
          </div>
        </div>

        {/* The pipeline strip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass mb-12 flex flex-wrap items-center justify-center gap-2 rounded-2xl p-4 text-[11px] font-semibold text-slate-300"
        >
          {["📦 Raw data", "🧹 Clean", "✂️ Split", "🏋️ Train", "📊 Evaluate", "🔮 Predict"].map(
            (step, i, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1.5">
                  {step}
                </span>
                {i < arr.length - 1 && <span className="text-purple-400">→</span>}
              </span>
            )
          )}
        </motion.div>

        {/* Grouped category cards */}
        {GROUPS.map((group, g) => (
          <section key={group.title} className="mb-12">
            <motion.h2
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + g * 0.08 }}
              className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-400"
            >
              <span className="text-base">{group.emoji}</span>
              {group.title}
              <span className="ml-2 h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
              <span className="text-[10px] font-semibold normal-case tracking-normal text-slate-600">
                {group.items.length} topics
              </span>
            </motion.h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((cat, i) => {
                const card = (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + g * 0.08 + i * 0.04 }}
                    whileHover={cat.available ? { y: -5, scale: 1.02 } : undefined}
                    className={`glass relative flex h-full flex-col rounded-2xl p-5 transition-shadow ${
                      cat.available
                        ? "cursor-pointer border-purple-700/50 hover:shadow-[0_0_50px_-15px_rgba(168,85,247,0.6)]"
                        : "opacity-50"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/80 text-xl">
                        {cat.icon}
                      </span>
                      {cat.available ? (
                        <span className="rounded-full border border-emerald-700/50 bg-emerald-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                          ● Live
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          🔒 Soon
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-100">{cat.name}</h3>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-400">
                      {cat.desc}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                      <span className="text-[11px] text-slate-500">{cat.meta}</span>
                      {cat.available && (
                        <span className="text-sm font-bold text-purple-400">Open →</span>
                      )}
                    </div>
                  </motion.div>
                );
                return cat.available ? (
                  <Link key={cat.id} href={cat.href} className="h-full">
                    {card}
                  </Link>
                ) : (
                  <div key={cat.id} className="h-full">
                    {card}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

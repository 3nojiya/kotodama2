// app/components/modals/HelpModal.tsx
'use client';

import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white text-gray-800 rounded-2xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="bg-amber-50 border-b border-amber-200 p-4 flex justify-between items-center">
          <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
            <span>ℹ️</span> 言霊 使い方ヘルプ
          </h3>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            ✕ 閉じる
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs leading-relaxed overflow-y-auto max-h-[70vh]">
          <div className="space-y-1">
            <h4 className="font-bold text-amber-900 text-xs">🌐 言霊掲示板とは？</h4>
            <p className="text-gray-600">
              多言語自動翻訳とGemini AIによる暴言フィルター機能を搭載したリアルタイム掲示板システムです。3つの異なる表示モードを切り替えて利用できます。
            </p>
          </div>

          <div className="space-y-2 border-t pt-3">
            <h4 className="font-bold text-gray-800 text-xs">🎨 3つの画面モード</h4>
            <ul className="space-y-1.5 text-gray-600 pl-2">
              <li><b className="text-red-700">・chモード:</b> 伝統的なちゃんねる形式のテキスト重視スレッド掲示板です。</li>
              <li><b className="text-emerald-700">・enjoyモード:</b> 見やすいカードUIとトピックベースの掲示板です。</li>
              <li><b className="text-sky-600">・Zモード:</b> リアルタイムのSNSタイムライン形式（X/旧Twitter風）です。</li>
            </ul>
          </div>

          <div className="space-y-2 border-t pt-3">
            <h4 className="font-bold text-gray-800 text-xs">✨ 主な便利機能</h4>
            <ul className="space-y-1.5 text-gray-600 pl-2">
              <li><b>🤖 Gemini翻訳:</b> 投稿の「✨ Gemini翻訳」ボタンを押すと選択中の表示言語にAI翻訳します。</li>
              <li><b>🛡️ 暴言フィルター:</b> 攻撃的な言葉はAIが自動的にマイルドで丁寧な表現に言い換えて投稿します。</li>
              <li><b>🔗 メディア埋め込み:</b> YouTube, ニコニコ, TikTok, WebページのURLを貼るとカードプレビュー表示されます。</li>
              <li><b>⭐ お気に入り:</b> 「推しスタンプ」を押すとマイページやお気に入り一覧からすぐ見返せます。</li>
            </ul>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border-t text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            理解しました
          </button>
        </div>
      </div>
    </div>
  );
}
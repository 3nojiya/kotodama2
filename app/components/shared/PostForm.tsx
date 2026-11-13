// app/components/shared/PostForm.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface PostFormProps {
  theme: 'channel' | 'enjoy' | 'z';
  account: any;
  parentId?: number | null;
  replyingToAuthor?: string | null;
  newThreadTitle?: string;
  setNewThreadTitle?: (val: string) => void;
  newComment: string;
  setNewComment: (val: string) => void;
  newMediaUrl?: string;
  setNewMediaUrl?: (val: string) => void;
  isTargetAll?: boolean;
  setIsTargetAll?: (val: boolean) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  asciiArts?: string[];
  emojis?: string[];
}

export const PostForm: React.FC<PostFormProps> = ({
  theme,
  account,
  parentId,
  replyingToAuthor,
  newThreadTitle = '',
  setNewThreadTitle,
  newComment,
  setNewComment,
  newMediaUrl = '',
  setNewMediaUrl,
  isTargetAll = false,
  setIsTargetAll,
  isSubmitting,
  onSubmit,
  asciiArts: propAsciiArts,
  emojis: propEmojis,
}) => {
  const [activeTab, setActiveTab] = useState<string>('none');
  
  // 動的ロード用のステート
  const [asciiArts, setAsciiArts] = useState<string[]>([]);
  const [emojis, setEmojis] = useState<string[]>([]);

  // 管理画面（localStorage）から最新の絵文字・AAを読み込む
  useEffect(() => {
    // 1. アスキーアートの読み込み
    if (propAsciiArts && propAsciiArts.length > 0) {
      setAsciiArts(propAsciiArts);
    } else {
      const savedAA = localStorage.getItem('kotodama_admin_aa');
      if (savedAA) {
        try {
          const parsed = JSON.parse(savedAA);
          // オブジェクトの配列 [{id, content}, ...] または文字列配列に対応
          setAsciiArts(parsed.map((item: any) => typeof item === 'string' ? item : item.content));
        } catch (e) {
          setAsciiArts(['(・∀・)', '（´・ω・`）', '(ﾟдﾟ)', '(;ﾟДﾟ)']);
        }
      } else {
        setAsciiArts(['(・∀・)', '（´・ω・`）', '(ﾟдﾟ)', '(;ﾟДﾟ)']);
      }
    }

    // 2. 絵文字の読み込み
    if (propEmojis && propEmojis.length > 0) {
      setEmojis(propEmojis);
    } else {
      const savedEmojis = localStorage.getItem('kotodama_admin_emojis');
      if (savedEmojis) {
        try {
          const parsed = JSON.parse(savedEmojis);
          setEmojis(parsed.map((item: any) => typeof item === 'string' ? item : item.content));
        } catch (e) {
          setEmojis(['👍', '❤️', '✨', '🔥', '🎉', '👏']);
        }
      } else {
        setEmojis(['👍', '❤️', '✨', '🔥', '🎉', '👏']);
      }
    }
  }, [propAsciiArts, propEmojis]);

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-3">
      <form onSubmit={onSubmit} className="space-y-2">
        {/* スレッドタイトル */}
        {!parentId && setNewThreadTitle && (
          <input
            type="text"
            value={newThreadTitle}
            onChange={(e) => setNewThreadTitle(e.target.value)}
            placeholder="スレッドタイトル (任意)"
            className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        )}

        {/* 返信先表示 */}
        {replyingToAuthor && (
          <div className="text-xs text-blue-500 px-1 font-medium">
            @{replyingToAuthor} さんに返信中
          </div>
        )}

        {/* 本文入力欄 */}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={parentId ? "返信を入力..." : "いまどうしてる？"}
          rows={2}
          className="w-full p-2.5 text-sm bg-gray-50/50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl resize-y min-h-[60px] focus:outline-none focus:border-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 font-mono"
        />

        {/* 絵文字・AA横スクロール切替窓 */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-1.5">
          {/* ① タブボタン列 */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none select-none">
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'emoji' ? 'none' : 'emoji')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition shrink-0 border ${
                activeTab === 'emoji'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              😊 絵文字 ({emojis.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'aa' ? 'none' : 'aa')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition shrink-0 border ${
                activeTab === 'aa'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
              }`}
            >
              (･∀･) AA・顔文字 ({asciiArts.length})
            </button>

            {activeTab !== 'none' && (
              <button
                type="button"
                onClick={() => setActiveTab('none')}
                className="px-1.5 py-0.5 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-auto shrink-0 cursor-pointer"
              >
                ✕ 閉じる
              </button>
            )}
          </div>

          {/* ② ドロワー横スクロール表示 (管理画面の変更と完全連動) */}
          {activeTab !== 'none' && (
            <div className="mt-1 pt-1 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1 overflow-x-auto py-1 scrollbar-thin select-none">
              {activeTab === 'emoji' && emojis.map((emoji, idx) => (
                <button
                  key={`emoji-${idx}`}
                  type="button"
                  onClick={() => setNewComment(newComment + emoji)}
                  className="p-1 bg-gray-50 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded text-sm transition shrink-0 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}

              {activeTab === 'aa' && asciiArts.map((aa, idx) => (
                <button
                  key={`aa-${idx}`}
                  type="button"
                  onClick={() => setNewComment(newComment + aa)}
                  className="px-1.5 py-0.5 bg-gray-50 dark:bg-black/30 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded text-[11px] font-mono transition shrink-0 cursor-pointer whitespace-nowrap"
                >
                  {aa}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 下部エリア */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
          {setIsTargetAll ? (
            <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200">
              <input
                type="checkbox"
                checked={isTargetAll}
                onChange={(e) => setIsTargetAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              全モードに共通表示する
            </label>
          ) : <div />}

          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-full transition cursor-pointer shadow-sm"
          >
            {isSubmitting ? '送信中...' : '投稿する'}
          </button>
        </div>
      </form>
    </div>
  );
};
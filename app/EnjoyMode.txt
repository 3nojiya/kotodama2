'use client';

import React from 'react';

export default function EnjoyMode(props: any) {
  const {
    categories, enjoyCategory, setEnjoyCategory, mainReplies, replies, account,
    enjoyViewMode, setEnjoyViewMode, enjoySelectedThreadId, setEnjoySelectedThreadId,
    enjoySearchQuery, setEnjoySearchQuery, newThreadTitle, setNewThreadTitle,
    newAuthorName, setNewAuthorName, newEmail, setNewEmail, newComment, setNewComment,
    mediaUrlInput, setMediaUrlInput, mediaTypeInput, setMediaTypeInput, isTargetAll,
    setIsTargetAll, isSubmitting, isBookmarkView, setIsBookmarkView, handlePost,
    handleReplySubmit, handleDelete, handleOpenTranslateModal, renderBookmarkStampButton,
    renderMedia, replyInputs, setReplyInputs
  } = props;

  return (
    <div className="min-h-screen font-sans text-xs bg-[#f4f6f8] text-[#333]">
      <div className="bg-[#007e59] text-white p-3 shadow-md flex justify-between items-center max-w-6xl mx-auto my-2 rounded-xl">
        <span className="font-bold text-base">エンジョイ言霊掲示板 (板: {enjoyCategory})</span>
        <button onClick={() => setEnjoyViewMode('write')} className="bg-amber-400 text-slate-900 font-bold px-3 py-1 rounded">✍️ 新規書き込み</button>
      </div>

      <div className="max-w-6xl mx-auto my-2 grid grid-cols-12 gap-4">
        <div className="col-span-3 bg-white border rounded-xl p-3 space-y-2">
          <h2 className="font-bold border-b pb-1">📁 カテゴリー一覧</h2>
          {categories.map((cat: any) => (
            <button
              key={cat.name || cat}
              onClick={() => { setEnjoyCategory(cat.name || cat); setEnjoyViewMode('list'); setEnjoySelectedThreadId(null); }}
              className={`w-full text-left px-2 py-1 rounded block truncate ${enjoyCategory === (cat.name || cat) ? 'bg-[#007e59] text-white font-bold' : 'hover:bg-gray-100'}`}
            >
              ・{cat.name || cat}
            </button>
          ))}
        </div>

        <div className="col-span-9 bg-white border rounded-xl p-4 space-y-4">
          {enjoyViewMode === 'write' ? (
            <form onSubmit={handlePost} className="space-y-3">
              <h2 className="font-bold text-sm text-[#007e59] border-b pb-2">✍️ 新規スレッド作成 ({enjoyCategory})</h2>
              <input type="text" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} placeholder="タイトル..." className="w-full border p-2 rounded text-xs bg-white text-black" required />
              <textarea rows={5} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="本文..." className="w-full border p-2 rounded text-xs bg-white text-black" required />
              <div className="flex justify-between">
                <button type="button" onClick={() => setEnjoyViewMode('list')} className="px-4 py-2 bg-gray-200 rounded">キャンセル</button>
                <button type="submit" className="px-6 py-2 bg-[#007e59] text-white font-bold rounded">投稿する</button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <h2 className="font-bold border-b pb-2">板: 【{enjoyCategory}】 スレッド一覧 ({mainReplies.length}件)</h2>
              {mainReplies.length === 0 ? (
                <div className="p-8 text-center text-gray-400">（この板にはまだ書き込みがありません）</div>
              ) : (
                mainReplies.map((thread: any) => (
                  <div key={thread.id} onClick={() => { setEnjoySelectedThreadId(thread.id); setEnjoyViewMode('detail'); }} className="p-3 hover:bg-emerald-50 rounded border cursor-pointer flex justify-between">
                    <span className="font-bold text-blue-900">{thread.content.split('\n')[0]}</span>
                    {thread.media_url && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">🎬 メディア付き</span>}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
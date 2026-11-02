'use client';

import React from 'react';

export default function ChannelMode(props: any) {
  const {
    categories, enjoyCategory, setEnjoyCategory, mainReplies, replies, account,
    selectedJaneThreadId, setSelectedJaneThreadId, viewLimitMode, setViewLimitMode,
    channelSearchQuery, setChannelSearchQuery, newThreadTitle, setNewThreadTitle,
    newAuthorName, setNewAuthorName, newEmail, setNewEmail, newComment, setNewComment,
    mediaUrlInput, setMediaUrlInput, mediaTypeInput, setMediaTypeInput, isTargetAll,
    setIsTargetAll, isSubmitting, isBookmarkView, setIsBookmarkView, handlePost,
    handleReplySubmit, handleDelete, handleOpenTranslateModal, renderBookmarkStampButton,
    renderMedia, replyInputs, setReplyInputs, newThreadFormRef
  } = props;

  const selectedThread = replies.find((r: any) => r.id === selectedJaneThreadId) || (mainReplies.length > 0 ? mainReplies[0] : null);
  const selectedThreadChildPosts = selectedThread ? replies.filter((r: any) => r.parent_id === selectedThread.id) : [];

  return (
    <div className="min-h-screen font-sans text-xs bg-[#eef3f8] text-[#000] p-2">
      <div className="max-w-6xl mx-auto my-3 bg-white border border-[#b0b0b0] shadow-sm grid grid-cols-12 min-h-[80vh]">
        <div className="col-span-3 sm:col-span-2 bg-[#f0f4f8] border-r border-[#c0c0c0] p-2 space-y-3 text-[11px]">
          <div className="font-bold text-[#800000] border-b border-[#c0c0c0] pb-1">■ 板・カテゴリー一覧</div>
          <div className="space-y-1 max-h-[75vh] overflow-y-auto pr-1">
            {categories.map((cat: any) => (
              <button
                key={cat.name || cat}
                onClick={() => { setEnjoyCategory(cat.name || cat); setIsBookmarkView(false); setSelectedJaneThreadId(null); }}
                className={`block w-full text-left px-1.5 py-1 rounded cursor-pointer truncate ${enjoyCategory === (cat.name || cat) && !isBookmarkView ? 'bg-[#800000] text-white font-bold' : 'text-blue-900 hover:underline'}`}
              >
                ・{cat.name || cat}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-9 sm:col-span-10 p-4 space-y-6 bg-[#fffbf5]">
          <div className="bg-[#e6e6d8] border border-[#d0d0c0] p-3 text-center rounded flex justify-between items-center">
            <h1 className="text-base font-bold text-[#800000]">【板: {enjoyCategory}】 チャンネル掲示板</h1>
            <input type="text" value={channelSearchQuery} onChange={(e) => setChannelSearchQuery(e.target.value)} placeholder="スレッド検索..." className="outline-none text-xs text-black bg-white border p-1 rounded w-40" />
          </div>

          <div className="border border-[#c0c0c0] bg-white p-3 rounded space-y-2">
            <div className="font-bold text-[#800000] border-b pb-1">▼ スレッド一覧 ({mainReplies.length}件)</div>
            {mainReplies.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">（この板はのっぺらぼうです）</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {mainReplies.map((thread: any, idx: number) => (
                  <div key={thread.id} onClick={() => setSelectedJaneThreadId(thread.id)} className={`cursor-pointer truncate hover:underline flex justify-between ${selectedThread?.id === thread.id ? 'font-bold text-[#800000]' : 'text-blue-900'}`}>
                    <span className="truncate">{idx + 1}: {thread.content.split('\n')[0]}</span>
                    {thread.media_url && <span className="bg-sky-100 text-sky-800 px-1 rounded text-[9px] font-bold">🎬メディア</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedThread && (
            <div className="border border-[#c0c0c0] bg-white p-4 rounded space-y-4">
              <h2 className="text-sm font-bold text-[#800000] border-b pb-1">{selectedThread.content.split('\n')[0]}</h2>
              <div className="p-2 whitespace-pre-wrap text-black">{selectedThread.content}</div>
              {selectedThread.media_url && renderMedia(selectedThread.media_url, selectedThread.media_type || 'image')}

              {selectedThreadChildPosts.map((child: any, idx: number) => (
                <div key={child.id} className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span><b>{idx + 2}</b> {child.author} [{child.date}]</span>
                    <button onClick={(e) => handleOpenTranslateModal(child.content, e)} className="text-indigo-600 font-bold">✨翻訳</button>
                  </div>
                  <div className="whitespace-pre-wrap text-black">{child.content}</div>
                </div>
              ))}

              <div className="bg-[#f9f9f5] border p-3 rounded space-y-2">
                <textarea rows={3} value={replyInputs[selectedThread.id] || ''} onChange={(e) => setReplyInputs({ ...replyInputs, [selectedThread.id]: e.target.value })} placeholder="レスを入力..." className="w-full p-2 border rounded text-xs bg-white text-black" />
                <div className="flex justify-end"><button onClick={() => handleReplySubmit(selectedThread.id, replyInputs[selectedThread.id])} className="px-5 py-1.5 bg-[#800000] text-white font-bold rounded">書き込む</button></div>
              </div>
            </div>
          )}

          <div ref={newThreadFormRef} className="border border-[#c0c0c0] bg-white p-4 rounded space-y-3">
            <div className="font-bold text-[#800000] border-b pb-2">■ 【{enjoyCategory}】 新規スレッド作成</div>
            <form onSubmit={handlePost} className="space-y-3">
              <input type="text" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} placeholder="タイトル..." className="w-full border p-2 rounded text-xs bg-white text-black" required />
              <textarea rows={4} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="本文..." className="w-full border p-2 rounded text-xs bg-white text-black" required />
              <div className="bg-gray-50 border p-3 rounded space-y-2">
                <div className="font-bold text-xs text-[#800000]">🎬 動画・画像URL添付</div>
                <div className="flex gap-2">
                  <select value={mediaTypeInput} onChange={(e) => setMediaTypeInput(e.target.value as any)} className="border p-1 bg-white text-black rounded"><option value="image">画像</option><option value="video">動画</option></select>
                  <input type="text" value={mediaUrlInput} onChange={(e) => setMediaUrlInput(e.target.value)} placeholder="URL..." className="flex-1 border p-1 rounded bg-white text-black" />
                </div>
              </div>
              <div className="flex justify-end"><button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#800000] text-white font-bold rounded">スレッド作成</button></div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
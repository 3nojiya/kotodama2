'use client';

import React from 'react';

export default function ZMode(props: any) {
  const {
    mainReplies, replies, newComment, setNewComment, mediaUrlInput, setMediaUrlInput,
    mediaTypeInput, setMediaTypeInput, isSubmitting, handlePost, handleReplySubmit,
    handleDelete, handleOpenTranslateModal, renderBookmarkStampButton, renderMedia,
    replyInputs, setReplyInputs
  } = props;

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-2xl mx-auto space-y-4">
      <form onSubmit={handlePost} className="border border-gray-800 p-4 rounded-2xl space-y-3 bg-[#0a0a0a]">
        <textarea rows={3} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="いまどうしてる？" className="w-full bg-transparent text-white outline-none resize-none" />
        <div className="flex justify-between items-center border-t border-gray-800 pt-2">
          <input type="text" value={mediaUrlInput} onChange={(e) => setMediaUrlInput(e.target.value)} placeholder="メディアURL..." className="bg-black border border-gray-800 px-2 py-1 rounded text-xs text-white" />
          <button type="submit" disabled={isSubmitting} className="bg-sky-500 text-white font-bold px-4 py-1.5 rounded-full text-xs">ポストする</button>
        </div>
      </form>

      <div className="space-y-4">
        {mainReplies.map((post: any) => (
          <div key={post.id} className="border border-gray-800 p-4 rounded-2xl bg-[#16181c] space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span className="font-bold text-white">{post.author}</span>
              <span>{post.date}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{post.content}</p>
            {post.media_url && renderMedia(post.media_url, post.media_type || 'image')}
            <div className="flex justify-between text-xs text-gray-400 pt-2 border-t border-gray-800">
              <button onClick={(e) => handleOpenTranslateModal(post.content, e)} className="text-indigo-400 font-bold">✨ 翻訳</button>
              {renderBookmarkStampButton(post.id)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
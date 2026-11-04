'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { createClient } from '@/utils/supabase/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Reply, UserAccount, ENJOY_CATEGORIES, LANGUAGES } from './categories';

// ==========================================
// 【SVGコンテンツの安全な描画コンポーネント（Vercel対応強化版）】
// ==========================================
const SafeSvgContent: React.FC<{ content: string; size?: 'thumb' | 'full' }> = ({ content, size = 'full' }) => {
  const safeContent = content || '';

  // HTMLエンティティをデコードしてからチェック（Geminiフィルター対策）
  const decoded = safeContent
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  const hasSvgTag = /<\s*svg[\s>]/i.test(decoded) && /<\s*\/\s*svg\s*>/i.test(decoded);

  if (decoded && hasSvgTag) {
    // SVG部分のみを安全に抽出
    const svgMatch = decoded.match(/<svg[\s\S]*?<\/svg>/i);
    const svgOnly = svgMatch ? svgMatch[0] : decoded;

    if (size === 'thumb') {
      return (
        <div 
          className="svg-container-thumb inline-flex items-center justify-center w-7 h-7 overflow-hidden rounded bg-black/10 shrink-0"
          dangerouslySetInnerHTML={{ __html: svgOnly }} 
        />
      );
    }

    return (
      <div 
        className="svg-container-full w-full overflow-x-auto p-4 bg-black/20 rounded-2xl flex justify-center my-2 max-h-[500px]"
        dangerouslySetInnerHTML={{ __html: svgOnly }} 
      />
    );
  }
  return <span className="whitespace-pre-wrap break-words">{safeContent}</span>;
};

// パレット用のプリセットデータ
const EMOJI_LIST = ['😊', '😂', '🔥', '✨', '👍', '🎉', '💬', '🌟', '🤝', '⛩️'];
const AA_LIST = [
  '(´・ω・`)',
  ' (ﾟ∀ﾟ) ',
  ' ( ﾟдﾟ) ',
  ' (・∀・) ',
  ' ｷﾀ━(ﾟ∀ﾟ)━! ',
  ' ⊂( ﾟдﾟ) ⊃ '
];
const SVG_TEMPLATES = [
  { label: '🌟 星マーク', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#ffb703"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' },
  { label: '🔥 炎マーク', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#e63946"><path d="M12 23c-4.97 0-9-4.03-9-9 0-4.13 2.76-7.53 6.55-8.66.5-.15.95.27.87.79-.34 2.14.36 4.3 1.95 5.82 1.48 1.42 2.21 3.42 1.97 5.45C15.89 16.42 17 14.82 17 13c0-.55.45-1 1-1s1 .45 1 1c0 3.86-3.14 7-7 7z"/></svg>' },
  { label: '🌅 富士山と夕日', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="180" viewBox="0 0 260 180"><defs><linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ff7b00"/><stop offset="100%" stop-color="#ffdd00"/></linearGradient></defs><rect width="260" height="180" fill="url(#sky)" rx="12"/><circle cx="130" cy="90" r="40" fill="#ff4500" opacity="0.8"/><polygon points="20,180 130,60 240,180" fill="#3b3a60"/><polygon points="90,180 130,120 170,180" fill="#ffffff"/><path d="M0 150 Q65 130 130 150 T260 150 L260 180 L0 180 Z" fill="#2d6a4f"/></svg>' }
];

const getIsMockMode = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('app_mode') !== 'live';
};

const fetchGeminiOrMock = async (prompt: string, mockResponse: string): Promise<string> => {
  if (getIsMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockResponse;
  }

  const apiKey = localStorage.getItem('user_gemini_api_key');
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

export default function KotodamaBoard() {
  const supabase = createClient();
  const [theme, setTheme] = useState<'channel' | 'enjoy' | 'z' | 'chat'>('chat');
  const [categories, setCategories] = useState<string[]>([
    'すべて', '雑談', 'プログラミング', '日常', '質問・相談'
  ]);
  const [currentCategory, setCurrentCategory] = useState('すべて');

  const [selectedBoard, setSelectedBoard] = useState('news');
  const [selectedJaneThreadId, setSelectedJaneThreadId] = useState<number | null>(null);
  const [viewLimitMode, setViewLimitMode] = useState<'all' | '50' | '100'>('all');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');

  const [enjoyViewMode, setEnjoyViewMode] = useState<'list' | 'detail' | 'write'>('list');
  const [enjoySelectedThreadId, setEnjoySelectedThreadId] = useState<number | null>(null);

  // 初期状態を未ログイン（ゲスト）に整理
  const [account, setAccount] = useState<UserAccount>({
    isLoggedIn: false,
    name: 'ゲスト',
    handle: '@guest',
    avatarChar: 'ゲ',
  });

  const [isHydrated, setIsHydrated] = useState(false); // 復元完了フラグ（レースコンディション対策）

  // 起動時にLocalStorageからログインセッションを復元
  useEffect(() => {
    const savedAccount = localStorage.getItem('kotodama_user_account');
    if (savedAccount) {
      try {
        const parsed = JSON.parse(savedAccount);
        if (parsed && parsed.isLoggedIn) {
          setAccount(parsed);
        }
      } catch (e) {
        console.error('セッション復元エラー:', e);
      }
    }
    setIsHydrated(true); // 復元完了を記録
  }, []);

  // ログイン状態が変わったらLocalStorageに保存（ハイドレーション完了後のみ走らせる）
  useEffect(() => {
    if (!isHydrated) return; // 初回マウント時に誤ってセッションを削除するのを防止

    if (account.isLoggedIn) {
      localStorage.setItem('kotodama_user_account', JSON.stringify(account));
    } else {
      localStorage.removeItem('kotodama_user_account');
    }
  }, [account, isHydrated]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [editHandleInput, setEditHandleInput] = useState('');

  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [myPageTab, setMyPageTab] = useState<'activity' | 'ranking' | 'settings'>('activity');
  const [rankingType, setRankingType] = useState<'likes' | 'replies'>('likes');
  const [userApiKeyInput, setUserApiKeyInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(true);

  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [translateTargetText, setTranslateTargetText] = useState('');
  const [aiChatOutput, setAiChatOutput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiErrorMsg, setAiErrorMsg] = useState('');

  const [newComment, setNewComment] = useState('');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteTab, setPaletteTab] = useState<'emoji' | 'aa' | 'svg'>('emoji');

  const insertToInput = (text: string, targetId?: number) => {
    if (targetId) {
      setReplyInputs(prev => ({ ...prev, [targetId]: (prev[targetId] || '') + text }));
    } else {
      setNewComment(prev => prev + text);
    }
    setIsPaletteOpen(false);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedLang, setSelectedLang] = useState('ja');
  const [isTargetAll, setIsTargetAll] = useState(true);

  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const newThreadFormRef = useRef<HTMLDivElement>(null);

  const [zTab, setZTab] = useState<'timeline' | 'following' | 'dm'>('timeline');
  const [selectedUserForTimeline, setSelectedUserForTimeline] = useState<string | null>(null);
  const [followingList, setFollowingList] = useState<string[]>([]);
  const [followersList, setFollowersList] = useState<string[]>([]);
  const [directMessages, setDirectMessages] = useState<any[]>([]);
  const [activeDmUser, setActiveDmUser] = useState<string | null>(null);
  const [dmText, setDmText] = useState<string>('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      if (!getIsMockMode()) {
        supabase
          .from('categories')
          .select('name')
          .order('id', { ascending: true })
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              setCategories(data.map((item: { name: string }) => item.name));
            }
          });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [isBookmarkView, setIsBookmarkView] = useState(false);

  const [replyInputs, setReplyInputs] = useState<{ [key: number]: string }>({});
  const [replyBoxOpen, setReplyBoxOpen] = useState<{ [key: number]: boolean }>({});

  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [mediaTypeInput, setMediaTypeInput] = useState<'image' | 'video'>('image');

  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<{ [key: string]: 'like' | 'dislike' }>({});
  const [userReposts, setUserReposts] = useState<{ [key: number]: boolean }>({});
  const [userBookmarks, setUserBookmarks] = useState<{ [key: number]: boolean }>({});

  const [editingReplyKey, setEditingReplyKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [editMediaType, setEditMediaType] = useState<'image' | 'video'>('image');

  const [replies, setReplies] = useState<Reply[]>([]);

  useEffect(() => {
    const savedKey = localStorage.getItem('user_gemini_api_key');
    if (savedKey) {
      setUserApiKeyInput(savedKey);
    }
  }, []);

  useEffect(() => {
    if (account.isLoggedIn && account.handle) {
      fetchFollowData();
      fetchDirectMessages();
    }
  }, [account.handle, account.isLoggedIn]);

  const fetchFollowData = async () => {
    if (!account.isLoggedIn) return;
    const { data: followingData } = await supabase
      .from('follows')
      .select('following_handle')
      .eq('follower_handle', account.handle);

    if (followingData) {
      setFollowingList(followingData.map((f: any) => f.following_handle));
    }

    const { data: followerData } = await supabase
      .from('follows')
      .select('follower_handle')
      .eq('following_handle', account.handle);

    if (followerData) {
      setFollowersList(followerData.map((f: any) => f.follower_handle));
    }
  };

  const handleToggleFollow = async (targetHandle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!account.isLoggedIn || account.handle === targetHandle) return;

    const isFollowing = followingList.includes(targetHandle);

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_handle', account.handle)
        .eq('following_handle', targetHandle);
      setNoticeMessage(`@${targetHandle} のフォローを解除しました`);
    } else {
      await supabase
        .from('follows')
        .insert([{ follower_handle: account.handle, following_handle: targetHandle }]);
      setNoticeMessage(`@${targetHandle} をフォローしました！`);
    }
    setTimeout(() => setNoticeMessage(null), 2000);
    await fetchFollowData();
  };

  const fetchDirectMessages = async () => {
    if (!account.isLoggedIn) return;
    const { data } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_handle.eq.${account.handle},receiver_handle.eq.${account.handle}`)
      .order('created_at', { ascending: true });

    if (data) {
      setDirectMessages(data);
    }
  };

  const handleSendDm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDmUser || !dmText.trim() || !account.isLoggedIn) return;

    const { error } = await supabase.from('direct_messages').insert([
      {
        sender_handle: account.handle,
        receiver_handle: activeDmUser,
        message: dmText.trim(),
      },
    ]);

    if (!error) {
      setDmText('');
      fetchDirectMessages();
    } else {
      alert('DMの送信に失敗しました');
    }
  };

  useEffect(() => {
    (window as any).handleCredentialResponse = (response: any) => {
      try {
        const responsePayload = parseJwt(response.credential);
        const userName = responsePayload.name || 'Googleユーザー';
        const userEmail = responsePayload.email || '';
        const userHandle = `@${userEmail.split('@')[0] || 'google'}`;

        const newAcc = {
          isLoggedIn: true,
          name: userName,
          handle: userHandle,
          avatarChar: userName.slice(0, 1) || 'G',
        };

        setAccount(newAcc);
        setIsAuthModalOpen(false);
        setNoticeMessage(`✔ Googleログイン成功！ようこそ、${userName} さん`);
        setTimeout(() => setNoticeMessage(null), 3000);
      } catch (e) {
        console.error('Googleログインの解析エラー:', e);
        alert('ログイン情報の処理に失敗しました。');
      }
    };

    if ((window as any).google) {
      initializeGoogleButton();
    }
  }, []);

  // 【ログイン改善】モーダルが開いたときに確実にGoogleボタンを描画するロジック
  useEffect(() => {
    if (isAuthModalOpen) {
      const timer = setTimeout(() => {
        initializeGoogleButton();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAuthModalOpen]);

  const initializeGoogleButton = () => {
    try {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: '564187839163-lafaj28q9mk17gmht90lvnc6agdbrfhe.apps.googleusercontent.com',
          callback: (window as any).handleCredentialResponse,
        });

        const btnElement = document.getElementById('google-signin-btn');
        if (btnElement) {
          btnElement.innerHTML = ''; // 重複防止
          (window as any).google.accounts.id.renderButton(
            btnElement,
            { theme: 'outline', size: 'large', width: '280' }
          );
        }
      }
    } catch (err) {
      console.error('Googleボタン描画エラー:', err);
    }
  };

  const parseJwt = (token: string) => {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('user_gemini_api_key', userApiKeyInput.trim());
    setNoticeMessage('🔑 APIキーを端末に保存しました！');
    setTimeout(() => setNoticeMessage(null), 3000);
    setIsMyPageOpen(false);
  };

  const handleOpenTranslateModal = async (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setTranslateTargetText(text);
    setIsTranslateModalOpen(true);
    setAiChatOutput('');
    setAiErrorMsg('');

    setIsAiLoading(true);
    try {
      const prompt = `以下の文章を自然な日本語（または選択された言語コード ${selectedLang}）に翻訳してください。解説は不要で翻訳結果のみを出力してください：\n\n${text}`;
      const mockResult = `[モック翻訳結果] (${selectedLang})\nこれはテスト表示用ダミーテキストです。API制限を消費していません。`;

      const responseText = await fetchGeminiOrMock(prompt, mockResult);
      setAiChatOutput(responseText);
    } catch (err: any) {
      console.error('Gemini API 呼び出しエラー:', err);
      const errString = err?.toString() || '';
      
      if (errString.includes('API_KEY_MISSING')) {
        setAiErrorMsg('⚠️ マイページであなたの Gemini API キーが設定されていません。「マイページ」を開いてキーを登録してください。');
      } else if (errString.includes('503') || errString.includes('high demand') || errString.includes('overloaded')) {
        setAiErrorMsg('⏳ 現在AIサーバーが大変混み合っています。数秒〜数分ほど時間を置いてから再度お試しください。');
      } else {
        setAiErrorMsg('翻訳に失敗しました。APIキーが正しいか確認してください。');
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const fetchPosts = async () => {
    let query = supabase
      .from('posts')
      .select('*')
      .order('id', { ascending: true });

    if (currentCategory && currentCategory !== 'すべて') {
      query = query.eq('category', currentCategory);
    }

    const { data: postsData, error: postsError } = await query;

    if (postsError) {
      console.error('データ取得エラー:', postsError);
      return;
    }

    const { data: repostsData } = await supabase.from('reposts').select('*');
    const allReposts = repostsData || [];
    const myRepostMap: { [key: number]: boolean } = {};
    const countMap: { [key: number]: number } = {};

    allReposts.forEach((r: any) => {
      countMap[r.post_id] = (countMap[r.post_id] || 0) + 1;
      if (r.user_handle === account.handle) {
        myRepostMap[r.post_id] = true;
      }
    });
    setUserReposts(myRepostMap);

    const { data: bookmarksData } = await supabase.from('bookmarks').select('*');
    const allBookmarks = bookmarksData || [];
    const myBookmarkMap: { [key: number]: boolean } = {};

    allBookmarks.forEach((b: any) => {
      if (b.user_handle === account.handle) {
        myBookmarkMap[b.post_id] = true;
      }
    });
    setUserBookmarks(myBookmarkMap);

    if (postsData) {
      const formattedPosts: Reply[] = postsData.map((item: any) => ({
        id: item.id,
        author: item.author || 'ゲスト',
        handle: item.handle || '@guest',
        date: item.date || 'たった今',
        content: item.content || '',
        translatedContent: item.translated_content || undefined,
        targetLang: item.target_lang || undefined,
        mediaUrl: item.media_url || undefined,
        mediaType: item.media_type || undefined,
        lang: item.lang || 'ja',
        likes: item.likes || 0,
        dislikes: item.dislikes || 0,
        targetMode: item.target_mode || 'all',
        category: item.category || '雑談',
        parentId: item.parent_id || null,
        repostCount: countMap[item.id] || 0,
        updatedAt: item.updated_at || undefined,
      }));
      setReplies(formattedPosts);

      if (!selectedJaneThreadId && formattedPosts.length > 0) {
        const firstMain = formattedPosts.find(p => !p.parentId);
        if (firstMain) {
          setSelectedJaneThreadId(firstMain.id);
          setEnjoySelectedThreadId(firstMain.id);
        }
      }
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [account.handle]);

  const handleDelete = async (id: number, postHandle: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!account.isLoggedIn || account.handle !== postHandle) {
      alert("他のユーザーの投稿を削除することはできません。");
      return;
    }

    if (!confirm("本当にこのポストを削除しますか？")) return;

    const { error } = await supabase.from('posts').delete().eq('id', id);

    if (error) {
      console.error("削除エラー:", error.message);
      alert("削除に失敗しました。");
    } else {
      setNoticeMessage('ポストを削除しました。');
      setTimeout(() => setNoticeMessage(null), 3000);
      if (activePostId === id) setActivePostId(null);
      if (selectedJaneThreadId === id) setSelectedJaneThreadId(null);
      if (enjoySelectedThreadId === id) setEnjoySelectedThreadId(null);
      fetchPosts();
    }
  };

  const handleOpenEnjoyThread = async (thread: Reply) => {
    const newViews = (thread.views || 0) + 1;
    await supabase.from('posts').update({ views: newViews }).eq('id', thread.id);
    setReplies(prev => prev.map(r => r.id === thread.id ? { ...r, views: newViews } : r));
    setEnjoySelectedThreadId(thread.id);
    setEnjoyViewMode('detail');
  };

  const handleRepost = async (reply: Reply, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const isAlreadyReposted = userReposts[reply.id];
    const userHandle = account.isLoggedIn ? account.handle : '@guest';

    if (isAlreadyReposted) {
      await supabase.from('reposts').delete().eq('post_id', reply.id).eq('user_handle', userHandle);
      setNoticeMessage('リポストを解除しました。');
      setTimeout(() => setNoticeMessage(null), 2000);
      fetchPosts();
    } else {
      await supabase.from('reposts').insert([{ post_id: reply.id, user_handle: userHandle }]);
      setNoticeMessage('リポストしました！');
      setTimeout(() => setNoticeMessage(null), 2000);
      fetchPosts();
    }
  };

  const handleBookmark = async (replyId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const isBookmarked = userBookmarks[replyId];
    const userHandle = account.isLoggedIn ? account.handle : '@guest';

    setUserBookmarks(prev => ({ ...prev, [replyId]: !isBookmarked }));
    setNoticeMessage(isBookmarked ? 'お気に入りスタンプを外しました' : '🌟 推しスタンプを押しました！');
    setTimeout(() => setNoticeMessage(null), 2000);

    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('post_id', replyId).eq('user_handle', userHandle);
    } else {
      await supabase.from('bookmarks').insert([{ post_id: replyId, user_handle: userHandle }]);
    }
  };

  const handleZVote = async (replyId: number, targetVote: 'like' | 'dislike', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const voteKey = `reply_${replyId}`;
    const currentVote = userVotes[voteKey];

    const targetReply = replies.find(r => r.id === replyId);
    if (!targetReply) return;

    let newLikes = targetReply.likes;
    let newDislikes = targetReply.dislikes;
    let nextVoteState: 'like' | 'dislike' | undefined = targetVote;

    if (currentVote === targetVote) {
      if (targetVote === 'like') newLikes = Math.max(0, newLikes - 1);
      if (targetVote === 'dislike') newDislikes = Math.max(0, newDislikes - 1);
      nextVoteState = undefined;
    } else if (currentVote === 'like' && targetVote === 'dislike') {
      newLikes = Math.max(0, newLikes - 1);
      newDislikes += 1;
    } else if (currentVote === 'dislike' && targetVote === 'like') {
      newDislikes = Math.max(0, newDislikes - 1);
      newLikes += 1;
    } else {
      if (targetVote === 'like') newLikes += 1;
      if (targetVote === 'dislike') newDislikes += 1;
    }

    setUserVotes({ ...userVotes, [voteKey]: nextVoteState } as { [key: string]: 'like' | 'dislike' });
    setReplies(replies.map(r => r.id === replyId ? { ...r, likes: newLikes, dislikes: newDislikes } : r));
    await supabase.from('posts').update({ likes: newLikes, dislikes: newDislikes }).eq('id', replyId);
  };

  const handleShare = async (content: string, author: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const shareData = {
      title: '世界多言語掲示板 言霊',
      text: `【${author}さんのポスト】\n${content}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        console.log('シェアがキャンセルされました');
      }
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
    window.open(twitterUrl, '_blank');
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!account.isLoggedIn) {
      alert('書き込みを行うにはログインが必要です。画面右上の「ログイン」ボタンからログインしてください。');
      setIsAuthModalOpen(true);
      return;
    }

    if ((!newComment.trim() && !mediaUrlInput.trim() && !newThreadTitle.trim()) || isSubmitting) return;

    setIsSubmitting(true);

    try {
      let author = newAuthorName.trim() || account.name;
      let handle = account.handle;

      let dateStr = new Date().toLocaleString();
      if (theme === 'channel') {
        dateStr = `${dateStr} ID:ch${Math.floor(Math.random() * 999)}`;
      } else if (theme === 'enjoy') {
        dateStr = `${new Date().toISOString().slice(0, 10)} ${new Date().toLocaleTimeString().slice(0, 5)} ID:en${Math.floor(Math.random() * 999)}`;
      }

      let contentToPost = newComment;
      if ((theme === 'channel' || theme === 'enjoy') && newThreadTitle.trim()) {
        contentToPost = `【${newThreadTitle.trim()}】\n${newComment}`;
      }

      let finalContent = contentToPost;

      // 【SVG問題の根本解決】SVGが含まれている場合はAIフィルターをバイパスして保護する
      const containsSvgTag = /<\s*svg[\s>]/i.test(contentToPost);

      if (contentToPost.trim() && !containsSvgTag) {
        try {
          const prompt = `以下の投稿テキストをチェックしてください。
暴言、悪口、攻撃的な言葉が含まれている場合は、その意図を汲みつつ、相手を傷つけない『非常にマイルドで優しく丁寧な言葉（またはポジティブな言葉）』に言い換えて、変換後のテキストのみを出力してください。
暴言や悪口が含まれていない場合は、元のテキストをそのまま出力してください。

投稿テキスト:
${contentToPost}`;

          finalContent = await fetchGeminiOrMock(prompt, contentToPost);
        } catch (err) {
          console.error('暴言フィルター処理エラー:', err);
        }
      }

      const targetModeVal = isTargetAll ? 'all' : theme;

      const newPostData = {
        author,
        handle,
        date: theme === 'z' ? 'たった今' : dateStr,
        content: finalContent,
        target_lang: selectedLang,
        media_url: mediaUrlInput.trim() ? mediaUrlInput.trim() : null,
        media_type: mediaUrlInput.trim() ? mediaTypeInput : null,
        lang: selectedLang,
        likes: 0,
        dislikes: 0,
        target_mode: targetModeVal,
        category: currentCategory,
        parent_id: null,
        repost_count: 0,
      };

      const { data, error } = await supabase.from('posts').insert([newPostData]).select();

      if (error) {
        console.error('投稿エラー:', error);
        alert('ポストの送信に失敗しました。');
        return;
      }

      setNewThreadTitle('');
      setNewComment('');
      setMediaUrlInput('');
      setNoticeMessage('✨ 新規スレッドの作成が完了しました！');
      setTimeout(() => setNoticeMessage(null), 3000);

      if (theme === 'channel' && data && data[0]) {
        setSelectedJaneThreadId(data[0].id);
      }
      if (theme === 'enjoy' && data && data[0]) {
        setEnjoySelectedThreadId(data[0].id);
        setEnjoyViewMode('detail');
      }
      fetchPosts();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: number, customText?: string) => {
    if (!account.isLoggedIn) {
      alert('書き込みを行うにはログインが必要です。画面右上の「ログイン」ボタンからログインしてください。');
      setIsAuthModalOpen(true);
      return;
    }

    const replyText = customText || replyInputs[parentId];
    if (!replyText || !replyText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let author = newAuthorName.trim() || account.name;
      let handle = account.handle;

      let dateStr = new Date().toLocaleString();
      if (theme === 'channel' || theme === 'enjoy') {
        const isSage = newEmail.trim().toLowerCase() === 'sage';
        dateStr = `${dateStr} ID:${theme === 'enjoy' ? 'en' : 'ch'}${Math.floor(Math.random() * 999)}${isSage ? ' (sage)' : ''}`;
      }

      let finalReplyText = replyText;

      // 【SVG問題の根本解決】SVGが含まれている場合は返信時のAIフィルターをバイパス
      const containsSvgTag = /<\s*svg[\s>]/i.test(replyText);

      if (!containsSvgTag) {
        try {
          const prompt = `以下の投稿テキストをチェックしてください。
暴言、悪口、攻撃的な言葉が含まれている場合は、その意図を汲みつつ、相手を傷つけない『非常にマイルドで優しく丁寧な言葉（またはポジティブな言葉）』に言い換えて、変換後のテキストのみを出力してください。
暴言や悪口が含まれていない場合は、元のテキストをそのまま出力してください。

投稿テキスト:
${replyText}`;

          finalReplyText = await fetchGeminiOrMock(prompt, replyText);
        } catch (err) {
          console.error('返信フィルターエラー:', err);
        }
      }

      const parentPost = replies.find(r => r.id === parentId);
      const replyCategory = parentPost?.category || currentCategory;

      const newReplyData = {
        author,
        handle,
        date: theme === 'z' ? 'たった今' : dateStr,
        content: finalReplyText,
        target_lang: selectedLang,
        parent_id: parentId,
        media_url: mediaUrlInput.trim() ? mediaUrlInput.trim() : null,
        media_type: mediaUrlInput.trim() ? mediaTypeInput : null,
        target_mode: theme,
        category: replyCategory,
        likes: 0,
        dislikes: 0,
        repost_count: 0,
      };

      const { error } = await supabase.from('posts').insert([newReplyData]);

      if (error) {
        console.error('返信エラー:', error);
        alert('返信の投稿に失敗しました。');
      } else {
        const isSage = newEmail.trim().toLowerCase() === 'sage';
        if (!isSage) {
          await supabase.from('posts').update({ updated_at: new Date().toISOString() }).eq('id', parentId);
        }

        setReplyInputs({ ...replyInputs, [parentId]: '' });
        setReplyBoxOpen({ ...replyBoxOpen, [parentId]: false });
        setMediaUrlInput('');
        setNoticeMessage('書き込みました！');
        setTimeout(() => setNoticeMessage(null), 3000);
        fetchPosts();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaUrlInput(url);
      setMediaTypeInput(file.type.startsWith('video') ? 'video' : 'image');
    }
  };

  const renderMedia = (url: string, type: 'image' | 'video', isEnlarged: boolean = false) => {
    if (type === 'video') {
      let youtubeEmbed: string | null = null;
      let isVerticalYT = false;

      if (url.includes('youtube.com/shorts/') || url.includes('youtu.be/shorts/')) {
        isVerticalYT = true;
        const id = url.split(/\/shorts\//)[1]?.split('?')[0];
        if (id) youtubeEmbed = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes('youtube.com/live/')) {
        const id = url.split('youtube.com/live/')[1]?.split('?')[0];
        if (id) youtubeEmbed = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        if (id) youtubeEmbed = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes('youtube.com/watch')) {
        const id = new URLSearchParams(url.split('?')[1]).get('v');
        if (id) youtubeEmbed = `https://www.youtube.com/embed/${id}`;
      } else if (url.includes('youtube.com/embed/')) {
        const id = url.split('youtube.com/embed/')[1]?.split('?')[0];
        if (id) youtubeEmbed = `https://www.youtube.com/embed/${id}`;
      }

      if (youtubeEmbed) {
        return (
          <div className={`flex justify-center bg-black rounded-2xl overflow-hidden ${isVerticalYT ? '' : 'w-full'}`}>
            <iframe
              src={youtubeEmbed}
              className={isVerticalYT ? (isEnlarged ? 'w-full max-w-md h-[600px] rounded-2xl' : 'w-full max-w-sm h-[480px] rounded-2xl') : (isEnlarged ? 'w-full h-96 md:h-[450px] rounded-2xl' : 'w-full h-64 md:h-80 rounded-2xl')}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube Video"
            />
          </div>
        );
      }

      let nicoId: string | null = null;
      if (url.includes('nicovideo.jp/watch/')) {
        nicoId = url.split('nicovideo.jp/watch/')[1]?.split('?')[0];
      } else if (/^sm\d+$/.test(url.trim())) {
        nicoId = url.trim();
      }

      if (nicoId) {
        return (
          <div className="flex justify-center bg-black rounded-2xl overflow-hidden w-full">
            <iframe
              src={`https://embed.nicovideo.jp/watch/${nicoId}`}
              className={isEnlarged ? 'w-full h-96 md:h-[450px] rounded-2xl' : 'w-full h-64 md:h-80 rounded-2xl'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Niconico Video"
            />
          </div>
        );
      }

      return <video src={url} controls className={isEnlarged ? 'max-h-[500px] object-contain w-full rounded-2xl' : 'max-h-72 object-contain w-full rounded-2xl'} />;
    }
    return <img src={url} alt="メディア" className={isEnlarged ? 'max-h-[600px] object-contain w-full bg-black/20 rounded-2xl' : 'max-h-96 object-cover w-full bg-black/10 rounded-2xl'} />;
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameInput.trim()) return;

    const newAcc = {
      isLoggedIn: true,
      name: editNameInput.trim(),
      handle: editHandleInput.trim().startsWith('@') ? editHandleInput.trim() : `@${editHandleInput.trim()}`,
      avatarChar: editNameInput.trim().slice(0, 1) || '素',
    };

    setAccount(newAcc);
    setIsAuthModalOpen(false);
    setNoticeMessage('アカウント情報を更新しました！');
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  const handleToggleLogin = () => {
    if (account.isLoggedIn) {
      setAccount({ isLoggedIn: false, name: 'ゲスト', handle: '@guest', avatarChar: 'ゲ' });
      localStorage.removeItem('kotodama_user_account');
      setNoticeMessage('ログアウトしました。');
    } else {
      setEditNameInput('');
      setEditHandleInput('');
      setIsAuthModalOpen(true);
    }
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  const handleSaveEdit = async (replyId: number, postHandle: string | undefined, isThreadOrMain: boolean) => {
    if (!account.isLoggedIn || account.handle !== postHandle) {
      alert("他のユーザーの投稿を編集することはできません。");
      return;
    }

    if (!editContent.trim()) return;

    let finalNewContent = editContent;
    if (isThreadOrMain && editTitle.trim()) {
      finalNewContent = `【${editTitle.trim()}】\n${editContent}`;
    }

    const updatedData = {
      content: finalNewContent,
      media_url: editMediaUrl.trim() ? editMediaUrl.trim() : null,
      media_type: editMediaUrl.trim() ? editMediaType : null,
    };

    const { error } = await supabase.from('posts').update(updatedData).eq('id', replyId);

    if (error) {
      console.error("編集更新エラー:", error);
      alert("編集の保存に失敗しました。");
      return;
    }

    setEditingReplyKey(null);
    setEditTitle('');
    setEditContent('');
    setEditMediaUrl('');
    setNoticeMessage('ポストを更新しました。');
    setTimeout(() => setNoticeMessage(null), 3000);
    fetchPosts();
  };

  const mainReplies = replies.filter(r => {
    if (r.parentId) return false;

    if (isBookmarkView) {
      return userBookmarks[r.id] === true;
    }

    const postCategory = r.category || '雑談';
    if (currentCategory !== 'すべて' && postCategory !== currentCategory) {
      return false;
    }

    if (theme === 'channel' && r.targetMode !== 'all' && r.targetMode !== 'channel') return false;
    if (theme === 'enjoy' && r.targetMode !== 'all' && r.targetMode !== 'enjoy') return false;
    if (theme === 'z') {
      if (r.targetMode !== 'all' && r.targetMode !== 'z') return false;
      if (zTab === 'following') {
        const authorHandleWithoutAt = r.handle?.startsWith('@') ? r.handle : `@${r.handle}`;
        const isMyPost = r.handle === account.handle;
        const isFollowingTarget = followingList.includes(r.handle || '') || followingList.includes(authorHandleWithoutAt);
        return isMyPost || isFollowingTarget;
      }
    }
    return true;
  });

  const renderBookmarkStampButton = (replyId: number) => {
    const isBookmarked = userBookmarks[replyId];
    return (
      <button 
        type="button" 
        onClick={(e) => handleBookmark(replyId, e)} 
        className={`cursor-pointer transition px-2.5 py-0.5 rounded-xl font-bold text-[11px] select-none border shadow-xs flex items-center gap-1 whitespace-nowrap shrink-0 ${
          isBookmarked 
            ? 'bg-pink-500 text-white border-pink-400 scale-105' 
            : theme === 'z' ? 'bg-[#16181c] text-gray-400 border-[#2f3336] hover:text-white hover:border-gray-500' : 'bg-gray-100 text-gray-600 border-gray-300 hover:text-black'
        }`}
      >
        {isBookmarked ? '🌟 推し済み' : '⭐ お気に入り'}
      </button>
    );
  };

  const renderLanguageSelector = () => {
    const currentLangObj = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];
    const filteredLanguages = LANGUAGES.filter(l => 
      l.label.toLowerCase().includes(langSearchQuery.toLowerCase()) || 
      l.code.toLowerCase().includes(langSearchQuery.toLowerCase())
    );

    return (
      <div className="relative" ref={langDropdownRef}>
        <button
          type="button"
          onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs cursor-pointer transition ${
            theme === 'z' 
              ? 'bg-[#16181c] border-[#2f3336] text-white hover:border-sky-500' 
              : theme === 'enjoy' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:border-emerald-400' 
              : 'bg-gray-100 border-gray-300 text-gray-800 hover:border-blue-500'
          }`}
        >
          <span className="font-bold">🌍 表示言語:</span>
          <span className={`font-bold ${theme === 'z' ? 'text-sky-400' : theme === 'enjoy' ? 'text-[#007e59]' : 'text-blue-800'}`}>
            {currentLangObj.label}
          </span>
          <span className="text-[10px] opacity-70">▼</span>
        </button>

        {isLangDropdownOpen && (
          <div className="absolute left-0 mt-1 w-64 bg-[#16181c] text-white border border-[#2f3336] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-xs">
            <div className="p-2.5 border-b border-[#2f3336] bg-black/40">
              <input
                type="text"
                placeholder="🔍 言語を検索..."
                value={langSearchQuery}
                onChange={(e) => setLangSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-black border border-[#2f3336] rounded-xl text-white outline-none focus:border-sky-500 text-xs"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-[#2f3336]/40 p-1">
              {filteredLanguages.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-xs">言語が見つかりません</div>
              ) : (
                filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang.code);
                      setIsLangDropdownOpen(false);
                      setLangSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between cursor-pointer ${
                      selectedLang === lang.code 
                        ? 'bg-sky-500 text-white font-bold' 
                        : 'hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    <span>{lang.label}</span>
                    {selectedLang === lang.code && <span>✓</span>}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReplyTree = (parentId: number, depth: number = 1) => {
    const childReplies = replies.filter(r => r.parentId === parentId);
    if (childReplies.length === 0) return null;

    return (
      <div className={`space-y-3 mt-3 pl-4 sm:pl-6 border-l-2 ${theme === 'z' ? 'border-[#2f3336]' : 'border-gray-300'} relative`}>
        {childReplies.map(child => {
          const userVote = userVotes[`reply_${child.id}`];
          const isReposted = userReposts[child.id];
          const isEditing = editingReplyKey === `reply-${child.id}`;
          const isReplyOpen = replyBoxOpen[child.id];
          const isMyPost = account.isLoggedIn && account.handle === child.handle;

          return (
            <div key={child.id} className="pt-2 space-y-2">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${theme === 'z' ? 'bg-gradient-to-tr from-sky-500 to-teal-500 text-white' : theme === 'enjoy' ? 'bg-[#007e59] text-white' : 'bg-red-700 text-white'}`}>
                  {child.author.slice(0, 1)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold hover:underline cursor-pointer text-xs ${theme === 'z' ? 'text-white' : 'text-gray-900'}`}>{child.author}</span>
                      <span className="text-gray-500 text-[10px]">{child.handle || '@user'}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500 text-[10px]">{child.date}</span>
                      {child.mediaUrl && (
                        <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded text-[10px] font-bold">
                          {child.mediaType === 'video' ? '🎬 動画付' : '🖼️ 画像付'}
                        </span>
                      )}
                    </div>
                    {isMyPost && (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {!isEditing && (
                          <button onClick={(e) => { 
                            e.stopPropagation(); 
                            setEditingReplyKey(`reply-${child.id}`); 
                            setEditTitle('');
                            setEditContent(child.content); 
                            setEditMediaUrl(child.mediaUrl || ''); 
                            setEditMediaType(child.mediaType || 'image'); 
                          }} className="text-[11px] text-gray-500 hover:text-red-400 underline cursor-pointer">[修正]</button>
                        )}
                        <button onClick={(e) => handleDelete(child.id, child.handle, e)} className="text-[11px] text-red-500 hover:text-red-400 font-bold underline cursor-pointer">[削除]</button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <textarea rows={2} value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="本文を入力..." className={`w-full p-2 border rounded-xl text-xs outline-none ${theme === 'z' ? 'bg-black text-white border-[#2f3336]' : 'bg-white text-black border-gray-400'}`} />
                      <div className="flex gap-2 items-center">
                        <select value={editMediaType} onChange={(e) => setEditMediaType(e.target.value as 'image' | 'video')} className="p-1 border rounded text-xs bg-white text-black">
                          <option value="image">画像</option>
                          <option value="video">動画</option>
                        </select>
                        <input type="text" value={editMediaUrl} onChange={(e) => setEditMediaUrl(e.target.value)} placeholder="メディアURLを変更..." className="flex-1 p-1 border rounded text-xs bg-white text-black" />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingReplyKey(null)} className="px-2 py-1 bg-gray-300 text-gray-700 rounded-full text-[10px]">キャンセル</button>
                        <button onClick={() => handleSaveEdit(child.id, child.handle, false)} className="px-3 py-1 bg-sky-500 text-white rounded-full text-[10px] font-bold">保存</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`text-xs leading-relaxed ${theme === 'z' ? 'text-[#e7e9ea]' : 'text-gray-800'}`}>
                      <SafeSvgContent content={child.content} size="full" />
                    </div>
                  )}

                  {child.mediaUrl && (
                    <div className="mt-2 rounded-2xl overflow-hidden border border-gray-300 bg-black p-1 flex justify-center">
                      {renderMedia(child.mediaUrl, child.mediaType || 'image')}
                    </div>
                  )}

                  <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 pt-1.5 text-[11px] ${theme === 'z' ? 'text-gray-400' : 'text-gray-600'}`} onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setReplyBoxOpen({ ...replyBoxOpen, [child.id]: !isReplyOpen }); }} className="hover:text-sky-400 flex items-center gap-1 cursor-pointer bg-transparent border-none">
                      💬 返信
                    </button>
                    
                    <button type="button" onClick={(e) => handleOpenTranslateModal(child.content, e)} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none">
                      ✨ Gemini翻訳
                    </button>

                    <button type="button" onClick={(e) => handleRepost(child, e)} className={`flex items-center gap-1 transition cursor-pointer bg-transparent border-none ${isReposted ? 'text-green-500 font-bold' : 'hover:text-green-400'}`}>
                      🔄 {child.repostCount}
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={(e) => handleZVote(child.id, 'like', e)} className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${userVote === 'like' ? 'bg-pink-600 text-white border-pink-500 font-bold' : 'border-gray-600'}`}>
                        ❤ {child.likes}
                      </button>
                      <button type="button" onClick={(e) => handleZVote(child.id, 'dislike', e)} className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${userVote === 'dislike' ? 'bg-sky-600 text-white border-sky-500 font-bold' : 'border-gray-600'}`}>
                        👎 {child.dislikes}
                      </button>
                    </div>

                    {renderBookmarkStampButton(child.id)}
                    
                    <button type="button" onClick={(e) => handleShare(child.content, child.author, e)} className="cursor-pointer transition select-none bg-transparent border-none outline-none hover:text-sky-400 text-gray-400 flex items-center gap-1" title="シェア">
                      📤 シェア
                    </button>
                  </div>

                  {isReplyOpen && (
                    <div className={`pt-2 space-y-2 p-3 rounded-2xl border mt-2 ${theme === 'z' ? 'bg-[#16181c] border-[#2f3336]' : 'bg-gray-50 border-gray-300'}`} onClick={(e) => e.stopPropagation()}>
                      <textarea
                        rows={2}
                        value={replyInputs[child.id] || ''}
                        onChange={(e) => setReplyInputs({ ...replyInputs, [child.id]: e.target.value })}
                        placeholder="返信をポスト..."
                        className={`w-full p-2 border rounded-xl text-xs outline-none resize-none ${theme === 'z' ? 'bg-black text-white border-[#2f3336]' : 'bg-white text-black border-gray-400'}`}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setReplyBoxOpen({ ...replyBoxOpen, [child.id]: false })} className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs cursor-pointer">キャンセル</button>
                        <button 
                          onClick={() => handleReplySubmit(child.id)} 
                          disabled={isSubmitting}
                          className="px-4 py-1 bg-sky-500 text-white font-bold rounded-full text-xs cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? '送信中…' : '返信する'}
                        </button>
                      </div>
                    </div>
                  )}

                  {renderReplyTree(child.id, depth + 1)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const selectedThread = replies.find(r => r.id === selectedJaneThreadId);
  const selectedThreadChildPosts = selectedJaneThreadId ? replies.filter(r => r.parentId === selectedJaneThreadId) : [];

  let displayedPosts = selectedThreadChildPosts;
  if (viewLimitMode === '50') {
    displayedPosts = selectedThreadChildPosts.slice(-50);
  } else if (viewLimitMode === '100') {
    displayedPosts = selectedThreadChildPosts.slice(0, 100);
  }

  const selectedEnjoyThread = replies.find(r => r.id === enjoySelectedThreadId);
  const enjoyThreadChildPosts = enjoySelectedThreadId ? replies.filter(r => r.parentId === enjoySelectedThreadId) : [];

  const scrollToNewThreadForm = () => {
    if (newThreadFormRef.current) {
      newThreadFormRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const rankingPosts = [...replies.filter(r => !r.parentId)].map(post => {
    const childCount = replies.filter(r => r.parentId === post.id).length;
    return {
      ...post,
      replyCount: childCount,
      likesCount: post.likes || 0,
    };
  });

  if (rankingType === 'likes') {
    rankingPosts.sort((a, b) => b.likesCount - a.likesCount);
  } else {
    rankingPosts.sort((a, b) => b.replyCount - a.replyCount);
  }
  const top10Ranking = rankingPosts.slice(0, 10);
  const myPosts = replies.filter(r => r.handle === account.handle);

  return (
    <div className={`min-h-screen font-sans text-xs ${theme === 'z' ? 'bg-black text-[#e7e9ea]' : 'bg-[#efeeef] text-[#333]'}`}>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          initializeGoogleButton();
        }}
      />

      {/* ヘッダーバー */}
      <div className="sticky top-0 z-50 bg-[#16181c] text-white p-2.5 flex justify-between items-center text-xs border-b border-[#2f3336] flex-wrap gap-2 shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wider text-sm">🌐 世界多言語掲示板 言霊 <span className="text-[10px] text-green-400 ml-2">● Supabase 連携</span></span>
          {renderLanguageSelector()}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMyPageOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 h-8 rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1 shrink-0"
          >
            <span>👤 マイページ</span>
          </button>
          
          <button 
            onClick={() => setIsHelpOpen(true)} 
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 h-8 rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1 shrink-0"
          >
            <span>ℹ️ ヘルプ</span>
          </button>
          <div className="flex items-center gap-2 bg-black/50 px-2.5 py-1 rounded-full border border-gray-700">
            <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center font-bold text-[10px] text-white">
              {account.isLoggedIn ? account.avatarChar : 'ゲ'}
            </div>
            <span className="text-gray-300 font-bold">
              {account.isLoggedIn ? account.name : 'ゲスト'}
            </span>
            <button onClick={handleToggleLogin} className="text-[10px] underline text-sky-400 hover:text-sky-300 ml-1 cursor-pointer">
              {account.isLoggedIn ? 'ログアウト' : 'ログイン'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 border-l border-gray-700 pl-3">
            <span className="text-gray-400 hidden sm:inline">モード切替:</span>
            <button onClick={() => setTheme('channel')} className={`px-2.5 py-1 rounded transition cursor-pointer ${theme === 'channel' ? 'bg-red-600 font-bold text-white' : 'bg-gray-800 text-gray-300'}`}>chモード</button>
            <button onClick={() => setTheme('enjoy')} className={`px-2.5 py-1 rounded transition cursor-pointer ${theme === 'enjoy' ? 'bg-[#007e59] font-bold text-white' : 'bg-gray-800 text-gray-300'}`}>enjoyモード</button>
            <button onClick={() => setTheme('z')} className={`px-2.5 py-1 rounded transition cursor-pointer ${theme === 'z' ? 'bg-sky-500 font-bold text-white' : 'bg-gray-800 text-gray-300'}`}>Zモード</button>
            <button onClick={() => setTheme('chat')} className={`px-2.5 py-1 rounded transition cursor-pointer ${theme === 'chat' ? 'bg-[#c1440e] font-bold text-white' : 'bg-gray-800 text-gray-300'}`}>柿色チャット</button>
          </div>
        </div>
      </div>

      <div className={`max-w-6xl mx-auto flex flex-col ${theme === 'z' ? 'border-x border-[#2f3336] bg-black' : 'bg-white border border-gray-400 shadow-sm rounded-lg overflow-hidden my-2'}`}>
        
        {/* マイページ・モーダル */}
        {isMyPageOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                    <span>👤</span> マイページ
                  </h3>
                  <p className="text-gray-600 text-[11px] mt-0.5">ハンドルネーム: <b className="text-black">{account.handle || '@guest'}</b></p>
                </div>
                <button
                  onClick={() => setIsMyPageOpen(false)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  ✕ 閉じる
                </button>
              </div>

              <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 text-xs font-bold">
                <button
                  onClick={() => setMyPageTab('activity')}
                  className={`flex-1 py-2.5 transition cursor-pointer text-center ${
                    myPageTab === 'activity' ? 'border-b-2 border-emerald-700 text-emerald-900 bg-white' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  📝 自分のアクティビティ ({myPosts.length}件)
                </button>
                <button
                  onClick={() => setMyPageTab('ranking')}
                  className={`flex-1 py-2.5 transition cursor-pointer text-center ${
                    myPageTab === 'ranking' ? 'border-b-2 border-emerald-700 text-emerald-900 bg-white' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  🏆 総合ランキング
                </button>
                <button
                  onClick={() => setMyPageTab('settings')}
                  className={`flex-1 py-2.5 transition cursor-pointer text-center ${
                    myPageTab === 'settings' ? 'border-b-2 border-emerald-700 text-emerald-900 bg-white' : 'text-gray-500 hover:text-black'
                  }`}
                >
                  🔑 API設定
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                {myPageTab === 'activity' && (
                  <div className="space-y-3">
                    {myPosts.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 border border-dashed rounded-xl">
                        まだ投稿履歴がありません。
                      </div>
                    ) : (
                      myPosts.map((post) => (
                        <div key={post.id} className="border border-gray-200 p-3 rounded-xl bg-gray-50 space-y-2">
                          <div className="flex justify-between items-center text-gray-500 text-[11px]">
                            <span>カテゴリー: <b>{post.category || '雑談'}</b> | 日時: {post.date}</span>
                            <button
                              onClick={(e) => handleDelete(post.id, post.handle, e)}
                              className="text-red-600 font-bold hover:underline cursor-pointer"
                            >
                              [削除]
                            </button>
                          </div>
                          <div className="text-black text-xs">
                            <SafeSvgContent content={post.content} size="full" />
                          </div>
                          {post.mediaUrl && renderMedia(post.mediaUrl, post.mediaType || 'image')}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {myPageTab === 'ranking' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg border border-gray-200">
                      <span className="font-bold text-gray-700">TOP10ランキング</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setRankingType('likes')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                            rankingType === 'likes' ? 'bg-emerald-700 text-white' : 'bg-white border text-gray-700'
                          }`}
                        >
                          👍 高評価順
                        </button>
                        <button
                          onClick={() => setRankingType('replies')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                            rankingType === 'replies' ? 'bg-emerald-700 text-white' : 'bg-white border text-gray-700'
                          }`}
                        >
                          💬 レス数順
                        </button>
                      </div>
                    </div>

                    {top10Ranking.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 border border-dashed rounded-xl">
                        ランキング対象の投稿がありません。
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {top10Ranking.map((post, idx) => {
                          const titleText = post.content.startsWith('【') && post.content.includes('】\n')
                            ? post.content.split('】\n')[0].replace('【', '')
                            : post.content.split('\n')[0];

                          return (
                            <div
                              key={post.id}
                              className="border border-gray-200 p-2.5 rounded-xl bg-white flex justify-between items-center gap-3"
                            >
                              <div className="flex items-center gap-2.5 truncate flex-1">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 text-[10px] ${
                                  idx === 0 ? 'bg-amber-400 text-white' :
                                  idx === 1 ? 'bg-slate-300 text-gray-800' :
                                  idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {idx + 1}
                                </span>
                                <div className="truncate flex-1">
                                  <div className="font-bold text-blue-900 truncate">
                                    <SafeSvgContent content={titleText} size="thumb" />
                                  </div>
                                  <div className="text-[10px] text-gray-500">
                                    投稿者: {post.author} ({post.category || '雑談'})
                                  </div>
                                </div>
                              </div>
                              <div className="shrink-0 font-bold text-[11px]">
                                {rankingType === 'likes' ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    👍 {post.likesCount}
                                  </span>
                                ) : (
                                  <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                    💬 {post.replyCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {myPageTab === 'settings' && (
                  <form onSubmit={handleSaveApiKey} className="space-y-4 pt-2">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block font-bold text-gray-700">Gemini API キー設定</label>
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="text-[11px] text-indigo-600 hover:underline font-bold cursor-pointer bg-transparent border-none"
                        >
                          {showApiKey ? '🙈 隠す' : '👁️ 表示'}
                        </button>
                      </div>
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={userApiKeyInput}
                        onChange={(e) => setUserApiKeyInput(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50 font-mono text-xs"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                      >
                        キーを保存
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 翻訳モーダル */}
        {isTranslateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white text-gray-800 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-2">
                  <span>🤖</span> Gemini 翻訳アシスタント
                </span>
                <button onClick={() => setIsTranslateModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold cursor-pointer">✕</button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] leading-relaxed shadow-sm">
                    <p className="text-[10px] text-indigo-200 mb-1 font-bold">原文</p>
                    {translateTargetText}
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] leading-relaxed shadow-sm">
                    <p className="text-[10px] text-gray-500 mb-1 font-bold">Gemini 翻訳結果</p>
                    {isAiLoading ? (
                      <div className="flex items-center gap-2 text-gray-500 py-2">
                        <span className="animate-spin">🌀</span> 翻訳中...
                      </div>
                    ) : aiErrorMsg ? (
                      <div className="text-red-600 font-bold space-y-2">
                        <p>{aiErrorMsg}</p>
                      </div>
                    ) : (
                      aiChatOutput
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
                <button
                  onClick={() => setIsTranslateModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ログインモーダル */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#16181c] border border-[#2f3336] text-white p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-xl">
              <h3 className="text-base font-bold border-b border-gray-700 pb-2 text-sky-400">👤 ログイン・アカウント設定</h3>
              
              <div className="space-y-2 py-2 flex flex-col items-center justify-center border-b border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Googleアカウントでかんたんログイン</div>
                <div id="google-signin-btn" className="flex justify-center"></div>
              </div>

              <form onSubmit={handleSaveAccount} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">表示名</label>
                  <input type="text" value={editNameInput} onChange={(e) => setEditNameInput(e.target.value)} placeholder="例: 山田太郎" className="w-full bg-black border border-gray-700 rounded p-2 text-xs text-white outline-none" required />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">ハンドルネーム (@ID)</label>
                  <input type="text" value={editHandleInput} onChange={(e) => setEditHandleInput(e.target.value)} placeholder="例: @yamada" className="w-full bg-black border border-gray-700 rounded p-2 text-xs text-white outline-none" />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsAuthModalOpen(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-xs cursor-pointer">キャンセル</button>
                  <button type="submit" className="px-4 py-1.5 bg-sky-500 font-bold text-white rounded text-xs cursor-pointer">保存</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {noticeMessage && (
          <div className="p-2 bg-sky-600 text-white font-bold text-center animate-pulse">{noticeMessage}</div>
        )}

        {/* =========================================================
            【chモード専用デザイン】
           ========================================================= */}
        {theme === 'channel' && (
          <div className="min-h-screen font-sans text-xs bg-[#eef3f8] text-[#000] p-2">
            <div className="max-w-6xl mx-auto my-3 bg-white border border-[#b0b0b0] shadow-sm grid grid-cols-12 min-h-[80vh]">
              <div className="col-span-3 sm:col-span-2 bg-[#f0f4f8] border-r border-[#c0c0c0] p-2 space-y-3 text-[11px] overflow-y-auto max-h-[80vh]">
                <div className="font-bold text-[#800000] border-b border-[#c0c0c0] pb-1">■ カテゴリー一覧</div>
                <div className="space-y-1">
                  {categories.map((catName) => (
                    <button
                      key={catName}
                      onClick={() => {
                        setCurrentCategory(catName);
                        setIsBookmarkView(false);
                      }}
                      className={`block w-full text-left px-1.5 py-1 rounded cursor-pointer truncate ${currentCategory === catName ? 'bg-[#800000] text-white font-bold' : 'text-blue-900 hover:underline'}`}
                    >
                      ・{catName}
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-300 pt-2 space-y-1">
                  <button onClick={() => setIsBookmarkView(!isBookmarkView)} className="text-blue-900 font-bold hover:underline block cursor-pointer">
                    {isBookmarkView ? '・板に戻る' : '⭐ お気に入り'}
                  </button>
                </div>
              </div>

              <div className="col-span-9 sm:col-span-10 p-4 space-y-6 bg-[#fffbf5]">
                <div className="bg-[#e6e6d8] border border-[#d0d0c0] p-3 text-center rounded flex flex-col md:flex-row justify-between items-center gap-3">
                  <h1 className="text-base font-bold text-[#800000]">言霊・チャンネルモード板 (カテゴリー: {currentCategory})</h1>
                  <div className="flex items-center gap-1 bg-white border border-gray-400 px-2 py-1 rounded">
                    <span className="text-gray-500">🔍</span>
                    <input
                      type="text"
                      value={channelSearchQuery}
                      onChange={(e) => setChannelSearchQuery(e.target.value)}
                      placeholder="スレッドを検索..."
                      className="outline-none text-xs text-black bg-transparent w-40"
                    />
                  </div>
                </div>

                <div className="border border-[#c0c0c0] bg-white p-3 rounded space-y-2">
                  <div className="font-bold text-[#800000] border-b border-gray-200 pb-1 flex justify-between items-center">
                    <span>▼ スレッド一覧 ({mainReplies.filter(r => r.content.toLowerCase().includes(channelSearchQuery.toLowerCase())).length}件)</span>
                    <button onClick={scrollToNewThreadForm} className="text-blue-800 text-[11px] hover:underline cursor-pointer font-bold">[＋新規スレッド作成フォームへ]</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {mainReplies
                      .filter(thread => thread.content.toLowerCase().includes(channelSearchQuery.toLowerCase()))
                      .map((thread, idx) => {
                        const threadCount = replies.filter(r => r.parentId === thread.id).length;
                        const isSelected = selectedJaneThreadId === thread.id;
                        const threadTitleText = thread.content.startsWith('【') && thread.content.includes('】\n') 
                          ? thread.content.split('】\n')[0].replace('【', '') 
                          : thread.content.split('\n')[0];

                        return (
                          <div 
                            key={thread.id} 
                            onClick={() => setSelectedJaneThreadId(thread.id)}
                            className="truncate flex items-center justify-between gap-1 cursor-pointer hover:text-blue-600 transition py-0.5"
                          >
                            <div className="truncate flex items-center gap-1">
                              <span>{idx + 1}:</span>
                              <SafeSvgContent content={threadTitleText} size="thumb" />
                              <span className="text-gray-500 font-normal">({threadCount})</span>
                            </div>
                            {thread.mediaUrl && (
                              <span className="bg-sky-100 text-sky-800 px-1 rounded text-[10px] font-bold shrink-0">
                                {thread.mediaType === 'video' ? '🎬動画' : '🖼️画像'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {selectedThread ? (
                  <div className="border border-[#c0c0c0] bg-white p-4 rounded space-y-4 shadow-sm">
                    <div className="border-b-2 border-[#800000] pb-2 flex justify-between items-center">
                      <h2 className="text-sm font-bold text-[#800000] flex items-center gap-1">
                        <SafeSvgContent content={
                          selectedThread.content.startsWith('【') && selectedThread.content.includes('】\n') 
                            ? selectedThread.content.split('】\n')[0].replace('【', '') 
                            : selectedThread.content.split('\n')[0]
                        } size="thumb" />
                      </h2>
                      <div className="flex items-center gap-2">
                        {account.isLoggedIn && account.handle === selectedThread.handle && editingReplyKey !== `reply-${selectedThread.id}` && (
                          <button onClick={() => { 
                            setEditingReplyKey(`reply-${selectedThread.id}`); 
                            const fullContent = selectedThread.content;
                            if (fullContent.startsWith('【') && fullContent.includes('】\n')) {
                              const parts = fullContent.split('】\n');
                              setEditTitle(parts[0].replace('【', ''));
                              setEditContent(parts[1] || '');
                            } else {
                              setEditTitle('');
                              setEditContent(fullContent);
                            }
                            setEditMediaUrl(selectedThread.mediaUrl || ''); 
                            setEditMediaType(selectedThread.mediaType || 'image'); 
                          }} className="text-blue-800 text-[11px] hover:underline cursor-pointer">[修正]</button>
                        )}
                        {account.isLoggedIn && account.handle === selectedThread.handle && (
                          <button onClick={(e) => handleDelete(selectedThread.id, selectedThread.handle, e)} className="text-red-600 text-[11px] hover:underline cursor-pointer">[削除]</button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4 font-mono text-xs leading-relaxed">
                      <div className="border-b border-gray-200 pb-3 space-y-1">
                        <div className="text-gray-700 flex justify-between flex-wrap gap-1">
                          <div className="flex items-center gap-1">
                            <b className="text-green-800">1</b> 名前：<b className="text-blue-950">{selectedThread.author}</b> [{selectedThread.date}]
                            {selectedThread.mediaUrl && (
                              <span className="bg-sky-100 text-sky-800 px-1 rounded text-[10px] font-bold ml-2">
                                {selectedThread.mediaType === 'video' ? '🎬 動画付き' : '🖼️ 画像付き'}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 font-sans items-center">
                            <button onClick={(e) => handleOpenTranslateModal(selectedThread.content, e)} className="text-indigo-600 font-bold hover:underline cursor-pointer">✨翻訳</button>
                            {renderBookmarkStampButton(selectedThread.id)}
                          </div>
                        </div>

                        {editingReplyKey === `reply-${selectedThread.id}` ? (
                          <div className="space-y-2 pt-2 bg-gray-50 p-2 rounded border border-gray-300 font-sans">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">タイトル:</label>
                              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="スレッドタイトル..." className="w-full p-1.5 border rounded text-xs text-black bg-white" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-0.5">本文:</label>
                              <textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="本文..." className="w-full p-2 border rounded text-xs text-black bg-white" />
                            </div>
                            <div className="flex gap-2 items-center">
                              <select value={editMediaType} onChange={(e) => setEditMediaType(e.target.value as 'image' | 'video')} className="p-1 border rounded text-xs bg-white text-black">
                                <option value="image">画像</option>
                                <option value="video">動画</option>
                              </select>
                              <input type="text" value={editMediaUrl} onChange={(e) => setEditMediaUrl(e.target.value)} placeholder="メディアURLを変更..." className="flex-1 p-1 border rounded text-xs bg-white text-black" />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingReplyKey(null)} className="px-2 py-1 bg-gray-200 rounded cursor-pointer">キャンセル</button>
                              <button onClick={() => handleSaveEdit(selectedThread.id, selectedThread.handle, true)} className="px-2 py-1 bg-blue-800 text-white rounded font-bold cursor-pointer">修正を保存</button>
                            </div>
                          </div>
                        ) : (
                          <div className="pl-2 pt-1 text-black font-sans">
                            <SafeSvgContent content={
                              selectedThread.content.startsWith('【') && selectedThread.content.includes('】\n')
                                ? selectedThread.content.split('】\n')[1]
                                : selectedThread.content
                            } size="full" />
                          </div>
                        )}

                        {selectedThread.mediaUrl && renderMedia(selectedThread.mediaUrl, selectedThread.mediaType || 'image')}
                      </div>

                      {displayedPosts.map((child, idx) => {
                        const isChildEditing = editingReplyKey === `reply-${child.id}`;
                        const isMyChildPost = account.isLoggedIn && account.handle === child.handle;
                        return (
                          <div key={child.id} className="border-b border-gray-200 pb-3 space-y-1">
                            <div className="text-gray-700 flex justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-1">
                                <b className="text-green-800">{idx + 2}</b> 名前：<b className="text-gray-900">{child.author}</b> [{child.date}]
                                {child.mediaUrl && (
                                  <span className="bg-sky-100 text-sky-800 px-1 rounded text-[10px] font-bold ml-2">
                                    {child.mediaType === 'video' ? '🎬 動画付' : '🖼️ 画像付'}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 font-sans items-center">
                                {isMyChildPost && !isChildEditing && (
                                  <button onClick={() => { 
                                    setEditingReplyKey(`reply-${child.id}`); 
                                    setEditTitle('');
                                    setEditContent(child.content); 
                                    setEditMediaUrl(child.mediaUrl || ''); 
                                    setEditMediaType(child.mediaType || 'image'); 
                                  }} className="text-blue-800 hover:underline cursor-pointer">[修正]</button>
                                )}
                                <button onClick={(e) => handleOpenTranslateModal(child.content, e)} className="text-indigo-600 font-bold hover:underline cursor-pointer">✨翻訳</button>
                                {isMyChildPost && (
                                  <button onClick={(e) => handleDelete(child.id, child.handle, e)} className="text-red-500 hover:underline cursor-pointer">[削除]</button>
                                )}
                                {renderBookmarkStampButton(child.id)}
                              </div>
                            </div>

                            {isChildEditing ? (
                              <div className="space-y-2 pt-2 bg-gray-50 p-2 rounded border border-gray-300 font-sans">
                                <textarea rows={2} value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="返信内容..." className="w-full p-2 border rounded text-xs text-black bg-white" />
                                <div className="flex gap-2 items-center">
                                  <select value={editMediaType} onChange={(e) => setEditMediaType(e.target.value as 'image' | 'video')} className="p-1 border rounded text-xs bg-white text-black">
                                    <option value="image">画像</option>
                                    <option value="video">動画</option>
                                  </select>
                                  <input type="text" value={editMediaUrl} onChange={(e) => setEditMediaUrl(e.target.value)} placeholder="メディアURLを変更..." className="flex-1 p-1 border rounded text-xs bg-white text-black" />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => setEditingReplyKey(null)} className="px-2 py-1 bg-gray-200 rounded cursor-pointer">キャンセル</button>
                                  <button onClick={() => handleSaveEdit(child.id, child.handle, false)} className="px-2 py-1 bg-blue-800 text-white rounded font-bold cursor-pointer">修正を保存</button>
                                </div>
                              </div>
                            ) : (
                              <div className="pl-2 pt-1 text-black font-sans">
                                <SafeSvgContent content={child.content} size="full" />
                              </div>
                            )}

                            {child.mediaUrl && renderMedia(child.mediaUrl, child.mediaType || 'image')}
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-[#f5f5ea] border border-[#d0d0c0] p-2 text-center text-xs space-x-3 text-blue-900 font-bold rounded">
                      <button onClick={() => setViewLimitMode('all')} className={`hover:underline cursor-pointer ${viewLimitMode === 'all' ? 'text-red-700 underline font-black' : ''}`}>全部読む</button>
                      <span>|</span>
                      <button onClick={() => setViewLimitMode('50')} className={`hover:underline cursor-pointer ${viewLimitMode === '50' ? 'text-red-700 underline font-black' : ''}`}>最新50</button>
                      <span>|</span>
                      <button onClick={() => setViewLimitMode('100')} className={`hover:underline cursor-pointer ${viewLimitMode === '100' ? 'text-red-700 underline font-black' : ''}`}>1-100</button>
                      <span>|</span>
                      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:underline cursor-pointer">板のトップ</button>
                      <span>|</span>
                      <button onClick={fetchPosts} className="hover:underline cursor-pointer">🔄 リロード</button>
                    </div>

                    <div className="bg-[#f9f9f5] border border-[#dcdcd0] p-3 rounded space-y-2">
                      <div className="font-bold text-[#800000] text-xs">■ レスを書き込む (E-mailに sage と入れると下げられます)</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <label className="flex items-center gap-1">
                          <span>名前:</span>
                          <input type="text" value={newAuthorName} onChange={(e) => setNewAuthorName(e.target.value)} placeholder={account.isLoggedIn ? account.name : "名無しさん"} className="border border-gray-400 px-2 py-0.5 bg-white text-black rounded w-36 outline-none" />
                        </label>
                        <label className="flex items-center gap-1">
                          <span>E-mail:</span>
                          <input type="text" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="sage" className="border border-gray-400 px-2 py-0.5 bg-white text-black rounded w-36 outline-none" />
                        </label>
                      </div>

                      <textarea
                        rows={3}
                        value={replyInputs[selectedThread.id] || ''}
                        onChange={(e) => setReplyInputs({ ...replyInputs, [selectedThread.id]: e.target.value })}
                        placeholder="レス内容を入力..."
                        className="w-full p-2 border border-gray-400 rounded text-xs bg-white text-black outline-none resize-y"
                      />

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleReplySubmit(selectedThread.id, replyInputs[selectedThread.id])}
                          disabled={isSubmitting}
                          className="px-5 py-1.5 bg-[#800000] hover:bg-[#a00000] text-white font-bold rounded text-xs cursor-pointer shadow disabled:opacity-50"
                        >
                          {isSubmitting ? '送信中…' : '書き込む'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 border border-dashed rounded">スレッドを選択すると表示されます</div>
                )}

                {/* 新規スレッド作成フォーム */}
                <div ref={newThreadFormRef} className="border border-[#c0c0c0] bg-white p-4 rounded space-y-3 shadow-sm">
                  <div className="font-bold text-[#800000] border-b pb-2 text-sm">■ 新規スレッド作成フォーム (カテゴリー: {currentCategory})</div>
                  <form onSubmit={handlePost} className="space-y-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">スレッドタイトル:</label>
                      <input 
                        type="text" 
                        value={newThreadTitle} 
                        onChange={(e) => setNewThreadTitle(e.target.value)} 
                        placeholder="スレッドのタイトルを入力..." 
                        className="w-full border border-gray-400 p-2 rounded text-xs outline-none bg-white text-black" 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">名前:</label>
                        <input type="text" value={newAuthorName} onChange={(e) => setNewAuthorName(e.target.value)} placeholder={account.isLoggedIn ? account.name : "名無しさん"} className="w-full border border-gray-400 p-2 rounded text-xs outline-none bg-white text-black" />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">E-mail (sage等):</label>
                        <input type="text" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="sage" className="w-full border border-gray-400 p-2 rounded text-xs outline-none bg-white text-black" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">本文 (1レス目):</label>
                      <textarea 
                        rows={4} 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)} 
                        placeholder="スレッドの最初の内容を入力..." 
                        className="w-full border border-gray-400 p-2 rounded text-xs outline-none bg-white text-black" 
                        required 
                      />
                    </div>

                    <div className="bg-gray-50 border border-gray-300 p-3 rounded space-y-2">
                      <div className="font-bold text-xs text-[#800000]">🎬 画像・動画リンク添付</div>
                      <div className="flex gap-2 items-center">
                        <select 
                          value={mediaTypeInput} 
                          onChange={(e) => setMediaTypeInput(e.target.value as 'image' | 'video')} 
                          className="border border-gray-400 rounded p-1 bg-white text-black text-xs"
                        >
                          <option value="image">画像URL</option>
                          <option value="video">動画URL (YouTube/ニコ動/MP4)</option>
                        </select>
                        <input 
                          type="text" 
                          value={mediaUrlInput} 
                          onChange={(e) => setMediaUrlInput(e.target.value)} 
                          placeholder="画像や動画のURLを入力..." 
                          className="flex-1 border border-gray-400 rounded p-1.5 bg-white text-black text-xs outline-none" 
                        />
                      </div>
                      {mediaUrlInput && (
                        <div className="relative rounded overflow-hidden border border-gray-300 max-h-48 bg-black flex justify-center mt-2">
                          <button type="button" onClick={() => setMediaUrlInput('')} className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold cursor-pointer z-10">✕</button>
                          {renderMedia(mediaUrlInput, mediaTypeInput)}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={isTargetAll} onChange={(e) => setIsTargetAll(e.target.checked)} />
                        <span>全モード共通で表示する</span>
                      </label>
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-[#800000] hover:bg-[#a00000] text-white font-bold rounded text-xs cursor-pointer shadow disabled:opacity-50"
                      >
                        {isSubmitting ? '作成中…' : '新規スレッドを作成する'}
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            【enjoyモード専用デザイン】
           ========================================================= */}
        {theme === 'enjoy' && (
          <div className="bg-[#fbfbfb] flex-1 text-gray-800">
            <div className="border-b border-gray-300 px-6 py-3 flex items-center justify-between bg-white shadow-xs gap-4">
              <div 
                onClick={() => { 
                  setCurrentCategory('すべて'); 
                  setEnjoyViewMode('list'); 
                  setIsBookmarkView(false); 
                }} 
                className="text-3xl font-black italic tracking-wider text-[#1b5e20] cursor-pointer hover:opacity-80 transition select-none shrink-0 pr-4"
                title="ホーム（すべてのトピック）に戻る"
              >
                enjoy mode
              </div>

              <div className="flex-1 max-w-md mx-auto">
                <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-full focus-within:border-emerald-600 focus-within:bg-white transition shadow-inner">
                  <span className="text-gray-400 text-xs pl-1">🔍</span>
                  <input
                    type="text"
                    placeholder="トピックを検索..."
                    className="w-full outline-none text-xs text-black bg-transparent"
                  />
                </div>
              </div>

              <div className="shrink-0">
                <button 
                  onClick={() => setIsBookmarkView(!isBookmarkView)} 
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    isBookmarkView 
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm' 
                      : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  ⭐ {isBookmarkView ? '掲示板に戻る' : 'お気に入り一覧'}
                </button>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[600px] bg-white">
              <div className="col-span-3 border-r border-gray-300 p-3 bg-[#f8faf9] space-y-3 text-xs overflow-y-auto max-h-[75vh]">
                <div className="font-bold text-[#1b5e20] border-b border-gray-300 pb-1">カテゴリー一覧</div>
                <div className="space-y-1">
                  {categories.map((catName) => (
                    <button
                      key={catName}
                      onClick={() => { 
                        setCurrentCategory(catName); 
                        setEnjoyViewMode('list'); 
                        setIsBookmarkView(false);
                      }}
                      className={`w-full text-left px-2 py-1 rounded flex justify-between items-center transition cursor-pointer truncate ${currentCategory === catName ? 'bg-[#1b5e20] text-white font-bold' : 'hover:bg-emerald-50 text-gray-700'}`}
                    >
                      <span className="truncate">・{catName}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-9 p-6 space-y-4 bg-white">
                {enjoyViewMode === 'write' ? (
                  <div className="border border-gray-300 bg-[#fdfdf9] p-5 rounded-lg space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h2 className="font-bold text-sm text-[#1b5e20]">◆ 新規トピック・書き込み (カテゴリー: {currentCategory})</h2>
                      <button onClick={() => setEnjoyViewMode('list')} className="text-gray-600 hover:underline cursor-pointer">← 一覧に戻る</button>
                    </div>

                    <form onSubmit={handlePost} className="space-y-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">タイトル (最大80文字):</label>
                        <input type="text" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} placeholder="トピックのタイトル..." className="w-full border border-gray-300 p-2 rounded text-xs outline-none bg-white text-black" required />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">お名前:</label>
                          <input type="text" value={newAuthorName} onChange={(e) => setNewAuthorName(e.target.value)} placeholder={account.isLoggedIn ? account.name : "名無しさん"} className="w-full border border-gray-300 p-2 rounded text-xs outline-none bg-white text-black" />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">E-mail (sage等):</label>
                          <input type="text" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="sage" className="w-full border border-gray-300 p-2 rounded text-xs outline-none bg-white text-black" />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-gray-700 mb-1">本文 (AIマイルドフィルター自動適用):</label>
                        <textarea rows={6} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="本文を入力してください..." className="w-full border border-gray-300 p-2 rounded text-xs outline-none bg-white text-black" required />
                      </div>

                      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg space-y-2">
                        <div className="font-bold text-xs text-[#1b5e20]">🎬 画像・動画リンク添付</div>
                        <div className="flex gap-2 items-center">
                          <select value={mediaTypeInput} onChange={(e) => setMediaTypeInput(e.target.value as 'image' | 'video')} className="border rounded p-1 bg-white text-black">
                            <option value="image">画像URL</option>
                            <option value="video">動画URL</option>
                          </select>
                          <input type="text" value={mediaUrlInput} onChange={(e) => setMediaUrlInput(e.target.value)} placeholder="YouTubeや画像URL..." className="flex-1 border rounded p-1 bg-white text-black outline-none" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input type="checkbox" checked={isTargetAll} onChange={(e) => setIsTargetAll(e.target.checked)} />
                          <span>全モード共通で表示する</span>
                        </label>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#1b5e20] hover:bg-[#144517] text-white font-bold rounded cursor-pointer shadow disabled:opacity-50">
                          {isSubmitting ? '送信中…' : '書き込み実行'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : enjoyViewMode === 'detail' && selectedEnjoyThread ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <button onClick={() => setEnjoyViewMode('list')} className="text-[#1b5e20] underline cursor-pointer font-bold">← トピック一覧に戻る</button>
                      {account.isLoggedIn && account.handle === selectedEnjoyThread.handle && (
                        <div className="flex items-center gap-3">
                          {editingReplyKey !== `reply-${selectedEnjoyThread.id}` && (
                            <button onClick={() => { 
                              setEditingReplyKey(`reply-${selectedEnjoyThread.id}`); 
                              const fullContent = selectedEnjoyThread.content;
                              if (fullContent.startsWith('【') && fullContent.includes('】\n')) {
                                const parts = fullContent.split('】\n');
                                setEditTitle(parts[0].replace('【', ''));
                                setEditContent(parts[1] || '');
                              } else {
                                setEditTitle('');
                                setEditContent(fullContent);
                              }
                              setEditMediaUrl(selectedEnjoyThread.mediaUrl || ''); 
                              setEditMediaType(selectedEnjoyThread.mediaType || 'image'); 
                            }} className="text-blue-700 font-bold hover:underline text-xs cursor-pointer">[✏️ 編集]</button>
                          )}
                          <button onClick={(e) => handleDelete(selectedEnjoyThread.id, selectedEnjoyThread.handle, e)} className="text-red-600 font-bold hover:underline cursor-pointer">[トピック削除]</button>
                        </div>
                      )}
                    </div>

                    <div className="border border-gray-300 bg-white p-5 rounded-lg space-y-4 shadow-xs">
                      <h2 className="text-base font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
                        <div className="flex items-center">
                          {(() => {
                            const tText = selectedEnjoyThread.content.startsWith('【') && selectedEnjoyThread.content.includes('】\n') 
                              ? selectedEnjoyThread.content.split('】\n')[0].replace('【', '') 
                              : selectedEnjoyThread.content.split('\n')[0];
                            return <SafeSvgContent content={tText} size="thumb" />;
                          })()}
                        </div>
                        {selectedEnjoyThread.mediaUrl && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold">
                            {selectedEnjoyThread.mediaType === 'video' ? '🎬 動画付き' : '🖼️ 画像付き'}
                          </span>
                        )}
                      </h2>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-gray-500 text-[11px] bg-gray-50 p-2 rounded">
                          <div>
                            <span className="font-bold text-red-700 mr-2">🟥</span>
                            <span>投稿者: <b>{selectedEnjoyThread.author}</b> ({selectedEnjoyThread.date})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => handleOpenTranslateModal(selectedEnjoyThread.content, e)} className="text-indigo-600 font-bold hover:underline cursor-pointer">✨ 翻訳</button>
                            {renderBookmarkStampButton(selectedEnjoyThread.id)}
                          </div>
                        </div>

                        {editingReplyKey === `reply-${selectedEnjoyThread.id}` ? (
                          <div className="space-y-2 p-3 bg-gray-50 border rounded">
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">タイトル:</label>
                              <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full p-2 border rounded text-xs bg-white text-black" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-700 mb-1">本文:</label>
                              <textarea rows={4} value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full p-2 border rounded text-xs bg-white text-black" />
                            </div>
                            <div className="flex gap-2 items-center">
                              <select value={editMediaType} onChange={(e) => setEditMediaType(e.target.value as 'image' | 'video')} className="border rounded p-1 text-xs bg-white text-black">
                                <option value="image">画像</option>
                                <option value="video">動画</option>
                              </select>
                              <input type="text" value={editMediaUrl} onChange={(e) => setEditMediaUrl(e.target.value)} placeholder="メディアURL..." className="flex-1 border rounded p-1 text-xs bg-white text-black" />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingReplyKey(null)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs cursor-pointer">キャンセル</button>
                              <button onClick={() => handleSaveEdit(selectedEnjoyThread.id, selectedEnjoyThread.handle, true)} className="px-4 py-1 bg-emerald-700 text-white font-bold rounded text-xs cursor-pointer">編集を保存</button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed text-gray-800">
                            <SafeSvgContent content={
                              selectedEnjoyThread.content.startsWith('【') && selectedEnjoyThread.content.includes('】\n')
                                ? selectedEnjoyThread.content.split('】\n')[1]
                                : selectedEnjoyThread.content
                            } size="full" />
                          </div>
                        )}

                        {selectedEnjoyThread.mediaUrl && (
                          <div className="p-2 bg-black rounded flex justify-center">
                            {renderMedia(selectedEnjoyThread.mediaUrl, selectedEnjoyThread.mediaType || 'image', true)}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t">
                          <button onClick={(e) => handleZVote(selectedEnjoyThread.id, 'like', e)} className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded text-[11px] hover:bg-emerald-100 cursor-pointer">👍 推薦投票 ({selectedEnjoyThread.likes})</button>
                          <button onClick={(e) => handleZVote(selectedEnjoyThread.id, 'dislike', e)} className="px-3 py-1 bg-red-50 border border-red-300 text-red-800 rounded text-[11px] hover:bg-red-100 cursor-pointer">👎 反対投票 ({selectedEnjoyThread.dislikes})</button>
                        </div>
                      </div>

                      <div className="pt-4 border-t space-y-3">
                        <div className="font-bold text-gray-700 text-xs">▼ レス一覧</div>
                        {enjoyThreadChildPosts.map((child, idx) => {
                          const isMyEnjoyChild = account.isLoggedIn && account.handle === child.handle;
                          return (
                            <div key={child.id} className="border border-gray-200 p-3 rounded bg-gray-50 space-y-1">
                              <div className="flex justify-between text-[11px] text-gray-500">
                                <span className="flex items-center gap-1">
                                  <b>{idx + 1}.</b> {child.author} [{child.date}]
                                  {child.mediaUrl && (
                                    <span className="bg-emerald-100 text-emerald-800 px-1 rounded text-[10px] font-bold ml-1">
                                      {child.mediaType === 'video' ? '🎬動画' : '🖼️画像'}
                                    </span>
                                  )}
                                </span>
                                <div className="flex gap-2 items-center">
                                  <button onClick={(e) => handleOpenTranslateModal(child.content, e)} className="text-indigo-600 font-bold cursor-pointer">✨翻訳</button>
                                  {isMyEnjoyChild && (
                                    <button onClick={(e) => handleDelete(child.id, child.handle, e)} className="text-red-500 cursor-pointer">[削除]</button>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-800">
                                <SafeSvgContent content={child.content} size="full" />
                              </div>
                              {child.mediaUrl && renderMedia(child.mediaUrl, child.mediaType || 'image')}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t space-y-2">
                        <textarea
                          rows={3}
                          value={replyInputs[selectedEnjoyThread.id] || ''}
                          onChange={(e) => setReplyInputs({ ...replyInputs, [selectedEnjoyThread.id]: e.target.value })}
                          placeholder="コメントを入力..."
                          className="w-full p-2 border rounded text-xs bg-white text-black outline-none"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleReplySubmit(selectedEnjoyThread.id, replyInputs[selectedEnjoyThread.id])}
                            disabled={isSubmitting}
                            className="px-5 py-1.5 bg-[#1b5e20] text-white font-bold rounded text-xs cursor-pointer shadow disabled:opacity-50"
                          >
                            {isSubmitting ? '送信中…' : 'REPLY (返信)'}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-gray-500 text-[11px]">enjoyモード &gt; <b>{currentCategory}</b></div>
                    
                    <div className="flex justify-between items-center border-b pb-2">
                      <h2 className="text-sm font-bold text-gray-800">
                        {isBookmarkView ? '🌟 お気に入りスタンプ一覧' : `カテゴリー: ${currentCategory}`}
                      </h2>
                      <button 
                        onClick={() => setEnjoyViewMode('write')} 
                        className="bg-[#1b5e20] hover:bg-[#144517] text-white font-bold px-4 py-1.5 rounded text-xs cursor-pointer shadow"
                      >
                        ✏️ 書き込み
                      </button>
                    </div>

                    <div className="border border-gray-300 rounded overflow-hidden text-xs">
                      <div className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700 grid grid-cols-12 p-2">
                        <div className="col-span-7">タイトル</div>
                        <div className="col-span-3">投稿者</div>
                        <div className="col-span-2 text-center">閲覧数 / 推薦</div>
                      </div>

                      <div className="divide-y divide-gray-200 bg-white">
                        {mainReplies.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">トピックがありません。「書き込み」ボタンから投稿してください。</div>
                        ) : (
                          mainReplies.map((reply) => {
                            const totalReplies = replies.filter(r => r.parentId === reply.id).length;
                            const titleText = reply.content.startsWith('【') && reply.content.includes('】\n')
                              ? reply.content.split('】\n')[0].replace('【', '')
                              : reply.content.split('\n')[0];

                            return (
                              <div 
                                key={reply.id} 
                                onClick={() => handleOpenEnjoyThread(reply)}
                                className="grid grid-cols-12 p-2.5 items-center hover:bg-emerald-50/40 transition cursor-pointer"
                              >
                                <div className="col-span-7 flex items-center justify-between truncate pr-2 font-bold text-blue-900">
                                  <div className="flex items-center gap-2 truncate">
                                    <span>🟥</span>
                                    <div className="truncate flex items-center">
                                      <SafeSvgContent content={titleText} size="thumb" />
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-normal">({totalReplies})</span>
                                  </div>
                                  {reply.mediaUrl && (
                                    <span className="bg-emerald-100 text-emerald-800 px-1 rounded text-[10px] font-bold shrink-0">
                                      {reply.mediaType === 'video' ? '🎬動画' : '🖼️画像'}
                                    </span>
                                  )}
                                </div>
                                <div className="col-span-3 text-gray-600 truncate">{reply.author}</div>
                                <div className="col-span-2 text-center text-gray-500 text-[11px]">
                                  <span className="font-semibold text-gray-700">{reply.views || 0}</span> / {reply.likes || 0}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <div className="flex gap-1 text-xs">
                        <button className="px-2.5 py-1 bg-[#1b5e20] text-white font-bold rounded">1</button>
                      </div>
                      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded text-xs cursor-pointer shadow">
                        Back to Top
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            【Zモード専用デザイン】
           ========================================================= */}
        {theme === 'z' && (
          <div className="grid grid-cols-1 md:grid-cols-4 flex-1">
            <div className="border-r border-[#2f3336] p-4 hidden md:flex flex-col justify-between space-y-4 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">
              <div className="space-y-3">
                <div className="text-xl font-black px-3 text-sky-400 tracking-wider">𝕫 言霊</div>
                <nav className="space-y-1 text-sm font-bold">
                  <div onClick={() => { 
                    setCurrentCategory('すべて');
                    setActivePostId(null);         
                    setIsBookmarkView(false);      
                    setZTab('timeline');           
                    setSelectedUserForTimeline(null); 
                  }} className="p-3 hover:bg-[#181818] rounded-full cursor-pointer flex items-center gap-4 text-white transition">
                    🏠 ホーム
                  </div>
                  <div onClick={() => { 
                    setActivePostId(null); 
                    setZTab('timeline'); 
                    setIsBookmarkView(true); 
                  }} className={`p-3 rounded-full cursor-pointer flex items-center gap-4 transition ${isBookmarkView ? 'bg-pink-500/20 text-pink-400 font-extrabold' : 'hover:bg-[#181818] text-gray-300'}`}>
                    <span>⭐</span> お気に入りスタンプ一覧
                  </div>
                  <div onClick={() => { setActivePostId(null); setIsBookmarkView(false); setZTab('following'); }} className={`p-3 rounded-full cursor-pointer flex items-center gap-4 transition ${zTab === 'following' ? 'bg-sky-500/20 text-sky-400 font-extrabold' : 'hover:bg-[#181818] text-gray-300'}`}>
                    <span>👥</span> フォロー中 ({followingList.length})
                  </div>
                  <div onClick={() => { setActivePostId(null); setIsBookmarkView(false); setZTab('dm'); }} className={`p-3 rounded-full cursor-pointer flex items-center gap-4 transition ${zTab === 'dm' ? 'bg-sky-500/20 text-sky-400 font-extrabold' : 'hover:bg-[#181818] text-gray-300'}`}>
                    <span>✉️</span> メッセージ (DM)
                  </div>
                </nav>

                <div className="pt-4 border-t border-[#2f3336]">
                  <div className="text-xs font-bold text-gray-400 px-3 mb-2">📁 カテゴリー</div>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {categories.map((catName) => (
                      <div
                        key={catName}
                        onClick={() => {
                          setCurrentCategory(catName);
                          setSelectedUserForTimeline(null);
                          setIsBookmarkView(false);
                          setZTab('timeline');
                        }}
                        className={`px-3 py-2 rounded-xl cursor-pointer text-xs font-bold transition flex justify-between items-center truncate ${
                          currentCategory === catName ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-gray-300 hover:bg-[#181818]'
                        }`}
                      >
                        <span className="truncate"># {catName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-tr from-sky-500/20 to-teal-500/20 border border-sky-500/30 p-3.5 rounded-2xl space-y-2">
                <div className="font-bold text-xs text-sky-400 flex items-center gap-1.5">
                  <span>🤖</span> AI暴言フィルター搭載
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  攻撃的な表現は、自動的に優しく丁寧な言葉にマイルド変換されて投稿されます。
                </p>
              </div>
            </div>

            <div className="md:col-span-2 border-r border-[#2f3336] min-h-screen">
              <div className="border-b border-[#2f3336] flex font-bold text-xs bg-black/80 backdrop-blur sticky top-12 z-10 justify-around items-center px-2 py-3">
                <button
                  onClick={() => { setZTab('timeline'); setActivePostId(null); setIsBookmarkView(false); }}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer ${zTab === 'timeline' && !isBookmarkView ? 'bg-sky-500 text-white font-black' : 'text-gray-400 hover:text-white'}`}
                >
                  🌐 タイムライン
                </button>
                <button
                  onClick={() => { setZTab('following'); setActivePostId(null); setIsBookmarkView(false); }}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer ${zTab === 'following' ? 'bg-sky-500 text-white font-black' : 'text-gray-400 hover:text-white'}`}
                >
                  👥 フォロー中 ({followingList.length})
                </button>
                <button
                  onClick={() => { setZTab('dm'); setActivePostId(null); setIsBookmarkView(false); }}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer ${zTab === 'dm' ? 'bg-sky-500 text-white font-black' : 'text-gray-400 hover:text-white'}`}
                >
                  ✉️ DM
                </button>
              </div>

              {zTab === 'dm' && !activePostId && !isBookmarkView ? (
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-black min-h-[500px]">
                  <div className="border-r border-[#2f3336] pr-3 space-y-2">
                    <h3 className="text-xs font-bold text-gray-400 mb-2">チャット相手を選ぶ</h3>
                    {!account.isLoggedIn ? (
                      <div className="text-gray-500 text-xs p-4 text-center">ログインするとDMが使えます</div>
                    ) : (
                      <div className="space-y-1">
                        {Array.from(new Set(replies.map((p) => p.handle)))
                          .filter((h) => h && h !== account.handle && h !== '@guest')
                          .map((targetUser) => (
                            <button
                              key={targetUser}
                              onClick={() => setActiveDmUser(targetUser)}
                              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-between ${
                                activeDmUser === targetUser
                                  ? 'bg-sky-500/20 border border-sky-500 text-white font-bold'
                                  : 'hover:bg-[#16181c] text-gray-300 border border-transparent'
                              }`}
                            >
                              <span>{targetUser}</span>
                              <span className="text-[10px] text-sky-400">💬</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2 flex flex-col justify-between bg-[#0a0a0a] border border-[#2f3336] rounded-2xl p-4 min-h-[450px]">
                    {activeDmUser ? (
                      <>
                        <div className="border-b border-[#2f3336] pb-2 mb-3 flex items-center justify-between">
                          <span className="font-bold text-sky-400 text-xs">{activeDmUser} とのDM</span>
                          <button onClick={fetchDirectMessages} className="text-xs text-gray-400 hover:text-white cursor-pointer">🔄 更新</button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 max-h-[350px] pr-2 mb-3">
                          {directMessages
                            .filter(
                              (dm) =>
                                (dm.sender_handle === account.handle && dm.receiver_handle === activeDmUser) ||
                                (dm.sender_handle === activeDmUser && dm.receiver_handle === account.handle)
                            )
                            .map((dm) => {
                              const isMe = dm.sender_handle === account.handle;
                              return (
                                <div key={dm.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                  <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${isMe ? 'bg-sky-500 text-white rounded-br-none font-medium' : 'bg-[#16181c] text-gray-200 border border-[#2f3336] rounded-bl-none'}`}>
                                    <SafeSvgContent content={dm.message} size="full" />
                                  </div>
                                  <span className="text-[9px] text-gray-500 mt-0.5">
                                    {new Date(dm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              );
                            })}
                        </div>

                        <form onSubmit={handleSendDm} className="flex gap-2 pt-2 border-t border-[#2f3336]">
                          <input
                            type="text"
                            value={dmText}
                            onChange={(e) => setDmText(e.target.value)}
                            placeholder={`${activeDmUser}へメッセージ送信...`}
                            className="flex-1 bg-black border border-[#2f3336] px-3 py-2 rounded-xl text-xs text-white outline-none focus:border-sky-500"
                          />
                          <button type="submit" className="bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                            送信
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                        左側のリストからメッセージを送る相手を選んでください
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {!activePostId && zTab !== 'following' && !isBookmarkView && (
                    <div className="p-4 border-b border-[#2f3336] space-y-3 bg-[#0a0a0a]">
                      <form onSubmit={handlePost} className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center font-bold text-white shrink-0">
                            {account.isLoggedIn ? account.avatarChar : 'ゲ'}
                          </div>
                          <div className="flex-1 space-y-2">
                            <textarea
                              rows={3}
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              placeholder={`いまどうしてる？ [カテゴリー: ${currentCategory}]`}
                              className="w-full bg-transparent text-white placeholder-gray-50 text-sm outline-none resize-none"
                            />

                            <div className="flex flex-wrap gap-2 items-center bg-[#16181c] p-2.5 rounded-xl border border-[#2f3336]">
                              <select
                                value={mediaTypeInput}
                                onChange={(e) => setMediaTypeInput(e.target.value as 'image' | 'video')}
                                className="bg-black text-gray-300 border border-[#2f3336] rounded-lg px-2 py-1 text-xs outline-none"
                              >
                                <option value="image">画像URL</option>
                                <option value="video">動画URL (YouTube/ニコ動/MP4)</option>
                              </select>
                              <input
                                type="text"
                                value={mediaUrlInput}
                                onChange={(e) => setMediaUrlInput(e.target.value)}
                                placeholder="画像または動画のURLを入力..."
                                className="flex-1 bg-black text-white text-xs border border-[#2f3336] rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-500"
                              />
                            </div>

                            {mediaUrlInput && (
                              <div className="relative rounded-2xl overflow-hidden border border-[#2f3336] max-h-60 bg-black flex justify-center">
                                <button type="button" onClick={() => setMediaUrlInput('')} className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold cursor-pointer z-10">✕</button>
                                {renderMedia(mediaUrlInput, mediaTypeInput)}
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-2 border-t border-[#2f3336]">
                              <div className="flex items-center gap-3">
                                <label className="cursor-pointer text-sky-400 hover:text-sky-300 transition flex items-center gap-1 text-xs font-bold">
                                  <span>📁 ファイル選択</span>
                                  <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                                </label>

                                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                                  <input type="checkbox" checked={isTargetAll} onChange={(e) => setIsTargetAll(e.target.checked)} className="rounded bg-black border-gray-700" />
                                  <span>全モード共通</span>
                                </label>
                              </div>

                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-full text-xs transition cursor-pointer shadow-sm disabled:opacity-50"
                              >
                                {isSubmitting ? 'ポスト中…' : 'ポストする'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="divide-y divide-[#2f3336]">
                    {activePostId ? (
                      (() => {
                        const post = replies.find(r => r.id === activePostId);
                        if (!post) return <div className="p-8 text-center text-gray-500">ポストが見つかりません</div>;

                        const userVote = userVotes[`reply_${post.id}`];
                        const isReposted = userReposts[post.id];
                        const isEditing = editingReplyKey === `reply-${post.id}`;
                        const isReplyOpen = replyBoxOpen[post.id];
                        const isMyPost = account.isLoggedIn && account.handle === post.handle;
                        const isFollowingTarget = followingList.includes(post.handle || '');

                        return (
                          <div className="p-4 space-y-4 bg-black/40">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center font-bold text-white shrink-0">
                                {post.author.slice(0, 1)}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-sm">{post.author}</span>
                                        {account.isLoggedIn && !isMyPost && (
                                          <button
                                            onClick={(e) => handleToggleFollow(post.handle || '', e)}
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition cursor-pointer ${
                                              isFollowingTarget
                                                ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-red-950 hover:text-red-400'
                                                : 'bg-sky-500 text-white hover:bg-sky-400'
                                            }`}
                                          >
                                            {isFollowingTarget ? 'フォロー中' : '＋ フォロー'}
                                          </button>
                                        )}
                                      </div>
                                      <span className="text-gray-500 text-xs">{post.handle || '@user'} · {post.date}</span>
                                    </div>
                                    {post.mediaUrl && (
                                      <span className="bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded text-xs font-bold">
                                        {post.mediaType === 'video' ? '🎬 動画付き' : '🖼️ 画像付き'}
                                      </span>
                                    )}
                                  </div>
                                  {isMyPost && (
                                    <div className="flex items-center gap-2">
                                      {!isEditing && (
                                        <button onClick={() => { 
                                          setEditingReplyKey(`reply-${post.id}`); 
                                          setEditTitle('');
                                          setEditContent(post.content); 
                                          setEditMediaUrl(post.mediaUrl || ''); 
                                          setEditMediaType(post.mediaType || 'image'); 
                                        }} className="text-xs text-gray-500 hover:text-sky-400 underline cursor-pointer">[修正]</button>
                                      )}
                                      <button onClick={(e) => handleDelete(post.id, post.handle, e)} className="text-xs text-red-500 hover:text-red-400 font-bold underline cursor-pointer">[削除]</button>
                                    </div>
                                  )}
                                </div>

                                {isEditing ? (
                                  <div className="space-y-2 pt-2">
                                    <textarea rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="本文..." className="w-full bg-black text-white border border-[#2f3336] p-2.5 rounded-xl text-xs outline-none" />
                                    <div className="flex gap-2 items-center">
                                      <select value={editMediaType} onChange={(e) => setEditMediaType(e.target.value as 'image' | 'video')} className="bg-black text-white border border-[#2f3336] p-1 rounded text-xs">
                                        <option value="image">画像</option>
                                        <option value="video">動画</option>
                                      </select>
                                      <input type="text" value={editMediaUrl} onChange={(e) => setEditMediaUrl(e.target.value)} placeholder="メディアURL..." className="flex-1 bg-black text-white border border-[#2f3336] p-1 rounded text-xs" />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => setEditingReplyKey(null)} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs cursor-pointer">キャンセル</button>
                                      <button onClick={() => handleSaveEdit(post.id, post.handle, false)} className="px-4 py-1 bg-sky-500 text-white font-bold rounded-full text-xs cursor-pointer">保存</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-[#e7e9ea] pt-1">
                                    <SafeSvgContent content={post.content} size="full" />
                                  </div>
                                )}

                                {post.mediaUrl && (
                                  <div className="mt-3 rounded-2xl overflow-hidden border border-[#2f3336] bg-black p-1 flex justify-center">
                                    {renderMedia(post.mediaUrl, post.mediaType || 'image', true)}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-gray-400 text-xs border-t border-[#2f3336]/60 mt-3">
                                  <button type="button" onClick={() => setReplyBoxOpen({ ...replyBoxOpen, [post.id]: !isReplyOpen })} className="hover:text-sky-400 flex items-center gap-1 cursor-pointer bg-transparent border-none">
                                    💬 返信
                                  </button>
                                  
                                  <button type="button" onClick={(e) => handleOpenTranslateModal(post.content, e)} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none">
                                    ✨ 翻訳
                                  </button>

                                  <button type="button" onClick={(e) => handleRepost(post, e)} className={`flex items-center gap-1 transition cursor-pointer bg-transparent border-none ${isReposted ? 'text-green-500 font-bold' : 'hover:text-green-400'}`}>
                                    🔄 {post.repostCount}
                                  </button>
                                  
                                  <div className="flex items-center gap-1">
                                    <button type="button" onClick={(e) => handleZVote(post.id, 'like', e)} className={`px-2 py-0.5 rounded-lg border transition cursor-pointer ${userVote === 'like' ? 'bg-pink-600 text-white border-pink-500 font-bold' : 'border-gray-600'}`}>
                                      ❤ {post.likes}
                                    </button>
                                    <button type="button" onClick={(e) => handleZVote(post.id, 'dislike', e)} className={`px-2 py-0.5 rounded-lg border transition cursor-pointer ${userVote === 'dislike' ? 'bg-sky-600 text-white border-sky-500 font-bold' : 'border-gray-600'}`}>
                                      👎 {post.dislikes}
                                    </button>
                                  </div>

                                  {renderBookmarkStampButton(post.id)}

                                  <button type="button" onClick={(e) => handleShare(post.content, post.author, e)} className="cursor-pointer transition select-none bg-transparent border-none outline-none hover:text-sky-400 text-gray-400 flex items-center gap-1" title="シェア">
                                    📤 シェア
                                  </button>
                                </div>

                                {isReplyOpen && (
                                  <div className="pt-3 space-y-2 bg-[#16181c] p-3 rounded-2xl border border-[#2f3336] mt-3">
                                    <textarea
                                      rows={2}
                                      value={replyInputs[post.id] || ''}
                                      onChange={(e) => setReplyInputs({ ...replyInputs, [post.id]: e.target.value })}
                                      placeholder="返信をポスト..."
                                      className="w-full bg-black text-white border border-[#2f3336] p-2.5 rounded-xl text-xs outline-none resize-none"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => setReplyBoxOpen({ ...replyBoxOpen, [post.id]: false })} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs cursor-pointer">キャンセル</button>
                                      <button 
                                        onClick={() => handleReplySubmit(post.id)} 
                                        disabled={isSubmitting}
                                        className="px-4 py-1 bg-sky-500 text-white font-bold rounded-full text-xs cursor-pointer disabled:opacity-50"
                                      >
                                        {isSubmitting ? '送信中…' : '返信する'}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {renderReplyTree(post.id)}

                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : zTab === 'following' ? (
                      <div className="p-4 space-y-3">
                        {selectedUserForTimeline ? (
                          <div>
                            <button
                              onClick={() => setSelectedUserForTimeline(null)}
                              className="mb-3 px-3 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 transition cursor-pointer"
                            >
                              ← フォロー一覧に戻る
                            </button>
                            <p className="font-bold text-sm mb-4 text-white">@{selectedUserForTimeline.replace(/^@+/, '')} さんの投稿</p>

                            <div className="divide-y divide-[#2f3336]">
                              {replies
                                .filter((r) => {
                                  const postHandle = r.handle ? r.handle.replace(/^@+/, '') : '';
                                  const targetHandle = selectedUserForTimeline.replace(/^@+/, '');
                                  return postHandle === targetHandle;
                                })
                                .length === 0 ? (
                                  <p className="text-center text-gray-500 text-xs py-4">投稿がありません</p>
                                ) : (
                                  replies
                                    .filter((r) => {
                                      const postHandle = r.handle ? r.handle.replace(/^@+/, '') : '';
                                      const targetHandle = selectedUserForTimeline.replace(/^@+/, '');
                                      return postHandle === targetHandle;
                                    })
                                    .map((reply) => (
                                      <div
                                        key={reply.id}
                                        onClick={() => setActivePostId(reply.id)}
                                        className="p-4 hover:bg-[#16181c]/30 transition space-y-2 cursor-pointer border-b border-[#2f3336]"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center font-bold text-white shrink-0">
                                            {reply.author.slice(0, 1)}
                                          </div>
                                          <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold text-white text-xs">{reply.author}</span>
                                              <span className="text-gray-500 text-[11px]">@{reply.handle?.replace(/^@+/, '')}</span>
                                              <span className="text-gray-500">·</span>
                                              <span className="text-gray-500 text-[11px]">{reply.date}</span>
                                            </div>
                                            <div className="text-sm text-[#e7e9ea]">
                                              <SafeSvgContent content={reply.content} size="full" />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-base mb-3 text-center text-white">フォロー中のアカウント</p>
                            {followingList.length === 0 ? (
                              <p className="text-center text-gray-500 text-xs">フォロー中のユーザーはいません</p>
                            ) : (
                              followingList.map((rawHandle) => {
                                const cleanHandle = rawHandle ? rawHandle.replace(/^@+/, '') : '';
                                if (!cleanHandle) return null;

                                return (
                                  <div
                                    key={cleanHandle}
                                    onClick={() => setSelectedUserForTimeline(cleanHandle)}
                                    className="p-3 border border-gray-700 rounded-lg cursor-pointer flex items-center justify-between hover:bg-gray-800 transition mb-2"
                                  >
                                    <span className="font-bold text-white">@{cleanHandle}</span>
                                    <span className="text-xs text-blue-400">投稿を見る →</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    ) : mainReplies.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">「{currentCategory}」カテゴリーにはまだポストがありません。</div>
                    ) : (
                      mainReplies
                        .filter((r) => {
                          const postHandle = r.handle ? r.handle.replace(/^@+/, '') : '';
                          const selectedHandle = selectedUserForTimeline ? selectedUserForTimeline.replace(/^@+/, '') : '';
                          return selectedUserForTimeline ? postHandle === selectedHandle : true;
                        })
                        .map((reply) => {
                          const userVote = userVotes[`reply_${reply.id}`];
                          const isReposted = userReposts[reply.id];
                          const childCount = replies.filter(r => r.parentId === reply.id).length;
                          const isEditing = editingReplyKey === `reply-${reply.id}`;
                          const isReplyOpen = replyBoxOpen[reply.id];
                          const isMyPost = account.isLoggedIn && account.handle === reply.handle;
                          const isFollowingTarget = followingList.includes(reply.handle || '');

                          return (
                            <div 
                              key={reply.id} 
                              onClick={() => setActivePostId(reply.id)}
                              className="p-4 hover:bg-[#16181c]/30 transition space-y-2 cursor-pointer"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center font-bold text-white shrink-0">
                                  {reply.author.slice(0, 1)}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-xs hover:underline">{reply.author}</span>
                                      
                                      {account.isLoggedIn && !isMyPost && (
                                        <button
                                          onClick={(e) => handleToggleFollow(reply.handle || '', e)}
                                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition cursor-pointer ${
                                            isFollowingTarget
                                              ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-red-950 hover:text-red-400'
                                              : 'bg-sky-500 text-white hover:bg-sky-400'
                                          }`}
                                        >
                                          {isFollowingTarget ? 'フォロー中' : '＋ フォロー'}
                                        </button>
                                      )}

                                      <span className="text-gray-500 text-[11px]">{reply.handle || '@user'}</span>
                                      <span className="text-gray-500">·</span>
                                      <span className="text-gray-500 text-[11px]">{reply.date}</span>
                                      {reply.mediaUrl && (
                                        <span className="bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                          {reply.mediaType === 'video' ? '🎬 動画' : '🖼️ 画像'}
                                        </span>
                                      )}
                                    </div>
                                    {isMyPost && (
                                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        {!isEditing && (
                                          <button onClick={(e) => { 
                                            e.stopPropagation(); 
                                            setEditingReplyKey(`reply-${reply.id}`); 
                                            setEditTitle('');
                                            setEditContent(reply.content); 
                                            setEditMediaUrl(reply.mediaUrl || ''); 
                                            setEditMediaType(reply.mediaType || 'image'); 
                                          }} className="text-[11px] text-gray-500 hover:text-sky-400 underline cursor-pointer">[修正]</button>
                                        )}
                                        <button onClick={(e) => handleDelete(reply.id, reply.handle, e)} className="text-[11px] text-red-500 hover:text-red-400 font-bold underline cursor-pointer">[削除]</button>
                                      </div>
                                    )}
                                  </div>

                                  {isEditing ? (
                                    <div className="space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                      <textarea rows={2} value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="本文..." className="w-full bg-black text-white border border-[#2f3336] p-2 rounded-xl text-xs outline-none" />
                                      <div className="flex gap-2 items-center">
                                        <select value={editMediaType} onChange={(e) => setEditMediaType(e.target.value as 'image' | 'video')} className="bg-black text-white border border-[#2f3336] p-1 rounded text-xs">
                                          <option value="image">画像</option>
                                          <option value="video">動画</option>
                                        </select>
                                        <input type="text" value={editMediaUrl} onChange={(e) => setEditMediaUrl(e.target.value)} placeholder="メディアURL..." className="flex-1 bg-black text-white border border-[#2f3336] p-1 rounded text-xs" />
                                      </div>
                                      <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingReplyKey(null)} className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-full text-[10px]">キャンセル</button>
                                        <button onClick={() => handleSaveEdit(reply.id, reply.handle, false)} className="px-3 py-1 bg-sky-500 text-white rounded-full text-[10px] font-bold">保存</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-sm text-[#e7e9ea] pt-1">
                                      <SafeSvgContent content={reply.content} size="full" />
                                    </div>
                                  )}

                                  {reply.mediaUrl && (
                                    <div className="mt-2 rounded-2xl overflow-hidden border border-[#2f3336] bg-black p-1 flex justify-center">
                                      {renderMedia(reply.mediaUrl, reply.mediaType || 'image')}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-2 text-gray-400 text-xs" onClick={(e) => e.stopPropagation()}>
                                    {(() => {
                                      const childCount = replies.filter(r => r.parentId === reply.id).length;
                                      return (
                                        <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                                          💬 {childCount} 返信
                                        </span>
                                      );
                                    })()}
                                    
                                    <button type="button" onClick={(e) => handleOpenTranslateModal(reply.content, e)} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none">
                                      ✨ 翻訳
                                    </button>

                                    <button type="button" onClick={(e) => handleRepost(reply, e)} className={`flex items-center gap-1 transition cursor-pointer bg-transparent border-none ${isReposted ? 'text-green-500 font-bold' : 'hover:text-green-400'}`}>
                                      🔄 {reply.repostCount}
                                    </button>
                                    
                                    <div className="flex items-center gap-1">
                                      <button type="button" onClick={(e) => handleZVote(reply.id, 'like', e)} className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${userVote === 'like' ? 'bg-pink-600 text-white border-pink-500 font-bold' : 'border-gray-600'}`}>
                                        ❤ {reply.likes}
                                      </button>
                                      <button type="button" onClick={(e) => handleZVote(reply.id, 'dislike', e)} className={`px-1.5 py-0.5 rounded border transition cursor-pointer ${userVote === 'dislike' ? 'bg-sky-600 text-white border-sky-500 font-bold' : 'border-gray-600'}`}>
                                       👎 {reply.dislikes}
                                      </button>
                                    </div>

                                    {renderBookmarkStampButton(reply.id)}

                                    <button type="button" onClick={(e) => handleShare(reply.content, reply.author, e)} className="cursor-pointer transition select-none bg-transparent border-none outline-none hover:text-sky-400 text-gray-400 flex items-center gap-1" title="シェア">
                                      📤 シェア
                                    </button>
                                  </div>

                                  {isReplyOpen && (
                                    <div className="pt-2 space-y-2 bg-[#16181c] p-3 rounded-2xl border border-[#2f3336] mt-2" onClick={(e) => e.stopPropagation()}>
                                      <textarea
                                        rows={2}
                                        value={replyInputs[reply.id] || ''}
                                        onChange={(e) => setReplyInputs({ ...replyInputs, [reply.id]: e.target.value })}
                                        placeholder="返信をポスト..."
                                        className="w-full bg-black text-white border border-[#2f3336] p-2 rounded-xl text-xs outline-none resize-none"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button onClick={() => setReplyBoxOpen({ ...replyBoxOpen, [reply.id]: false })} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs cursor-pointer">キャンセル</button>
                                        <button 
                                          onClick={() => handleReplySubmit(reply.id)} 
                                          disabled={isSubmitting}
                                          className="px-4 py-1 bg-sky-500 text-white font-bold rounded-full text-xs cursor-pointer disabled:opacity-50"
                                        >
                                          {isSubmitting ? '送信中…' : '返信する'}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                </div>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 hidden md:block space-y-4 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto">
              <div className="bg-[#16181c] p-3 rounded-full border border-[#2f3336] flex items-center gap-3">
                <span className="text-gray-400 pl-2">🔍</span>
                <input type="text" placeholder="キーワード検索" className="w-full bg-transparent text-white text-xs outline-none" />
              </div>

              <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  <span>🏆</span> 総合人気ランキング
                </h3>
                <div className="space-y-2 text-xs">
                  {top10Ranking.slice(0, 5).length === 0 ? (
                    <p className="text-gray-500">まだデータがありません</p>
                  ) : (
                    top10Ranking.slice(0, 5).map((p, idx) => (
                      <div 
                        key={p.id} 
                        onClick={() => setActivePostId(p.id)} 
                        className="p-2 bg-black/40 rounded-xl border border-[#2f3336] hover:border-sky-500 transition cursor-pointer space-y-1"
                      >
                        <div className="flex justify-between items-center text-[10px] text-sky-400 font-bold">
                          <span>第 {idx + 1} 位</span>
                          <span>❤ {p.likesCount} ｲｲﾈ</span>
                        </div>
                        <div className="text-gray-200 truncate">
                          <SafeSvgContent content={p.content} size="thumb" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-white text-sm">言霊について</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  世界多言語掲示板「言霊」へようこそ！chモード、enjoyモード、そしてZモードを自由に切り替えて交流をお楽しみいただけます。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            【柿色チャットモード専用デザイン】
           ========================================================= */}
        {theme === 'chat' && (
          <div className="min-h-screen bg-[#fff8f3] text-[#3d2b1f] p-4 flex flex-col items-center">
            <div className="w-full max-w-4xl bg-white border-2 border-[#c1440e] rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[80vh]">
              
              <div className="bg-[#c1440e] text-white p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-xl">柿</span>
                  <h2 className="font-bold text-base tracking-wide">言霊 柿色リアルタイムチャット</h2>
                </div>
                <span className="text-xs bg-[#a03306] px-3 py-1 rounded-full text-orange-100 font-bold">
                  カテゴリー: {currentCategory}
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#fffaf5]">
                {mainReplies.map((post) => {
                  const isMyPost = account.isLoggedIn && account.handle === post.handle;
                  return (
                    <div key={post.id} className={`flex flex-col ${isMyPost ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1 text-[11px] text-gray-600">
                        <span className="font-bold text-[#c1440e]">{post.author}</span>
                        <span>{post.date}</span>
                      </div>
                      
                      <div className={`max-w-[80%] p-3.5 rounded-2xl shadow-sm text-xs border ${
                        isMyPost 
                          ? 'bg-[#c1440e] text-white rounded-br-none border-[#a03306]' 
                          : 'bg-[#ffe8d6] text-[#3d2b1f] rounded-bl-none border-[#fcd5b5]'
                      }`}>
                        <SafeSvgContent content={post.content} size="full" />
                        {post.mediaUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden">
                            {renderMedia(post.mediaUrl, post.mediaType || 'image')}
                          </div>
                        )}
                      </div>

                      {renderReplyTree(post.id)}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-[#fff3ea] border-t border-[#fcd5b5] space-y-2">
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                    className="px-3 py-1.5 bg-[#e07a5f] hover:bg-[#c1440e] text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    🎨 絵文字・AA・SVGパレット
                  </button>
                </div>

                {isPaletteOpen && (
                  <div className="p-3 bg-white border border-[#fcd5b5] rounded-xl shadow-inner space-y-2">
                    <div className="flex gap-2 border-b border-gray-200 pb-2 font-bold text-xs">
                      <button 
                        type="button"
                        onClick={() => setPaletteTab('emoji')} 
                        className={`px-2 py-1 rounded cursor-pointer ${paletteTab === 'emoji' ? 'bg-[#c1440e] text-white' : 'text-gray-600'}`}
                      >
                        絵文字
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaletteTab('aa')} 
                        className={`px-2 py-1 rounded cursor-pointer ${paletteTab === 'aa' ? 'bg-[#c1440e] text-white' : 'text-gray-600'}`}
                      >
                        アスキーアート (AA)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaletteTab('svg')} 
                        className={`px-2 py-1 rounded cursor-pointer ${paletteTab === 'svg' ? 'bg-[#c1440e] text-white' : 'text-gray-600'}`}
                      >
                        SVG掲示板用パーツ
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                      {paletteTab === 'emoji' && EMOJI_LIST.map((emoji, i) => (
                        <button key={i} type="button" onClick={() => insertToInput(emoji)} className="text-lg p-1.5 hover:bg-orange-100 rounded cursor-pointer">{emoji}</button>
                      ))}
                      {paletteTab === 'aa' && AA_LIST.map((aa, i) => (
                        <button key={i} type="button" onClick={() => insertToInput(aa)} className="text-xs p-1.5 font-mono bg-gray-50 border hover:bg-orange-100 rounded cursor-pointer">{aa}</button>
                      ))}
                      {paletteTab === 'svg' && SVG_TEMPLATES.map((item, i) => (
                        <button key={i} type="button" onClick={() => insertToInput(item.svg)} className="text-xs p-2 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded flex items-center gap-1 cursor-pointer font-bold text-[#c1440e]">
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handlePost} className="flex gap-2">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="柿色チャットにメッセージを入力... (SVG直貼りも可能)"
                    className="flex-1 p-2.5 bg-white border border-[#fcd5b5] rounded-xl text-xs outline-none focus:border-[#c1440e] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 bg-[#c1440e] hover:bg-[#a03306] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    送信
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================
            【ヘルプ・使い方ガイド モーダル】
           ========================================================= */}
        {isHelpOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white text-gray-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
              
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 flex justify-between items-center">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span>📖</span> 世界多言語掲示板「言霊」の使い方ガイド
                </h3>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="px-3 py-1 bg-black/20 hover:bg-black/40 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  ✕ 閉じる
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs leading-relaxed text-gray-700">
                <div className="space-y-2">
                  <h4 className="font-bold text-amber-800 text-sm border-b pb-1">🌐 4つの切り替えモード</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-red-800">🔴 chモード</span>
                      <p className="text-[11px] text-gray-600">伝統的なネット掲示板スタイル。過去ログの閲覧や「sage」を使ったスレッド保守が可能です。</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-[#1b5e20]">🟢 enjoyモード</span>
                      <p className="text-[11px] text-gray-600">閲覧数や推薦数、スレッド一覧がすっきり見やすいコミュニティスタイル。</p>
                    </div>
                    <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-sky-800">🔵 Zモード</span>
                      <p className="text-[11px] text-gray-600">SNS風のタイムライン形式。フォロー機能やダイレクトメッセージ（DM）を楽しめます。</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl space-y-1">
                      <span className="font-bold text-[#c1440e]">🟠 柿色チャット</span>
                      <p className="text-[11px] text-gray-600">温かみのある柿色テーマのリアルタイムチャット。パレットを使った絵文字・SVGの投稿に最適！</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-amber-800 text-sm border-b pb-1">✨ 主な便利機能</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                    <li><b>🎨 絵文字・AA・SVGパレット:</b> チャット等の入力欄にあるパレットボタンから、絵文字やアスキーアート、SVGパーツをワンクリックで挿入できます。</li>
                    <li><b>🤖 Gemini翻訳:</b> 投稿にある「✨ Gemini翻訳」を押すと、AIが瞬時に自然な日本語（または選択中の言語）に翻訳してくれます。</li>
                    <li><b>🛡️ AI暴言フィルター:</b> 攻撃的な言葉が入力された場合でも、AIが自動的にマイルドで優しい表現に言い換えて投稿を守ります。</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 text-right">
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition"
                >
                  理解しました！
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
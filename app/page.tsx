// app/page.tsx
'use client';

import MyPageModal from './components/modals/MyPageModal';
import HelpModal from './components/modals/HelpModal';
import { PostForm } from './components/shared/PostForm';
import { ChannelMode } from './components/modes/ChannelMode';
import { EnjoyMode } from './components/modes/EnjoyMode';
import { ZMode } from './components/modes/ZMode';
import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { createClient } from '@/utils/supabase/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENJOY_CATEGORIES, Reply, UserAccount, LANGUAGES } from './categories';
import { 
  Flame, 
  Sparkles, 
  Zap, 
  MessageSquare, 
  Heart, 
  Share2, 
  LogOut, 
  LogIn, 
  Send, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe,
  Link as LinkIcon
} from 'lucide-react';

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
  const [openMenuPostId, setOpenMenuPostId] = useState<number | null>(null);
  const [banVotes, setBanVotes] = useState<Record<string, { count: number; voters: string[] }>>({});
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [reportedPosts, setReportedPosts] = useState<number[]>([]);

  const supabase = createClient();
  
  const [theme, setTheme] = useState<'channel' | 'enjoy' | 'z'>('channel');
  const [isHydrated, setIsHydrated] = useState(false);
  const [account, setAccount] = useState<UserAccount>({
    isLoggedIn: false,
    name: 'ゲスト',
    handle: '@guest',
    avatarChar: 'ゲ',
  });

  useEffect(() => {
    const savedBlocks = localStorage.getItem('kotodama_blocked_users');
    if (savedBlocks) {
      try { setBlockedUsers(JSON.parse(savedBlocks)); } catch (e) {}
    }

    const savedReports = localStorage.getItem('kotodama_reported_posts');
    if (savedReports) {
      try { setReportedPosts(JSON.parse(savedReports)); } catch (e) {}
    }

    const savedBans = localStorage.getItem('kotodama_ban_votes');
    if (savedBans) {
      try { setBanVotes(JSON.parse(savedBans)); } catch (e) {}
    }
  }, []);

  const handleToggleBlock = (handle: string) => {
    const cleanHandle = handle.replace(/^@+/, '');
    const cleanSelf = account?.handle?.replace(/^@+/, '');

    if (cleanSelf && cleanHandle === cleanSelf) {
      alert('自分自身をブロックすることはできません。');
      if (blockedUsers.includes(cleanSelf)) {
        const fixed = blockedUsers.filter(h => h !== cleanSelf);
        setBlockedUsers(fixed);
        localStorage.setItem('kotodama_blocked_users', JSON.stringify(fixed));
      }
      return;
    }

    const updated = blockedUsers.includes(cleanHandle)
      ? blockedUsers.filter(h => h !== cleanHandle)
      : [...blockedUsers, cleanHandle];
    
    setBlockedUsers(updated);
    localStorage.setItem('kotodama_blocked_users', JSON.stringify(updated));
    setNoticeMessage(blockedUsers.includes(cleanHandle) ? `@${cleanHandle} のブロックを解除しました` : `@${cleanHandle} をブロックしました`);
    setTimeout(() => setNoticeMessage(null), 2000);
  };

  const handleReportPost = (postId: number) => {
    if (reportedPosts.includes(postId)) return;
    const updated = [...reportedPosts, postId];
    setReportedPosts(updated);
    localStorage.setItem('kotodama_reported_posts', JSON.stringify(updated));
    setNoticeMessage('⚠️ スパムとして通報し、非表示にしました');
    setTimeout(() => setNoticeMessage(null), 2000);
  };

  const handleVoteBan = (targetHandle: string) => {
    if (!account.isLoggedIn) {
      alert('出禁投票を行うにはログインが必要です。');
      setIsAuthModalOpen(true);
      return;
    }

    const cleanTarget = targetHandle.replace(/^@+/, '');
    const cleanMyHandle = account.handle.replace(/^@+/, '');

    const ADMIN_HANDLES = ["admin", "shingo", "gairyou", "3nojiya"]; 
    if (ADMIN_HANDLES.includes(cleanTarget)) {
      alert('🚨 システム保護により、管理人は出禁にすることができません。');
      return;
    }

    if (cleanTarget === cleanMyHandle) {
      alert('自分自身に投票することはできません。');
      return;
    }

    const current = banVotes[cleanTarget] || { count: 0, voters: [] };
    if (current.voters.includes(account.handle)) {
      alert('すでにこのユーザーの出禁投票に投票済みです。');
      return;
    }

    const updatedVoters = [...current.voters, account.handle];
    const newCount = current.count + 1;
    const updatedBans = { ...banVotes, [cleanTarget]: { count: newCount, voters: updatedVoters } };

    setBanVotes(updatedBans);
    localStorage.setItem('kotodama_ban_votes', JSON.stringify(updatedBans));

    const MIN_VOTES_REQUIRED = 3; 

    if (newCount >= MIN_VOTES_REQUIRED && !blockedUsers.includes(cleanTarget)) {
      const updatedBlocks = [...blockedUsers, cleanTarget];
      setBlockedUsers(updatedBlocks);
      localStorage.setItem('kotodama_blocked_users', JSON.stringify(updatedBlocks));
      setNoticeMessage(`🚨 投票が規定数（${MIN_VOTES_REQUIRED}票）に達したため、@${cleanTarget} が出禁（ブロック）処分となりました。`);
    } else {
      setNoticeMessage(`🗳️ 出禁投票に賛成しました（現在 ${newCount} 票 / ${MIN_VOTES_REQUIRED}票で出禁）`);
    }
    
    setTimeout(() => setNoticeMessage(null), 3000);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('kotodama_board_theme') as 'channel' | 'enjoy' | 'z';
    if (savedTheme && ['channel', 'enjoy', 'z'].includes(savedTheme)) {
      setTheme(savedTheme);
    }

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
    
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && theme) {
      localStorage.setItem('kotodama_board_theme', theme);
    }
  }, [theme, isHydrated]);

  const [categories, setCategories] = useState<string[]>(ENJOY_CATEGORIES);
  const [currentCategory, setCurrentCategory] = useState<string>(ENJOY_CATEGORIES[0] || 'すべて');

  useEffect(() => {
    const loadDynamicCategories = () => {
      const savedCats = localStorage.getItem('kotodama_admin_categories');
      if (savedCats) {
        try {
          const parsed = JSON.parse(savedCats);
          const catNames = parsed.map((c: any) => typeof c === 'string' ? c : (c.name || c));
          if (catNames.length > 0) {
            setCategories(catNames);
          }
        } catch (e) {
          console.error('カテゴリーの動的読み込みエラー:', e);
        }
      }
    };

    loadDynamicCategories();
    window.addEventListener('storage', loadDynamicCategories);
    return () => {
      window.removeEventListener('storage', loadDynamicCategories);
    };
  }, []);

  const [selectedBoard, setSelectedBoard] = useState('news');
  const [selectedJaneThreadId, setSelectedJaneThreadId] = useState<number | null>(null);
  const [viewLimitMode, setViewLimitMode] = useState<'all' | '50' | '100'>('all');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [channelSearchQuery, setChannelSearchQuery] = useState('');

  const [enjoyViewMode, setEnjoyViewMode] = useState<'list' | 'detail' | 'write'>('list');
  const [enjoySelectedThreadId, setEnjoySelectedThreadId] = useState<number | null>(null);

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
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (account.isLoggedIn) {
      localStorage.setItem('kotodama_user_account', JSON.stringify(account));
    } else {
      localStorage.removeItem('kotodama_user_account');
    }
  }, [account, isHydrated]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [editHandleInput, setEditHandleInput] = useState('');

  // ★ マイページをフルページビューとして開くためのステート（モーダルから昇格）
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
  const [newMediaUrl, setNewMediaUrl] = useState('');
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

  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [isBookmarkView, setIsBookmarkView] = useState(false);

  const [replyInputs, setReplyInputs] = useState<{ [key: number]: string }>({});
  const [replyBoxOpen, setReplyBoxOpen] = useState<{ [key: number]: boolean }>({});

  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<{ [key: string]: 'like' | 'dislike' }>({});
  const [userReposts, setUserReposts] = useState<{ [key: number]: boolean }>({});
  const [userBookmarks, setUserBookmarks] = useState<{ [key: number]: boolean }>({});

  const [editingReplyKey, setEditingReplyKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMediaUrl, setEditMediaUrl] = useState('');

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
    if (!account.isLoggedIn || !account.handle) return;
    const myCleanHandle = account.handle.replace(/^@+/, '');

    const { data: followingData } = await supabase
      .from('follows')
      .select('following_handle')
      .eq('follower_handle', `@${myCleanHandle}`);

    if (followingData) {
      setFollowingList(followingData.map((f: any) => f.following_handle.replace(/^@+/, '')));
    }

    const { data: followerData } = await supabase
      .from('follows')
      .select('follower_handle')
      .eq('following_handle', `@${myCleanHandle}`);

    if (followerData) {
      setFollowersList(followerData.map((f: any) => f.follower_handle.replace(/^@+/, '')));
    }
  };

  const handleToggleFollow = async (targetHandle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!account.isLoggedIn) {
      alert('フォロー機能を使うにはログインが必要です。');
      return;
    }

    const cleanTarget = targetHandle.replace(/^@+/, '');
    const cleanMyHandle = account.handle.replace(/^@+/, '');
    if (cleanMyHandle === cleanTarget) return;

    const formattedTarget = `@${cleanTarget}`;
    const formattedMyHandle = `@${cleanMyHandle}`;
    const isFollowing = followingList.includes(cleanTarget);

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_handle', formattedMyHandle)
        .eq('following_handle', formattedTarget);
      setNoticeMessage(`@${cleanTarget} のフォローを解除しました`);
    } else {
      await supabase
        .from('follows')
        .insert([{ follower_handle: formattedMyHandle, following_handle: formattedTarget }]);
      setNoticeMessage(`@${cleanTarget} をフォローしました！`);
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
        const userAvatarUrl = responsePayload.picture || undefined;
        const newAcc = {
          isLoggedIn: true,
          name: userName,
          handle: userHandle,
          avatarChar: userName.slice(0, 1) || 'G',
          avatarUrl: userAvatarUrl,
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
          btnElement.innerHTML = '';
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

    if (currentCategory && currentCategory !== 'すべて' && currentCategory !== '総合' && currentCategory !== 'ホーム') {
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
        category: item.category || ENJOY_CATEGORIES[1] || '雑談',
        parentId: item.parent_id || null,
        repostCount: countMap[item.id] || 0,
        updatedAt: item.updated_at || undefined,
        avatarUrl: item.avatar_url || undefined,
      }));

      const uniquePosts = Array.from(
        new Map(formattedPosts.map(post => [post.id, post])).values()
      );

      setReplies(uniquePosts);

      if (!selectedJaneThreadId && uniquePosts.length > 0) {
        const firstMain = uniquePosts.find(p => !p.parentId);
        if (firstMain) {
          setSelectedJaneThreadId(firstMain.id);
          setEnjoySelectedThreadId(firstMain.id);
        }
      }
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [account.handle, currentCategory]);

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

    if ((!newComment.trim() && !newThreadTitle.trim()) || isSubmitting) return;

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
      if (contentToPost.trim()) {
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
        lang: selectedLang,
        media_url: newMediaUrl.trim() ? newMediaUrl.trim() : null,
        likes: 0,
        dislikes: 0,
        target_mode: targetModeVal,
        category: currentCategory === ENJOY_CATEGORIES[0] ? (ENJOY_CATEGORIES[1] || '雑談') : currentCategory,
        parent_id: null,
        repost_count: 0,
        avatar_url: (account as any).avatarUrl || null,
      };

      const { data, error } = await supabase.from('posts').insert([newPostData]).select();

      if (error) {
        console.error('投稿エラー:', error);
        alert('ポストの送信に失敗しました。');
        return;
      }

      setNewThreadTitle('');
      setNewComment('');
      setNewMediaUrl('');
      setNoticeMessage('✨ 新規スレッドの作成が完了しました！');
      setTimeout(() => setNoticeMessage(null), 3000);

      if (theme === 'channel' && data && data[0]) {
        setSelectedJaneThreadId(data[0].id);
      }
      if (theme === 'enjoy' && data && data[0]) {
        setEnjoySelectedThreadId(data[0].id);
        setEnjoyViewMode('detail');
      }
      if (theme === 'z' && data && data[0]) {
        setActivePostId(data[0].id);
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

      const parentPost = replies.find(r => r.id === parentId);
      const replyCategory = parentPost?.category || (currentCategory === ENJOY_CATEGORIES[0] ? (ENJOY_CATEGORIES[1] || '雑談') : currentCategory);

      const newReplyData = {
        author,
        handle,
        date: theme === 'z' ? 'たった今' : dateStr,
        content: finalReplyText,
        target_lang: selectedLang,
        parent_id: parentId,
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
        setNoticeMessage('書き込みました！');
        setTimeout(() => setNoticeMessage(null), 3000);
        fetchPosts();
      }
    } finally {
      setIsSubmitting(false);
    }
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
    const targetReply = replies.find(r => r.id === replyId);
    const actualHandle = postHandle || targetReply?.handle;

    if (!account.isLoggedIn || (actualHandle && account.handle !== actualHandle)) {
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

    const handleWithoutAt = (r.handle || '').replace(/^@+/, '');
    const myHandleWithoutAt = (account.handle || '').replace(/^@+/, '');

    if (handleWithoutAt !== myHandleWithoutAt && blockedUsers.includes(handleWithoutAt)) return false;
    if (reportedPosts.includes(r.id)) return false;

    if (isBookmarkView) {
      return userBookmarks[r.id] === true;
    }

    if (theme === 'channel' && r.targetMode !== 'all' && r.targetMode !== 'channel') return false;
    if (theme === 'enjoy' && r.targetMode !== 'all' && r.targetMode !== 'enjoy') return false;
    if (theme === 'z') {
      if (r.targetMode !== 'all' && r.targetMode !== 'z') return false;
      if (zTab === 'following') {
        const authorHandleClean = (r.handle || '').replace(/^@+/, '').toLowerCase();
        const myHandleClean = (account.handle || '').replace(/^@+/, '').toLowerCase();
        const isMyPost = authorHandleClean === myHandleClean;
        const isFollowingTarget = followingList.some(
          (h: string) => h.replace(/^@+/, '').toLowerCase() === authorHandleClean
        );
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
        className={`cursor-pointer transition px-3 py-1 rounded-full font-bold text-xs select-none border shadow-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
          isBookmarked 
            ? 'bg-pink-500 text-white border-pink-400 scale-105 shadow-sm' 
            : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 hover:border-amber-300'
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-900 font-bold text-xs cursor-pointer transition hover:bg-sky-100 shadow-xs"
        >
          <span>🌍 言語:</span>
          <span className="text-sky-700">{currentLangObj.label}</span>
          <span className="text-[10px] opacity-70">▼</span>
        </button>

        {isLangDropdownOpen && (
          <div className="absolute left-0 mt-1 w-64 bg-white text-gray-800 border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col text-xs">
            <div className="p-2.5 border-b border-gray-100 bg-gray-50">
              <input
                type="text"
                placeholder="🔍 言語を検索..."
                value={langSearchQuery}
                onChange={(e) => setLangSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-gray-800 outline-none focus:border-sky-500 text-xs shadow-inner"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 p-1">
              {filteredLanguages.length === 0 ? (
                <div className="p-3 text-center text-gray-400 text-xs">言語が見つかりません</div>
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
                        : 'hover:bg-gray-100 text-gray-700'
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

  // =========================================================================
  // ★ マイページが開かれているときは、Zモード同様に画面全体をフルページ占有して表示
  // =========================================================================
  if (isMyPageOpen) {
    return (
      <div className="min-h-screen font-sans text-xs bg-white text-gray-900">
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 sticky top-0 bg-white/95 backdrop-blur-sm z-20">
            <button 
              onClick={() => setIsMyPageOpen(false)} 
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>←</span>
              <span>掲示板に戻る</span>
            </button>
            <h1 className="font-bold text-sm text-gray-800 flex items-center gap-2">
              <span className="text-indigo-600 font-black">👤</span>
              <span className="text-indigo-600">マイページ フルページ表示</span>
            </h1>
          </div>

          <MyPageModal
            isOpen={true}
            onClose={() => setIsMyPageOpen(false)}
            account={account}
            myPageTab={myPageTab}
            setMyPageTab={setMyPageTab}
            rankingType={rankingType}
            setRankingType={setRankingType}
            myPosts={myPosts}
            top10Ranking={top10Ranking}
            userApiKeyInput={userApiKeyInput}
            setUserApiKeyInput={setUserApiKeyInput}
            showApiKey={showApiKey}
            setShowApiKey={setShowApiKey}
            handleSaveApiKey={handleSaveApiKey}
            handleDelete={handleDelete}
            renderMedia={renderMedia}
            renderContentWithEmbed={renderContentWithEmbed}
            isFullPage={true}
          />
        </div>
      </div>
    );
  }

  // 通常時の画面描画
  return (
    <div className="min-h-screen font-sans text-xs bg-[#f4f7fa] text-gray-900">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          initializeGoogleButton();
        }}
      />

      {/* =========================================================================
          ★ 全体統括グローバルヘッダー（黒からパッと明るい爽やかなカラーへ刷新）
          ========================================================================= */}
      {/* 全体統括グローバルヘッダー */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md text-gray-800 px-4 py-2.5 flex justify-between items-center text-xs border-b border-sky-100 flex-wrap gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-extrabold tracking-wider text-sm text-sky-900 flex items-center gap-1.5">
            <span>🌐</span> 世界多言語掲示板 言霊 
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">● Supabase 連携</span>
          </span>
          {renderLanguageSelector()}
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* ヘルプボタン */}
          <button 
            onClick={() => setIsHelpOpen(true)} 
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <span>ℹ️ ヘルプ</span>
          </button>

          {/* ログイン・マイページ統合エリア */}
          {account.isLoggedIn ? (
            <div className="flex items-center gap-2">
              {/* 丸いアイコンをクリックするとマイページ（フルページ）が開く */}
              <button
                onClick={() => setIsMyPageOpen(true)}
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200 shadow-inner cursor-pointer transition group"
                title="マイページを開く"
              >
                {/* Googleアカウント等の丸いプロフィール画像、または頭文字 */}
                {(account as any).avatarUrl ? (
                  <img
                    src={(account as any).avatarUrl}
                    alt="プロフィール"
                    className="w-6 h-6 rounded-full object-cover border border-gray-300 group-hover:border-sky-500 transition"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center font-bold text-[10px] text-white">
                    {account.avatarChar || 'ゲ'}
                  </div>
                )}
                <span className="text-gray-800 font-bold max-w-[100px] truncate">
                  {account.name}
                </span>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded ml-0.5">
                  マイページ →
                </span>
              </button>

              {/* ログアウトボタン */}
              <button 
                onClick={handleToggleLogin} 
                className="text-[11px] font-bold text-gray-500 hover:text-red-600 transition cursor-pointer px-1.5 py-1"
              >
                ログアウト
              </button>
            </div>
          ) : (
            /* 未ログイン時は「ログイン」ボタンを表示 */
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <span>🔑 ログイン</span>
            </button>
          )}

          {/* モード切替 */}
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
            <span className="text-gray-500 font-medium hidden sm:inline">モード:</span>
            <button onClick={() => setTheme('channel')} className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${theme === 'channel' ? 'bg-red-600 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>chモード</button>
            <button onClick={() => setTheme('enjoy')} className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${theme === 'enjoy' ? 'bg-[#007e59] text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>enjoyモード</button>
            <button onClick={() => setTheme('z')} className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${theme === 'z' ? 'bg-sky-500 text-white shadow-xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Zモード</button>
          </div>
        </div>
      </div>




      <div className={`w-full max-w-full flex flex-col ${theme === 'z' ? 'bg-white text-gray-900' : 'bg-white border border-gray-200 shadow-sm overflow-hidden my-2'}`}>
        
        <HelpModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />

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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-900 border border-gray-200 p-6 rounded-3xl max-w-sm w-full space-y-5 shadow-2xl">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-sky-600 flex items-center gap-1.5">
                  <span>👤</span> ログイン / アカウント認証
                </h3>
                <button 
                  onClick={() => setIsAuthModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3 py-2 flex flex-col items-center justify-center">
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                  言霊プロジェクトへようこそ。<br />Googleアカウントで安全にログインできます。
                </p>
                <div id="google-signin-btn" className="flex justify-center my-3"></div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsAuthModalOpen(false)} 
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs cursor-pointer font-bold transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}

        {noticeMessage && (
          <div className="p-2 bg-sky-600 text-white font-bold text-center animate-pulse">{noticeMessage}</div>
        )}

        {theme === 'channel' && (
          <ChannelMode
            categories={categories}
            currentCategory={currentCategory}
            setCurrentCategory={setCurrentCategory}
            isBookmarkView={isBookmarkView}
            setIsBookmarkView={setIsBookmarkView}
            channelSearchQuery={channelSearchQuery}
            setChannelSearchQuery={setChannelSearchQuery}
            mainReplies={mainReplies}
            replies={replies}
            selectedJaneThreadId={selectedJaneThreadId}
            setSelectedJaneThreadId={setSelectedJaneThreadId}
            viewLimitMode={viewLimitMode}
            setViewLimitMode={setViewLimitMode}
            account={account}
            newAuthorName={newAuthorName}
            setNewAuthorName={setNewAuthorName}
            newEmail={newEmail}
            setNewEmail={setNewEmail}
            newThreadTitle={newThreadTitle}
            setNewThreadTitle={setNewThreadTitle}
            newComment={newComment}
            setNewComment={setNewComment}
            isTargetAll={isTargetAll}
            setIsTargetAll={setIsTargetAll}
            isSubmitting={isSubmitting}
            handlePost={handlePost}
            handleReplySubmit={handleReplySubmit}
            handleDelete={handleDelete}
            handleSaveEdit={handleSaveEdit}
            handleOpenTranslateModal={handleOpenTranslateModal}
            fetchPosts={fetchPosts}
            scrollToNewThreadForm={scrollToNewThreadForm}
            newThreadFormRef={newThreadFormRef}
            renderBookmarkStampButton={renderBookmarkStampButton}
            renderMedia={renderMedia}
            renderContentWithEmbed={renderContentWithEmbed}
            setIsAuthModalOpen={setIsAuthModalOpen}
            editingReplyKey={editingReplyKey}
            setEditingReplyKey={setEditingReplyKey}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editContent={editContent}
            setEditContent={setEditContent}
            editMediaUrl={editMediaUrl}
            setEditMediaUrl={setEditMediaUrl}
            replyInputs={replyInputs}
            setReplyInputs={setReplyInputs}
            blockedUsers={blockedUsers}
            reportedPosts={reportedPosts}
            banVotes={banVotes}
            handleToggleBlock={handleToggleBlock}
            handleReportPost={handleReportPost}
            handleVoteBan={handleVoteBan}
            openMenuPostId={openMenuPostId}
            setOpenMenuPostId={setOpenMenuPostId}
          />
        )}

        {theme === 'enjoy' && (
          <EnjoyMode
            categories={categories}
            currentCategory={currentCategory}
            setCurrentCategory={setCurrentCategory}
            isBookmarkView={isBookmarkView}
            setIsBookmarkView={setIsBookmarkView}
            mainReplies={mainReplies}
            replies={replies}
            enjoySelectedThreadId={enjoySelectedThreadId}
            setEnjoySelectedThreadId={setEnjoySelectedThreadId}
            enjoyViewMode={enjoyViewMode}
            setEnjoyViewMode={setEnjoyViewMode}
            account={account}
            newAuthorName={newAuthorName}
            setNewAuthorName={setNewAuthorName}
            newEmail={newEmail}
            setNewEmail={setNewEmail}
            newThreadTitle={newThreadTitle}
            setNewThreadTitle={setNewThreadTitle}
            newComment={newComment}
            setNewComment={setNewComment}
            isTargetAll={isTargetAll}
            setIsTargetAll={setIsTargetAll}
            isSubmitting={isSubmitting}
            handlePost={handlePost}
            handleReplySubmit={handleReplySubmit}
            handleDelete={handleDelete}
            handleSaveEdit={handleSaveEdit}
            handleOpenTranslateModal={handleOpenTranslateModal}
            handleZVote={handleZVote}
            handleOpenEnjoyThread={handleOpenEnjoyThread}
            renderBookmarkStampButton={renderBookmarkStampButton}
            renderMedia={renderMedia}
            renderContentWithEmbed={renderContentWithEmbed}
            setIsAuthModalOpen={setIsAuthModalOpen}
            editingReplyKey={editingReplyKey}
            setEditingReplyKey={setEditingReplyKey}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editContent={editContent}
            setEditContent={setEditContent}
            editMediaUrl={editMediaUrl}
            setEditMediaUrl={setEditMediaUrl}
            replyInputs={replyInputs}
            setReplyInputs={setReplyInputs}
            blockedUsers={blockedUsers}
            reportedPosts={reportedPosts}
            banVotes={banVotes}
            handleToggleBlock={handleToggleBlock}
            handleReportPost={handleReportPost}
            handleVoteBan={handleVoteBan}
          />
        )}

        {theme === 'z' && (
          <ZMode
            mainReplies={mainReplies}
            replies={replies}
            followingList={followingList}
            categories={categories}
            currentCategory={currentCategory}
            isBookmarkView={isBookmarkView}
            zTab={zTab}
            selectedUserForTimeline={selectedUserForTimeline}
            activeDmUser={activeDmUser}
            directMessages={directMessages}
            dmText={dmText}
            newComment={newComment}
            newThreadTitle={newThreadTitle}       
            setNewThreadTitle={setNewThreadTitle} 
            isTargetAll={isTargetAll}
            isSubmitting={isSubmitting}
            account={account}
            userReposts={userReposts}
            userVotes={userVotes}
            editingReplyKey={editingReplyKey}
            replyBoxOpen={replyBoxOpen}
            replyInputs={replyInputs}
            editContent={editContent}
            editMediaUrl={editMediaUrl}
            top10Ranking={top10Ranking}
            activePostId={activePostId}
            setCurrentCategory={setCurrentCategory}
            setActivePostId={setActivePostId}
            setIsBookmarkView={setIsBookmarkView}
            setZTab={setZTab}
            setSelectedUserForTimeline={setSelectedUserForTimeline}
            setActiveDmUser={setActiveDmUser}
            setDmText={setDmText}
            setNewComment={setNewComment}
            setIsTargetAll={setIsTargetAll}
            setEditingReplyKey={setEditingReplyKey}
            setEditTitle={setEditTitle}
            setEditContent={setEditContent}
            setEditMediaUrl={setEditMediaUrl}
            setReplyBoxOpen={setReplyBoxOpen}
            setReplyInputs={setReplyInputs}
            setIsAuthModalOpen={setIsAuthModalOpen}
            handlePost={handlePost}
            handleSendDm={handleSendDm}
            handleDelete={handleDelete}
            handleToggleFollow={handleToggleFollow}
            handleSaveEdit={handleSaveEdit}
            handleOpenTranslateModal={handleOpenTranslateModal}
            handleRepost={handleRepost}
            handleZVote={handleZVote}
            handleShare={handleShare}
            handleReplySubmit={handleReplySubmit}
            renderBookmarkStampButton={renderBookmarkStampButton}
            renderMedia={renderMedia}
            renderContentWithEmbed={renderContentWithEmbed}
            blockedUsers={blockedUsers}
            reportedPosts={reportedPosts}
            banVotes={banVotes}
            handleToggleBlock={handleToggleBlock}
            handleReportPost={handleReportPost}
            handleVoteBan={handleVoteBan}
          />
        )}

      </div>
    </div>
  );
}

function TwitterEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tweetId = url.split('/status/')[1]?.split('?')[0];
    if (!tweetId || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    const blockquote = document.createElement('blockquote');
    blockquote.className = 'twitter-tweet';
    blockquote.setAttribute('data-theme', 'dark');

    const a = document.createElement('a');
    a.href = `https://twitter.com/x/status/${tweetId}`;
    blockquote.appendChild(a);

    containerRef.current.appendChild(blockquote);

    const scriptId = 'twitter-wjs';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const runWidgetLoad = () => {
      if ((window as any).twttr && (window as any).twttr.widgets && containerRef.current) {
        (window as any).twttr.widgets.load(containerRef.current);
      }
    };

    if (!(window as any).twttr) {
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        document.body.appendChild(script);
      }
      script.onload = runWidgetLoad;
    } else {
      runWidgetLoad();
    }
  }, [url]);

  return (
    <div className="my-3 max-w-lg overflow-hidden flex justify-center">
      <div ref={containerRef} className="w-full flex justify-center min-h-[150px]">
        <div className="p-3 bg-gray-900 text-gray-400 text-xs rounded-xl border border-gray-800 animate-pulse text-center w-full">
          𝕏 ポストを読み込み中...
        </div>
      </div>
    </div>
  );
}

function LinkPreviewCard({ url }: { url: string }) {
  const [ogp, setOgp] = React.useState<{ title: string; description: string; image: string; domain: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    fetch(`/api/ogp?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && !data.error) {
          setOgp(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  let domain = url;
  try {
    domain = new URL(url).hostname;
  } catch (e) {}

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col sm:flex-row border border-gray-200 dark:border-[#2f3336] rounded-xl overflow-hidden bg-white dark:bg-[#16181c] hover:border-sky-500/50 transition shadow-sm my-2 max-w-lg no-underline group"
    >
      <div className="sm:w-36 h-28 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex flex-col items-center justify-center shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-[#2f3336] overflow-hidden p-2 text-center">
        {loading ? (
          <span className="text-[10px] text-gray-400 animate-pulse">読込中...</span>
        ) : ogp?.image ? (
          <img 
            src={ogp.image} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}

        {(!loading && !ogp?.image) && (
          <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-sky-500 transition p-2">
            <span className="text-xl mb-1">📰</span>
            <span className="text-[10px] font-bold truncate max-w-[120px]">{domain}</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <p className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 group-hover:text-sky-400 transition">
            {loading ? url : (ogp?.title || url)}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
            {loading ? 'リンク先情報を取得中...' : (ogp?.description || 'クリックしてリンク先を表示')}
          </p>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-black/40 px-1.5 py-0.5 rounded truncate">
            {domain}
          </span>
        </div>
      </div>
    </a>
  );
}

function renderMedia(url: string) {
  if (!url) return null;

  const getYouTubeId = (urlStr: string) => {
    const match = urlStr.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const getNicoNicoId = (urlStr: string) => {
    const match = urlStr.match(/nicovideo\.jp\/watch\/(sm\d+)/);
    return match ? match[1] : null;
  };

  const youtubeId = getYouTubeId(url);
  const niconicoId = getNicoNicoId(url);

  if (youtubeId) {
    return (
      <div className="my-3 aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-lg bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube Video"
        />
      </div>
    );
  }

  if (niconicoId) {
    return (
      <div className="my-3 aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-lg bg-black">
        <iframe
          src={`https://embed.nicovideo.jp/watch/${niconicoId}`}
          className="w-full h-full"
          allowFullScreen
          title="Niconico Video"
        />
      </div>
    );
  }

  if (url.includes('tiktok.com')) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="my-3 flex items-center gap-3 bg-black/40 border border-sky-500/30 p-3 rounded-xl hover:border-sky-500 transition group"
      >
        <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0 text-pink-400 font-bold">
          🎵
        </div>
        <div className="flex-1 truncate">
          <h4 className="text-xs font-bold text-white group-hover:text-sky-400 transition truncate">TikTok 動画リンク</h4>
          <p className="text-[10px] text-gray-400 truncate">{url}</p>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-500 shrink-0" />
      </a>
    );
  }

  return <LinkPreviewCard url={url} />;
}

function renderContentWithEmbed(content: string, theme?: string) {
  const text = content || '';

  const youtubeMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  const niconicoMatch = text.match(/(?:nicovideo\.jp\/watch\/|nico\.ms\/)(sm\d+)/);
  const xMatch = text.match(/(https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^\s]+)/);
  const imageMatch = text.match(/(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s]*)?)/i);
  const generalUrlMatch = text.match(/(https?:\/\/[^\s]+)/);

  const renderTextWithLinks = (inputText: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = inputText.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 hover:underline break-all font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2">
      <p className="whitespace-pre text-gray-900 text-xs leading-tight font-mono tracking-tighter overflow-x-auto">
        {renderTextWithLinks(text)}
      </p>

      {youtubeMatch && (
        <div className="my-3 aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-lg bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeMatch[1]}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube Video"
          />
        </div>
      )}

      {niconicoMatch && (
        <div className="my-3 aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-lg bg-black">
          <iframe
            src={`https://embed.nicovideo.jp/watch/${niconicoMatch[1]}`}
            className="w-full h-full"
            allowFullScreen
            title="Niconico Video"
          />
        </div>
      )}

      {xMatch && <TwitterEmbed url={xMatch[1]} />}

      {imageMatch ? (
        <div className="my-3 max-w-lg rounded-xl overflow-hidden border border-gray-200 dark:border-[#2f3336] bg-black/5 flex justify-center">
          <img src={imageMatch[1]} alt="Attached media" className="max-h-96 w-auto object-contain" />
        </div>
      ) : (
        !youtubeMatch && !niconicoMatch && !xMatch && generalUrlMatch && (
          <LinkPreviewCard url={generalUrlMatch[1]} />
        )
      )}
    </div>
  );
}
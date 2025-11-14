import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  runTransaction,
  increment,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { auth, googleProvider, db, storage } from "./firebase-init.js";

const state = {
  boards: [],
  topics: [],
  posts: [],
  trending: [],
  moderators: [],
  events: [],
  currentBoardId: null,
  currentTopicId: null,
  currentUser: null,
  boardFilter: "",
  topicFilter: "all",
  topicSort: "active",
  following: [],
  followingSet: new Set(),
  unsubBoards: null,
  unsubTopics: null,
  unsubPosts: null,
  unsubStats: null,
  unsubFollow: null,
  attemptedSeed: false,
  viewedPosts: new Set(),
  replyingTo: null,
  totalPostsCount: 0,
  totalTopicsCount: 0,
  uniqueAuthors: new Set(),
  userProfile: null,
  notifications: [],
  unsubNotifications: null,
};

const selectors = {
  header: document.querySelector(".site-header"),
  page: document.querySelector(".page"),
  mobileMenuToggle: document.getElementById("mobileMenuToggle"),
  createTopicAction: document.getElementById("createTopicAction"),
  heroCreateTopic: document.getElementById("heroCreateTopic"),
  heroViewBoards: document.getElementById("heroViewBoards"),
  themeToggle: document.getElementById("themeToggle"),
  boardList: document.getElementById("boardList"),
  boardSkeleton: document.getElementById("boardSkeleton"),
  boardEmptyState: document.getElementById("boardEmptyState"),
  boardRefreshButton: document.getElementById("boardRefreshButton"),
  boardSearchInput: document.getElementById("board-search-input"),
  boardTitle: document.getElementById("boardTitle"),
  boardDescription: document.getElementById("boardDescription"),
  boardStatTopics: document.getElementById("boardStatTopics"),
  boardStatPosts: document.getElementById("boardStatPosts"),
  boardStatMembers: document.getElementById("boardStatMembers"),
  topicTableBody: document.getElementById("topicTableBody"),
  topicsSkeleton: document.getElementById("topicsSkeleton"),
  topicsEmptyState: document.getElementById("topicsEmptyState"),
  topicFilterSelect: document.getElementById("topicFilterSelect"),
  topicSortSelect: document.getElementById("topicSortSelect"),
  openCreateTopicButtons: [
    document.getElementById("openCreateTopic"),
    document.getElementById("emptyCreateTopic"),
  ].filter(Boolean),
  boardsBackButton: document.getElementById("boardsBackButton"),
  topicDetail: document.getElementById("topicDetail"),
  topicDetailTitle: document.getElementById("topicDetailTitle"),
  topicDetailMeta: document.getElementById("topicDetailMeta"),
  topicDetailTags: document.getElementById("topicDetailTags"),
  topicDetailReplies: document.getElementById("topicDetailReplies"),
  topicDetailViews: document.getElementById("topicDetailViews"),
  topicDetailWatchers: document.getElementById("topicDetailWatchers"),
  closeTopicDetail: document.getElementById("closeTopicDetail"),
  postList: document.getElementById("postList"),
  replyAuthNotice: document.getElementById("replyAuthNotice"),
  replyForm: document.getElementById("replyForm"),
  replyText: document.getElementById("replyText"),
  replySubmit: document.getElementById("replySubmit"),
  replyAttachmentInput: document.getElementById("replyAttachmentInput"),
  replyAttachmentName: document.getElementById("replyAttachmentName"),
  topicDialog: document.getElementById("topicDialog"),
  createTopicForm: document.getElementById("createTopicForm"),
  topicBoardSelect: document.getElementById("topicBoardSelect"),
  topicTitleInput: document.getElementById("topicTitleInput"),
  topicBodyInput: document.getElementById("topicBodyInput"),
  topicTagsInput: document.getElementById("topicTagsInput"),
  topicCoverInput: document.getElementById("topicCoverInput"),
  topicDialogSubmit: document.getElementById("topicDialogSubmit"),
  boardDialog: document.getElementById("boardDialog"),
  createBoardButton: document.getElementById("createBoardButton"),
  createBoardAction: document.getElementById("createBoardAction"),
  bottomNav: document.getElementById("bottomNav"),
  mobileCreateTopic: document.getElementById("mobileCreateTopic"),
  mobileNotifications: document.getElementById("mobileNotifications"),
  mobileNotificationsBadge: document.getElementById("mobileNotificationsBadge"),
  mobileProfile: document.getElementById("mobileProfile"),
  mobileProfileAvatar: document.getElementById("mobileProfileAvatar"),
  boardTitleInput: document.getElementById("boardTitleInput"),
  boardDescriptionInput: document.getElementById("boardDescriptionInput"),
  boardIconInput: document.getElementById("boardIconInput"),
  boardDialogSubmit: document.getElementById("boardDialogSubmit"),
  createBoardForm: document.getElementById("createBoardForm"),
  authDialog: document.getElementById("authDialog"),
  authDialogTitle: document.getElementById("authDialogTitle"),
  authTabs: document.querySelectorAll(".auth-tab"),
  signInForm: document.getElementById("signInForm"),
  signUpForm: document.getElementById("signUpForm"),
  resetPasswordForm: document.getElementById("resetPasswordForm"),
  googleSignIn: document.getElementById("googleSignIn"),
  openSignIn: document.getElementById("openSignIn"),
  openSignUp: document.getElementById("openSignUp"),
  authActions: document.getElementById("authActions"),
  userMenu: document.getElementById("userMenu"),
  userMenuTrigger: document.getElementById("userMenuTrigger"),
  userAvatar: document.getElementById("userAvatar"),
  userDisplayName: document.getElementById("userDisplayName"),
  userEmailLabel: document.getElementById("userEmailLabel"),
  userStatusLabel: document.getElementById("userStatusLabel"),
  signOutButton: document.getElementById("signOutButton"),
  refreshTrending: document.getElementById("refreshTrending"),
  trendingList: document.getElementById("trendingList"),
  messageArea: document.getElementById("messageArea"),
  statTopics: document.getElementById("statTopics"),
  statPosts: document.getElementById("statPosts"),
  statBoards: document.getElementById("statBoards"),
  footerYear: document.getElementById("footerYear"),
  openSignInButtons: [document.getElementById("createTopicAction"), document.getElementById("openSignIn"), document.getElementById("openSignUp")].filter(Boolean),
  followedPostsList: document.getElementById("followed-posts"),
  notificationsMenu: document.getElementById("notificationsMenu"),
  notificationsTrigger: document.getElementById("notificationsTrigger"),
  notificationsBadge: document.getElementById("notificationsBadge"),
  notificationsDropdown: document.getElementById("notificationsDropdown"),
  notificationsList: document.getElementById("notificationsList"),
  markAllReadButton: document.getElementById("markAllReadButton"),
  profileDialog: document.getElementById("profileDialog"),
  profileAvatar: document.getElementById("profileAvatar"),
  profileName: document.getElementById("profileName"),
  profileEmail: document.getElementById("profileEmail"),
  profileMemberSince: document.getElementById("profileMemberSince"),
  profilePostCount: document.getElementById("profilePostCount"),
  profileReactionCount: document.getElementById("profileReactionCount"),
  profileTopicCount: document.getElementById("profileTopicCount"),
  profileActivityDays: document.getElementById("profileActivityDays"),
  profileExpertise: document.getElementById("profileExpertise"),
  profileTopPost: document.getElementById("profileTopPost"),
  profileActivity: document.getElementById("profileActivity"),
};

const numberFormatter = new Intl.NumberFormat("tr-TR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const timeFormatter = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });

const localeDateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatNumber(value) {
  if (typeof value !== "number") return "-";
  return numberFormatter.format(value);
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "-";
  let date;
  if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  if (Number.isNaN(date.getTime())) return "-";
  return localeDateFormatter.format(date);
}

function formatRelativeTimestamp(timestamp) {
  if (!timestamp) return "-";
  let date;
  if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }
  const now = Date.now();
  const diff = date.getTime() - now;
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(seconds) < 60) return timeFormatter.format(seconds, "seconds");
  if (Math.abs(minutes) < 60) return timeFormatter.format(minutes, "minutes");
  if (Math.abs(hours) < 48) return timeFormatter.format(hours, "hours");
  return timeFormatter.format(days, "days");
}

function firstLetter(value) {
  if (!value) return "?";
  return value.trim().charAt(0).toUpperCase();
}

function joinTags(tags) {
  return Array.isArray(tags) ? tags.join(", ") : tags || "";
}

function escapeHtml(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function getFollowButton(authorUid, authorName) {
  if (!authorUid) return "";
  if (state.currentUser && authorUid === state.currentUser.uid) {
    return "";
  }
  const encodedName = encodeURIComponent(authorName || "");
  const isFollowing = state.followingSet.has(authorUid);
  const label = isFollowing ? "Takiptesin" : "Takip Et";
  return `<button class="follow-chip${isFollowing ? " active" : ""}" data-follow-uid="${authorUid}" data-follow-name="${encodedName}">${label}</button>`;
}

function refreshFollowButtons(root = document) {
  const buttons = root.querySelectorAll?.("[data-follow-uid]") ?? [];
  buttons.forEach((button) => {
    const uid = button.dataset.followUid;
    if (!uid) {
      return;
    }
    const isFollowing = state.followingSet.has(uid);
    button.classList.toggle("active", isFollowing);
    button.textContent = isFollowing ? "Takiptesin" : "Takip Et";
  });
}

function updateFollowingState(following) {
  const next = Array.isArray(following) ? following.filter(Boolean) : [];
  state.following = next;
  state.followingSet = new Set(next);
  renderFollowedTopics();
  refreshFollowButtons();
  renderTopics();
}

function renderFollowedTopics() {
  const list = selectors.followedPostsList;
  if (!list) return;
  list.innerHTML = "";

  if (!state.currentUser) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Takip etmek için giriş yapın.";
    list.append(empty);
    return;
  }

  if (!state.following.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Henüz kimseyi takip etmiyorsun.";
    list.append(empty);
    return;
  }

  const followedTopics = state.topics.filter((topic) =>
    state.followingSet.has(topic.authorUid)
  );

  if (!followedTopics.length) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "Takip ettiğin kullanıcılardan yeni konu yok.";
    list.append(empty);
    return;
  }

  const boardsById = state.boards.reduce((map, board) => {
    map[board.id] = board.title;
    return map;
  }, {});

  followedTopics.slice(0, 10).forEach((topic) => {
    const item = document.createElement("li");
    item.className = "profile-post-item";
    item.dataset.topicId = topic.id;
    item.dataset.boardId = topic.boardId;

    const boardTitle = boardsById[topic.boardId] || "-";
    item.innerHTML = `
      <span class="post-title">${escapeHtml(topic.title || "Konu")}</span>
      <span class="comment-meta">${escapeHtml(boardTitle)} • ${formatRelativeTimestamp(topic.createdAt)}</span>
    `;
    list.append(item);
  });
}

function subscribeToFollowDoc(uid) {
  if (state.unsubFollow) {
    state.unsubFollow();
    state.unsubFollow = null;
  }
  if (!uid) {
    updateFollowingState([]);
    return;
  }

  const followRef = doc(db, "userFollows", uid);
  state.unsubFollow = onSnapshot(
    followRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        updateFollowingState(Array.isArray(data.following) ? data.following : []);
      } else {
        updateFollowingState([]);
      }
    },
    (error) => {
      console.error("Takip listesi alınamadı", error);
      updateFollowingState([]);
    }
  );
}

async function handleFollowToggle(button) {
  const targetUid = button.dataset.followUid;
  const encodedName = button.dataset.followName || "";
  const targetName = decodeURIComponent(encodedName);
  if (!targetUid) return;

  if (!state.currentUser) {
    openAuthDialog("sign-in");
    showToast("Takip etmek için giriş yapın.", "info");
    return;
  }

  if (targetUid === state.currentUser.uid) {
    return;
  }

  const alreadyFollowing = state.followingSet.has(targetUid);
  const followRef = doc(db, "userFollows", state.currentUser.uid);

  try {
    button.disabled = true;
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(followRef);
      let following = [];
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.following)) {
          following = data.following.slice();
        }
      }
      const index = following.indexOf(targetUid);
      if (index >= 0) {
        following.splice(index, 1);
      } else {
        following.push(targetUid);
        // Takip edilen kullanıcıya bildirim gönder
        createNotification(targetUid, "follow", {});
      }
      transaction.set(followRef, { following }, { merge: true });
    });

    showToast(
      alreadyFollowing
        ? `${targetName || "Kullanıcı"} takibi bırakıldı.`
        : `${targetName || "Kullanıcı"} artık takipte.`,
      alreadyFollowing ? "info" : "success"
    );
  } catch (error) {
    console.error("Takip güncellenemedi", error);
    showToast("Takip durumu güncellenemedi.", "error");
  } finally {
    button.disabled = false;
  }
}

function showToast(message, type = "info") {
  if (!selectors.messageArea) return;
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <strong>${type === "error" ? "Hata" : type === "success" ? "Başarılı" : "Bilgi"}</strong>
    <span>${message}</span>
  `;
  selectors.messageArea.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 400);
  }, 4200);
}

function openDialog(dialog) {
  if (dialog && typeof dialog.showModal === "function" && !dialog.open) {
    dialog.showModal();
  }
}

function closeDialog(dialog) {
  if (dialog && dialog.open) {
    dialog.close();
  }
}

function setLoading(element, loading) {
  if (!element) return;
  element.disabled = Boolean(loading);
  element.dataset.loading = loading ? "true" : "false";
}

function toggleHeaderShadow() {
  if (!selectors.header) return;
  const shouldShow = window.scrollY > 6;
  selectors.header.dataset.shadow = shouldShow ? "true" : "false";
}

function toggleTheme(optionalTheme) {
  const current = document.body.classList.contains("theme-dark") ? "dark" : "light";
  const nextTheme = optionalTheme || (current === "dark" ? "light" : "dark");
  document.body.classList.toggle("theme-dark", nextTheme === "dark");
  document.body.classList.toggle("theme-light", nextTheme === "light");
  localStorage.setItem("borsaForumTheme", nextTheme);
}

function restoreTheme() {
  const stored = localStorage.getItem("borsaForumTheme");
  if (stored === "dark") {
    document.body.classList.remove("theme-light");
    document.body.classList.add("theme-dark");
  } else {
    document.body.classList.remove("theme-dark");
    document.body.classList.add("theme-light");
  }
}

function closeAllMenus() {
  selectors.userMenu?.classList.remove("open");
  selectors.header?.classList.remove("open");
}

function handleDocumentClick(event) {
  const { userMenu } = selectors;
  if (userMenu && userMenu.classList.contains("open")) {
    if (!userMenu.contains(event.target)) {
      userMenu.classList.remove("open");
    }
  }
}

async function maybeSeedDemoData() {
  if (state.attemptedSeed) {
    return;
  }
  state.attemptedSeed = true;
  try {
    const markerRef = doc(db, "forumMeta", "seed");
    const snapshot = await getDoc(markerRef);
    if (snapshot.exists() && snapshot.data().seeded) {
      return;
    }

    const batchBoards = [
      {
        title: "BIST100 Analizleri",
        description: "Endeks bazlı teknik ve temel değerlendirmeler, haftalık stratejiler.",
        icon: "📈",
        order: 1,
      },
      {
        title: "Hisse Senedi Sohbeti",
        description: "Şirket haberleri, bilanço yorumları ve hisse bazlı tartışmalar.",
        icon: "🏢",
        order: 2,
      },
      {
        title: "VİOP & Türev Ürünler",
        description: "Vadeli işlemler, opsiyon stratejileri ve risk yönetimi önerileri.",
        icon: "⚙️",
        order: 3,
      },
    ];

    const now = serverTimestamp();
    const boardRefs = [];
    for (const board of batchBoards) {
      const refBoard = await addDoc(collection(db, "forumBoards"), {
        ...board,
        createdAt: now,
        topicCount: 0,
        postCount: 0,
        memberCountEstimate: Math.floor(Math.random() * 4000 + 800),
        lastTopicTitle: null,
        lastActivityAt: now,
        lastAuthor: null,
      });
      boardRefs.push({ id: refBoard.id, ...board });
    }

    // Create sample topic per board
    for (const board of boardRefs) {
      const topicRef = await addDoc(collection(db, "forumTopics"), {
        boardId: board.id,
        title: `${board.title} İçin Genel Başlık`,
        body: `Merhaba yatırımcılar, ${board.title.toLowerCase()} üzerine fikir ve beklentilerinizi paylaşın.`,
        tags: ["bist", "analiz"],
        authorUid: "seed-user",
        authorName: "BorsaForum Editörü",
        authorAvatar: "BF",
        createdAt: now,
        lastReplyAt: now,
        lastReplyAuthor: "BorsaForum Editörü",
        replyCount: 1,
        viewCount: Math.floor(Math.random() * 200 + 120),
        watcherCount: Math.floor(Math.random() * 20 + 5),
        isPinned: board.order === 1,
      });

      await addDoc(collection(db, "forumPosts"), {
        boardId: board.id,
        topicId: topicRef.id,
        body: `Bu başlık altında ${board.title.toLowerCase()} ile ilgili tüm gelişmeleri konuşabiliriz. Güncel stratejilerinizi, teknik analizlerinizi ve şirket haberlerini paylaşmayı unutmayın.`,
        authorUid: "seed-user",
        authorName: "BorsaForum Editörü",
        authorAvatar: "BF",
        createdAt: now,
        likes: 3,
        reactions: {
          "👍": ["seed-user-1", "seed-user-2", "seed-user-3"],
          "❤️": ["seed-user-1"],
        },
        viewCount: Math.floor(Math.random() * 50 + 10),
        attachmentUrl: null,
      });

      await updateDoc(doc(db, "forumBoards", board.id), {
        topicCount: increment(1),
        postCount: increment(1),
        lastTopicTitle: `${board.title} İçin Genel Başlık`,
        lastActivityAt: now,
        lastAuthor: "BorsaForum Editörü",
      });
    }

    await setDoc(markerRef, { seeded: true, seededAt: now }, { merge: true });

    await setDoc(doc(db, "forumMeta", "global"), {
      memberCount: 5400,
      topicCount: boardRefs.length,
      postCount: boardRefs.length,
      eventCount: 6,
      statsUpdatedAt: now,
    }, { merge: true });

    await setDoc(doc(db, "forumMeta", "events"), {
      highlight: "Borsa İstanbul genel forumu başlatıldı.",
      updatedAt: now,
    }, { merge: true });

    showToast("Demo forum verileri yüklendi. Hoş geldiniz!", "success");
  } catch (error) {
    console.error("Demo verisi oluşturulamadı", error);
  }
}

function renderBoardList() {
  const { boards } = state;
  const {
    boardList,
    boardSkeleton,
    boardEmptyState,
    boardSearchInput,
    currentBoardId,
  } = {
    boardList: selectors.boardList,
    boardSkeleton: selectors.boardSkeleton,
    boardEmptyState: selectors.boardEmptyState,
    boardSearchInput: selectors.boardSearchInput,
    currentBoardId: state.currentBoardId,
  };

  if (!boardList) return;
  boardList.innerHTML = "";

  if (boardSkeleton) boardSkeleton.style.display = "none";

  let filteredBoards = boards;
  const filter = state.boardFilter.trim().toLowerCase();
  if (filter) {
    filteredBoards = boards.filter((board) => {
      const haystack = `${board.title ?? ""} ${board.description ?? ""} ${
        Array.isArray(board.tags) ? board.tags.join(" ") : ""
      }`.toLowerCase();
      return haystack.includes(filter);
    });
  }

  if (!filteredBoards.length) {
    if (boardEmptyState) boardEmptyState.hidden = false;
    return;
  }

  if (boardEmptyState) boardEmptyState.hidden = true;

  filteredBoards.forEach((board) => {
    const item = document.createElement("li");
    item.className = "board-card";
    item.dataset.boardId = board.id;
    if (board.id === currentBoardId) {
      item.classList.add("active");
    }

    item.innerHTML = `
      <div class="board-card__icon">${board.icon || "📊"}</div>
      <div class="board-card__content">
        <div class="board-card__title">${board.title || "Forum"}</div>
        <p>${board.description || ""}</p>
        <div class="board-card__metrics">
          <span>${formatNumber(board.topicCount ?? 0)} konu</span>
          <span>${formatNumber(board.postCount ?? 0)} mesaj</span>
          <span>${formatNumber(board.memberCountEstimate ?? 0)} üye</span>
        </div>
        <div class="board-card__meta">
          <span>Son mesaj: <strong>${board.lastTopicTitle || "-"}</strong></span>
          <span>${board.lastActivityAt ? formatRelativeTimestamp(board.lastActivityAt) : "-"}</span>
        </div>
      </div>
    `;

    boardList.appendChild(item);
  });
  updateStats();
}

function showBoardsView() {
  // Topic detail'i gizle
  selectors.topicDetail?.setAttribute("hidden", "hidden");
  
  // Board listesini göster
  if (selectors.boardList) {
    const boardRail = selectors.boardList.closest(".board-rail");
    if (boardRail) {
      boardRail.removeAttribute("hidden");
    }
  }
  
  // Navbar'daki nav-link aktif durumunu güncelle
  document.querySelectorAll(".nav-link[data-view]").forEach(link => {
    link.classList.remove("active");
    if (link.dataset.view === "boards") {
      link.classList.add("active");
    }
  });
  
  // Bottom nav aktif durumunu güncelle
  if (selectors.bottomNav) {
    const items = selectors.bottomNav.querySelectorAll(".bottom-nav__item");
    items.forEach(item => item.classList.remove("active"));
    const boardsBtn = selectors.bottomNav.querySelector('[data-view="boards"]');
    if (boardsBtn) boardsBtn.classList.add("active");
  }
  
  // Forumlar listesine scroll et
  const boardRail = selectors.boardList?.closest(".board-rail");
  if (boardRail) {
    const offsetTop = boardRail.offsetTop - 80; // Header yüksekliği için
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function selectBoard(boardId) {
  if (!boardId) return;
  const board = state.boards.find((item) => item.id === boardId);
  if (!board) return;

  state.currentBoardId = boardId;
  selectors.boardTitle.textContent = board.title || "Forum";
  selectors.boardDescription.textContent = board.description || "";
  selectors.boardStatTopics.textContent = formatNumber(board.topicCount ?? 0);
  selectors.boardStatPosts.textContent = formatNumber(board.postCount ?? 0);
  // Gerçek yazar sayısını göster
  selectors.boardStatMembers.textContent = formatNumber(state.uniqueAuthors.size || 0);

  renderBoardList();
  subscribeTopics(boardId);
  updateTopicBoardSelect();
  selectors.topicDetail?.setAttribute("hidden", "hidden");
  updateStats();
}

function renderTopics() {
  const { topics } = state;
  const { topicTableBody, topicsEmptyState, topicsSkeleton } = selectors;
  if (!topicTableBody) return;

  topicTableBody.innerHTML = "";
  if (topicsSkeleton) topicsSkeleton.style.display = "none";

  const filteredTopics = filterTopics(topics);
  const sortedTopics = sortTopics(filteredTopics);

  if (!sortedTopics.length) {
    if (topicsEmptyState) {
      topicsEmptyState.hidden = false;
      // Eğer gerçekten konu yoksa
      if (topics.length === 0) {
        const emptyTitle = document.getElementById("topicsEmptyTitle");
        const emptyMessage = document.getElementById("topicsEmptyMessage");
        if (emptyTitle) emptyTitle.textContent = "Bu forumda henüz konu yok";
        if (emptyMessage) emptyMessage.textContent = "İlk paylaşımı yaparak tartışmayı başlat.";
      } else {
        // Filtreleme sonrası boş liste
        const emptyTitle = document.getElementById("topicsEmptyTitle");
        const emptyMessage = document.getElementById("topicsEmptyMessage");
        if (emptyTitle) emptyTitle.textContent = "Filtreleme kriterlerinize uygun konu bulunamadı";
        if (emptyMessage) emptyMessage.textContent = "Farklı filtreler deneyin veya yeni bir konu açın.";
      }
    }
    renderFollowedTopics();
    return;
  }
  if (topicsEmptyState) topicsEmptyState.hidden = true;

  sortedTopics.forEach((topic) => {
    const row = document.createElement("tr");
    row.dataset.topicId = topic.id;
    const tagsText = topic.tags && topic.tags.length
      ? `#${topic.tags
          .slice(0, 3)
          .map((tag) => escapeHtml(tag))
          .join(" #")}`
      : "";
    const followButtonHtml = getFollowButton(topic.authorUid, topic.authorName);
    const shareButtons = getShareButtons(topic, "topic");
    row.innerHTML = `
      <td>
        <div class="topic-title">
          <div class="topic-title__main">
            <strong>${escapeHtml(topic.title || "Konu")}</strong>
            <span>${tagsText}</span>
          </div>
          <div class="topic-title__actions">${shareButtons}</div>
        </div>
      </td>
      <td>
        <div class="topic-meta">
          <span>${escapeHtml(topic.authorName || "Anonim")}</span>
          <span>${formatTimestamp(topic.createdAt)}</span>
          ${followButtonHtml}
        </div>
      </td>
      <td>${formatNumber(topic.replyCount ?? 0)}</td>
      <td>${formatNumber(topic.viewCount ?? 0)}</td>
      <td>
        <div class="topic-last-message">
          <span>${escapeHtml(topic.lastReplyAuthor || topic.authorName || "-")}</span>
          <time datetime="${topic.lastReplyAt?.toDate?.()?.toISOString?.() ?? ""}">
            ${formatRelativeTimestamp(topic.lastReplyAt)}
          </time>
        </div>
      </td>
    `;
    topicTableBody.appendChild(row);
    refreshFollowButtons(row);
    initShareButtons(row);
    initTopicProfileClicks(row);
  });
  renderFollowedTopics();
  updateStats();
}

function initTopicProfileClicks(container) {
  if (!container) return;
  
  // Topic'teki yazar adına tıklama
  const authorNames = container.querySelectorAll(".topic-meta span:first-child");
  authorNames.forEach((name) => {
    name.style.cursor = "pointer";
    name.addEventListener("click", (e) => {
      e.stopPropagation();
      const row = name.closest("tr");
      const topicId = row?.dataset.topicId;
      const topic = state.topics.find(t => t.id === topicId);
      if (topic?.authorUid) {
        showUserProfile(topic.authorUid, topic.authorName);
      }
    });
  });
}

function filterTopics(topics) {
  const filterValue = state.topicFilter;
  if (filterValue === "all") return [...topics];
  if (filterValue === "unanswered") {
    return topics.filter((topic) => (topic.replyCount ?? 0) <= 1);
  }
  if (filterValue === "watching") {
    if (!state.currentUser) return [];
    if (!state.followingSet.size) return [];
    return topics.filter((topic) => state.followingSet.has(topic.authorUid));
  }
  if (filterValue === "popular") {
    return topics.filter((topic) => (topic.replyCount ?? 0) > 5 || (topic.viewCount ?? 0) > 500);
  }
  return [...topics];
}

function sortTopics(topics) {
  const sortValue = state.topicSort;
  const cloned = [...topics];
  if (sortValue === "recent") {
    return cloned.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
  }
  if (sortValue === "views") {
    return cloned.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
  }
  if (sortValue === "replies") {
    return cloned.sort((a, b) => (b.replyCount ?? 0) - (a.replyCount ?? 0));
  }
  return cloned.sort((a, b) => getTime(b.lastReplyAt || b.createdAt) - getTime(a.lastReplyAt || a.createdAt));
}

function getTime(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime();
}

function renderTopicDetail(topic) {
  if (!topic || !selectors.topicDetail) return;
  selectors.topicDetailTitle.textContent = topic.title;
  const created = formatTimestamp(topic.createdAt);
  const relative = formatRelativeTimestamp(topic.createdAt);
  const followButton = getFollowButton(topic.authorUid, topic.authorName);
  const shareButtons = getShareButtons(topic, "topic");
  const metaSegments = [
    `<span>${escapeHtml(topic.authorName || "Anonim")}</span>`,
    `<span>${created} (${relative})</span>`,
  ];
  if (followButton) {
    metaSegments.push(followButton);
  }
  selectors.topicDetailMeta.innerHTML = metaSegments.join("");
  refreshFollowButtons(selectors.topicDetailMeta);
  initTopicDetailProfileClicks();
  selectors.topicDetailReplies.textContent = formatNumber(topic.replyCount ?? 0);
  selectors.topicDetailViews.textContent = formatNumber(topic.viewCount ?? 0);
  selectors.topicDetailWatchers.textContent = formatNumber(topic.watcherCount ?? 0);
  
  // Paylaşım butonlarını stats bölümüne ekle
  const statsContainer = selectors.topicDetail.querySelector(".topic-detail__stats");
  if (statsContainer) {
    const existingShare = statsContainer.querySelector(".share-menu");
    if (existingShare) {
      existingShare.remove();
    }
    const shareContainer = document.createElement("div");
    shareContainer.innerHTML = shareButtons;
    statsContainer.appendChild(shareContainer);
    initShareButtons(shareContainer);
  }
  
  selectors.topicDetailTags.innerHTML = "";
  if (Array.isArray(topic.tags)) {
    topic.tags.slice(0, 6).forEach((tag) => {
      const tagElement = document.createElement("span");
      tagElement.textContent = `#${tag}`;
      selectors.topicDetailTags.append(tagElement);
    });
  }
  selectors.topicDetail.removeAttribute("hidden");
}

function initTopicDetailProfileClicks() {
  const authorName = selectors.topicDetailMeta?.querySelector("span:first-child");
  if (authorName) {
    authorName.style.cursor = "pointer";
    authorName.addEventListener("click", () => {
      const topic = state.topics.find(t => t.id === state.currentTopicId);
      if (topic?.authorUid) {
        showUserProfile(topic.authorUid, topic.authorName);
      }
    });
  }
}

function renderPosts(posts) {
  if (!selectors.postList) return;
  selectors.postList.innerHTML = "";
  posts.forEach((post) => {
    const item = document.createElement("article");
    item.className = "post-item";
    const followButton = getFollowButton(post.authorUid, post.authorName);
    const topic = state.topics.find(t => t.id === post.topicId);
    const shareData = {
      id: post.id,
      topicId: post.topicId,
      title: topic?.title || "BorsaForum Konusu",
      body: post.body,
    };
    const shareButtons = getShareButtons(shareData, "post");
    const canDelete = state.currentUser && post.authorUid === state.currentUser.uid;
    const deleteButton = canDelete ? `<button class="post-delete-btn" data-post-id="${post.id}" type="button" title="Yorumu sil">
      <span class="icon icon-delete"></span>
      <span>Sil</span>
    </button>` : "";
    item.innerHTML = `
      ${deleteButton ? `<div class="post-actions">${deleteButton}</div>` : ""}
      <div class="post-author">
        <div class="post-author__avatar">${post.authorAvatar || firstLetter(post.authorName)}</div>
        <div class="post-author__meta">
          <strong>${escapeHtml(post.authorName || "Anonim")}</strong>
          <span>${formatTimestamp(post.createdAt)}</span>
          ${followButton}
        </div>
      </div>
      <div class="post-body">
        ${post.replyTo ? getReplyQuote(post.replyTo) : ""}
        <p>${formatBody(post.body)}</p>
        ${post.attachmentUrl ? `<img src="${post.attachmentUrl}" alt="${escapeHtml(post.authorName || "")} paylaşımı" loading="lazy" />` : ""}
        <div class="post-body__toolbar">
          <button class="post-reply-btn" data-post-id="${post.id}" type="button" title="Yanıtla">
            <span class="icon icon-reply"></span>
            <span>Yanıtla</span>
          </button>
          <div class="reactions">
            ${getReactionButtons(post)}
          </div>
          <span class="post-stats">
            <span class="post-view-count" title="Görüntülenme sayısı">
              <span class="icon icon-eye"></span>
              ${formatNumber(post.viewCount ?? 0)}
            </span>
          </span>
          <span class="post-time">${formatRelativeTimestamp(post.createdAt)}</span>
          ${shareButtons}
        </div>
      </div>
    `;
    selectors.postList.appendChild(item);
    refreshFollowButtons(item);
    initShareButtons(item);
    initReactionButtons(item);
    initReplyButtons(item);
    initDeleteButtons(item);
    initProfileClicks(item);
  });
  updateStats();
}

function initProfileClicks(container) {
  if (!container) return;
  
  // Avatar'a tıklama
  const avatars = container.querySelectorAll(".post-author__avatar");
  avatars.forEach((avatar) => {
    avatar.style.cursor = "pointer";
    avatar.addEventListener("click", (e) => {
      e.stopPropagation();
      const postItem = avatar.closest(".post-item");
      const postId = postItem?.querySelector("[data-post-id]")?.dataset.postId;
      const post = state.posts.find(p => p.id === postId);
      if (post?.authorUid) {
        showUserProfile(post.authorUid, post.authorName);
      }
    });
  });
  
  // İsme tıklama
  const names = container.querySelectorAll(".post-author__meta strong");
  names.forEach((name) => {
    name.style.cursor = "pointer";
    name.addEventListener("click", (e) => {
      e.stopPropagation();
      const postItem = name.closest(".post-item");
      const postId = postItem?.querySelector("[data-post-id]")?.dataset.postId;
      const post = state.posts.find(p => p.id === postId);
      if (post?.authorUid) {
        showUserProfile(post.authorUid, post.authorName);
      }
    });
  });
}

function formatBody(text) {
  if (!text) return "";
  return text
    .replace(/\n{2,}/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

function getReplyQuote(replyToData) {
  if (!replyToData || typeof replyToData !== "object") return "";
  const authorName = replyToData.authorName || "Anonim";
  const body = replyToData.body || "";
  const bodyPreview = body.length > 150 ? body.substring(0, 150) + "..." : body;
  
  return `
    <div class="post-quote">
      <div class="post-quote__header">
        <strong>${escapeHtml(authorName)}</strong>
        <span>dedi:</span>
      </div>
      <div class="post-quote__body">${formatBody(bodyPreview)}</div>
    </div>
  `;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎯", "💡"];

function getReactionButtons(post) {
  const reactions = post.reactions || {};
  const currentUserId = state.currentUser?.uid;
  
  return REACTION_EMOJIS.map((emoji) => {
    const userIds = reactions[emoji] || [];
    const count = userIds.length;
    const isActive = currentUserId && userIds.includes(currentUserId);
    
    return `
      <button 
        class="reaction-btn ${isActive ? "active" : ""}" 
        data-emoji="${emoji}" 
        data-post-id="${post.id}"
        type="button"
        aria-label="${emoji} reaksiyonu"
        title="${count > 0 ? `${count} kişi ${emoji} reaksiyonu verdi` : `${emoji} reaksiyonu ver`}"
      >
        <span class="reaction-emoji">${emoji}</span>
        ${count > 0 ? `<span class="reaction-count">${count}</span>` : ""}
      </button>
    `;
  }).join("");
}

async function handleReaction(postId, emoji) {
  if (!state.currentUser) {
    showToast("Reaksiyon vermek için giriş yapın.", "info");
    return;
  }
  
  try {
    const postRef = doc(db, "forumPosts", postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      showToast("Gönderi bulunamadı.", "error");
      return;
    }
    
    const postData = postDoc.data();
    const reactions = postData.reactions || {};
    const userIds = reactions[emoji] || [];
    const currentUserId = state.currentUser.uid;
    
    const isActive = userIds.includes(currentUserId);
    
    await runTransaction(db, async (transaction) => {
      const updatedReactions = { ...reactions };
      
      if (isActive) {
        // Reaksiyonu kaldır
        updatedReactions[emoji] = userIds.filter((id) => id !== currentUserId);
        if (updatedReactions[emoji].length === 0) {
          delete updatedReactions[emoji];
        }
      } else {
        // Reaksiyonu ekle
        updatedReactions[emoji] = [...userIds, currentUserId];
        // Bildirim oluştur (sadece ilk kez reaksiyon verildiğinde)
        if (userIds.length === 0 && postData.authorUid) {
          createNotification(postData.authorUid, "reaction", {
            postId: postId,
            topicId: postData.topicId,
          });
        }
      }
      
      transaction.update(postRef, {
        reactions: updatedReactions,
      });
    });
  } catch (error) {
    console.error("Reaksiyon güncellenemedi:", error);
    showToast("Reaksiyon güncellenirken bir hata oluştu.", "error");
  }
}

function getShareUrl(type, data) {
  const siteUrl = window.location.origin;
  const topicUrl = `${siteUrl}?topic=${data.topicId || data.id}`;
  const title = encodeURIComponent(data.title || "BorsaForum Konusu");
  const text = encodeURIComponent(
    data.body 
      ? `${data.title || "BorsaForum"}\n\n${data.body.substring(0, 200)}${data.body.length > 200 ? "..." : ""}`
      : title
  );
  
  switch (type) {
    case "twitter":
    case "x":
      return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(topicUrl)}`;
    case "whatsapp":
      return `https://wa.me/?text=${text}%20${encodeURIComponent(topicUrl)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(topicUrl)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(topicUrl)}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(topicUrl)}&text=${text}`;
    case "copy":
      return topicUrl;
    default:
      return topicUrl;
  }
}

function handleShare(type, data, event) {
  event?.preventDefault();
  const url = getShareUrl(type, data);
  
  if (type === "copy") {
    navigator.clipboard.writeText(url).then(() => {
      showToast("Link kopyalandı!", "success");
    }).catch(() => {
      showToast("Link kopyalanamadı.", "error");
    });
    return;
  }
  
  const width = 600;
  const height = 400;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  window.open(
    url,
    "share",
    `width=${width},height=${height},left=${left},top=${top},toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1`
  );
}

function getShareButtons(data, type = "topic") {
  const shareData = {
    id: data.id,
    topicId: data.topicId || data.id,
    title: data.title || "BorsaForum Konusu",
    body: data.body || "",
  };
  
  return `
    <div class="share-menu">
      <button class="share-trigger" type="button" aria-label="Paylaş">
        <span class="icon icon-share" aria-hidden="true"></span>
        <span>Paylaş</span>
      </button>
      <div class="share-dropdown">
        <button class="share-item" data-share="x" data-share-id="${shareData.topicId}" data-share-type="${type}">
          <span class="icon icon-x"></span>
          <span>X (Twitter)</span>
        </button>
        <button class="share-item" data-share="whatsapp" data-share-id="${shareData.topicId}" data-share-type="${type}">
          <span class="icon icon-whatsapp"></span>
          <span>WhatsApp</span>
        </button>
        <button class="share-item" data-share="facebook" data-share-id="${shareData.topicId}" data-share-type="${type}">
          <span class="icon icon-facebook"></span>
          <span>Facebook</span>
        </button>
        <button class="share-item" data-share="linkedin" data-share-id="${shareData.topicId}" data-share-type="${type}">
          <span class="icon icon-linkedin"></span>
          <span>LinkedIn</span>
        </button>
        <button class="share-item" data-share="telegram" data-share-id="${shareData.topicId}" data-share-type="${type}">
          <span class="icon icon-telegram"></span>
          <span>Telegram</span>
        </button>
        <hr />
        <button class="share-item" data-share="copy" data-share-id="${shareData.topicId}" data-share-type="${type}">
          <span class="icon icon-copy"></span>
          <span>Linki Kopyala</span>
        </button>
      </div>
    </div>
  `;
}

function initReactionButtons(container) {
  if (!container) return;
  
  const reactionButtons = container.querySelectorAll(".reaction-btn");
  reactionButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const emoji = button.dataset.emoji;
      const postId = button.dataset.postId;
      if (emoji && postId) {
        await handleReaction(postId, emoji);
      }
    });
  });
}

function initReplyButtons(container) {
  if (!container) return;
  
  const replyButtons = container.querySelectorAll(".post-reply-btn");
  replyButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const postId = button.dataset.postId;
      if (postId) {
        handleReplyToPost(postId);
      }
    });
  });
}

function initDeleteButtons(container) {
  if (!container) return;
  
  const deleteButtons = container.querySelectorAll(".post-delete-btn");
  deleteButtons.forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const postId = button.dataset.postId;
      if (postId) {
        await handleDeletePost(postId);
      }
    });
  });
}

async function handleDeletePost(postId) {
  if (!state.currentUser) {
    showToast("Yorum silmek için giriş yapın.", "info");
    return;
  }
  
  const post = state.posts.find((p) => p.id === postId);
  if (!post) {
    showToast("Yorum bulunamadı.", "error");
    return;
  }
  
  if (post.authorUid !== state.currentUser.uid) {
    showToast("Sadece kendi yorumlarınızı silebilirsiniz.", "error");
    return;
  }
  
  if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) {
    return;
  }
  
  try {
    // Yorumu sil
    await deleteDoc(doc(db, "forumPosts", postId));
    
    // Konu istatistiklerini güncelle
    if (post.topicId) {
      await updateDoc(doc(db, "forumTopics", post.topicId), {
        replyCount: increment(-1),
      });
    }
    
    // Board istatistiklerini güncelle
    if (post.boardId) {
      await updateDoc(doc(db, "forumBoards", post.boardId), {
        postCount: increment(-1),
      });
    }
    
    showToast("Yorum silindi.", "success");
  } catch (error) {
    console.error("Yorum silinemedi:", error);
    showToast("Yorum silinirken bir hata oluştu.", "error");
  }
}

function handleReplyToPost(postId) {
  if (!state.currentUser) {
    showToast("Yanıt vermek için giriş yapın.", "info");
    return;
  }
  
  const post = state.posts.find((p) => p.id === postId);
  if (!post) return;
  
  state.replyingTo = {
    postId: post.id,
    authorUid: post.authorUid,
    authorName: post.authorName,
    body: post.body,
  };
  
  // Alıntıyı göster
  const replyQuote = document.getElementById("replyQuote");
  const replyQuoteAuthor = document.getElementById("replyQuoteAuthor");
  const replyQuoteBody = document.getElementById("replyQuoteBody");
  const replyLabel = document.getElementById("replyLabel");
  
  if (replyQuote && replyQuoteAuthor && replyQuoteBody && replyLabel) {
    replyQuoteAuthor.textContent = post.authorName || "Anonim";
    replyQuoteBody.innerHTML = formatBody(post.body);
    replyLabel.textContent = `${post.authorName || "Kullanıcı"}'ya yanıt veriyorsunuz`;
    replyQuote.hidden = false;
  }
  
  // Formu göster ve scroll yap
  if (selectors.replyForm) {
    selectors.replyForm.hidden = false;
    selectors.replyForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    selectors.replyText?.focus();
  }
  
  if (selectors.replyAuthNotice) {
    selectors.replyAuthNotice.hidden = true;
  }
}

function initShareButtons(container) {
  if (!container) return;
  
  // Paylaşım menüsü toggle
  const triggers = container.querySelectorAll(".share-trigger");
  triggers.forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = trigger.closest(".share-menu");
      const dropdown = menu?.querySelector(".share-dropdown");
      if (dropdown) {
        const isOpen = dropdown.classList.contains("active");
        document.querySelectorAll(".share-dropdown").forEach((d) => d.classList.remove("active"));
        dropdown.classList.toggle("active", !isOpen);
      }
    });
  });
  
  // Paylaşım butonları
  const shareItems = container.querySelectorAll("[data-share]");
  shareItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const shareType = item.dataset.share;
      const shareId = item.dataset.shareId;
      const dataType = item.dataset.shareType;
      
      let data;
      if (dataType === "topic") {
        data = state.topics.find((t) => t.id === shareId);
      } else if (dataType === "post") {
        const post = state.posts.find((p) => p.id === shareId || p.topicId === shareId);
        const topic = state.topics.find((t) => t.id === (post?.topicId || shareId));
        data = {
          id: post?.id || shareId,
          topicId: post?.topicId || shareId,
          title: topic?.title || "BorsaForum Konusu",
          body: post?.body || "",
        };
      } else {
        data = { id: shareId, topicId: shareId, title: "BorsaForum Konusu", body: "" };
      }
      
      if (data) {
        handleShare(shareType, data, e);
        const dropdown = item.closest(".share-dropdown");
        if (dropdown) dropdown.classList.remove("active");
      }
    });
  });
}

function updateTopicBoardSelect() {
  if (!selectors.topicBoardSelect) return;
  selectors.topicBoardSelect.innerHTML = "";
  state.boards.forEach((board) => {
    const option = document.createElement("option");
    option.value = board.id;
    option.textContent = board.title;
    if (board.id === state.currentBoardId) {
      option.selected = true;
    }
    selectors.topicBoardSelect.append(option);
  });
}

function subscribeBoards() {
  if (state.unsubBoards) state.unsubBoards();
  if (selectors.boardSkeleton) selectors.boardSkeleton.style.display = "flex";
  const boardCollection = collection(db, "forumBoards");
  state.unsubBoards = onSnapshot(
    boardCollection,
    (snapshot) => {
      const boards = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      boards.sort((a, b) => {
        const orderDiff = (a.order ?? 999) - (b.order ?? 999);
        if (orderDiff !== 0) return orderDiff;
        return (a.title || "").localeCompare(b.title || "", "tr");
      });
      state.boards = boards;
      renderBoardList();
      renderFollowedTopics();
      updateStats();
      if (!boards.length) {
        if (selectors.boardEmptyState) selectors.boardEmptyState.hidden = false;
        maybeSeedDemoData();
      } else if (!state.currentBoardId) {
        selectBoard(boards[0].id);
      } else if (!boards.some((board) => board.id === state.currentBoardId)) {
        selectBoard(boards[0].id);
      }
    },
    (error) => {
      console.error("Forum listesi yüklenemedi", error);
      showToast("Forum listesi yüklenemedi. Lütfen tekrar deneyin.", "error");
      if (selectors.boardSkeleton) selectors.boardSkeleton.style.display = "none";
    }
  );
}

function subscribeTopics(boardId) {
  if (!boardId) return;
  if (state.unsubTopics) state.unsubTopics();
  if (selectors.topicsSkeleton) selectors.topicsSkeleton.style.display = "flex";
  if (selectors.topicsEmptyState) selectors.topicsEmptyState.hidden = true;

  const topicsQuery = query(
    collection(db, "forumTopics"),
    where("boardId", "==", boardId),
    orderBy("lastReplyAt", "desc"),
    limit(75)
  );

  state.unsubTopics = onSnapshot(
    topicsQuery,
    (snapshot) => {
      state.topics = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
      renderTopics();
      updateStats();
      if (selectors.topicsSkeleton) selectors.topicsSkeleton.style.display = "none";
    },
    (error) => {
      console.error("Konular alınamadı", error);
      if (error.code === "failed-precondition" && error.message.includes("index")) {
        const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
        showToast(
          `Konular için Firestore indeksi gerekiyor. ${indexUrl ? `Link: ${indexUrl}` : "Firebase Console > Firestore > Indexes bölümünden indeks oluşturun."}`,
          "error",
          10000
        );
      } else {
        showToast("Konular yüklenemedi. Lütfen tekrar deneyin.", "error");
      }
      if (selectors.topicsSkeleton) selectors.topicsSkeleton.style.display = "none";
      state.topics = [];
      renderTopics();
    }
  );
}

function subscribePosts(boardId, topicId) {
  if (!topicId) return;
  if (state.unsubPosts) state.unsubPosts();

  const postsQuery = query(
    collection(db, "forumPosts"),
    where("boardId", "==", boardId),
    where("topicId", "==", topicId),
    orderBy("createdAt", "asc")
  );

  state.unsubPosts = onSnapshot(
    postsQuery,
    async (snapshot) => {
      state.posts = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      renderPosts(state.posts);
      updateStats();
      
      // Post görüntülenme sayılarını artır
      for (const post of state.posts) {
        if (!state.viewedPosts.has(post.id)) {
          state.viewedPosts.add(post.id);
          try {
            await updateDoc(doc(db, "forumPosts", post.id), {
              viewCount: increment(1),
            });
          } catch (error) {
            console.warn("Görüntülenme sayısı artırılamadı:", error);
          }
        }
      }
    },
    (error) => {
      console.error("Gönderiler yüklenemedi", error);
      if (error.code === "failed-precondition" && error.message.includes("index")) {
        const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
        showToast(
          `Yorumlar için Firestore indeksi gerekiyor. ${indexUrl ? `Link: ${indexUrl}` : "Firebase Console > Firestore > Indexes bölümünden indeks oluşturun."}`,
          "error",
          10000
        );
      } else {
        showToast("Gönderiler alınamadı.", "error");
      }
      // Hata durumunda boş liste göster
      state.posts = [];
      renderPosts([]);
    }
  );
}

async function handleTopicSelection(topicId) {
  const topic = state.topics.find((item) => item.id === topicId);
  if (!topic) return;
  state.currentTopicId = topicId;
  renderTopicDetail(topic);
  subscribePosts(topic.boardId, topic.id);

  if (selectors.replyForm && selectors.replyAuthNotice) {
    if (state.currentUser) {
      selectors.replyForm.hidden = false;
      selectors.replyAuthNotice.hidden = true;
    } else {
      selectors.replyForm.hidden = true;
      selectors.replyAuthNotice.hidden = false;
    }
  }

  try {
    await updateDoc(doc(db, "forumTopics", topic.id), {
      viewCount: increment(1),
    });
  } catch (error) {
    console.warn("Görüntüleme artırılamadı", error);
  }
}

async function handleReplySubmit(event) {
  event.preventDefault();
  if (!state.currentUser) {
    showToast("Yanıt paylaşmak için lütfen giriş yapın.", "info");
    openAuthDialog("sign-in");
    return;
  }
  const text = selectors.replyText?.value.trim();
  if (!text) {
    showToast("Yanıt içeriği boş olamaz.", "error");
    return;
  }
  if (!state.currentTopicId || !state.currentBoardId) {
    showToast("Aktif bir konu seçiniz.", "error");
    return;
  }

  setLoading(selectors.replySubmit, true);
  try {
    let attachmentUrl = null;
    const file = selectors.replyAttachmentInput?.files?.[0];
    if (file) {
      const storageRef = ref(
        storage,
        `topicAttachments/${state.currentTopicId}/${Date.now()}-${file.name}`
      );
      await uploadBytes(storageRef, file);
      attachmentUrl = await getDownloadURL(storageRef);
    }

    const authorName = getUserDisplayName(state.currentUser, state.userProfile);
    const postPayload = {
      boardId: state.currentBoardId,
      topicId: state.currentTopicId,
      body: text,
      authorUid: state.currentUser.uid,
      authorName,
      authorAvatar: firstLetter(authorName),
      createdAt: serverTimestamp(),
      likes: 0,
      reactions: {},
      viewCount: 0,
      attachmentUrl,
    };
    
    // Eğer bir yoruma yanıt veriliyorsa, replyTo field'ını ekle
    if (state.replyingTo) {
      postPayload.replyTo = {
        postId: state.replyingTo.postId,
        authorName: state.replyingTo.authorName,
        body: state.replyingTo.body,
      };
    }

    const newPostRef = await addDoc(collection(db, "forumPosts"), postPayload);

    await updateDoc(doc(db, "forumTopics", state.currentTopicId), {
      replyCount: increment(1),
      lastReplyAt: serverTimestamp(),
      lastReplyAuthor: postPayload.authorName,
    });

    // Eğer bir yoruma yanıt veriliyorsa, yorum sahibine bildirim gönder
    if (state.replyingTo && state.replyingTo.authorUid) {
      createNotification(state.replyingTo.authorUid, "reply", {
        postId: newPostRef.id,
        topicId: state.currentTopicId,
      });
    }

    selectors.replyText.value = "";
    if (selectors.replyAttachmentInput) selectors.replyAttachmentInput.value = "";
    if (selectors.replyAttachmentName) selectors.replyAttachmentName.textContent = "";
    
    // Alıntıyı temizle
    state.replyingTo = null;
    const replyQuote = document.getElementById("replyQuote");
    const replyLabel = document.getElementById("replyLabel");
    if (replyQuote) replyQuote.hidden = true;
    if (replyLabel) replyLabel.textContent = "Yanıtınız";
    
    showToast("Yanıtınız paylaşıldı.", "success");
  } catch (error) {
    console.error("Yanıt kaydedilemedi", error);
    showToast("Yanıt kaydedilirken bir hata oluştu.", "error");
  } finally {
    setLoading(selectors.replySubmit, false);
  }
}

async function handleCreateTopic(event) {
  event.preventDefault();
  if (!state.currentUser) {
    openAuthDialog("sign-in");
    showToast("Konu açmak için giriş yapmalısınız.", "info");
    return;
  }
  const boardId = selectors.topicBoardSelect?.value;
  const title = selectors.topicTitleInput?.value.trim();
  const body = selectors.topicBodyInput?.value.trim();
  const tagsRaw = selectors.topicTagsInput?.value.trim();
  if (!boardId || !title || !body) {
    showToast("Lütfen tüm alanları doldurun.", "error");
    return;
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  setLoading(selectors.topicDialogSubmit, true);

  try {
    let coverUrl = null;
    const coverFile = selectors.topicCoverInput?.files?.[0];
    if (coverFile) {
      const coverRef = ref(
        storage,
        `topicCovers/${Date.now()}-${coverFile.name}`
      );
      await uploadBytes(coverRef, coverFile);
      coverUrl = await getDownloadURL(coverRef);
    }

    const authorName = getUserDisplayName(state.currentUser, state.userProfile);
    const newTopicRef = await addDoc(collection(db, "forumTopics"), {
      boardId,
      title,
      body,
      tags,
      coverUrl,
      authorUid: state.currentUser.uid,
      authorName,
      authorAvatar: firstLetter(authorName),
      createdAt: serverTimestamp(),
      lastReplyAt: serverTimestamp(),
      lastReplyAuthor: authorName,
      replyCount: 1,
      viewCount: 1,
      watcherCount: 1,
    });

    await addDoc(collection(db, "forumPosts"), {
      boardId,
      topicId: newTopicRef.id,
      body,
      authorUid: state.currentUser.uid,
      authorName,
      authorAvatar: firstLetter(authorName),
      createdAt: serverTimestamp(),
      likes: 0,
      reactions: {},
      viewCount: 0,
      attachmentUrl: coverUrl,
    });

    await updateDoc(doc(db, "forumBoards", boardId), {
      topicCount: increment(1),
      postCount: increment(1),
      lastTopicTitle: title,
      lastActivityAt: serverTimestamp(),
      lastAuthor: authorName,
    });

    closeDialog(selectors.topicDialog);
    selectors.createTopicForm?.reset();
    showToast("Yeni konu başarıyla oluşturuldu.", "success");
    selectBoard(boardId);
  } catch (error) {
    console.error("Konu oluşturulamadı", error);
    showToast("Konu oluşturulurken bir hata oluştu.", "error");
  } finally {
    setLoading(selectors.topicDialogSubmit, false);
  }
}

async function handleCreateBoard(event) {
  event.preventDefault();
  if (!state.currentUser) {
    showToast("Forum oluşturmak için giriş yapın.", "info");
    openAuthDialog("sign-in");
    return;
  }
  const title = selectors.boardTitleInput?.value.trim();
  const description = selectors.boardDescriptionInput?.value.trim();
  const icon = selectors.boardIconInput?.value.trim();
  if (!title || !description) {
    showToast("Başlık ve açıklama zorunludur.", "error");
    return;
  }
  setLoading(selectors.boardDialogSubmit, true);
  try {
    const order = (state.boards[state.boards.length - 1]?.order ?? 0) + 1;
    await addDoc(collection(db, "forumBoards"), {
      title,
      description,
      icon: icon || "📊",
      order,
      topicCount: 0,
      postCount: 0,
      memberCountEstimate: 0,
      createdAt: serverTimestamp(),
      lastTopicTitle: null,
      lastActivityAt: serverTimestamp(),
      lastAuthor: null,
    });
    selectors.createBoardForm?.reset();
    closeDialog(selectors.boardDialog);
    showToast("Yeni forum alanı eklendi.", "success");
  } catch (error) {
    console.error("Forum alanı eklenemedi", error);
    showToast("Forum alanı oluşturulamadı.", "error");
  } finally {
    setLoading(selectors.boardDialogSubmit, false);
  }
}

function openAuthDialog(view = "sign-in") {
  selectors.authTabs.forEach((tab) => {
    const tabView = tab.dataset.authView;
    tab.classList.toggle("active", tabView === view);
  });
  selectors.signInForm.hidden = view !== "sign-in";
  selectors.signUpForm.hidden = view !== "sign-up";
  selectors.resetPasswordForm.hidden = view !== "reset";
  selectors.authDialogTitle.textContent =
    view === "sign-in"
      ? "Hesabına Giriş Yap"
      : view === "sign-up"
      ? "Yeni Üyelik Oluştur"
      : "Parolanı Sıfırla";
  openDialog(selectors.authDialog);
}

async function handleSignIn(event) {
  event.preventDefault();
  const email = event.target.email.value.trim();
  const password = event.target.password.value.trim();
  if (!email || !password) {
    showToast("E-posta ve parola gerekli.", "error");
    return;
  }
  setLoading(event.submitter, true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    closeDialog(selectors.authDialog);
    showToast("Hoş geldin!", "success");
  } catch (error) {
    console.error("Giriş başarısız", error);
    showToast("Giriş başarısız. Bilgilerinizi kontrol edin.", "error");
  } finally {
    setLoading(event.submitter, false);
  }
}

async function handleSignUp(event) {
  event.preventDefault();
  const username = event.target.username?.value.trim();
  const email = event.target.email.value.trim();
  const password = event.target.password.value.trim();
  const confirmPassword = event.target.confirmPassword.value.trim();
  
  if (!username || !email || !password || !confirmPassword) {
    showToast("Tüm alanları doldurun.", "error");
    return;
  }
  
  if (username.length < 3 || username.length > 20) {
    showToast("Kullanıcı adı 3-20 karakter arasında olmalıdır.", "error");
    return;
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    showToast("Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.", "error");
    return;
  }
  
  if (password !== confirmPassword) {
    showToast("Parolalar eşleşmiyor.", "error");
    return;
  }
  
  setLoading(event.submitter, true);
  let credential = null;
  try {
    // Kullanıcı adının kullanılabilir olup olmadığını kontrol et
    const usernameCheck = await getDocs(
      query(collection(db, "userProfiles"), where("username", "==", username.toLowerCase()))
    );
    if (!usernameCheck.empty) {
      showToast("Bu kullanıcı adı zaten kullanılıyor.", "error");
      setLoading(event.submitter, false);
      return;
    }
    
    credential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Kullanıcı profilini oluştur
    try {
      await setDoc(doc(db, "userProfiles", credential.user.uid), {
        username: username.toLowerCase(),
        displayName: username,
        email: email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (profileError) {
      console.error("Profil oluşturulamadı, ancak hesap oluşturuldu", profileError);
      // Profil oluşturulamadı ama hesap oluşturuldu, kullanıcıya bilgi ver
      showToast("Hesap oluşturuldu ancak profil oluşturulurken bir sorun oluştu. Lütfen tekrar giriş yapın.", "warning");
      closeDialog(selectors.authDialog);
      setLoading(event.submitter, false);
      return;
    }
    
    await sendEmailVerification(credential.user);
    closeDialog(selectors.authDialog);
    showToast("Üyelik tamamlandı. Lütfen e-posta doğrulaması yapın.", "success");
  } catch (error) {
    console.error("Üyelik oluşturulamadı", error);
    
    // Eğer hesap oluşturuldu ama profil oluşturulamadıysa, kullanıcıyı bilgilendir
    if (credential && error.code === "permission-denied") {
      showToast("Hesap oluşturuldu ancak profil oluşturulurken izin hatası oluştu. Lütfen tekrar giriş yapın.", "warning");
    } else if (error.code === "auth/email-already-in-use") {
      showToast("Bu e-posta adresi zaten kullanılıyor.", "error");
    } else if (error.code === "auth/weak-password") {
      showToast("Parola çok zayıf. Daha güçlü bir parola seçin.", "error");
    } else {
      showToast("Üyelik oluşturulamadı: " + (error.message || "Bilinmeyen hata"), "error");
    }
  } finally {
    setLoading(event.submitter, false);
  }
}

async function handlePasswordReset(event) {
  event.preventDefault();
  const email = event.target.email.value.trim();
  if (!email) {
    showToast("E-posta adresini girin.", "error");
    return;
  }
  setLoading(event.submitter, true);
  try {
    await sendPasswordResetEmail(auth, email);
    showToast("Sıfırlama bağlantısı e-posta adresine gönderildi.", "success");
    closeDialog(selectors.authDialog);
  } catch (error) {
    console.error("Sıfırlama e-postası gönderilemedi", error);
    showToast("Sıfırlama e-postası gönderilemedi.", "error");
  } finally {
    setLoading(event.submitter, false);
  }
}

async function handleGoogleSignIn() {
  setLoading(selectors.googleSignIn, true);
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Kullanıcı profilini kontrol et, yoksa oluştur
    const profileRef = doc(db, "userProfiles", user.uid);
    const profileSnap = await getDoc(profileRef);
    
    if (!profileSnap.exists()) {
      // Google'dan gelen bilgileri kullan
      const displayName = user.displayName || user.email?.split("@")[0] || "Kullanıcı";
      const username = displayName.toLowerCase().replace(/[^a-z0-9_]/g, "_").substring(0, 20);
      
      // Kullanıcı adının benzersiz olduğundan emin ol
      let finalUsername = username;
      let counter = 1;
      while (true) {
        const check = await getDocs(
          query(collection(db, "userProfiles"), where("username", "==", finalUsername))
        );
        if (check.empty) break;
        finalUsername = `${username}${counter}`;
        counter++;
      }
      
      await setDoc(profileRef, {
        username: finalUsername,
        displayName: displayName,
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    closeDialog(selectors.authDialog);
    showToast("Google ile giriş yapıldı.", "success");
  } catch (error) {
    console.error("Google ile giriş başarısız", error);
    showToast("Google ile giriş başarısız.", "error");
  } finally {
    setLoading(selectors.googleSignIn, false);
  }
}

async function handleSignOut() {
  try {
    await signOut(auth);
    showToast("Oturum kapatıldı.", "success");
  } catch (error) {
    console.error("Çıkış yapılamadı", error);
    showToast("Oturum kapatılamadı.", "error");
  }
}

async function loadUserProfile(uid) {
  try {
    const profileRef = doc(db, "userProfiles", uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      state.userProfile = profileSnap.data();
      return state.userProfile;
    }
    return null;
  } catch (error) {
    console.error("Kullanıcı profili yüklenemedi", error);
    return null;
  }
}

function getUserDisplayName(user, profile = null) {
  if (profile?.displayName) return profile.displayName;
  if (user?.displayName) return user.displayName;
  if (user?.email) return user.email.split("@")[0];
  return "Kullanıcı";
}

async function updateAuthUI(user) {
  state.currentUser = user;
  if (!user) {
    state.userProfile = null;
    if (state.unsubFollow) {
      state.unsubFollow();
      state.unsubFollow = null;
    }
    if (state.unsubNotifications) {
      state.unsubNotifications();
      state.unsubNotifications = null;
    }
    updateFollowingState([]);
    state.notifications = [];
    selectors.authActions?.removeAttribute("hidden");
    selectors.userMenu?.setAttribute("hidden", "hidden");
    selectors.notificationsMenu?.setAttribute("hidden", "hidden");
    selectors.replyForm?.setAttribute("hidden", "hidden");
    selectors.replyAuthNotice?.removeAttribute("hidden");
    
    // Mobil bottom nav'i gizle
    if (selectors.bottomNav) {
      selectors.bottomNav.style.display = "none";
    }
    return;
  }

  // Kullanıcı profilini yükle
  await loadUserProfile(user.uid);

  if (selectors.authActions) selectors.authActions.hidden = true;
  if (selectors.userMenu) selectors.userMenu.hidden = false;
  if (selectors.notificationsMenu) selectors.notificationsMenu.hidden = false;
  if (selectors.replyForm && state.currentTopicId) selectors.replyForm.hidden = false;
  if (selectors.replyAuthNotice) selectors.replyAuthNotice.hidden = true;

  const displayName = getUserDisplayName(user, state.userProfile);
  const email = user.email || "-";
  selectors.userDisplayName.textContent = displayName;
  selectors.userEmailLabel.textContent = email;
  selectors.userAvatar.textContent = firstLetter(displayName);
  selectors.userStatusLabel.textContent = user.emailVerified ? "Doğrulanmış Üye" : "Ücretsiz Üye";
  
  // Mobil profil avatar'ını güncelle
  if (selectors.mobileProfileAvatar) {
    selectors.mobileProfileAvatar.textContent = firstLetter(displayName);
  }
  
  // Mobil bottom nav'i göster
  if (selectors.bottomNav && window.innerWidth <= 768) {
    selectors.bottomNav.style.display = "flex";
  }

  subscribeToFollowDoc(user.uid);
  subscribeToNotifications(user.uid);
}

function subscribeToNotifications(userId) {
  if (state.unsubNotifications) {
    state.unsubNotifications();
  }

  const notificationsQuery = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  state.unsubNotifications = onSnapshot(
    notificationsQuery,
    (snapshot) => {
      state.notifications = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      renderNotifications();
      updateNotificationBadge();
    },
    (error) => {
      console.error("Bildirimler yüklenemedi", error);
    }
  );
}

function renderNotifications() {
  const { notificationsList } = selectors;
  if (!notificationsList) return;

  if (state.notifications.length === 0) {
    notificationsList.innerHTML = `
      <div class="notifications-menu__empty">
        <p>Henüz bildirim yok</p>
      </div>
    `;
    return;
  }

  notificationsList.innerHTML = state.notifications
    .map((notif) => {
      const icon = getNotificationIcon(notif.type);
      const text = getNotificationText(notif);
      const time = formatRelativeTimestamp(notif.createdAt);
      const unreadClass = notif.read ? "" : "unread";

      return `
        <div class="notification-item ${unreadClass}" data-notification-id="${notif.id}">
          <div class="notification-item__icon">${icon}</div>
          <div class="notification-item__content">
            <div class="notification-item__text">${text}</div>
            <div class="notification-item__time">${time}</div>
          </div>
        </div>
      `;
    })
    .join("");

  // Bildirim tıklama olaylarını ekle
  notificationsList.querySelectorAll(".notification-item").forEach((item) => {
    item.addEventListener("click", () => {
      const notificationId = item.dataset.notificationId;
      const notification = state.notifications.find((n) => n.id === notificationId);
      if (notification) {
        markNotificationAsRead(notificationId);
        handleNotificationClick(notification);
      }
    });
  });
}

function getNotificationIcon(type) {
  const icons = {
    reaction: "👍",
    reply: "💬",
    follow: "👤",
    mention: "@",
  };
  return icons[type] || "🔔";
}

function getNotificationText(notification) {
  const { type, actorName, postId, topicId } = notification;
  
  switch (type) {
    case "reaction":
      return `<strong>${escapeHtml(actorName)}</strong> yorumunuza reaksiyon verdi`;
    case "reply":
      return `<strong>${escapeHtml(actorName)}</strong> yorumunuza yanıt verdi`;
    case "follow":
      return `<strong>${escapeHtml(actorName)}</strong> sizi takip etmeye başladı`;
    case "mention":
      return `<strong>${escapeHtml(actorName)}</strong> sizden bahsetti`;
    default:
      return "Yeni bildirim";
  }
}

function updateNotificationBadge() {
  const unreadCount = state.notifications.filter((n) => !n.read).length;
  const { notificationsBadge, mobileNotificationsBadge } = selectors;
  
  if (notificationsBadge) {
    if (unreadCount > 0) {
      notificationsBadge.textContent = unreadCount > 99 ? "99+" : unreadCount.toString();
      notificationsBadge.hidden = false;
    } else {
      notificationsBadge.hidden = true;
    }
  }
  
  // Mobil badge'i de güncelle
  if (mobileNotificationsBadge) {
    if (unreadCount > 0) {
      mobileNotificationsBadge.textContent = unreadCount > 99 ? "99+" : unreadCount.toString();
      mobileNotificationsBadge.hidden = false;
    } else {
      mobileNotificationsBadge.hidden = true;
    }
  }
}

async function createNotification(userId, type, data) {
  if (!state.currentUser || userId === state.currentUser.uid) {
    return; // Kendi kendine bildirim gönderme
  }

  try {
    const actorName = getUserDisplayName(state.currentUser, state.userProfile);
    await addDoc(collection(db, "notifications"), {
      userId,
      type,
      actorUid: state.currentUser.uid,
      actorName,
      postId: data.postId || null,
      topicId: data.topicId || null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Bildirim oluşturulamadı", error);
  }
}

async function markNotificationAsRead(notificationId) {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
    });
  } catch (error) {
    console.error("Bildirim okundu işaretlenemedi", error);
  }
}

async function markAllNotificationsAsRead() {
  const unreadNotifications = state.notifications.filter((n) => !n.read);
  if (unreadNotifications.length === 0) return;

  try {
    const batch = unreadNotifications.map((notif) =>
      updateDoc(doc(db, "notifications", notif.id), { read: true })
    );
    await Promise.all(batch);
  } catch (error) {
    console.error("Bildirimler okundu işaretlenemedi", error);
  }
}

function handleNotificationClick(notification) {
  if (notification.topicId) {
    // Topic'e git
    const topic = state.topics.find((t) => t.id === notification.topicId);
    if (topic) {
      if (topic.boardId !== state.currentBoardId) {
        selectBoard(topic.boardId);
        setTimeout(() => handleTopicSelection(notification.topicId), 300);
      } else {
        handleTopicSelection(notification.topicId);
      }
    }
  }
  // Bildirim menüsünü kapat
  selectors.notificationsMenu?.classList.remove("open");
}

async function showUserProfile(userId, userName) {
  if (!userId) return;
  
  try {
    // Kullanıcı profilini yükle
    const profileRef = doc(db, "userProfiles", userId);
    const profileSnap = await getDoc(profileRef);
    const profile = profileSnap.exists() ? profileSnap.data() : null;
    
    // Kullanıcının tüm yorumlarını ve konularını al
    const userPosts = state.posts.filter(p => p.authorUid === userId);
    const userTopics = state.topics.filter(t => t.authorUid === userId);
    
    // İstatistikleri hesapla
    const postCount = userPosts.length;
    const topicCount = userTopics.length;
    
    // Toplam reaksiyon sayısını hesapla
    let totalReactions = 0;
    userPosts.forEach(post => {
      if (post.reactions && typeof post.reactions === 'object') {
        Object.values(post.reactions).forEach(userIds => {
          if (Array.isArray(userIds)) {
            totalReactions += userIds.length;
          }
        });
      }
    });
    
    // En çok beğenilen yorumu bul
    let topPost = null;
    let maxReactions = 0;
    userPosts.forEach(post => {
      let postReactions = 0;
      if (post.reactions && typeof post.reactions === 'object') {
        Object.values(post.reactions).forEach(userIds => {
          if (Array.isArray(userIds)) {
            postReactions += userIds.length;
          }
        });
      }
      if (postReactions > maxReactions) {
        maxReactions = postReactions;
        topPost = post;
      }
    });
    
    // Aktif gün sayısını hesapla
    const activityDays = new Set();
    userPosts.forEach(post => {
      if (post.createdAt) {
        const date = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
        const dateStr = date.toISOString().split('T')[0];
        activityDays.add(dateStr);
      }
    });
    userTopics.forEach(topic => {
      if (topic.createdAt) {
        const date = topic.createdAt.toDate ? topic.createdAt.toDate() : new Date(topic.createdAt);
        const dateStr = date.toISOString().split('T')[0];
        activityDays.add(dateStr);
      }
    });
    
    // Uzmanlık alanlarını hesapla (en çok kullanılan etiketler)
    const tagCounts = {};
    userTopics.forEach(topic => {
      if (topic.tags && Array.isArray(topic.tags)) {
        topic.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
    
    // Üyelik tarihini hesapla
    let memberSince = "-";
    if (profile?.createdAt) {
      const date = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
      memberSince = formatTimestamp(date);
    } else if (userPosts.length > 0) {
      const firstPost = userPosts.sort((a, b) => {
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return aDate - bDate;
      })[0];
      if (firstPost.createdAt) {
        const date = firstPost.createdAt.toDate ? firstPost.createdAt.toDate() : new Date(firstPost.createdAt);
        memberSince = formatTimestamp(date);
      }
    }
    
    // Profil bilgilerini göster
    const displayName = profile?.displayName || userName || "Kullanıcı";
    const email = profile?.email || "-";
    
    selectors.profileAvatar.textContent = firstLetter(displayName);
    selectors.profileName.textContent = displayName;
    selectors.profileEmail.textContent = email;
    selectors.profileMemberSince.textContent = `Üyelik: ${memberSince}`;
    selectors.profilePostCount.textContent = formatNumber(postCount);
    selectors.profileReactionCount.textContent = formatNumber(totalReactions);
    selectors.profileTopicCount.textContent = formatNumber(topicCount);
    selectors.profileActivityDays.textContent = formatNumber(activityDays.size);
    
    // Uzmanlık alanları
    if (topTags.length > 0) {
      selectors.profileExpertise.innerHTML = topTags
        .map(tag => `<span class="expertise-tag">#${escapeHtml(tag)}</span>`)
        .join("");
    } else {
      selectors.profileExpertise.innerHTML = '<span class="muted">Henüz uzmanlık alanı yok</span>';
    }
    
    // En çok beğenilen yorum
    if (topPost && maxReactions > 0) {
      const topic = state.topics.find(t => t.id === topPost.topicId);
      selectors.profileTopPost.innerHTML = `
        <p><strong>${maxReactions} beğeni</strong></p>
        <p>${formatBody(topPost.body.substring(0, 200))}${topPost.body.length > 200 ? '...' : ''}</p>
        ${topic ? `<p class="muted" style="margin-top: 8px;">Konu: ${escapeHtml(topic.title)}</p>` : ''}
      `;
    } else {
      selectors.profileTopPost.innerHTML = '<p class="muted">Henüz beğenilen yorum yok</p>';
    }
    
    // Forum aktifliği
    const lastActivity = userPosts.length > 0 || userTopics.length > 0
      ? (() => {
          const allItems = [...userPosts, ...userTopics];
          const sorted = allItems.sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bDate - aDate;
          });
          return sorted[0]?.createdAt;
        })()
      : null;
    
    selectors.profileActivity.innerHTML = `
      <div class="activity-item">
        <span class="activity-label">Son aktivite</span>
        <span class="activity-value">${lastActivity ? formatRelativeTimestamp(lastActivity) : "-"}</span>
      </div>
      <div class="activity-item">
        <span class="activity-label">Aktif gün sayısı</span>
        <span class="activity-value">${formatNumber(activityDays.size)} gün</span>
      </div>
      <div class="activity-item">
        <span class="activity-label">Ortalama günlük yorum</span>
        <span class="activity-value">${activityDays.size > 0 ? (postCount / activityDays.size).toFixed(1) : "0"}</span>
      </div>
    `;
    
    // Dialog'u aç
    openDialog(selectors.profileDialog);
  } catch (error) {
    console.error("Profil yüklenemedi", error);
    showToast("Profil yüklenirken bir hata oluştu.", "error");
  }
}

function updateStats() {
  // Gerçek verilerden istatistikleri hesapla
  const boardCount = state.boards.length;
  
  // Toplam konu ve yorum sayılarını kullan
  const topicCount = state.totalTopicsCount || state.topics.length;
  const postCount = state.totalPostsCount || state.posts.length;
  
  if (selectors.statTopics) {
    selectors.statTopics.textContent = formatNumber(topicCount);
  }
  if (selectors.statPosts) {
    selectors.statPosts.textContent = formatNumber(postCount);
  }
  if (selectors.statBoards) {
    selectors.statBoards.textContent = formatNumber(boardCount);
  }
}

function subscribeStats() {
  // Tüm yorumları dinle
  const allPostsQuery = collection(db, "forumPosts");
  onSnapshot(allPostsQuery, (snapshot) => {
    state.totalPostsCount = snapshot.size;
    // Benzersiz yazarları hesapla (yorumlardan)
    const authors = new Set();
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.authorUid) {
        authors.add(data.authorUid);
      }
    });
    state.uniqueAuthors = authors;
    updateStats();
  }, (error) => {
    console.error("Tüm yorumlar alınamadı", error);
  });
  
  // Tüm konuları dinle
  const allTopicsQuery = collection(db, "forumTopics");
  onSnapshot(allTopicsQuery, (snapshot) => {
    state.totalTopicsCount = snapshot.size;
    // Benzersiz yazarları hesapla (konulardan da)
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.authorUid) {
        state.uniqueAuthors.add(data.authorUid);
      }
    });
    updateStats();
  }, (error) => {
    console.error("Tüm konular alınamadı", error);
  });
  
  // İlk yükleme için updateStats çağır
  updateStats();
}

async function loadTrendingTopics() {
  try {
    const trendingQuery = query(
      collection(db, "forumTopics"),
      orderBy("lastReplyAt", "desc"),
      limit(6)
    );
    const snapshot = await getDocs(trendingQuery);
    state.trending = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderTrending();
  } catch (error) {
    console.error("Trend konular alınamadı", error);
  }
}

function renderTrending() {
  if (!selectors.trendingList) return;
  selectors.trendingList.innerHTML = "";
  if (!state.trending.length) {
    selectors.trendingList.innerHTML = "<li class=\"trend-item\">Henüz trend konu yok.</li>";
    return;
  }
  state.trending.forEach((topic) => {
    const item = document.createElement("li");
    item.className = "trend-item";
    item.innerHTML = `
      <strong>${topic.title}</strong>
      <span>${topic.authorName || "Anonim"} • ${formatRelativeTimestamp(topic.lastReplyAt)}</span>
    `;
    item.addEventListener("click", () => {
      if (topic.boardId) {
        selectBoard(topic.boardId);
        setTimeout(() => handleTopicSelection(topic.id), 300);
      }
    });
    selectors.trendingList.append(item);
  });
}

async function loadEvents() {
  try {
    const eventQuery = query(collection(db, "forumEvents"), orderBy("startAt", "asc"), limit(6));
    const snapshot = await getDocs(eventQuery);
    state.events = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.warn("Takvim verisi bulunamadı, örnek veri kullanılacak.");
    state.events = [
      { id: "1", name: "TCMB Faiz Kararı", startAt: new Date(), type: "Makro" },
      { id: "2", name: "BIST100 Açılış", startAt: new Date(Date.now() + 86400000), type: "Piyasa" },
    ];
  }
  renderEvents();
}

function renderEvents() {
  if (!selectors.eventList) return;
  selectors.eventList.innerHTML = "";
  state.events.forEach((event) => {
    const item = document.createElement("li");
    item.className = "event-item";
    item.innerHTML = `
      <div class="event-item__date">${formatEventDate(event.startAt)}</div>
      <div class="event-item__meta">
        <strong>${event.name || "Etkinlik"}</strong>
        <span>${event.type || ""}</span>
      </div>
    `;
    selectors.eventList.append(item);
  });
}


function bindEvents() {
  selectors.footerYear.textContent = new Date().getFullYear().toString();
  document.addEventListener("scroll", toggleHeaderShadow);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("click", (event) => {
    const followButton = event.target.closest("[data-follow-uid]");
    if (followButton) {
      event.preventDefault();
      event.stopPropagation();
      handleFollowToggle(followButton);
      return;
    }
    
    // Paylaşım dropdown'larını kapat
    if (!event.target.closest(".share-menu")) {
      document.querySelectorAll(".share-dropdown").forEach((d) => d.classList.remove("active"));
    }
  });

  selectors.themeToggle?.addEventListener("click", () => toggleTheme());

  selectors.boardSearchInput?.addEventListener("input", (event) => {
    state.boardFilter = event.target.value;
    renderBoardList();
  });

  selectors.boardRefreshButton?.addEventListener("click", () => {
    subscribeBoards();
    showToast("Forum listesi güncelleniyor...", "info");
  });

  if (selectors.boardList) {
    selectors.boardList.addEventListener("click", (event) => {
      const listItem = event.target.closest(".board-card");
      if (!listItem) return;
      selectBoard(listItem.dataset.boardId);
    });
  }

  selectors.topicTableBody?.addEventListener("click", (event) => {
    const row = event.target.closest("tr");
    if (row?.dataset.topicId) {
      handleTopicSelection(row.dataset.topicId);
    }
  });

  selectors.followedPostsList?.addEventListener("click", (event) => {
    const item = event.target.closest("li[data-topic-id]");
    if (!item) return;
    event.preventDefault();
    event.stopPropagation();
    const boardId = item.dataset.boardId;
    const topicId = item.dataset.topicId;
    if (boardId && boardId !== state.currentBoardId) {
      selectBoard(boardId);
      setTimeout(() => handleTopicSelection(topicId), 200);
    } else {
      handleTopicSelection(topicId);
    }
  });

  selectors.topicFilterSelect?.addEventListener("change", (event) => {
    state.topicFilter = event.target.value;
    renderTopics();
  });

  selectors.topicSortSelect?.addEventListener("change", (event) => {
    state.topicSort = event.target.value;
    renderTopics();
  });

  selectors.closeTopicDetail?.addEventListener("click", () => {
    selectors.topicDetail?.setAttribute("hidden", "hidden");
    state.currentTopicId = null;
  });

  selectors.replyForm?.addEventListener("submit", handleReplySubmit);
  
  // Alıntı kapatma butonu
  document.getElementById("replyQuoteClose")?.addEventListener("click", () => {
    state.replyingTo = null;
    const replyQuote = document.getElementById("replyQuote");
    const replyLabel = document.getElementById("replyLabel");
    if (replyQuote) replyQuote.hidden = true;
    if (replyLabel) replyLabel.textContent = "Yanıtınız";
  });

  selectors.replyAttachmentInput?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    selectors.replyAttachmentName.textContent = file ? file.name : "";
  });

  selectors.createTopicForm?.addEventListener("submit", handleCreateTopic);
  selectors.createBoardForm?.addEventListener("submit", handleCreateBoard);

  selectors.openCreateTopicButtons.forEach((button) => {
    button?.addEventListener("click", () => {
      if (!state.currentUser) {
        openAuthDialog("sign-in");
        showToast("Yeni konu açmak için giriş yapın.", "info");
        return;
      }
      updateTopicBoardSelect();
      openDialog(selectors.topicDialog);
    });
  });

  selectors.createBoardButton?.addEventListener("click", () => {
    if (!state.currentUser) {
      openAuthDialog("sign-in");
      return;
    }
    openDialog(selectors.boardDialog);
  });

  selectors.createBoardAction?.addEventListener("click", () => {
    if (!state.currentUser) {
      openAuthDialog("sign-in");
      return;
    }
    openDialog(selectors.boardDialog);
  });

  // Mobil bottom navigation
  selectors.mobileCreateTopic?.addEventListener("click", () => {
    if (state.currentUser) {
      updateTopicBoardSelect();
      openDialog(selectors.topicDialog);
    } else {
      openAuthDialog("sign-in");
    }
  });

  selectors.mobileNotifications?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state.currentUser) {
      // Mobilde bildirim dropdown'ını göster
      const isOpen = selectors.notificationsMenu?.classList.contains("open");
      // Önce diğer menüleri kapat
      selectors.userMenu?.classList.remove("open");
      // Bildirim menüsünü toggle et
      selectors.notificationsMenu?.classList.toggle("open");
      
      // Mobilde dropdown'ı bottom nav'deki bildirimler butonunun hemen üstüne yerleştir
      if (selectors.notificationsDropdown && window.innerWidth <= 768) {
        const notificationsBtn = selectors.mobileNotifications;
        if (notificationsBtn) {
          // Her açılışta pozisyonu yeniden hesapla
          setTimeout(() => {
            const btnRect = notificationsBtn.getBoundingClientRect();
            
            // Butonun pozisyonuna göre dropdown'ı yerleştir - butonun hemen üstünde
            selectors.notificationsDropdown.style.position = "fixed";
            selectors.notificationsDropdown.style.top = "auto";
            
            // Butonun üst kenarından 12px yukarıda konumlandır
            const bottomPosition = window.innerHeight - btnRect.top + 12;
            selectors.notificationsDropdown.style.bottom = `${bottomPosition}px`;
            
            // Genişlik ve pozisyon ayarları
            if (window.innerWidth <= 480) {
              // Küçük ekranlarda tam genişlik
              selectors.notificationsDropdown.style.width = "calc(100vw - 16px)";
              selectors.notificationsDropdown.style.left = "8px";
              selectors.notificationsDropdown.style.right = "8px";
              selectors.notificationsDropdown.style.maxWidth = "none";
            } else {
              // Orta ekranlarda butonun merkezine hizala
              const dropdownWidth = Math.min(400, window.innerWidth - 24);
              const btnCenterX = btnRect.left + (btnRect.width / 2);
              const dropdownLeft = btnCenterX - (dropdownWidth / 2);
              
              // Ekran sınırlarını kontrol et
              if (dropdownLeft < 12) {
                selectors.notificationsDropdown.style.left = "12px";
                selectors.notificationsDropdown.style.right = "auto";
              } else if (dropdownLeft + dropdownWidth > window.innerWidth - 12) {
                selectors.notificationsDropdown.style.right = "12px";
                selectors.notificationsDropdown.style.left = "auto";
              } else {
                selectors.notificationsDropdown.style.left = `${dropdownLeft}px`;
                selectors.notificationsDropdown.style.right = "auto";
              }
              
              selectors.notificationsDropdown.style.width = `${dropdownWidth}px`;
              selectors.notificationsDropdown.style.maxWidth = "400px";
            }
            
            // Maksimum yükseklik - butonun üstünden ekranın üstüne kadar
            const availableHeight = btnRect.top - 20; // 20px üstten boşluk
            const maxHeight = Math.min(availableHeight, window.innerHeight - 120);
            selectors.notificationsDropdown.style.maxHeight = `${maxHeight}px`;
            
            // Z-index'i artır
            selectors.notificationsDropdown.style.zIndex = "1001";
          }, 0);
        }
      }
    } else {
      openAuthDialog("sign-in");
    }
  });

  selectors.mobileProfile?.addEventListener("click", () => {
    if (state.currentUser) {
      selectors.userMenu?.classList.toggle("open");
    } else {
      openAuthDialog("sign-in");
    }
  });

  // Navbar'daki nav-link butonları
  document.querySelectorAll(".nav-link[data-view]").forEach(link => {
    link.addEventListener("click", () => {
      const view = link.dataset.view;
      if (view === "boards") {
        showBoardsView();
      }
      // Mobil menüyü kapat
      selectors.header?.classList.remove("open");
    });
  });

  // Bottom nav'da forumlar butonu
  const bottomNavItems = selectors.bottomNav?.querySelectorAll(".bottom-nav__item[data-view]");
  bottomNavItems?.forEach(item => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;
      if (view === "boards") {
        showBoardsView();
      }
    });
  });
  
  // Bottom nav'da aktif durumu güncelle
  function updateBottomNavActive() {
    if (!selectors.bottomNav) return;
    const items = selectors.bottomNav.querySelectorAll(".bottom-nav__item");
    items.forEach(item => {
      item.classList.remove("active");
    });
    // Forumlar butonunu aktif yap
    const boardsBtn = selectors.bottomNav.querySelector('[data-view="boards"]');
    if (boardsBtn) {
      boardsBtn.classList.add("active");
    }
  }
  
  // İlk yüklemede aktif durumu ayarla
  updateBottomNavActive();

  document.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.closest("dialog")));
  });

  selectors.authTabs.forEach((tab) => {
    tab.addEventListener("click", () => openAuthDialog(tab.dataset.authView));
  });

  selectors.signInForm?.addEventListener("submit", handleSignIn);
  selectors.signUpForm?.addEventListener("submit", handleSignUp);
  selectors.resetPasswordForm?.addEventListener("submit", handlePasswordReset);
  selectors.googleSignIn?.addEventListener("click", handleGoogleSignIn);
  selectors.openSignIn?.addEventListener("click", () => openAuthDialog("sign-in"));
  selectors.openSignUp?.addEventListener("click", () => openAuthDialog("sign-up"));
  selectors.createTopicAction?.addEventListener("click", () => {
    if (!state.currentUser) {
      openAuthDialog("sign-in");
      return;
    }
    openDialog(selectors.topicDialog);
  });

  selectors.heroCreateTopic?.addEventListener("click", () => {
    if (!state.currentUser) {
      openAuthDialog("sign-up");
      return;
    }
    openDialog(selectors.topicDialog);
  });

  selectors.heroViewBoards?.addEventListener("click", () => {
    window.scrollTo({ top: selectors.boardList?.offsetTop ?? 0, behavior: "smooth" });
  });

  selectors.userMenuTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    selectors.userMenu?.classList.toggle("open");
    // Diğer menüleri kapat
    selectors.notificationsMenu?.classList.remove("open");
  });

  selectors.notificationsTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = selectors.notificationsMenu?.classList.contains("open");
    selectors.notificationsMenu?.classList.toggle("open");
    // Diğer menüleri kapat
    selectors.userMenu?.classList.remove("open");
    
    // Desktop'ta dropdown pozisyonunu ayarla
    if (selectors.notificationsDropdown && window.innerWidth > 768) {
      setTimeout(() => {
        const trigger = selectors.notificationsTrigger;
        if (trigger) {
          const triggerRect = trigger.getBoundingClientRect();
          
          // Desktop'ta fixed pozisyon, trigger'ın altında
          selectors.notificationsDropdown.style.position = "fixed";
          selectors.notificationsDropdown.style.top = `${triggerRect.bottom + 12}px`;
          selectors.notificationsDropdown.style.bottom = "auto";
          
          // Sağa hizala, ekran dışına taşmasın
          const dropdownWidth = 360;
          const rightPosition = window.innerWidth - triggerRect.right;
          const leftPosition = triggerRect.left;
          
          // Sağdan hizala, ekran dışına taşarsa sola kaydır
          if (rightPosition + dropdownWidth > window.innerWidth - 12) {
            selectors.notificationsDropdown.style.right = "12px";
            selectors.notificationsDropdown.style.left = "auto";
          } else {
            selectors.notificationsDropdown.style.right = `${rightPosition}px`;
            selectors.notificationsDropdown.style.left = "auto";
          }
          
          selectors.notificationsDropdown.style.width = `${dropdownWidth}px`;
          selectors.notificationsDropdown.style.maxWidth = "360px";
          selectors.notificationsDropdown.style.maxHeight = "500px";
          selectors.notificationsDropdown.style.zIndex = "1001";
        }
      }, 0);
    }
  });

  selectors.markAllReadButton?.addEventListener("click", async (event) => {
    event.stopPropagation();
    await markAllNotificationsAsRead();
  });

  // Dışarı tıklandığında menüleri kapat
  document.addEventListener("click", (event) => {
    // Bildirim menüsü kontrolü
    if (!event.target.closest(".notifications-menu") && !event.target.closest(".notifications-menu__dropdown")) {
      selectors.notificationsMenu?.classList.remove("open");
    }
    // Kullanıcı menüsü kontrolü
    if (!event.target.closest(".user-menu") && !event.target.closest(".user-menu__dropdown")) {
      selectors.userMenu?.classList.remove("open");
    }
    // Mobil menüyü kapat
    if (!event.target.closest(".site-header")) {
      selectors.header?.classList.remove("open");
    }
  });

  selectors.signOutButton?.addEventListener("click", handleSignOut);

  selectors.refreshTrending?.addEventListener("click", () => {
    loadTrendingTopics();
    showToast("Trend konular güncelleniyor...", "info");
  });


  selectors.mobileMenuToggle?.addEventListener("click", () => {
    selectors.header?.classList.toggle("open");
  });
}

function initializeAuthWatcher() {
  onAuthStateChanged(auth, (user) => {
    updateAuthUI(user);
  });
}

function loadTopicFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicId = urlParams.get("topic");
  if (topicId) {
    // Boards yüklendikten sonra topic'i aç
    const checkAndOpenTopic = () => {
      if (state.boards.length > 0) {
        const topic = state.topics.find((t) => t.id === topicId);
        if (topic) {
          if (topic.boardId !== state.currentBoardId) {
            selectBoard(topic.boardId);
            setTimeout(() => handleTopicSelection(topicId), 300);
          } else {
            handleTopicSelection(topicId);
          }
        } else {
          // Topic henüz yüklenmediyse, topics yüklendikten sonra tekrar dene
          setTimeout(checkAndOpenTopic, 500);
        }
      } else {
        setTimeout(checkAndOpenTopic, 200);
      }
    };
    checkAndOpenTopic();
  }
}

function init() {
  restoreTheme();
  bindEvents();
  initializeAuthWatcher();
  subscribeBoards();
  subscribeStats();
  loadTrendingTopics();
  toggleHeaderShadow();
  
  // URL'den topic yükle
  setTimeout(() => loadTopicFromUrl(), 1000);
}

init();

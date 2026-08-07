"use client";

import { useEffect, useState } from "react";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "./firebase";
import type { Language } from "./GeminiGuide";

const labels = {
  ko: {
    login: "Google로 로그인",
    logout: "로그아웃",
    loading: "확인 중",
    error: "로그인하지 못했습니다.",
  },
  en: {
    login: "Sign in with Google",
    logout: "Sign out",
    loading: "Checking",
    error: "Could not sign in.",
  },
  ja: {
    login: "Googleでログイン",
    logout: "ログアウト",
    loading: "確認中",
    error: "ログインできませんでした。",
  },
  zh: {
    login: "使用 Google 登录",
    logout: "退出登录",
    loading: "正在确认",
    error: "无法登录。",
  },
};

export default function GoogleAuthButton({ language }: { language: Language }) {
  const t = labels[language];
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void setPersistence(firebaseAuth, browserLocalPersistence);
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setReady(true);
    });
  }, []);

  const login = async () => {
    setBusy(true);
    setError("");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(firebaseAuth, provider);
    } catch (caught) {
      const code = (caught as { code?: string }).code || "";
      if (
        code === "auth/popup-blocked" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(firebaseAuth, provider);
        return;
      }
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      )
        setError(t.error);
    } finally {
      setBusy(false);
    }
  };

  if (!ready)
    return (
      <button className="google-auth-button" disabled>
        {t.loading}
      </button>
    );

  if (!user)
    return (
      <div className="google-auth-wrap">
        <button
          className="google-auth-button"
          onClick={login}
          disabled={busy}
          title={error || t.login}
        >
          <span aria-hidden="true">G</span>
          {busy ? t.loading : t.login}
        </button>
        {error && <small role="alert">{error}</small>}
      </div>
    );

  return (
    <div className="google-user">
      {user.photoURL ? (
        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
      ) : (
        <span>{(user.displayName || user.email || "G").slice(0, 1)}</span>
      )}
      <b title={user.email || ""}>{user.displayName || user.email}</b>
      <button onClick={() => void signOut(firebaseAuth)}>{t.logout}</button>
    </div>
  );
}

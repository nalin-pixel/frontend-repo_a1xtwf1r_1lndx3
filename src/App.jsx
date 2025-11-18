import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import Spline from '@splinetool/react-spline';
import html2canvas from 'html2canvas';

const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

const defaultToggles = {
  banner: true,
  avatar: true,
  displayName: true,
  username: true,
  bio: true,
  location: true,
  website: true,
  joined: true,
  followers: true,
  following: true,
  verified: true,
  milestone: false,
  footerCredit: true,
};

function parseUsernameFromUrl(url) {
  try {
    const u = new URL(url.trim());
    if (!['x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com', 'www.x.com'].includes(u.hostname)) return null;
    const path = u.pathname.replace(/^\//, '');
    const username = path.split('/')[0];
    if (!username) return null;
    return username;
  } catch (e) {
    // treat it as raw username fallback
    const candidate = url.replace('@', '').trim();
    if (/^[A-Za-z0-9_]{1,15}$/.test(candidate)) return candidate;
    return null;
  }
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-48 rounded-xl bg-slate-800/70" />
      <div className="h-6 w-2/3 rounded bg-slate-800/70" />
      <div className="h-4 w-1/2 rounded bg-slate-800/70" />
      <div className="h-24 rounded bg-slate-800/70" />
    </div>
  );
}

function VerifiedBadge() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1d9bf0" className="w-6 h-6 drop-shadow"><path d="M22.5 12c0-1.35-.77-2.5-1.88-3.05.44-1.15.2-2.5-.69-3.39-.89-.89-2.24-1.13-3.39-.69C15.06 3.77 13.9 3 12.6 3c-1.3 0-2.46.77-3.02 1.87-1.15-.44-2.5-.2-3.39.69-.89.89-1.13 2.24-.69 3.39C3.77 9.5 3 10.65 3 12c0 1.35.77 2.5 1.87 3.05-.44 1.15-.2 2.5.69 3.39.89.89 2.24 1.13 3.39.69.56 1.1 1.72 1.87 3.02 1.87 1.3 0 2.46-.77 3.02-1.87 1.15.44 2.5.2 3.39-.69.89-.89 1.13-2.24.69-3.39 1.11-.55 1.88-1.7 1.88-3.05z"/><path fill="#fff" d="M10.6 14.6 8.5 12.5l-1.1 1.1 3.2 3.2 6.2-6.2-1.1-1.1z"/></svg>
  );
}

export default function App() {
  const [input, setInput] = useState('https://x.com/elonmusk');
  const [toggles, setToggles] = useState(defaultToggles);
  const [milestoneText, setMilestoneText] = useState('10K followers!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const cardRef = useRef(null);

  const onLoadProfile = async () => {
    setError('');
    const username = parseUsernameFromUrl(input);
    if (!username) {
      setError('Please paste a valid X/Twitter profile URL or username.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/extract-profile?username=${encodeURIComponent(username)}`);
      if (!res.ok) {
        const t = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(t.message || 'Failed to load profile');
      }
      const data = await res.json();
      setProfile(data);
    } catch (e) {
      setError(e.message || 'Something went wrong fetching the profile');
    } finally {
      setLoading(false);
    }
  };

  const avatarHQ = useMemo(() => {
    if (!profile?.avatar) return undefined;
    return profile.avatar.replace('_normal.', '_400x400.');
  }, [profile]);

  const downloadPNG = async () => {
    if (!cardRef.current) return;
    const element = cardRef.current;
    const canvas = await html2canvas(element, {
      scale: 3,
      backgroundColor: toggles.banner ? undefined : '#0f172a',
      useCORS: true,
    });
    const link = document.createElement('a');
    const username = profile?.username || 'profile';
    link.download = `my-x-card-${username}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 opacity-20">
          <Spline scene="https://prod.spline.design/qQUip0dJPqrrPryE/scene.splinecode" />
        </div>
        <div className="relative container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-300 via-cyan-200 to-sky-400">
            X Profile Card Maker
          </h1>
          <p className="mt-4 text-slate-300 max-w-2xl mx-auto">
            Paste any X profile URL → customize → download a beautiful card to share your progress
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://x.com/username"
              className="w-full sm:w-[520px] rounded-xl bg-slate-900/70 border border-white/10 px-4 py-3 outline-none ring-0 focus:border-sky-500/50"
            />
            <button onClick={onLoadProfile} className="rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 px-6 py-3 font-semibold shadow-lg shadow-sky-500/20">
              Load Profile
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-400">Examples: https://x.com/elonmusk • https://twitter.com/naval • @jack</p>
          {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <section className="lg:col-span-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 sticky top-4">
            <h2 className="font-semibold mb-4 text-slate-200">Controls</h2>
            <div className="space-y-3">
              {Object.entries(defaultToggles).map(([key]) => (
                <label key={key} className="flex items-center gap-3 text-slate-300">
                  <input
                    type="checkbox"
                    checked={toggles[key]}
                    onChange={(e) => setToggles((t) => ({ ...t, [key]: e.target.checked }))}
                  />
                  <span className="capitalize">{key === 'avatar' ? 'Show profile picture' : key === 'footerCredit' ? 'Show footer credit' : `Show ${key}`}</span>
                </label>
              ))}
              {toggles.milestone && (
                <div className="mt-2">
                  <input
                    className="w-full rounded-lg bg-slate-800/60 border border-white/10 px-3 py-2 text-sm"
                    placeholder="Milestone text (e.g. 10K followers!)"
                    value={milestoneText}
                    onChange={(e) => setMilestoneText(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="lg:col-span-8">
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
            {loading && <Skeleton />}
            {!loading && profile && (
              <div className="flex flex-col items-center">
                <div
                  ref={cardRef}
                  className="w-[600px] max-w-full rounded-3xl overflow-hidden shadow-2xl shadow-black/40 relative"
                >
                  {/* Banner or background */}
                  {toggles.banner && profile.banner ? (
                    <div className="relative h-48 w-full">
                      <img src={profile.banner} alt="banner" className="h-full w-full object-cover" crossOrigin="anonymous"/>
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
                    </div>
                  ) : (
                    <div className="h-32 w-full bg-slate-900" />
                  )}

                  {/* Avatar */}
                  {toggles.avatar && (
                    <div className="px-6 -mt-16">
                      <img
                        src={avatarHQ}
                        alt={profile.displayName}
                        className="h-36 w-36 rounded-full border-4 border-white object-cover shadow-lg"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}

                  {/* Name & username */}
                  <div className="px-6 mt-4">
                    <div className="flex items-center gap-2">
                      {toggles.displayName && (
                        <h3 className="text-3xl md:text-4xl font-extrabold text-white">
                          {profile.displayName || profile.username}
                        </h3>
                      )}
                      {toggles.verified && profile.isBlueVerified && <VerifiedBadge />}
                    </div>
                    {toggles.username && (
                      <p className="text-slate-400 text-lg">@{profile.username}</p>
                    )}
                  </div>

                  {/* Bio */}
                  {toggles.bio && profile.bio && (
                    <div className="px-6 mt-4 text-slate-200 whitespace-pre-wrap">
                      {profile.bio}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="px-6 mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-300">
                    {toggles.followers && (
                      <div><span className="font-bold text-white">{Intl.NumberFormat().format(profile.followers || 0)}</span> Followers</div>
                    )}
                    {toggles.following && (
                      <div><span className="font-bold text-white">{Intl.NumberFormat().format(profile.following || 0)}</span> Following</div>
                    )}
                    {toggles.joined && profile.joined && (
                      <div>Joined {new Date(profile.joined).toLocaleString(undefined, { month: 'short', year: 'numeric' })}</div>
                    )}
                  </div>

                  {/* Location & website */}
                  {(toggles.location || toggles.website) && (
                    <div className="px-6 mt-3 pb-4 space-y-1 text-slate-300">
                      {toggles.location && profile.location && <div>📍 {profile.location}</div>}
                      {toggles.website && profile.website && (
                        <div>
                          🔗 <a href={profile.website} className="text-sky-400 hover:underline" target="_blank" rel="noreferrer">{profile.website}</a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Milestone */}
                  {toggles.milestone && (
                    <div className="px-6 py-8 text-center">
                      <div className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-400">
                        {milestoneText}
                      </div>
                    </div>
                  )}

                  {/* Footer credit */}
                  {toggles.footerCredit && (
                    <div className="px-6 pb-4">
                      <p className="text-[10px] text-slate-500">Made with X Profile Card Maker</p>
                    </div>
                  )}
                </div>

                <button onClick={downloadPNG} className="mt-6 rounded-xl bg-white text-slate-900 hover:bg-slate-100 px-6 py-3 font-semibold">
                  Download as PNG
                </button>
              </div>
            )}

            {!loading && !profile && (
              <div className="text-slate-400 text-center py-10">
                Load a profile to see the preview here.
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-10 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} X Profile Card Maker
      </footer>
    </div>
  );
}

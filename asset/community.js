/* Public community: existing Academy account, server-held session, text-only rendering. */
(function () {
  'use strict';
  const API = 'https://academy.upull.ai/api/website-community/';
  let user = null, posts = [], filter = 'all', postOffset = 0, loading = false;
  const threads = new Set(), drafts = new Map(), inFlight = new Set();
  let pending = [], reports = [], linkedPostShown = false;
  const byId = id => document.getElementById(id);
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = String(text);
    if (className) node.className = className;
    return node;
  }
  function button(text, action, className = 'bc-btn') {
    const node = element('button', text, className); node.type = 'button';
    node.addEventListener('click', action); return node;
  }
  function name(value) { return typeof value === 'string' && value.trim() && !value.includes('@') ? value.trim().slice(0, 80) : 'Community member'; }
  function when(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
  }
  function status(text) { byId('community-status').textContent = text; }
  async function api(path, body) {
    const response = await fetch(API + path, {method: body === undefined ? 'GET' : 'POST', credentials: 'include', cache: 'no-store',
      headers: {'X-Upull-Community':'1', ...(body === undefined ? {} : {'Content-Type':'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}), signal: AbortSignal.timeout(25000)});
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401) { user = null; authUI(); }
      throw new Error(typeof data?.detail === 'string' ? data.detail : response.status === 422 ? 'Please check your message and try again.' : 'The community service is unavailable. Please try again.');
    }
    return data;
  }
  function authUI() {
    byId('authSignedOut').style.display = user ? 'none' : 'flex';
    byId('authSignedIn').style.display = user ? 'flex' : 'none';
    byId('authName').textContent = user ? name(user.displayName) : '';
    byId('postText').disabled = !user;
    byId('postText').placeholder = user ? 'Write your idea, short blog or a link to a longer article…' : 'Sign in with your uPull.ai account to share an idea or blog.';
    byId('postSubmitBtn').disabled = !user;
    byId('postSubmitBtn').hidden = !user;
    byId('postSubmitBtn').textContent = 'Publish post';
    if (byId('bc-signedout')) byId('bc-signedout').style.display = user ? 'none' : 'flex';
    if (byId('bc-composer')) byId('bc-composer').style.display = user ? 'block' : 'none';
    byId('community-moderation').hidden = !user?.isAdmin;
    if (!user?.isAdmin) { pending = []; reports = []; byId('community-pending').replaceChildren(); byId('community-reports').replaceChildren(); }
  }
  async function loadSession() {
    const result = await api('session'); user = result.user; authUI();
  }
  function entryCard(entry) {
    const card = element('div', null, 'bc-item');
    card.append(element('div', `${name(entry.user)} · ${when(entry.createdAt)}`, 'bc-meta'), element('div', entry.text, 'bc-body'));
    return card;
  }
  async function showReplies(id, host, offset = 0) {
    try {
      const replies = await api(`posts/${encodeURIComponent(id)}/replies?offset=${offset}`);
      if (!threads.has(id) || !host.isConnected) return;
      if (offset === 0) host.replaceChildren();
      host.querySelector('[data-more-replies]')?.remove();
      if (!replies.length && offset === 0) host.append(element('p', 'No approved replies yet.', 'bc-note'));
      replies.forEach(reply => host.append(entryCard(reply)));
      if (replies.length === 100) {
        const more = button('Show more replies', () => { more.disabled = true; showReplies(id, host, offset + 100); });
        more.dataset.moreReplies = '1'; host.append(more);
      }
      if (offset > 0 || host.querySelector('form')) return;
      if (!user) { host.append(element('p', 'Sign in with your uPull.ai account above to reply.', 'bc-note')); return; }
      const form = element('form'), input = element('textarea'), message = element('p', '', 'bc-status');
      input.maxLength = 2000; input.required = true; input.value = drafts.get(id) || '';
      input.placeholder = 'Write a reply. It will be reviewed before publication.'; input.setAttribute('aria-label', 'Write a reply');
      input.addEventListener('input', () => drafts.set(id, input.value)); message.setAttribute('role', 'status');
      const send = element('button', 'Send for review', 'cta-btn'); send.type = 'submit';
      form.append(input, send, message);
      form.addEventListener('submit', async event => {
        event.preventDefault(); const text = input.value.trim(); if (!text || !user || send.disabled) return;
        send.disabled = true;
        try { await api(`posts/${encodeURIComponent(id)}/replies`, {text}); drafts.delete(id); input.value = ''; message.textContent = 'Your reply has been sent for approval.'; await loadModeration(); }
        catch (err) { message.textContent = err.message; }
        finally { send.disabled = false; }
      });
      host.append(form);
    } catch (err) { if (host.isConnected) host.append(element('p', err.message, 'bc-status')); }
  }
  function renderPosts() {
    const host = byId('forum-feed-target'); host.replaceChildren();
    if (!posts.length) host.append(element('p', 'No posts in this category yet. Share the first idea.', 'bc-note'));
    posts.forEach(post => {
      const card = element('article', null, 'forum-post');
      card.id = 'community-post-' + post.id;
      const category = ['clinical','operational','vendor'].includes(post.cat) ? post.cat : 'community'; card.dataset.type = category;
      const header = element('div', null, 'post-header'), person = element('div', null, 'post-user'), meta = element('div', null, 'user-meta');
      const displayName = name(post.user);
      meta.append(element('span', displayName, 'user-name'), element('span', 'Community member', 'user-role'));
      person.append(element('div', displayName.charAt(0), 'user-avatar'), meta);
      header.append(person, element('span', category, 'post-badge'));
      const text = element('p', post.text); text.style.whiteSpace = 'pre-wrap';
      const actions = element('div', null, 'post-actions');
      const like = button(`${post.likes} Likes${post.liked ? ' · Liked' : ''}`, async () => {
        if (!user) { status('Sign in with your uPull.ai account to like a post.'); return; }
        if (inFlight.has(post.id)) return; inFlight.add(post.id); like.disabled = true;
        try { const result = await api(`posts/${encodeURIComponent(post.id)}/like`, {}); post.likes = result.likes; post.liked = true; like.textContent = `${post.likes} Likes · Liked`; }
        catch (err) { status(err.message); like.disabled = false; }
        finally { inFlight.delete(post.id); }
      }, 'action-btn'); like.disabled = !!post.liked || inFlight.has(post.id); actions.append(like);
      const replyHost = element('section', null, 'forum-replies'); replyHost.hidden = !threads.has(post.id);
      const toggle = button(threads.has(post.id) ? 'Close replies' : 'Reply Thread', () => {
        if (threads.has(post.id)) { threads.delete(post.id); replyHost.hidden = true; toggle.textContent = 'Reply Thread'; }
        else { threads.add(post.id); replyHost.hidden = false; toggle.textContent = 'Close replies'; showReplies(post.id, replyHost); }
      }, 'action-btn'); actions.append(toggle);
      if (post.canDelete) actions.append(button('Remove post', () => removeEntry(post.id), 'action-btn'));
      else {
        const report = button(post.reported ? 'Reported' : 'Report', async () => {
          if (!user) { status('Sign in with your uPull.ai account to report a post.'); return; }
          const reason = prompt('Why are you reporting this post? (optional)', ''); if (reason === null) return;
          report.disabled = true;
          try { await api(`posts/${encodeURIComponent(post.id)}/report`, {reason: reason.slice(0,1000)}); post.reported = true; report.textContent = 'Reported'; status('Thank you. This post has been flagged for moderator review.'); }
          catch (err) { status(err.message); report.disabled = false; }
        }, 'action-btn'); report.disabled = !!post.reported; actions.append(report);
      }
      const permalink = element('a', when(post.createdAt));
      permalink.href = '#community-post-' + encodeURIComponent(post.id); permalink.title = 'Link to this post';
      actions.append(permalink);
      card.append(header, text, actions, replyHost); host.append(card);
      if (threads.has(post.id)) showReplies(post.id, replyHost);
    });
    if (!linkedPostShown && window.location.hash.startsWith('#community-post-')) {
      const linkedPost = document.getElementById(window.location.hash.slice(1));
      if (linkedPost) { linkedPostShown = true; linkedPost.scrollIntoView({block: 'start'}); }
    }
  }
  async function loadPosts(append = false) {
    const category = filter === 'all' ? '' : `&category=${encodeURIComponent(filter)}`;
    const result = await api(`posts?offset=${append ? postOffset : 0}${category}`);
    posts = append ? [...posts, ...result] : result; postOffset = posts.length;
    byId('forum-more').hidden = result.length < 50; renderPosts();
  }
  window.filterForum = async category => {
    filter = ['clinical','operational','vendor'].includes(category) ? category : 'all';
    try { await loadPosts(); } catch (err) { status(err.message); }
  };
  window.submitPost = async () => {
    if (!user) { status('Sign in with your uPull.ai account to post.'); return; }
    const text = byId('postText').value.trim(), category = byId('postCategory')?.value || 'operational';
    if (!text || text.length > 5000) { status('Please write a post of up to 5,000 characters.'); return; }
    const send = byId('postSubmitBtn'); if (send.disabled) return; send.disabled = true; send.textContent = 'Publishing…';
    try { await api('posts', {text, category}); byId('postText').value = ''; filter = 'all'; await loadPosts(); status('Your post is published.'); }
    catch (err) { status(err.message); }
    finally { authUI(); }
  };
  async function removeEntry(id) {
    if (!confirm('Remove this post from the public community?')) return;
    try { await api(`entries/${encodeURIComponent(id)}/delete`, {}); await loadPosts(); await loadModeration(); }
    catch (err) { status(err.message); }
  }
  window.signOutUser = async () => {
    try { await api('logout', {}); user = null; drafts.clear(); byId('postText').value = ''; if (byId('bc-text')) byId('bc-text').value = ''; authUI(); await loadPosts(); status('Signed out of community and Academy. Your Portal session is unchanged.'); }
    catch (err) { status(err.message); }
  };
  function buildBlogOptions() {
    const select = byId('bc-post'); if (!select) return;
    document.querySelectorAll('#blog-grid a.blog-card').forEach(card => {
      const match = /weekly(\d{8})\.html#?([a-z-]*)/i.exec(card.getAttribute('href') || ''); if (!match) return;
      const key = `weekly${match[1]}${match[2] ? '-' + match[2] : ''}`;
      const option = element('option', `${card.querySelector('.blog-meta span')?.textContent || ''} · ${card.querySelector('.blog-cat')?.textContent || ''}: ${card.querySelector('h4')?.textContent?.trim() || ''}`);
      option.value = key; select.append(option);
    });
  }
  window.bcRender = async () => {
    if (!byId('bc-list') || !byId('bc-post')) return;
    const host = byId('bc-list'), key = byId('bc-post').value; if (!key) return;
    host.replaceChildren(element('p', 'Loading comments…', 'bc-note'));
    try {
      const result = await api(`blog-comments?post_key=${encodeURIComponent(key)}`);
      if (byId('bc-post').value !== key) return;
      host.replaceChildren(); result.forEach(entry => host.append(entryCard(entry)));
      if (!result.length) host.append(element('p', 'No approved comments on this briefing yet.', 'bc-note'));
    } catch (err) { host.replaceChildren(element('p', err.message, 'bc-status')); }
  };
  window.bcSubmit = async () => {
    if (!byId('bc-text')) return;
    const input = byId('bc-text'), message = byId('bc-status'), send = byId('bc-submit'), select = byId('bc-post');
    const text = input.value.trim(); if (!user || !text || text.length > 2000 || !select.value || send.disabled) return;
    send.disabled = true;
    try { await api('blog-comments', {text, post_key: select.value, post_title: (select.selectedOptions[0]?.textContent || '').slice(0,200)}); input.value = ''; message.textContent = 'Thank you. Your comment has been sent for approval.'; await loadModeration(); }
    catch (err) { message.textContent = err.message; }
    finally { send.disabled = false; }
  };
  async function loadModeration() {
    if (!user?.isAdmin) return;
    try {
      const result = await api('moderation'); if (!user?.isAdmin) return;
      pending = result.pending; reports = result.reports;
      const host = byId('community-pending'); host.replaceChildren();
      if (!pending.length) host.append(element('p', 'Nothing waiting for approval.', 'bc-note'));
      pending.forEach(entry => {
        const card = entryCard(entry); card.prepend(element('p', entry.kind === 'blog' ? `Blog comment · ${entry.postTitle || entry.postKey}` : `Reply to post ${entry.parent_id}`, 'bc-note'));
        for (const next of ['approved','rejected']) card.append(button(next === 'approved' ? 'Approve' : 'Reject', async () => {
          try { await api(`entries/${encodeURIComponent(entry.id)}/review`, {status:next}); await loadModeration(); await window.bcRender(); renderPosts(); }
          catch (err) { status(err.message); }
        }));
        host.append(card);
      });
      const reportHost = byId('community-reports'); reportHost.replaceChildren();
      if (!reports.length) reportHost.append(element('p', 'No reported posts.', 'bc-note'));
      reports.forEach(report => { const card = entryCard(report.entry); card.append(element('p', report.reason || 'No reason supplied.', 'bc-note'), button('Remove post', () => removeEntry(report.entry.id))); reportHost.append(card); });
    } catch (err) { status(err.message); }
  }
  async function refresh() {
    if (loading || document.hidden) return; loading = true;
    try { await loadSession(); await loadPosts(); await loadModeration(); }
    catch (err) { status(err.message); }
    finally { loading = false; }
  }
  function init() {
    buildBlogOptions(); authUI();
    byId('forum-more').addEventListener('click', async () => { try { await loadPosts(true); } catch (err) { status(err.message); } });
    window.bcRender(); refresh();
    // Refresh sign-in when returning from Academy without interrupting a draft.
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

import React, { useEffect } from 'react';
import { useAuthStore, useMailStore, useAssistantStore } from './store';
import { authApi } from './services/api';
import { EmailList, EmailDetail, EmailThread, ComposeForm } from './components/mail';
import EmailDetailSkeleton from './components/mail/EmailDetailSkeleton';
import { AssistantPanel } from './components/assistant';
import { Sidebar } from './components/ui';
import LoginPage from './pages/LoginPage';
import './App.css';

function App() {
  const { isAuthenticated, user, setUser, setToken, logout } = useAuthStore();
  const {
    currentView,
    setCurrentView,
    inbox,
    sent,
    currentEmail,
    isLoading,
    fetchInbox,
    fetchSent,
    fetchEmail,
    fetchThread, // New action
    sendEmail,
    currentThread, // New state
    clearComposeDraft,
    setComposeDraft,
    loadMore,
    deleteEmail,
    markAsRead,
  } = useMailStore();
  const { isPanelOpen } = useAssistantStore();

  // Check for auth callback token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setToken(token);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setToken]);

  // Fetch user info on auth
  useEffect(() => {
    if (isAuthenticated && !user) {
      authApi.getMe().then(res => {
        setUser(res.data);
      }).catch(() => {
        logout();
      });
    }
  }, [isAuthenticated, user, setUser, logout]);

  // Fetch emails on view change (but not during active search)
  useEffect(() => {
    if (isAuthenticated) {
      const { isSearchActive } = useMailStore.getState();

      // Skip fetch if search is active (just show cached results)
      if (isSearchActive) return;

      if (currentView === 'inbox') {
        fetchInbox();
      } else if (currentView === 'sent') {
        fetchSent();
      }
    }
  }, [isAuthenticated, currentView, fetchInbox, fetchSent]);

  // Real-time updates via SSE
  useEffect(() => {
    if (!isAuthenticated) return;

    let cleanup = () => { };

    const setupRealtime = async () => {
      // Register Gmail watch on login
      try {
        await authApi.registerWatch();
      } catch (err) {
        console.error('Failed to register watch:', err);
      }

      const { connectSSE, disconnectSSE } = await import('./services/socket');

      cleanup = disconnectSSE;

      // Connect to SSE
      const token = localStorage.getItem('token');
      connectSSE(token, {
        onNewEmail: (data) => {
          // Refresh inbox if open
          if (currentView === 'inbox') {
            fetchInbox();
          }
        },
        onSyncRequired: () => {
          fetchInbox();
        }
      });
    };

    setupRealtime();



    return () => {
      cleanup();
    };
  }, [isAuthenticated]); // Only re-run when auth state changes

  const handleNavigate = (view) => {
    setCurrentView(view);
    if (view === 'compose') {
      clearComposeDraft();
    }
  };

  const handleEmailClick = async (email) => {
    // Optimistically mark as read and switch view immediately to show skeleton
    markAsRead(email.id);
    setCurrentView('email');

    // Fetch full thread if available, otherwise just email
    if (email.threadId) {
      await fetchThread(email.threadId);
    } else {
      await fetchEmail(email.id);
    }
  };

  const handleBack = () => {
    const { lastListView } = useMailStore.getState();
    setCurrentView(lastListView || 'inbox');
  };

  const handleReply = () => {
    if (currentEmail) {
      setCurrentView('compose');
      setComposeDraft({
        to: [currentEmail.from_address?.email],
        subject: `Re: ${currentEmail.subject}`,
        body: `\n\n---\nOn ${new Date(currentEmail.date).toLocaleString()}, ${currentEmail.from_address?.email} wrote:\n${currentEmail.body_text || currentEmail.snippet}`,
        replyToId: currentEmail.id,
      });
    }
  };

  const handleSend = async () => {
    await sendEmail();
    setCurrentView('sent');
  };

  const handleCloseCompose = () => {
    clearComposeDraft();
    const { lastListView } = useMailStore.getState();
    setCurrentView(lastListView || 'inbox');
  };

  const handleDeleteCurrent = async (id) => {
    // If id is not provided, use currentEmail.id
    const targetId = id || currentEmail?.id;
    if (targetId) {
      await deleteEmail(targetId);
      handleBack(); // Navigate back to list after delete
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="app">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={logout}
        user={user}
      />

      <main className="main-content">
        {currentView === 'inbox' && (
          <EmailList
            emails={inbox}
            title="Inbox"
            isLoading={isLoading}
            onEmailClick={handleEmailClick}
            onRefresh={() => fetchInbox()}
            selectedEmailId={currentEmail?.id}
            onDelete={(id) => deleteEmail(id)}
            onLoadMore={() => loadMore()}
            hasMore={!!useMailStore.getState().nextPageToken}
          />
        )}

        {currentView === 'sent' && (
          <EmailList
            emails={sent}
            title="Sent"
            isLoading={isLoading}
            onEmailClick={handleEmailClick}
            onRefresh={() => fetchSent()}
            selectedEmailId={currentEmail?.id}
            emptyMessage="No sent emails"
          />
        )}

        {currentView === 'email' && (
          isLoading ? (
            <EmailDetailSkeleton onBack={handleBack} />
          ) : (
            // Use Thread View if we have a thread, otherwise Detail View
            currentThread && currentThread.length > 0 ? (
              <EmailThread
                thread={currentThread}
                onBack={handleBack}
                onReply={handleReply}
                onDelete={handleDeleteCurrent}
              />
            ) : (
              <EmailDetail
                email={currentEmail}
                onBack={handleBack}
                onReply={handleReply}
                onDelete={handleDeleteCurrent}
              />
            )
          )
        )}

        {currentView === 'compose' && (
          <ComposeForm
            onClose={handleCloseCompose}
            onSend={handleSend}
          />
        )}
      </main>

      <AssistantPanel />
    </div>
  );
}

export default App;

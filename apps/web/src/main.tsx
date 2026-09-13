import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './app';
import { InvitePage } from './pages/invite';
import { ErrorBoundary } from './components/error-boundary';
import { ToastViewport } from './components/toast-viewport';
import { ApiError } from './lib/api-client';
import { toastStore } from './lib/toast-store';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
  mutationCache: new MutationCache({
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.';
      toastStore.error(message);
    },
  }),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/invite/:code" element={<InvitePage />} />
            <Route path="*" element={<App />} />
          </Routes>
        </BrowserRouter>
        <ToastViewport />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

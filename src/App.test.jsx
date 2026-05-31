import { render, screen } from '@testing-library/react';
import App from './App.jsx';
import { AppSettingsProvider } from './state/AppSettingsContext.jsx';
import { TaskLogProvider } from './state/TaskLogContext.jsx';

test('renders app shell', () => {
  render(
    <AppSettingsProvider>
      <TaskLogProvider>
        <App />
      </TaskLogProvider>
    </AppSettingsProvider>
  );
  expect(screen.getByText(/BlockChain Interact Tools/i)).toBeInTheDocument();
});

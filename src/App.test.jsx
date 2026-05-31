import { render, screen } from '@testing-library/react';
import App from './App.jsx';

test('renders app shell', () => {
  render(<App />);
  expect(screen.getByText(/BlockChain Interact Tools/i)).toBeInTheDocument();
});

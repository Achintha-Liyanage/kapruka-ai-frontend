import React from 'react';
import { CartProvider } from './context/CartContext';
import ChatInterface from './components/ChatInterface';

const App: React.FC = () => {
  return (
    <CartProvider>
      <ChatInterface />
    </CartProvider>
  );
};

export default App;

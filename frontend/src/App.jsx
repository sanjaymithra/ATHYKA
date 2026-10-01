import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { initUtmCapture } from './utils/utm';
import './App.css';

export default function App() {
  useEffect(() => {
    initUtmCapture();
  }, []);

  return <RouterProvider router={router} />;
}

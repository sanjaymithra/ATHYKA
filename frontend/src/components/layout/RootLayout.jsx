import React from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import CustomCursor from '../../CustomCursor';

export default function RootLayout() {
  return (
    <>
      <CustomCursor />
      <ScrollRestoration getKey={(location) => (location.pathname === '/' ? null : location.key)} />
      <Outlet />
    </>
  );
}

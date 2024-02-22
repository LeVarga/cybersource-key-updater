import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './routes/App.tsx'
import ErrorPage from './routes/ErrorPage.tsx';
import TestPage from './routes/TestPage.tsx';

import {createBrowserRouter, RouterProvider} from "react-router-dom";
import './index.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>,
    errorElement: <ErrorPage/>
  },
  {
    path: "testpage",
    element: <TestPage/>,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

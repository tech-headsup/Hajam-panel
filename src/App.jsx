import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Accounts/Login/Login';
import Panel from './Panel/Panel';
import { setUserData } from './redux/Actions/UserAction';
import { getElevateUser } from './storage/Storage';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const dispatch = useDispatch();
  const UserReducer = useSelector(state => state.UserReducer);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkUserData = () => {
      try {
        const doc = getElevateUser();
        if (doc) {
          dispatch(setUserData(doc));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkUserData();
  }, [dispatch]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={UserReducer.user ? <Navigate to="/" /> : <Login />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={UserReducer.user ? <Panel /> : <Navigate to="/login" />}
        />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;

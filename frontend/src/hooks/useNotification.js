import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useNotification = () => {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        setPermission(perm);
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const perm = await Notification.requestPermission();
    setPermission(perm);
    return perm;
  }, []);

  const notify = useCallback((title, options = {}) => {
    const { body, type = 'success', duration = 4000, icon } = options;

    // 1. Show Toast (In-App)
    if (type === 'success') toast.success(body || title, { duration });
    else if (type === 'error') toast.error(body || title, { duration });
    else toast(body || title, { icon: icon || '🔔', duration });

    // 2. Show Browser Notification (System) if permitted & document is hidden (or always if desired)
    // For this requirement, "toast notification for all the activity that uses the browser notification", 
    // we might want to trigger it even if visible, or maybe just when backgrounded. 
    // Let's trigger it if permission granted.
    if (permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/vite.svg', // Placeholder icon
          ...options
        });
      } catch (error) {
        console.error("Browser notification failed", error);
      }
    }
  }, [permission]);

  return { notify, requestPermission, permission };
};

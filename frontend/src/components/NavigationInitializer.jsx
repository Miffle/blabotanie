import { useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { setNavigationCallback } from '../ws/client';

export default function NavigationInitializer() {
    const { redirectToAuth } = useNavigation();

    useEffect(() => {
        setNavigationCallback(redirectToAuth);
    }, [redirectToAuth]);

    return null;
} 
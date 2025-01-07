import { writable } from 'svelte/store';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

function createToastStore() {
    const { subscribe, update } = writable<Toast[]>([]);

    let nextId = 1;

    function show(message: string, type: ToastType = 'info') {
        const id = nextId++;
        update(toasts => [...toasts, { id, message, type }]);
        setTimeout(() => {
            remove(id);
        }, 5000);
    }

    function remove(id: number) {
        update(toasts => toasts.filter(t => t.id !== id));
    }

    return {
        subscribe,
        success: (message: string) => show(message, 'success'),
        error: (message: string) => show(message, 'error'),
        info: (message: string) => show(message, 'info'),
        remove
    };
}

export const toasts = createToastStore(); 
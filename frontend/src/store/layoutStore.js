import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLayoutStore = create(
    persist(
        (set) => ({
            active: 'chats',
            selectedContact: null,
            setSelectedContact: (contact) => set({ selectedContact: contact }),
            setActiveTab: (tab) => set({ active: tab })
        }),
        {
            name: "layout-storage",
            getStorage: () => localStorage
        }
    )
);
export default useLayoutStore;
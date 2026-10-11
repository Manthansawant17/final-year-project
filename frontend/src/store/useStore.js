import { create } from 'zustand'

const useStore = create((set, get) => ({
  // ── UI State ──────────────────────────────────────────
  activeTab: 'pr',
  sidebarSection: 'repositories',

  // ── Repositories & Files ─────────────────────────────
  repositories: [
    {
      id: 1,
      name: 'core-service',
      type: 'folder',
      expanded: true,
      children: [
        {
          id: 11,
          name: 'src',
          type: 'folder',
          expanded: true,
          children: [
            {
              id: 111,
              name: 'main',
              type: 'folder',
              expanded: true,
              children: [
                {
                  id: 1111,
                  name: 'java',
                  type: 'folder',
                  expanded: true,
                  children: [
                    {
                      id: 11111,
                      name: 'com',
                      type: 'folder',
                      expanded: true,
                      children: [
                        {
                          id: 111111,
                          name: 'company',
                          type: 'folder',
                          expanded: true,
                          children: [
                            {
                              id: 111112,
                              name: 'service',
                              type: 'folder',
                              expanded: true,
                              children: [
                                { id: 1111121, name: 'AppController.java', type: 'file', lang: 'java' },
                                { id: 1111122, name: 'AppService.java', type: 'file', lang: 'java' },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 1112,
                  name: 'resources',
                  type: 'folder',
                  expanded: false,
                  children: [
                    { id: 11121, name: 'application.yml', type: 'file', lang: 'yml' },
                  ],
                },
              ],
            },
            {
              id: 112,
              name: 'test',
              type: 'folder',
              expanded: false,
              children: [
                { id: 1121, name: 'AppControllerTest.java', type: 'file', lang: 'java' },
              ],
            },
          ],
        },
        { id: 12, name: 'pom.xml', type: 'file', lang: 'xml' },
      ],
    },
  ],

  selectedFile: null,
  openTabs: [
    { id: 'AppController', name: 'AppController.java', icon: '📄' },
    { id: 'AppService', name: 'AppService.java', icon: '📄' },
    { id: 'pr-452', name: 'PR #452: Fix data fetch', icon: '🔀', closable: true },
    { id: 'terminal', name: 'Terminal', icon: '💻' },
  ],
  activeEditorTab: 'pr-452',

  // ── PR / Diff ─────────────────────────────────────────
  currentPR: {
    number: 452,
    title: 'Fix data fetch issues and improve error handling',
    status: 'Open',
    diffOld: `public class AppController {

  @GetMapping("/data")
  public class getData() {
    return service.getData();
  }

  @GetMapping("/data")
    return service.getData();
  }
}`,
    diffNew: `public class AppController {

  @GetMapping("/data")
  public AppService.getData() {
    return service.getData();
  }

  @GetMapping("/data")
    return service.getData();
  }

  // New data structure
  public Optional<Data> getData() {
    return Optional.ofNullable(
      repository.fetchData());
  }
}`,
  },

  // ── AI Chat ───────────────────────────────────────────
  chatMessages: [
    {
      id: 1,
      role: 'user',
      content: "Can you refactor the `getData` method in `AppService.java` to handle potential null pointer exceptions?",
      timestamp: new Date(Date.now() - 60000),
    },
    {
      id: 2,
      role: 'assistant',
      content: "Certainly! Here is a refactored version using `Optional` to handle potential nulls:",
      code: `public Optional<Data> getData() {
  return Optional.ofNullable(
    repository.fetchData());
}`,
      codeLanguage: 'java',
      actions: ['Apply Code', 'Create PR'],
      timestamp: new Date(Date.now() - 30000),
    },
  ],
  chatInput: '',
  isAiTyping: false,
  aiModel: 'Gemini 3.8 Flash (Free)',
  mcpConnected: true,

  // ── Actions ───────────────────────────────────────────
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveEditorTab: (tab) => set({ activeEditorTab: tab }),
  setSidebarSection: (section) => set({ sidebarSection: section }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setChatInput: (input) => set({ chatInput: input }),

  activeRepoName: 'core-service',
  setActiveRepoName: (name) => set({ activeRepoName: name }),

  collapseAll: () => {
    const collapse = (nodes) =>
      nodes.map((n) => ({
        ...n,
        expanded: false,
        children: n.children ? collapse(n.children) : undefined,
      }))
    set((s) => ({ repositories: collapse(s.repositories) }))
  },

  expandAll: () => {
    const expand = (nodes) =>
      nodes.map((n) => ({
        ...n,
        expanded: true,
        children: n.children ? expand(n.children) : undefined,
      }))
    set((s) => ({ repositories: expand(s.repositories) }))
  },

  toggleFolder: (nodeId) => {
    const toggle = (nodes) =>
      nodes.map((n) => {
        if (n.id === nodeId) return { ...n, expanded: !n.expanded }
        if (n.children) return { ...n, children: toggle(n.children) }
        return n
      })
    set((s) => ({ repositories: toggle(s.repositories) }))
  },

  addChatMessage: (message) =>
    set((s) => ({
      chatMessages: [...s.chatMessages, { id: Date.now(), timestamp: new Date(), ...message }],
    })),

  setAiTyping: (typing) => set({ isAiTyping: typing }),

  closeTab: (tabId) =>
    set((s) => {
      const tabs = s.openTabs.filter((t) => t.id !== tabId)
      const active = s.activeEditorTab === tabId ? (tabs[tabs.length - 1]?.id || '') : s.activeEditorTab
      return { openTabs: tabs, activeEditorTab: active }
    }),
}))

export default useStore

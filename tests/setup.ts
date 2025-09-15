import { vi } from 'vitest';

// Mock modules that are not available in test environment
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false,
	version: 'test'
}));

vi.mock('$app/stores', () => {
	const mockStore = (value: any) => ({
		subscribe: vi.fn((callback) => {
			callback(value);
			return () => {};
		})
	});
	
	return {
		page: mockStore({ 
			url: { pathname: '/test' },
			params: {},
			route: { id: null },
			status: 200,
			error: null,
			data: {},
			form: undefined
		}),
		navigating: mockStore(null),
		updated: mockStore({ check: vi.fn() })
	};
});

// Global mocks for SvelteKit/Vite modules that might be imported
globalThis.fetch = vi.fn();

// Set up DOM globals that Svelte expects
Object.defineProperty(globalThis, 'document', {
	value: document,
	writable: true
});

Object.defineProperty(globalThis, 'window', {
	value: window,
	writable: true
});

// Ensure we're in browser-like environment
globalThis.navigator = globalThis.navigator || { userAgent: 'test' };
globalThis.location = globalThis.location || { href: 'http://localhost:3000' };

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation(query => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Force browser environment for Svelte
if (typeof globalThis !== 'undefined') {
	globalThis.process = globalThis.process || {};
	globalThis.process.browser = true;
}

// Mock Svelte to always use client-side version
vi.mock('svelte', async () => {
	// Don't actually mock the entire svelte package, just override server detection
	const actual = await vi.importActual('svelte');
	return {
		...actual,
		onMount: vi.fn((fn) => fn()),
		beforeUpdate: vi.fn((fn) => fn()),
		afterUpdate: vi.fn((fn) => fn()),
		onDestroy: vi.fn((fn) => fn()),
		createEventDispatcher: vi.fn(() => vi.fn()),
		tick: vi.fn(() => Promise.resolve()),
		flushSync: vi.fn()
	};
});

// Mock SvelteKit client-side navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn()
}));
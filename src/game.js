// Compatibility entrypoint for previously cached HTML shells.
// The production loader is versioned so CDN and service-worker caches cannot pin an obsolete decoder.
import './boot-v8.js';

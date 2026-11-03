// cPanel / Passenger startup file. Passenger loads apps with require(), which can't load ES modules
// on older Node versions, so this CommonJS shim imports the real app.
import('./app.js').catch((err) => {
  console.error('[imr api] failed to start:', err);
  process.exit(1);
});

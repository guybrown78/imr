// Published copy of src/data/pricing.json, which quote.php reads so server and browser share one price rule.
import pricing from '../../data/pricing.json';
export const GET = () => new Response(JSON.stringify(pricing), { headers: { 'Content-Type': 'application/json' } });

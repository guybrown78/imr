// Published copy of src/data/site.json (public contact details only), which quote.php reads for the notification address.
import site from '../../data/site.json';
const { name, url, phone, email } = site;
export const GET = () => new Response(JSON.stringify({ name, url, phone, email }), { headers: { 'Content-Type': 'application/json' } });

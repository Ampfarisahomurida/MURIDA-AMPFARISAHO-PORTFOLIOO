import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Helper to ensure `fetch` is available (lazy-load node-fetch when needed)
async function ensureFetch() {
    if (typeof fetch !== 'undefined') return;
    try {
        const mod = await import('node-fetch');
        // node-fetch v3 exports default as the fetch function
        global.fetch = mod.default || mod;
    } catch (e) {
        console.warn('Failed to lazy-load node-fetch:', e && e.message);
    }
}
import * as DB from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
const HOST = process.env.HOST || '0.0.0.0';

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// In-memory conversation store: sessionId -> [{role: 'user'|'assistant', content: '...'}]
const conversations = new Map();
const MAX_HISTORY = 8; // keep last N messages per session
const DATA_DIR = path.join(__dirname, 'data');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
const FAQ_FILE = path.join(DATA_DIR, 'faq.json');

// Ensure data directory exists
try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { /* ignore */ }

// Load persisted chats from DB
try {
    const all = DB.loadAllConversations();
    Object.keys(all).forEach(k => conversations.set(k, all[k]));
    console.log('Loaded conversations from DB.');
} catch (e) {
    console.error('Failed to load conversations from DB:', e);
}

// Load FAQ dataset from DB (fallback to file if DB empty)
let FAQ = DB.getAllFAQs();
if (!FAQ || FAQ.length === 0) {
    try {
        if (fs.existsSync(FAQ_FILE)) {
            const fileFaq = JSON.parse(fs.readFileSync(FAQ_FILE, 'utf-8') || '[]');
            // insert into DB
            fileFaq.forEach(item => DB.upsertFAQ(item.triggers || [], item.answer || ''));
            FAQ = DB.getAllFAQs();
            console.log('Seeded FAQ dataset into DB.');
        }
    } catch (e) {
        console.error('Failed to seed FAQ into DB:', e);
    }
}

function persistChats() {
    try {
        const obj = {};
        conversations.forEach((v, k) => { obj[k] = v; });
        fs.writeFile(CHATS_FILE, JSON.stringify(obj, null, 2), err => {
            if (err) console.error('Error writing chats file:', err);
        });
    } catch (e) {
        console.error('persistChats error:', e);
    }
}

const server = http.createServer((req, res) => {
    // Log requests
    console.log(`${req.method} ${req.url}`);

    // Basic Admin Auth
    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Mizzirash2';

    function sendAuthRequired() {
        res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Admin Area"', 'Content-Type': 'text/plain' });
        res.end('Authentication required');
    }

    function checkAdminAuth() {
        const h = req.headers['authorization'];
        if (!h) { sendAuthRequired(); return false; }
        const m = h.match(/^Basic\s+(.*)$/i);
        if (!m) { sendAuthRequired(); return false; }
        let decoded = '';
        try { decoded = Buffer.from(m[1], 'base64').toString('utf8'); } catch (e) { sendAuthRequired(); return false; }
        const [u, p] = decoded.split(':');
        if (u === ADMIN_USER && p === ADMIN_PASSWORD) return true;
        sendAuthRequired();
        return false;
    }

    // Protect admin endpoints and UI
    if (req.url.startsWith('/api/admin') || req.url === '/admin' || req.url === '/admin.html' || req.url === '/admin.js') {
        if (!checkAdminAuth()) return;
    }

    // Handle API endpoints
    if (req.url === '/api/contact' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                console.log('Contact Form Submission:', data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Message received!' }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
            }
        });
        return;
    }

    // Chat API endpoint with conversational memory and provider options
    if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const userMessage = String(data.message || '');
                const sessionId = data.sessionId || (`sid_${Date.now()}_${Math.floor(Math.random()*1e6)}`);
                const action = data.action || null; // e.g., 'clear'

                // Basic profile context
                const profile = `Name: AMPFARISAHO Murida. Roles: Frontend Developer, Data Analyst. Experience: 3+ years as a freelancer. Skills: HTML, CSS, JavaScript, React, Node.js, Excel, SQL. Contact: muridafoster@gmail.com, 060 894 4194.`;

                // Handle clear action
                if (action === 'clear') {
                    conversations.delete(sessionId);
                    try { DB.clearConversation(sessionId); } catch(e){}
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, message: 'Memory cleared', sessionId }));
                    return;
                }

                // Retrieve or create conversation
                const history = conversations.get(sessionId) || [];

                // Append user message to history (if any)
                if (userMessage && userMessage.trim()) {
                    history.push({ role: 'user', content: userMessage });
                }

                // Trim history to last MAX_HISTORY exchanges
                const trimmed = history.slice(-MAX_HISTORY * 2);

                // Decide provider: env AI_PROVIDER === 'hf' uses Hugging Face, else OpenAI if key present
                const provider = (process.env.AI_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : (process.env.HF_API_KEY ? 'hf' : 'local'))).toLowerCase();

                let reply = '';

                if (provider === 'openai' && process.env.OPENAI_API_KEY) {
                    try {
                        // Build messages array for OpenAI with system + history
                        const messages = [ { role: 'system', content: `You are a helpful assistant that answers questions about the following person and their portfolio: ${profile}` } ];
                        trimmed.forEach(m => messages.push({ role: m.role, content: m.content }));

                        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                            },
                            body: JSON.stringify({ model: 'gpt-3.5-turbo', messages, max_tokens: 700 })
                        });
                        const json = await resp.json();
                        reply = json?.choices?.[0]?.message?.content || '';
                    } catch (err) {
                        console.error('OpenAI error:', err);
                        reply = '';
                    }
                } else if (provider === 'hf' && process.env.HF_API_KEY) {
                    try {
                        const hfModel = process.env.HF_MODEL || 'gpt2';
                        // Build a single prompt including profile and trimmed history
                        let prompt = `You are an assistant answering questions about the following person:\n${profile}\n\n`;
                        trimmed.forEach(m => {
                            prompt += (m.role === 'user' ? `User: ${m.content}\n` : `Assistant: ${m.content}\n`);
                        });
                        prompt += `User: ${userMessage}\nAssistant:`;

                        const resp = await fetch(`https://api-inference.huggingface.co/models/${hfModel}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.HF_API_KEY}`
                            },
                            body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 250 } })
                        });
                        const json = await resp.json();
                        // Attempt to extract generated text from HF response
                        if (typeof json === 'string') reply = json;
                        else if (Array.isArray(json) && json[0]?.generated_text) reply = json[0].generated_text;
                        else if (json?.generated_text) reply = json.generated_text;
                        else if (json?.error) reply = `Model error: ${json.error}`;
                        else reply = '';
                    } catch (err) {
                        console.error('HuggingFace error:', err);
                        reply = '';
                    }
                }

                // If provider didn't produce a reply, consult FAQ, then fall back to local rules
                if (!reply) {
                    const lower = userMessage.toLowerCase();

                    // Check FAQ dataset for trigger word matches
                    for (const item of FAQ) {
                        for (const t of item.triggers) {
                            if (lower.includes(t)) {
                                reply = item.answer;
                                break;
                            }
                        }
                        if (reply) break;
                    }

                    // If no FAQ match, apply local rules as a last resort
                    if (!reply) {
                        if (!userMessage.trim()) {
                            reply = 'Hi — how can I help you learn about Murida? Ask about experience, skills, projects, or contact details.';
                        } else if (lower.includes('experience') || lower.includes('freelancer') || lower.includes('years')) {
                            reply = 'Murida has been freelancing for the past 3 years, delivering frontend projects, data analysis, and reporting for clients and small businesses.';
                        } else if (lower.includes('couple collection') || lower.includes('project') || lower.includes('shopping')) {
                            reply = 'Couple Collection is a personal shopping website project currently in progress. You can view it here: https://couple-collection-1.onrender.com/index.html';
                        } else if (lower.includes('skills') || lower.includes('technologies') || lower.includes('tech')) {
                            reply = 'Key skills include HTML, CSS, JavaScript, React, Node.js, Excel, and SQL.';
                        } else if (lower.includes('contact') || lower.includes('email') || lower.includes('phone')) {
                            reply = 'Contact Murida at muridafoster@gmail.com or call/WhatsApp +27 60 894 4194.';
                        } else if (lower.includes('portfolio') || lower.includes('work')) {
                            reply = 'This portfolio highlights projects, CV, technical skills, and data analysis reports. Check the Portfolio section for details.';
                        } else {
                            reply = 'I can help with questions about Murida\'s experience, skills, projects (including Couple Collection), and contact info. Could you rephrase your question?';
                        }
                    }
                }

                // Save assistant reply to history and persist to DB
                if (reply) {
                    trimmed.push({ role: 'assistant', content: reply });
                }
                conversations.set(sessionId, trimmed);
                try { DB.saveConversation(sessionId, trimmed); } catch (e) { console.error('DB save error', e); }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, reply, sessionId }));
            } catch (e) {
                console.error('Chat handler error:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server error', error: String(e && e.message) }));
            }
        });
        return;
    }

    // Admin API: list FAQs
    if (req.url === '/api/admin/faqs' && req.method === 'GET') {
        try {
            const faqs = DB.getAllFAQs();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, faqs }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false }));
        }
        return;
    }

    // Admin API: upsert FAQ
    if (req.url === '/api/admin/faqs' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const id = DB.upsertFAQ(data.triggers || [], data.answer || '', data.id || null);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, id }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false }));
            }
        });
        return;
    }

    // Admin API: delete FAQ
    if (req.url.startsWith('/api/admin/faqs') && req.method === 'DELETE') {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        const id = urlObj.searchParams.get('id');
        if (!id) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Missing id' }));
            return;
        }
        const ok = DB.deleteFAQ(Number(id));
        res.writeHead(ok ? 200 : 500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: ok }));
        return;
    }

    // Admin API: export chats
    if (req.url === '/api/admin/export' && req.method === 'GET') {
        try {
            const data = DB.exportChats();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, data }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false }));
        }
        return;
    }

    // Admin API: analytics
    if (req.url === '/api/admin/analytics' && req.method === 'GET') {
        try {
            const data = DB.getAnalytics();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, analytics: data }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false }));
        }
        return;
    }

    // Serve admin page
    if (req.url === '/admin') {
        const adminPath = path.join(__dirname, 'admin.html');
        if (fs.existsSync(adminPath)) {
            const content = fs.readFileSync(adminPath);
            res.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
            res.end(content);
            return;
        }
    }

    // Serve static files
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found, serve index.html for SPA routing
                fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
                    res.writeHead(200, { 'Content-Type': mimeTypes['.html'] });
                    res.end(content, 'utf-8');
                });
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + err.code + ' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`\n⭐ Portfolio Server Running ⭐`);
    console.log(`\n📍 URL: http://${HOST}:${PORT}`);
    console.log(`\n🎯 MURIDA AMPFARISAHO's Professional Portfolio`);
    console.log(`📧 Email: muridafoster@gmail.com`);
    console.log(`📱 Phone: 060 894 4194\n`);
    console.log(`Press Ctrl+C to stop the server\n`);
});
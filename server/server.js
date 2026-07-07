import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json());

// Gemini chat — no login required
const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
});

// Open http://localhost:5001/chat in browser to use the textbox
app.get('/chat', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Gemini Chat</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;flex-direction:column;align-items:center;padding:40px 16px;min-height:100vh}
    h1{margin-bottom:24px;color:#38bdf8}
    #box{width:100%;max-width:700px;background:#1e293b;border-radius:12px;padding:20px;min-height:300px;max-height:500px;overflow-y:auto;margin-bottom:16px;display:flex;flex-direction:column;gap:12px}
    .msg{padding:12px 16px;border-radius:8px;max-width:85%;line-height:1.6;font-size:14px;white-space:pre-wrap}
    .user{background:#0284c7;align-self:flex-end}
    .ai{background:#334155;align-self:flex-start}
    #form{display:flex;gap:10px;width:100%;max-width:700px}
    #input{flex:1;padding:14px 16px;border-radius:8px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:15px;outline:none}
    #input:focus{border-color:#38bdf8}
    button{padding:14px 24px;background:#38bdf8;color:#0f172a;font-weight:bold;border:none;border-radius:8px;cursor:pointer;font-size:15px}
    button:disabled{opacity:0.5;cursor:not-allowed}
  </style>
</head>
<body>
  <h1>Gemini Chat</h1>
  <div id="box"></div>
  <form id="form">
    <input id="input" type="text" placeholder="Type your message..." autocomplete="off"/>
    <button id="btn">Send</button>
  </form>
  <script>
    const box=document.getElementById('box'),form=document.getElementById('form'),input=document.getElementById('input'),btn=document.getElementById('btn');
    function add(text,role){const d=document.createElement('div');d.className='msg '+role;d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight}
    form.addEventListener('submit',async(e)=>{
      e.preventDefault();
      const msg=input.value.trim();if(!msg)return;
      add(msg,'user');input.value='';btn.disabled=true;btn.textContent='...';
      try{
        const r=await fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
        const d=await r.json();add(d.reply,'ai');
      }catch(err){add('Error: '+err.message,'ai')}
      finally{btn.disabled=false;btn.textContent='Send';input.focus()}
    });
  </script>
</body>
</html>`);
});

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: 'No message provided.' });
    const response = await gemini.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [{ role: 'user', content: message }]
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error('Gemini error:', err.message, err.status, JSON.stringify(err.error));
    res.status(500).json({ reply: 'Gemini API error: ' + err.message });
  }
});

// Original routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

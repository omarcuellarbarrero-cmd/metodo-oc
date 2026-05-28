import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

// Ruta estricta para app.html con "limpieza de caché" forzada
app.get('/app.html', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'app.html'));
});

// Ruta de API para obtener los tips dinámicamente
app.get('/tips.js', (req, res) => {
    try {
        const tips = fs.existsSync('./tips.js') ? fs.readFileSync('./tips.js', 'utf8') : "No hay tips disponibles.";
        res.setHeader('Content-Type', 'application/javascript');
        res.send(tips);
    } catch (err) {
        res.status(500).json({ error: "Error al cargar tips." });
    }
});

// Procesador de IA
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "SIN_API_KEY");

app.post('/api/diagnostico', async (req, res) => {
    try {
        const tips = fs.existsSync('./tips.js') ? fs.readFileSync('./tips.js', 'utf8') : "";
        const { marca, modelo, sintoma, descartes } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Actúa como técnico experto del Método OC. Referencia técnica: ${tips}. Caso: ${marca} ${modelo}, ${sintoma}. Diagnóstico profesional, lógico y directo.`;
        const result = await model.generateContent(prompt);
        res.json({ text: result.response.text() });
    } catch (err) {
        res.status(500).json({ text: "Error: " + err.message });
    }
});

app.use(express.static('.'));
app.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log("🚀 Sistema Método OC activo..."));
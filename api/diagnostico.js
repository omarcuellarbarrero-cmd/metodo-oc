import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';

const app = express();

// Permitir que el servidor entienda datos en formato JSON
app.use(express.json());

// Bypass de CORS para que su interfaz estática se comunique sin bloqueos
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Cambiamos el handler de Vercel por una ruta POST estándar de Express
app.post('/api/diagnostico', async (req, res) => {
    try {
        const { marca, modelo, sintoma, descartes } = req.body;

        // Validamos que los componentes requeridos hayan llegado bien
        if (!marca || !modelo || !sintoma) {
            return res.status(200).json({ text: "⚠️ ERROR EN RECEPCIÓN: Faltan datos técnicos en el reporte enviado desde el buscador." });
        }

        // Base de conocimiento integrada de forma interna
        const tipsContenido = "Aplica el Método OC. Usa conocimientos avanzados en electrónica de TVs modernos. Analiza voltajes en la fuente, señales LVDS/Mini-LVDS, voltajes de compuerta T-CON (VGH, VGL, VCOM) y fallas comunes en COF/TAB.";

        // Estructura del Prompt para el motor de la IA
        const prompt = `Actúa como un expertisimo instructor de reparación de televisores modernos. 
        Basándote en estas directrices técnicas: ${tipsContenido}
        Analiza detalladamente la siguiente falla en banco y provee un diagnóstico estructurado bajo el Método OC:
        MARCA: ${marca} | MODELO: ${modelo} | SÍNTOMA: ${sintoma} | PRUEBAS REALIZADAS: ${descartes || 'Ninguna registrado'}`;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(200).json({ 
                text: "⚠️ FUEGO EN LA FUENTE: El servidor VPS no está detectando la variable GEMINI_API_KEY en Coolify." 
            });
        }

        // Inicializamos el cliente de Inteligencia Artificial
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Envío de señal a los servidores de Google
        const result = await model.generateContent(prompt);
        const responseIA = await result.response;
        const textoFinal = responseIA.text();

        // Retornamos la respuesta limpia en JSON
        return res.status(200).json({ text: textoFinal });

    } catch (error) {
        console.error("DETALLE GENERAL DEL COLAPSO EN EL VPS:", error.message);
        return res.status(500).json({ 
            text: `⚙️ ERROR INTERNO DEL SERVIDOR (COLAPSO MOTOR IA): ${error.message}` 
        });
    }
});
// Ruta de prueba de vida (Healthcheck) para que Coolify vea que el circuito está cerrado
app.get('/', (req, res) => {
    res.status(200).send("Servidor PRO operando en perfecta condición.");
});
// EL FILAMENTO CONTINUO: Este bloque mantiene el servidor encendido las 24/7
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor PRO operando con éxito y escuchando en puerto ${PORT}`);
});
//para ejecutar este servidor, asegúrate de tener la variable de entorno GEMINI_API_KEY configurada con tu clave de API de Google Generative AI. Luego, puedes iniciar el servidor con `node diagnostico.js` y estará listo para recibir solicitudes POST en la ruta /api/diagnostico.
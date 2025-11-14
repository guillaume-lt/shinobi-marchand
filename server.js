// server.js
const express = require("express");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const LOGIN_URL = "https://www.shinobi.fr/index.php?page=connexion";
const ARCHIVES_URL_MARCHAND = "https://www.shinobi.fr/index.php?page=archives&id=206";
const ARCHIVES_URL_MINEUR = "https://www.shinobi.fr/index.php?page=archives&id=207";

// Servir index.html dans le même dossier
app.use(express.static(path.join(__dirname)));

// Cache pour stocker les positions
let positionsCache = {
  marchand: null,
  mineur: null,
  lastUpdate: null,
  error: null
};

// Flag pour éviter les mises à jour concurrentes
let isUpdating = false;

// Durée de validité du cache (1 heure en millisecondes)
const CACHE_DURATION = 3600000; // 1 heure

// Vérifier si le cache est encore valide
function isCacheValid() {
  if (!positionsCache.lastUpdate) {
    return false;
  }
  const now = new Date();
  const timeSinceUpdate = now - positionsCache.lastUpdate;
  return timeSinceUpdate < CACHE_DURATION;
}

// Fonction pour récupérer toutes les positions
async function fetchAllPositions(force = false) {
  // Si une mise à jour est déjà en cours, ne pas en lancer une autre
  if (isUpdating) {
    if (process.env.NODE_ENV === "development") {
      console.log("Mise à jour déjà en cours, attente...");
    }
    return;
  }

  // Si le cache est valide et qu'on ne force pas, ne pas mettre à jour
  if (!force && isCacheValid()) {
    if (process.env.NODE_ENV === "development") {
      console.log("Cache encore valide, utilisation du cache");
    }
    return;
  }

  isUpdating = true;
  
  try {
    const marchandPosition = await getNpcPosition(
      ARCHIVES_URL_MARCHAND,
      "marchand\\s+ambulant",
      "marchand ambulant"
    );
    
    const mineurPosition = await getNpcPosition(
      ARCHIVES_URL_MINEUR,
      "mineur",
      "mineur"
    );
    
    positionsCache = {
      marchand: marchandPosition,
      mineur: mineurPosition,
      lastUpdate: new Date(),
      error: null
    };
    
    if (process.env.NODE_ENV === "development") {
      console.log("Positions mises à jour:", {
        marchand: marchandPosition,
        mineur: mineurPosition,
        lastUpdate: positionsCache.lastUpdate
      });
    }
  } catch (err) {
    // Ne pas écraser un cache valide en cas d'erreur
    if (!isCacheValid()) {
      positionsCache.error = err.message;
    }
    if (process.env.NODE_ENV === "development") {
      console.error("Erreur lors de la mise à jour des positions:", err.message);
    }
  } finally {
    isUpdating = false;
  }
}

// Fonction pour calculer le temps jusqu'à la prochaine heure (heure européenne)
function getTimeUntilNextHour() {
  const now = new Date();
  
  // Obtenir l'heure actuelle en Europe/Paris
  const europeTimeString = now.toLocaleString("en-US", { 
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  
  const [hours, minutes, seconds] = europeTimeString.split(":").map(Number);
  
  // Calculer les millisecondes jusqu'à la prochaine heure
  const currentMinutes = hours * 60 + minutes;
  const currentSeconds = currentMinutes * 60 + seconds;
  const secondsUntilNextHour = 3600 - (currentSeconds % 3600);
  
  return secondsUntilNextHour * 1000; // Retourner en millisecondes
}

// Fonction pour programmer la prochaine mise à jour à l'heure pile
function scheduleNextHourlyUpdate() {
  const timeUntilNext = getTimeUntilNextHour();
  
  if (process.env.NODE_ENV === "development") {
    const minutes = Math.floor(timeUntilNext / 60000);
    console.log(`Prochaine mise à jour dans ${minutes} minutes (à l'heure pile)`);
  }
  
  setTimeout(() => {
    fetchAllPositions(true);
    // Programmer les mises à jour suivantes toutes les heures
    setInterval(() => {
      fetchAllPositions(true);
    }, CACHE_DURATION);
  }, timeUntilNext);
}

// Récupérer les positions au démarrage (force = true pour la première fois)
fetchAllPositions(true);

// Programmer la première mise à jour à l'heure pile, puis toutes les heures
scheduleNextHourlyUpdate();

// Fonction helper pour se connecter et obtenir les cookies
async function login() {
  const login = process.env.SHINOBI_LOGIN;
  const password = process.env.SHINOBI_PASSWORD;
  
  if (!login || !password) {
    throw new Error("Identifiants non configurés. Vérifiez les variables d'environnement SHINOBI_LOGIN et SHINOBI_PASSWORD.");
  }

  const loginResponse = await fetch(LOGIN_URL, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0",
    },
    body: new URLSearchParams({
      login: login,
      pass: password,
      connecter: "Connexion",
    }),
  });

  const setCookie = loginResponse.headers.raw()["set-cookie"];
  if (!setCookie || setCookie.length === 0) {
    throw new Error("Impossible de se connecter (cookies non reçus).");
  }

  return setCookie
    .map((c) => c.split(";")[0])
    .join("; ");
}

// Fonction helper pour extraire la position d'un NPC
function extractPosition($, npcName) {
  let position = "";
  
  // Retirer tous les scripts et styles avant de chercher
  $('script, style, noscript').remove();
  
  // Chercher dans le texte de la page (sans les scripts)
  const bodyText = $('body').text().replace(/\s+/g, " ");
  
  // Pattern principal: "le/la NPC se trouve actuellement case XXX (XXxXX), dans..."
  // Permet "le" ou "la" avant le nom du NPC
  const pattern1 = new RegExp(`(?:le|la)\\s+${npcName}\\s+se\\s+trouve\\s+actuellement\\s+case\\s+(\\d+)\\s*\\((\\d+)x(\\d+)\\)\\s*,\\s*dans\\s+([^.]+)`, 'i');
  let match = bodyText.match(pattern1);
  if (match && match[1] && match[2] && match[3] && match[4]) {
    position = `case ${match[1]} (${match[2]}x${match[3]}), dans ${match[4].trim()}`;
    return position;
  }
  
  // Pattern alternatif sans "le/la": "NPC se trouve actuellement case XXX (XXxXX), dans..."
  const pattern1b = new RegExp(`${npcName}\\s+se\\s+trouve\\s+actuellement\\s+case\\s+(\\d+)\\s*\\((\\d+)x(\\d+)\\)\\s*,\\s*dans\\s+([^.]+)`, 'i');
  match = bodyText.match(pattern1b);
  if (match && match[1] && match[2] && match[3] && match[4]) {
    position = `case ${match[1]} (${match[2]}x${match[3]}), dans ${match[4].trim()}`;
    return position;
  }
  
  // Pattern alternatif: "le/la NPC se trouve case XXX (XXxXX)"
  const pattern2 = new RegExp(`(?:le|la)\\s+${npcName}\\s+se\\s+trouve[^.]*case\\s+(\\d+)\\s*\\((\\d+)x(\\d+)\\)`, 'i');
  match = bodyText.match(pattern2);
  if (match && match[1] && match[2] && match[3]) {
    position = `case ${match[1]} (${match[2]}x${match[3]})`;
    return position;
  }
  
  // Pattern alternatif sans "le/la": "NPC se trouve case XXX (XXxXX)"
  const pattern2b = new RegExp(`${npcName}\\s+se\\s+trouve[^.]*case\\s+(\\d+)\\s*\\((\\d+)x(\\d+)\\)`, 'i');
  match = bodyText.match(pattern2b);
  if (match && match[1] && match[2] && match[3]) {
    position = `case ${match[1]} (${match[2]}x${match[3]})`;
    return position;
  }
  
  // Pattern avec ":" format classique
  const pattern3 = new RegExp(`${npcName}\\s*:\\s*([^;}\\]]{1,150}?)(?:\\s*[;}\\]\\n\\r]|$)`, 'i');
  match = bodyText.match(pattern3);
  if (match && match[1]) {
    position = match[1].trim();
    position = position
      .replace(/[;}\]]+.*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (position.includes('function') || position.includes('var ') || position.includes('window.')) {
      position = "";
    } else if (position.length > 150) {
      position = position.substring(0, 150).trim();
    }
    if (position.length > 0) {
      return position;
    }
  }
  
  // Pattern général pour "NPC" suivi de position avec case
  const pattern4 = new RegExp(`${npcName}[^.]*case\\s+(\\d+)`, 'i');
  match = bodyText.match(pattern4);
  if (match && match[1]) {
    position = `case ${match[1]}`;
    return position;
  }
  
  // Chercher dans des éléments HTML spécifiques
  $('td, th, div, p, span, li').each((i, el) => {
    if (position) return;
    
    const $el = $(el);
    const text = $el.text().replace(/\s+/g, " ").trim();
    
    const npcPattern = new RegExp(npcName, 'i');
    if (npcPattern.test(text)) {
      // Essayer pattern avec "le/la"
      match = text.match(new RegExp(`(?:le|la)\\s+${npcName}\\s+se\\s+trouve\\s+actuellement\\s+case\\s+(\\d+)\\s*\\((\\d+)x(\\d+)\\)\\s*,\\s*dans\\s+([^.]+)`, 'i'));
      if (match && match[1] && match[2] && match[3] && match[4]) {
        position = `case ${match[1]} (${match[2]}x${match[3]}), dans ${match[4].trim()}`;
        return;
      }
      
      // Essayer pattern sans "le/la"
      match = text.match(new RegExp(`${npcName}\\s+se\\s+trouve\\s+actuellement\\s+case\\s+(\\d+)\\s*\\((\\d+)x(\\d+)\\)\\s*,\\s*dans\\s+([^.]+)`, 'i'));
      if (match && match[1] && match[2] && match[3] && match[4]) {
        position = `case ${match[1]} (${match[2]}x${match[3]}), dans ${match[4].trim()}`;
        return;
      }
      
      // Pattern alternatif avec "le/la"
      match = text.match(new RegExp(`(?:le|la)\\s+${npcName}\\s+se\\s+trouve[^.]*case\\s+(\\d+)\\s*\\((\\d+)x(\\d+)\\)`, 'i'));
      if (match && match[1] && match[2] && match[3]) {
        position = `case ${match[1]} (${match[2]}x${match[3]})`;
        return;
      }
      
      // Pattern alternatif sans "le/la"
      match = text.match(new RegExp(`${npcName}\\s+se\\s+trouve[^.]*case\\s+(\\d+)\\s*\\((\\d+)x(\\d+)\\)`, 'i'));
      if (match && match[1] && match[2] && match[3]) {
        position = `case ${match[1]} (${match[2]}x${match[3]})`;
        return;
      }
      
      match = text.match(pattern3);
      if (match && match[1]) {
        position = match[1].trim();
        position = position
          .replace(/[;}\]]+.*$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (!position.includes('function') && !position.includes('var ') && !position.includes('window.')) {
          if (position.length > 150) {
            position = position.substring(0, 150).trim();
          }
          return;
        } else {
          position = "";
        }
      }
    }
  });
  
  return position;
}

// Fonction helper pour récupérer la position d'un NPC
async function getNpcPosition(archivesUrl, npcName, npcDisplayName) {
  const cookieHeader = await login();

  // Page archives
  const archivesResponse = await fetch(archivesUrl, {
    method: "GET",
    headers: {
      Cookie: cookieHeader,
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!archivesResponse.ok) {
    throw new Error("Impossible de charger la page des archives.");
  }

  const html = await archivesResponse.text();
  const $ = cheerio.load(html);

  const position = extractPosition($, npcName);

  // Si toujours rien, on vérifie si c'est une erreur "pas aux archives"
  if (!position) {
    const fullText = $("body").text().replace(/\s+/g, " ").trim();

    // Détection de différents messages d'erreur possibles
    const isNotAtArchives = 
      (/archives/i.test(fullText) && (/dois être|devez être|être présent|être aux/i.test(fullText))) ||
      (/vous devez/i.test(fullText) && /archives/i.test(fullText)) ||
      (/accès refusé/i.test(fullText) && /archives/i.test(fullText));

    if (isNotAtArchives) {
      throw new Error(`Le joueur n'est pas aux archives, impossible de récupérer la position du ${npcDisplayName}.`);
    }

    throw new Error(`Position du ${npcDisplayName} introuvable dans la page. (Le joueur n'est peut-être pas aux archives ou le HTML a changé.)`);
  }

  return position;
}

app.get("/api/marchand-position", async (req, res) => {
  // Utiliser le cache si disponible et valide
  if (isCacheValid() && positionsCache.marchand) {
    return res.json({ position: positionsCache.marchand });
  }

  // Sinon, récupérer depuis l'API (et mettre à jour le cache)
  try {
    const position = await getNpcPosition(
      ARCHIVES_URL_MARCHAND,
      "marchand\\s+ambulant",
      "marchand ambulant"
    );
    
    // Mettre à jour le cache
    positionsCache.marchand = position;
    positionsCache.lastUpdate = new Date();
    
    return res.json({ position });
  } catch (err) {
    // Log minimal sans informations sensibles
    if (process.env.NODE_ENV === "development") {
      console.error("Erreur marchand:", err.message);
    }
    if (err.message.includes("Impossible de se connecter") || err.message.includes("Identifiants non configurés")) {
      return res.status(401).json({
        error: "Impossible de se connecter. Vérifiez la configuration.",
      });
    }
    if (err.message.includes("archives") || err.message.includes("introuvable")) {
      return res.status(400).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: "Erreur interne serveur lors de la récupération." });
  }
});

app.get("/api/mineur-position", async (req, res) => {
  // Utiliser le cache si disponible et valide
  if (isCacheValid() && positionsCache.mineur) {
    return res.json({ position: positionsCache.mineur });
  }

  // Sinon, récupérer depuis l'API (et mettre à jour le cache)
  try {
    const position = await getNpcPosition(
      ARCHIVES_URL_MINEUR,
      "mineur",
      "mineur"
    );
    
    // Mettre à jour le cache
    positionsCache.mineur = position;
    positionsCache.lastUpdate = new Date();
    
    return res.json({ position });
  } catch (err) {
    // Log minimal sans informations sensibles
    if (process.env.NODE_ENV === "development") {
      console.error("Erreur mineur:", err.message);
    }
    if (err.message.includes("Impossible de se connecter") || err.message.includes("Identifiants non configurés")) {
      return res.status(401).json({
        error: "Impossible de se connecter. Vérifiez la configuration.",
      });
    }
    if (err.message.includes("archives") || err.message.includes("introuvable")) {
      return res.status(400).json({ error: err.message });
    }
    return res
      .status(500)
      .json({ error: "Erreur interne serveur lors de la récupération." });
  }
});

// Endpoint pour récupérer toutes les positions (depuis le cache)
app.get("/api/positions", (req, res) => {
  if (positionsCache.error && !positionsCache.marchand && !positionsCache.mineur) {
    return res.status(500).json({ 
      error: positionsCache.error || "Erreur lors de la récupération des positions."
    });
  }
  
  return res.json({
    marchand: positionsCache.marchand,
    mineur: positionsCache.mineur,
    lastUpdate: positionsCache.lastUpdate
  });
});

app.listen(PORT, () => {
  if (process.env.NODE_ENV === "development") {
    console.log(`Server listening on port ${PORT}`);
  }
});

# 🎮 Secret Mission - Party Game App

Una sofisticata app per feste offline che trasforma qualsiasi riunione in un'esperienza di gioco coinvolgente attraverso missioni segrete e meccaniche pass-the-phone.

## ✨ Caratteristiche

- **🎯 Gioco Offline Completo**: Nessuna connessione internet richiesta
- **📱 Pass-the-Phone**: Meccaniche di gioco che coinvolgono tutti i partecipanti
- **🔒 Rivelazione Sicura**: Sistema di rivelazione missioni con press-and-hold
- **👥 Gestione Giocatori**: Aggiungi/rimuovi giocatori durante la partita
- **🏆 Rilevamento Vincitore**: Sistema automatico di vittoria e celebrazione
- **🎨 Design Sofisticato**: UI premium iOS-native senza elementi cartoon

## 🏗️ Architettura Tecnica

- **Framework**: React Native + Expo + TypeScript
- **State Management**: Context + useReducer
- **Persistenza**: AsyncStorage per funzionalità offline
- **Testing**: Jest + Property-Based Testing con fast-check
- **Design System**: Sistema di design personalizzato con palette colori obbligatoria

## 🎨 Sistema di Design

### Palette Colori
- **Primary/Brand**: `#F5B301` (oro)
- **Secondary**: `#1F2A44` (blu navy profondo)
- **Accent**: `#2EC4C6` (teal morbido)
- **Text Primary**: `#2B2B2B`
- **Background**: `#FFFFFF` / `#F5F6F8`

### Principi di Design
- ✅ Moderno, pulito, premium iOS feel
- ✅ Coinvolgente ma NON cartoonesco o infantile
- ✅ UX veloce e senza attriti
- ✅ Privacy-first by design

## 🚀 Installazione e Setup

### Prerequisiti
- Node.js (v18 o superiore)
- npm o yarn
- Expo CLI
- iOS Simulator o dispositivo iOS

### Installazione
```bash
# Clona il repository
git clone https://github.com/[username]/secret-mission-app.git
cd secret-mission-app

# Installa le dipendenze
npm install

# Avvia l'app
npm start
```

### Comandi Disponibili
```bash
npm start          # Avvia Expo development server
npm run ios        # Avvia su iOS simulator
npm run android    # Avvia su Android emulator
npm test           # Esegue tutti i test
npm run lint       # Esegue ESLint
npm run build      # Build per produzione
```

## 🧪 Testing

Il progetto include una suite di test completa:
- **56 test** che passano tutti
- **Property-Based Testing** per validazione robusta
- **MVP Validation** e checklist QA
- **Copertura errori** completa

```bash
npm test           # Esegue tutti i test
npm run test:watch # Esegue test in modalità watch
```

## 📱 Come Giocare

1. **Setup**: Aggiungi almeno 3 giocatori
2. **Assegnazione**: Ogni giocatore riceve una missione segreta
3. **Gioco**: I giocatori tentano di completare le loro missioni
4. **Rivelazione**: Usa "Vedi o aggiorna status missione" per rivelare e aggiornare
5. **Vittoria**: Il primo a completare 1 missione vince!

## 🏆 Funzionalità Principali

### Gestione Giocatori
- Aggiunta/rimozione dinamica durante la partita
- Validazione nomi (2-20 caratteri, no duplicati)
- Minimo 3 giocatori richiesti

### Sistema Missioni
- Rivelazione sicura con press-and-hold
- Stati: In Attesa → Attiva → Completata/Scoperta
- Assegnazione automatica per nuovi giocatori

### Privacy e Sicurezza
- Mai mostrare liste di missioni
- Solo rivelazioni individuali
- Design che protegge il contenuto delle missioni

## 🛠️ Struttura del Progetto

```
src/
├── screens/           # Schermate dell'app
├── components/        # Componenti riutilizzabili
├── store/            # State management (Context + Reducer)
├── models/           # Tipi TypeScript e interfacce
├── data/             # Dati statici (missioni)
├── utils/            # Funzioni di utilità
├── theme/            # Sistema di design e costanti
└── __tests__/        # Test suite
```

## 📋 Roadmap

- [ ] Espansione per Android
- [ ] Più categorie di missioni
- [ ] Modalità torneo
- [ ] Personalizzazione temi
- [ ] Statistiche avanzate

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 🎯 MVP Status

✅ **Completato** - L'app è pronta per l'uso con tutte le funzionalità core implementate e testate.

---

*Sviluppato con ❤️ per creare momenti di divertimento e connessione nelle feste*
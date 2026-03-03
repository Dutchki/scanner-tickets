import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, XCircle, AlertTriangle, ArrowLeft, FileSpreadsheet, ScanLine } from 'lucide-react';

// ==========================================
// PAGE D'ACCUEIL - Import du fichier CSV
// ==========================================

const PageAccueil = ({ definirDonneesCSV }) => {
  const [glissementActif, setGlissementActif] = useState(false);
  const [nomFichier, setNomFichier] = useState(null);
  const navigation = useNavigate();

  const gererGlissement = (e) => {
    e.preventDefault();
    setGlissementActif(true);
  };

  const gererSortieGlissement = () => {
    setGlissementActif(false);
  };

  const traiterFichier = (fichier) => {
    if (fichier && (fichier.type === "text/csv" || fichier.name.endsWith('.csv'))) {
      setNomFichier(fichier.name);
      const lecteur = new FileReader();
      lecteur.onload = (e) => {
        const texte = e.target.result;
        analyserCSV(texte);
      };
      lecteur.readAsText(fichier);
    } else {
      alert("Veuillez télécharger un fichier CSV valide.");
    }
  };

  const analyserCSV = (texte) => {
    const lignes = texte.split('\n');
    const donnees = [];
    
    // Trouver la ligne d'en-tête
    let indexDebut = lignes.findIndex(l => l.includes("Opérateur;Superviseur;Ticket"));
    if (indexDebut === -1) indexDebut = 0;

    for (let i = indexDebut + 1; i < lignes.length; i++) {
      const ligne = lignes[i].trim();
      if (!ligne) continue;

      // Séparer par point-virgule (format CSV français)
      const colonnes = ligne.split(';');
      
      // Le numéro de ticket est à l'index 2 (3ème colonne)
      if (colonnes[2] && !isNaN(colonnes[2])) {
        donnees.push({
          numeroTicket: colonnes[2].trim(),
          operateur: colonnes[0],
          ean: colonnes[3],
          libelle: colonnes[4],
          quantite: colonnes[7],
          prix: colonnes[9]
        });
      }
    }
    definirDonneesCSV(donnees);
  };

  const gererDepot = (e) => {
    e.preventDefault();
    setGlissementActif(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      traiterFichier(e.dataTransfer.files[0]);
    }
  };

  const gererSelectionFichier = (e) => {
    if (e.target.files && e.target.files[0]) {
      traiterFichier(e.target.files[0]);
    }
  };

  // Données de démonstration pour tester
  const utiliserDonneesDemo = () => {
    const donneesDemo = [
      { numeroTicket: "8591", operateur: "KAOUANI Kamel", libelle: "BLOUSE BROD UNIE" },
      { numeroTicket: "8587", operateur: "KAOUANI Kamel", libelle: "250G ARLEQUIN LUTI" },
      { numeroTicket: "8584", operateur: "KAOUANI Kamel", libelle: "SWIFFER PLUMEAUX" },
      { numeroTicket: "8573", operateur: "KAOUANI Kamel", libelle: "BOTTINE CUIR" },
      { numeroTicket: "8534", operateur: "KAOUANI Kamel", libelle: "XXTS BIO MC COL RI" },
      { numeroTicket: "8529", operateur: "KAOUANI Kamel", libelle: "CL MENST KAK M" },
      { numeroTicket: "8520", operateur: "KAOUANI Kamel", libelle: "JD MECHES LU SHP B" },
      { numeroTicket: "8500", operateur: "KAOUANI Kamel", libelle: "ARTICHAUT BLANC" },
      { numeroTicket: "8484", operateur: "PONS Jeanne", libelle: "2 ST PLUME JETABLE" },
      { numeroTicket: "8468", operateur: "PONS Jeanne", libelle: "SALADE LENTILLES" },
      { numeroTicket: "8456", operateur: "PONS Jeanne", libelle: "CARDIGAN ML" },
      { numeroTicket: "7585", operateur: "SCO 97", libelle: "YAOURT VANILLE" },
    ];
    definirDonneesCSV(donneesDemo);
    setNomFichier("Données_Démo.csv");
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="home-icon">
          <ScanLine size={64} />
        </div>
        <h1 className="home-title">Scanner de Tickets</h1>
        <p className="home-subtitle">Importez votre fichier CSV des retours pour commencer le scan</p>

        <div 
          onDragOver={gererGlissement}
          onDragLeave={gererSortieGlissement}
          onDrop={gererDepot}
          className={`drop-zone ${glissementActif ? 'active' : ''}`}
        >
          <input 
            type="file" 
            accept=".csv" 
            onChange={gererSelectionFichier}
            className="hidden-input" 
            id="entreeFichier" 
          />
          <label htmlFor="entreeFichier" style={{ cursor: 'pointer' }}>
            <div className="drop-icon">
              <Upload size={48} />
            </div>
            <div className="drop-text">
              {nomFichier ? nomFichier : "Déposez le fichier CSV ici ou cliquez pour parcourir"}
            </div>
            <div className="drop-hint">Format supporté : .csv</div>
          </label>
        </div>

        <button 
          onClick={() => navigation('/scan')}
          disabled={!nomFichier}
          className="btn-primary"
        >
          Commencer le Scan
        </button>
        
        <button 
          onClick={utiliserDonneesDemo}
          className="btn-link"
        >
          Utiliser les données de démonstration
        </button>
      </div>
    </div>
  );
};

// ==========================================
// PAGE DE SCAN - Scan des tickets
// ==========================================

const PageScan = ({ donneesCSV }) => {
  const [codesScannes, setCodesScannes] = useState([]);
  const [valeurEntree, setValeurEntree] = useState('');
  const [statutDernierScan, setStatutDernierScan] = useState(null);
  const referenceEntree = useRef(null);
  const navigation = useNavigate();

  // Garder le focus sur l'input
  useEffect(() => {
    if (referenceEntree.current) referenceEntree.current.focus();
  }, []);

  // Extraire le numéro de ticket du code-barres
  // Structure: 0106 [Contremarque] 0970 [Opérateur] 7585 [Ticket] 260302 [Date] 134936 [Heure]
  const extraireNumeroTicket = (codeBrut) => {
    // Supprimer les caractères non numériques
    const codePropre = codeBrut.replace(/\D/g, '');
    
    // Exemple: 010609707585260302134936
    // 0-3: Contremarque (0106)
    // 4-7: Opérateur (0970)
    // 8-11: Ticket (7585) -> On veut ça
    // 12-17: Date (inversée)
    // 18-23: Heure
    
    if (codePropre.length >= 12) {
      return codePropre.substring(8, 12); // Extrait 7585
    }
    return codePropre; // Fallback
  };

  const gererScan = (e) => {
    e.preventDefault();
    if (!valeurEntree) return;

    const numeroTicket = extraireNumeroTicket(valeurEntree);
    
    // Vérifier si déjà scanné
    if (codesScannes.some(s => s.numeroTicket === numeroTicket)) {
      setStatutDernierScan('doublon');
    } else {
      // Vérifier si existe dans la base de données
      const trouveDansBD = donneesCSV.find(ligne => ligne.numeroTicket === numeroTicket);
      
      const objetScan = {
        brut: valeurEntree,
        numeroTicket: numeroTicket,
        horodatage: new Date().toLocaleTimeString('fr-FR'),
        trouve: !!trouveDansBD,
        details: trouveDansBD || null
      };

      setCodesScannes(prev => [...prev, objetScan]);
      setStatutDernierScan(!!trouveDansBD ? 'succes' : 'erreur');
    }

    setValeurEntree('');
    // Refocus pour le scan suivant
    setTimeout(() => referenceEntree.current.focus(), 50);
  };

  // Calculer les résultats
  const ticketsManquants = donneesCSV.filter(itemBD => 
    !codesScannes.some(scan => scan.numeroTicket === itemBD.numeroTicket)
  );

  const ticketsInconnus = codesScannes.filter(scan => !scan.trouve);

  const getAlertClass = () => {
    switch(statutDernierScan) {
      case 'succes': return 'alert-success';
      case 'doublon': return 'alert-warning';
      case 'erreur': return 'alert-error';
      default: return '';
    }
  };

  const getAlertMessage = () => {
    switch(statutDernierScan) {
      case 'succes': return 'Ticket trouvé dans la base !';
      case 'doublon': return 'Attention : Ticket déjà scanné !';
      case 'erreur': return 'Erreur : Ticket non trouvé dans la base !';
      default: return '';
    }
  };

  const getAlertIcon = () => {
    switch(statutDernierScan) {
      case 'succes': return <CheckCircle size={24} />;
      case 'doublon': return <AlertTriangle size={24} />;
      case 'erreur': return <XCircle size={24} />;
      default: return null;
    }
  };

  return (
    <div className="scan-container">
      <div className="scan-content">
        {/* En-tête */}
        <div className="scan-header">
          <button 
            onClick={() => navigation('/')}
            className="btn-back"
          >
            <ArrowLeft size={20} /> Retour
          </button>
          <h2 className="scan-title">Mode Scan</h2>
          <div style={{ width: '80px' }}></div>
        </div>

        {/* Zone de saisie */}
        <div className="input-section">
          <form onSubmit={gererScan}>
            <label className="input-label">Saisie du Code-Barres</label>
            <div className="input-group">
              <input
                ref={referenceEntree}
                type="text"
                value={valeurEntree}
                onChange={(e) => setValeurEntree(e.target.value)}
                placeholder="Scannez le ticket ici..."
                className="scan-input"
                autoFocus
              />
              <button 
                type="submit"
                className="btn-enter"
              >
                Entrée
              </button>
            </div>
            <p className="input-hint">
              Format attendu : 0106...[Ticket]...[Date]... (Ex: 010609707585260302134936)
            </p>
          </form>

          {/* Indicateur de statut */}
          {statutDernierScan && (
            <div className={`alert ${getAlertClass()}`}>
              {getAlertIcon()}
              <span className="alert-text">{getAlertMessage()}</span>
            </div>
          )}
        </div>

        <div className="main-grid">
          {/* Liste des scans */}
          <div className="scans-panel">
            <div className="panel-header">
              <h3 className="panel-title">Tickets Scannés ({codesScannes.length})</h3>
            </div>
            <div className="scans-list">
              {codesScannes.length === 0 ? (
                <div className="empty-state">
                  <ScanLine size={48} className="empty-icon" />
                  Aucun ticket scanné pour l'instant
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>N° Ticket</th>
                      <th>Heure</th>
                      <th>Opérateur</th>
                      <th className="text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...codesScannes].reverse().map((scan, idx) => (
                      <tr key={idx}>
                        <td className="ticket-number">{scan.numeroTicket}</td>
                        <td className="ticket-time">{scan.horodatage}</td>
                        <td className="ticket-operator">
                          {scan.details?.operateur || '-'}
                        </td>
                        <td className="text-right">
                          {scan.trouve ? (
                            <span className="badge badge-success">
                              <CheckCircle size={12} /> OK
                            </span>
                          ) : (
                            <span className="badge badge-error">
                              <XCircle size={12} /> INCONNU
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Résumé et tickets manquants */}
          <div className="side-panel">
            {/* Carte résumé */}
            <div className="summary-card">
              <h3 className="summary-title">
                <FileSpreadsheet size={20} /> Résumé
              </h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-label">Total en Base</div>
                  <div className="summary-value">{donneesCSV.length}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Scannés</div>
                  <div className="summary-value success">
                    {codesScannes.filter(s => s.trouve).length}
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Manquants</div>
                  <div className={`summary-value ${ticketsManquants.length > 0 ? 'error' : 'success'}`}>
                    {ticketsManquants.length}
                  </div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Inconnus</div>
                  <div className="summary-value warning">{ticketsInconnus.length}</div>
                </div>
              </div>
            </div>

            {/* Liste des tickets manquants */}
            <div className="missing-panel">
              <div className="missing-header">
                <AlertTriangle size={18} />
                <h3 className="missing-title">Tickets Manquants ({ticketsManquants.length})</h3>
              </div>
              <div className="missing-list">
                {ticketsManquants.length === 0 ? (
                  <div className="missing-empty">
                    <CheckCircle size={32} className="missing-empty-icon" />
                    Tous les tickets sont scannés !
                  </div>
                ) : (
                  <div>
                    {ticketsManquants.map((ticket, idx) => (
                      <div key={idx} className="missing-item">
                        <div className="missing-ticket-info">
                          <span className="missing-ticket-number">#{ticket.numeroTicket}</span>
                          <span className="missing-ticket-label">{ticket.libelle || 'Sans libellé'}</span>
                        </div>
                        <span className="missing-operator">
                          {ticket.operateur || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

function App() {
  const [donneesCSV, definirDonneesCSV] = useState([]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<PageAccueil definirDonneesCSV={definirDonneesCSV} />} />
        <Route path="/scan" element={<PageScan donneesCSV={donneesCSV} />} />
      </Routes>
    </Router>
  );
}

export default App;
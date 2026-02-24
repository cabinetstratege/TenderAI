
import jsPDF from 'jspdf';
import { UserProfile, Tender, AIStrategyAnalysis } from '../types';

export const generateDashboardReport = (stats: any, profile: UserProfile | null, periodLabel: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let y = 20;

  // --- HEADER ---
  // Titre
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text("Rapport d'Activité Marchés Publics", margin, y);
  y += 10;

  // Sous-titre
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Généré par Le Compagnon des Marchés pour ${profile?.companyName || 'Mon Entreprise'}`, margin, y);
  doc.text(`Période : ${periodLabel} | Date : ${new Date().toLocaleDateString()}`, margin, y + 5);
  y += 20;

  // Ligne de séparation
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // --- SECTION 1: SYNTHÈSE EXÉCUTIVE (KPIs) ---
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Synthèse Exécutive", margin, y);
  y += 10;

  // Dessin des boîtes KPI
  const kpiWidth = (pageWidth - (margin * 2) - 10) / 3;
  const kpiHeight = 25;

  const drawKPI = (label: string, value: string, x: number) => {
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(220, 220, 230);
      doc.roundedRect(x, y, kpiWidth, kpiHeight, 3, 3, 'FD');
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(label.toUpperCase(), x + 5, y + 8);
      
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175); // Blue
      doc.setFont("helvetica", "bold");
      doc.text(value, x + 5, y + 18);
      doc.setFont("helvetica", "normal");
  };

  drawKPI("Opportunités", stats.kpi.totalOpportunities.toString(), margin);
  drawKPI("Budget Détecté", (stats.kpi.totalBudget / 1000).toFixed(0) + " k€", margin + kpiWidth + 5);
  drawKPI("Taux Pertinence", stats.kpi.avgScore + " %", margin + (kpiWidth + 5) * 2);
  
  y += kpiHeight + 15;

  // --- SECTION 2: ANALYSE DÉTAILLÉE ---
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Détail de la Performance", margin, y);
  y += 10;

  const details = [
      `• Dossiers Gagnables (>70% match) : ${stats.kpi.winnableCount}`,
      `• Taux de transformation : ${stats.conversionRate}%`,
      `• Région principale : ${stats.topRegion || 'N/A'}`,
      `• Secteur dominant : ${stats.topSector || 'N/A'}`
  ];

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  details.forEach(detail => {
      doc.text(detail, margin + 5, y);
      y += 7;
  });
  y += 10;

  // --- SECTION 3: RÉPARTITION SECTORIELLE (Tableau simple) ---
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Répartition par Activité/Statut", margin, y);
  y += 10;

  // En-tête tableau
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Catégorie", margin + 5, y + 5);
  doc.text("Volume", margin + 100, y + 5);
  y += 8;

  // Lignes
  doc.setFont("helvetica", "normal");
  stats.donutData.forEach((item: any, index: number) => {
      if (index % 2 === 0) doc.setFillColor(250, 250, 250);
      else doc.setFillColor(255, 255, 255);
      
      doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
      doc.setTextColor(50, 50, 50);
      doc.text(item.name, margin + 5, y + 5);
      doc.text(item.value.toString(), margin + 100, y + 5);
      y += 8;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(`Document confidentiel - Le Compagnon des Marchés - Page ${i} / ${totalPages}`, margin, 280);
  }
  
  doc.save(`Rapport_Activite_${new Date().toISOString().split('T')[0]}.pdf`);
};

const addSectionTitle = (doc: jsPDF, title: string, x: number, y: number) => {
  doc.setFontSize(12);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), x, y);
  doc.setFont('helvetica', 'normal');
  return y + 6;
};

const addKeyValue = (doc: jsPDF, label: string, value: string, x: number, y: number) => {
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(label, x, y);
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(value, x, y + 5);
  return y + 12;
};

const ensureSpace = (doc: jsPDF, y: number, margin: number) => {
  if (y > 270) {
    doc.addPage();
    return margin;
  }
  return y;
};

export const generateTenderReport = (
  tender: Tender,
  analysis?: AIStrategyAnalysis,
  notes?: string,
  profile?: UserProfile | null,
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 18;
  let y = margin;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(tender.title, pageWidth - margin * 2);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 4; // spacing proportional to line count

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `AO #${tender.idWeb} — ${tender.buyer}`,
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 },
  );
  y += 12;

  // Info band
  const infoBoxWidth = (pageWidth - margin * 2 - 8) / 3;
  const infoBoxHeight = 20;
  const infoItems = [
    { label: 'Dépôt', value: tender.deadline },
    { label: 'Compatibilité', value: `${tender.compatibilityScore}%` },
    { label: 'Budget estimé', value: tender.estimatedBudget ? `${tender.estimatedBudget.toLocaleString('fr-FR')} €` : '—' },
  ];

  infoItems.forEach((item, idx) => {
    const x = margin + idx * (infoBoxWidth + 4);
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(225, 230, 235);
    doc.roundedRect(x, y, infoBoxWidth, infoBoxHeight, 3, 3, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 120);
    doc.text(item.label.toUpperCase(), x + 4, y + 7);
    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, x + 4, y + 15);
    doc.setFont('helvetica', 'normal');
  });
  y += infoBoxHeight + 12;

  // Summary
  y = addSectionTitle(doc, 'Résumé', margin, y);
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const summary = tender.aiSummary || tender.fullDescription || 'Résumé indisponible.';
  const summaryLines = doc.splitTextToSize(summary, pageWidth - margin * 2);
  summaryLines.forEach((line: string) => {
    y = ensureSpace(doc, y, margin);
    doc.text(line, margin, y);
    y += 6;
  });
  y += 4;

  // Lots
  y = ensureSpace(doc, y, margin);
  y = addSectionTitle(doc, 'Lots', margin, y);
  if (!tender.lots.length) {
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text('Aucun lot renseigné.', margin, y + 4);
    y += 12;
  } else {
    tender.lots.forEach((lot) => {
      y = ensureSpace(doc, y, margin);
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(230, 230, 230);
      const boxHeight = 20;
      doc.roundedRect(margin, y, pageWidth - margin * 2, boxHeight, 2, 2, 'FD');
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text(`Lot ${lot.lotNumber} — ${lot.title}`, margin + 4, y + 8);
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      const desc = lot.description || 'Description non fournie';
      doc.text(doc.splitTextToSize(desc, pageWidth - margin * 2 - 8), margin + 4, y + 14);
      if (lot.cpv?.length) {
        doc.setTextColor(60, 90, 140);
        doc.text(`CPV: ${lot.cpv.join(', ')}`, margin + 4, y + 18);
      }
      y += boxHeight + 4;
    });
  }

  // Analysis
  if (analysis) {
    y = ensureSpace(doc, y + 4, margin);
    y = addSectionTitle(doc, 'Analyse IA', margin, y);
    const columnWidth = (pageWidth - margin * 2 - 6) / 2;

    const renderBullet = (items: string[], title: string, x: number) => {
      doc.setFillColor(245, 247, 250);
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(x, y, columnWidth, 8 + items.length * 6, 2, 2, 'FD');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(title, x + 4, y + 6);
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      items.forEach((item, idx) => {
        doc.text(`• ${item}`, x + 4, y + 12 + idx * 6, { maxWidth: columnWidth - 8 });
      });
    };

    renderBullet(analysis.strengths || [], 'Atouts', margin);
    renderBullet(analysis.risks || [], 'Risques', margin + columnWidth + 6);
    y += Math.max(8 + (analysis.strengths?.length || 0) * 6, 8 + (analysis.risks?.length || 0) * 6) + 10;

    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Charge estimée : ${analysis.workload}`, margin, y);
    y += 10;
  }

  // Contacts & Notes
  y = ensureSpace(doc, y, margin);
  y = addSectionTitle(doc, 'Contacts & Notes', margin, y);
  const contactY = addKeyValue(doc, 'Contact', tender.contact?.name || '—', margin, y);
  const phoneY = addKeyValue(doc, 'Téléphone', tender.contact?.phone || '—', margin + 70, y);
  const emailY = addKeyValue(doc, 'Email', tender.contact?.email || '—', margin + 140, y);
  y = Math.max(contactY, phoneY, emailY) + 2;

  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  const notesText = notes?.trim() ? notes : 'Aucune note interne.';
  const noteLines = doc.splitTextToSize(notesText, pageWidth - margin * 2);
  noteLines.forEach((line: string) => {
    y = ensureSpace(doc, y, margin);
    doc.text(line, margin, y);
    y += 6;
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.text(
      `${profile?.companyName || 'TenderAI'} — Document généré le ${new Date().toLocaleDateString()}`,
      margin,
      287,
    );
    doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin - 20, 287);
  }

  doc.save(`AO-${tender.idWeb}.pdf`);
};

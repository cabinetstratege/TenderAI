
import jsPDF from 'jspdf';
import { UserProfile } from '../types';

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

/**
 * Constantes du thème, dans un module neutre : la mise en page (rendue côté
 * serveur) en a besoin, et une constante exportée d'un fichier « use client »
 * n'arrive au serveur que comme une référence vide.
 */
export const THEME_KEY = 'i2s-system.theme';

/**
 * Appliqué dans <head> AVANT le premier affichage : sans lui, une page en
 * mode sombre s'afficherait d'abord en clair, le temps que React démarre.
 */
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}`;

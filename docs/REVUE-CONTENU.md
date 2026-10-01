# Revue du contenu — cas cliniques (Phase 2)

Les 9 cas cliniques sont en **brouillon** (`"status": "draft"`). Ils apparaissent dans la Consultation avec un badge « Brouillon » et ne compteront jamais dans le Boss ni l'Examen blanc. Merci de vérifier chaque point ci-dessous avec tes cours avant de les valider dans l'éditeur (Phase 5).

Règle appliquée partout : **chaque syndrome de la réponse est justifié par au moins un signe clé** (`"key": true`) de l'interrogatoire ou de l'examen.

| Cas | Syndrome(s) attendu(s) → signe(s) clé(s) qui le justifient |
|---|---|
| Tuberculose pulmonaire (Brahim) | Condensation → crépitants + matité du sommet droit · Infectieux → T° 38,1 °C |
| Cholécystite aiguë (Khadija) | Colique hépatique → douleur HD irradiant à l'épaule après repas gras + signe de Murphy · Infectieux → T° 38,6 °C |
| Appendicite aiguë (Youssef) | Irritation péritonéale localisée → défense + Blumberg (+ Rovsing) · Infectieux → fébricule 38,1 °C |
| Kyste hydatique du foie (Mohammed) | Hépatomégalie → palpation + flèche hépatique 17 cm |
| Insuffisance cardiaque droite (Aïcha) | ICD → turgescence jugulaire, reflux hépato-jugulaire, hépatomégalie douloureuse, OMI |
| Épanchement pleural liquidien (Hamza) | Épanchement → matité, VV abolies, MV aboli · Infectieux → T° 38 °C |
| Méningite (Salma) | Méningé → raideur de nuque, Kernig, Brudzinski · Infectieux → T° 39,2 °C |
| Syndrome anémique (Hajar) | Anémique → pâleur cutanéo-muqueuse, conjonctives pâles, tachycardie |
| Brucellose (Omar) | Infectieux → T° 38,9 °C, sueurs (fièvre ondulante à l'interrogatoire) |

## Points à vérifier

1. **Lignes en darija** (8 nouvelles) : écrites par l'assistant. Vérifier l'orthographe en translittération et le naturel des phrases.
2. **Noms de syndromes** : la liste des choix est dans `src/config/syndromes.json`. Vérifier qu'ils correspondent aux intitulés de ta faculté, en particulier :
   - « colique hépatique » pour la cholécystite (certains cours parlent de « syndrome douloureux biliaire ») ;
   - « hépatomégalie » pour le kyste hydatique : c'est un signe plus qu'un syndrome (alternative possible : « hépatomégalie isolée » ou « syndrome tumoral hépatique ») ;
   - brucellose : seulement « syndrome infectieux » ; ta faculté utilise peut-être « fièvre sudoro-algique ».
3. **Insuffisance cardiaque droite** : l'étiologie choisie est un **rétrécissement mitral rhumatismal** (ICD par hypertension pulmonaire), justifiée par l'éclat de B1 + roulement diastolique et des angines répétées dans l'enfance. Le souffle tricuspidien augmenté à l'inspiration (insuffisance tricuspide fonctionnelle) est un signe non clé. À confirmer.
4. **Épanchement pleural** : l'étiologie retenue est la tuberculose pleurale (adulte jeune, sueurs, contage). Les synonymes acceptés incluent simplement « tuberculose ».
5. **Méningite** : l'étiologie est « méningite aiguë » sans préciser bactérienne ou virale, car la clinique seule ne tranche pas. La fiche mémo mentionne l'imagerie avant la ponction lombaire en cas de signe de focalisation.
6. **Kyste hydatique** : « 4 travers de doigt » et « flèche hépatique à 17 cm » sont des valeurs choisies pour l'exemple.
7. **Outils de l'examen** : les signes méningés (raideur de nuque, Kernig, Brudzinski) se recherchent avec l'outil « Palpation » (manœuvre) et le Babinski avec le « Marteau à réflexes ». Dis-moi si tu préfères un outil « Manœuvre » dédié.
8. **Score** : un syndrome incomplet (un seul des deux trouvé) vaut le score minimal (10 points, qualité SM-2 = 2), comme une erreur proche.

Pour proposer une correction, note le nom du cas et la phrase concernée ; je mettrai à jour le fichier JSON correspondant dans `src/content/<aile>/cases.json`.

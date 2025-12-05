# Configuration VMware Workstation pour les Labs

Ce guide explique comment configurer VMware Workstation pour que les instructeurs puissent créer et lancer des labs virtuels.

## Prérequis

1. **VMware Workstation Pro** doit être installé sur le serveur
2. Le chemin par défaut est : `C:\Program Files (x86)\VMware\VMware Workstation\`
3. L'outil `vmrun.exe` doit être accessible

## Configuration

### Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Chemin vers vmrun.exe (optionnel, par défaut: C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe)
VMWARE_VMRUN_PATH=C:\Program Files (x86)\VMware\VMware Workstation\vmrun.exe

# Chemin vers VMware Workstation (optionnel)
VMWARE_PATH=C:\Program Files (x86)\VMware\VMware Workstation

# Répertoire où les VMs seront créées (optionnel, par défaut: C:\VMs)
VMS_DIRECTORY=C:\VMs
```

### Préparation des Templates de VM

1. **Créer un template de VM** :
   - Créez une VM dans VMware Workstation avec la configuration souhaitée
   - Installez le système d'exploitation et les logiciels nécessaires
   - Arrêtez la VM
   - Notez le chemin complet du fichier `.vmx` (ex: `C:\VMs\Templates\template-linux.vmx`)

2. **Utiliser le template** :
   - Lors de la création d'un lab, l'instructeur doit fournir le chemin complet vers le fichier `.vmx` du template
   - Le système clonera automatiquement cette VM et la lancera

## Utilisation

### Pour les Instructeurs

1. **Créer un lab** :
   - Accédez à la page "Labs" dans le menu
   - Cliquez sur "Nouveau lab"
   - Remplissez les champs :
     - **Titre** : Nom du lab
     - **Description** : Description du lab (optionnel)
     - **Chemin du template VM** : Chemin complet vers le fichier `.vmx` du template
     - **Nom de la VM** : Nom unique pour la VM qui sera créée
     - **Classe** : Optionnel, lier le lab à une classe spécifique

2. **Lancer un lab** :
   - Cliquez sur le bouton "Lancer" sur la carte du lab
   - Le système va :
     - Cloner la VM depuis le template
     - Lancer la VM dans VMware Workstation
     - Mettre à jour le statut du lab

3. **Arrêter un lab** :
   - Cliquez sur le bouton "Arrêter" pour arrêter la VM

4. **Supprimer un lab** :
   - Cliquez sur le bouton de suppression
   - La VM sera supprimée automatiquement

## Commandes VMware utilisées

Le service utilise les commandes suivantes de `vmrun` :

- `vmrun clone` : Clone une VM depuis un template
- `vmrun start` : Démarre une VM
- `vmrun stop` : Arrête une VM
- `vmrun list` : Liste les VMs en cours d'exécution

## Dépannage

### Erreur : "VMware Workstation n'est pas installé"

- Vérifiez que VMware Workstation Pro est installé
- Vérifiez le chemin dans `VMWARE_VMRUN_PATH`
- Assurez-vous que `vmrun.exe` existe à cet emplacement

### Erreur : "Échec du clonage de la VM"

- Vérifiez que le template existe et est accessible
- Vérifiez les permissions d'accès au répertoire de destination
- Assurez-vous que le template n'est pas en cours d'exécution

### Erreur : "Échec du démarrage de la VM"

- Vérifiez que la VM a été clonée correctement
- Vérifiez les ressources système (RAM, CPU, espace disque)
- Consultez les logs VMware Workstation

## Sécurité

- Les VMs sont créées dans un répertoire dédié (`VMS_DIRECTORY`)
- Seuls les instructeurs et administrateurs peuvent créer/lancer des labs
- Les VMs sont supprimées automatiquement lors de la suppression d'un lab

## Notes importantes

- Le clonage et le lancement de VMs peuvent prendre plusieurs minutes
- Assurez-vous d'avoir suffisamment d'espace disque pour les VMs
- Les VMs consomment des ressources système (RAM, CPU)
- Il est recommandé de créer des templates optimisés pour réduire le temps de clonage



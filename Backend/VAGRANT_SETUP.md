# Configuration Vagrant pour les Labs

Ce guide explique comment configurer Vagrant pour que les instructeurs puissent créer et lancer des labs virtuels.

## Prérequis

1. **Vagrant** doit être installé sur le serveur
   - Télécharger depuis : https://www.vagrantup.com/downloads
   - Installer et ajouter au PATH système

2. **VirtualBox** ou **VMware Workstation** doit être installé
   - Vagrant utilise VirtualBox par défaut
   - Pour VMware, installer le plugin : `vagrant plugin install vagrant-vmware-desktop`

3. Vérifier l'installation :
   ```bash
   vagrant --version
   ```

## Configuration

### Variables d'environnement

Ajoutez cette variable dans votre fichier `.env` (optionnel) :

```env
# Répertoire où les labs Vagrant seront créés (optionnel, par défaut: ./vagrant_labs)
VAGRANT_LABS_DIRECTORY=C:\vagrant_labs
```

## Utilisation

### Pour les Instructeurs

1. **Créer un lab** :
   - Accédez à la page "Labs" dans le menu (visible uniquement pour INSTRUCTOR et ADMIN)
   - Cliquez sur "Nouveau lab" (bouton visible en haut à droite)
   - Remplissez les champs :
     - **Titre** : Nom du lab
     - **Description** : Description du lab (optionnel)
     - **Box Vagrant** : Box à utiliser (ex: `ubuntu/jammy64`, `centos/7`, `debian/bullseye64`)
     - **Mémoire (MB)** : Mémoire allouée à la VM (défaut: 1024)
     - **CPU** : Nombre de CPU (défaut: 1)
     - **Classe** : Optionnel, lier le lab à une classe spécifique

2. **Lancer un lab** :
   - Cliquez sur le bouton "Lancer" sur la carte du lab
   - Le système va :
     - Créer un Vagrantfile dans un répertoire dédié
     - Exécuter `vagrant up` pour créer et démarrer la VM
     - Mettre à jour le statut du lab

3. **Arrêter un lab** :
   - Cliquez sur le bouton "Arrêter" pour arrêter la VM (`vagrant halt`)

4. **Supprimer un lab** :
   - Cliquez sur le bouton de suppression
   - La VM sera détruite avec `vagrant destroy` et le répertoire supprimé

## Boxes Vagrant populaires

- `ubuntu/jammy64` - Ubuntu 22.04 LTS
- `ubuntu/focal64` - Ubuntu 20.04 LTS
- `centos/7` - CentOS 7
- `debian/bullseye64` - Debian 11
- `hashicorp/bionic64` - Ubuntu 18.04

Pour voir toutes les boxes disponibles :
```bash
vagrant box search ubuntu
```

## Commandes Vagrant utilisées

Le service utilise les commandes suivantes :

- `vagrant up` : Crée et démarre la VM
- `vagrant halt` : Arrête la VM
- `vagrant status` : Vérifie le statut de la VM
- `vagrant destroy -f` : Supprime la VM

## Structure des Labs

Chaque lab est créé dans un répertoire séparé :
```
vagrant_labs/
  lab_1/
    Vagrantfile
    .vagrant/
  lab_2/
    Vagrantfile
    .vagrant/
```

## Dépannage

### Erreur : "Vagrant n'est pas installé"

- Vérifiez que Vagrant est installé : `vagrant --version`
- Vérifiez que Vagrant est dans le PATH système
- Redémarrez le serveur après l'installation

### Erreur : "Échec du démarrage de la VM"

- Vérifiez que VirtualBox ou VMware est installé
- Vérifiez les ressources système (RAM, CPU, espace disque)
- Consultez les logs dans le répertoire du lab : `vagrant_labs/lab_X/.vagrant/`

### Erreur : "Box not found"

- Téléchargez la box manuellement : `vagrant box add ubuntu/jammy64`
- Vérifiez la connexion internet pour télécharger la box

### VM ne démarre pas

- Vérifiez les logs : `cd vagrant_labs/lab_X && vagrant up --debug`
- Vérifiez que la virtualisation est activée dans le BIOS
- Vérifiez les permissions d'administration si nécessaire

## Personnalisation avancée

Le Vagrantfile généré peut être personnalisé pour ajouter :
- Scripts de provisioning
- Configuration réseau
- Port forwarding
- Synchronisation de dossiers

Exemple de configuration avancée dans le futur :
```json
{
  "box": "ubuntu/jammy64",
  "memory": "2048",
  "cpus": 2,
  "network": {
    "type": "private_network",
    "ip": "192.168.33.10"
  },
  "ports": [
    { "guest": 80, "host": 8080 },
    { "guest": 443, "host": 8443 }
  ],
  "provision": "apt-get update && apt-get install -y nginx"
}
```

## Sécurité

- Les labs sont créés dans un répertoire dédié
- Seuls les instructeurs et administrateurs peuvent créer/lancer des labs
- Les VMs sont isolées et supprimées lors de la suppression d'un lab

## Notes importantes

- Le téléchargement et le démarrage de VMs peuvent prendre plusieurs minutes
- Assurez-vous d'avoir suffisamment d'espace disque (chaque box peut faire plusieurs GB)
- Les VMs consomment des ressources système (RAM, CPU)
- La première fois qu'une box est utilisée, elle sera téléchargée automatiquement


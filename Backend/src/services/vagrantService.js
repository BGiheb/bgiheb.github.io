const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

/**
 * Service pour gérer les VMs avec Vagrant
 */
class VagrantService {
  constructor() {
    // Répertoire où les labs Vagrant seront créés
    this.labsDirectory = process.env.VAGRANT_LABS_DIRECTORY || path.join(process.cwd(), 'vagrant_labs');
  }

  /**
   * Vérifie si Vagrant est installé
   */
  async checkVagrantInstallation() {
    try {
      const { stdout } = await execAsync('vagrant --version', { timeout: 5000 });
      console.log('[Vagrant] Version:', stdout.trim());
      return true;
    } catch (error) {
      console.error('[Vagrant] Vagrant non trouvé:', error.message);
      return false;
    }
  }

  /**
   * Crée un Vagrantfile pour un lab
   * @param {string} labPath - Chemin du répertoire du lab
   * @param {object} config - Configuration du lab (box, memory, cpus, etc.)
   */
  async createVagrantfile(labPath, config) {
    const vagrantfilePath = path.join(labPath, 'Vagrantfile');
    
    const vagrantfileContent = `# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "${config.box || 'ubuntu/jammy64'}"
  config.vm.hostname = "${config.hostname || 'lab-vm'}"
  
  ${config.memory ? `config.vm.provider "virtualbox" do |vb|
    vb.memory = "${config.memory || '1024'}"
    vb.cpus = ${config.cpus || 1}
  end` : ''}
  
  ${config.network ? `config.vm.network "${config.network.type || 'private_network'}", ip: "${config.network.ip || '192.168.33.10'}"` : ''}
  
  ${config.provision ? `
  # Provisioning scripts
  config.vm.provision "shell", inline: <<-SHELL
${config.provision}
  SHELL
  ` : ''}
  
  ${config.ports ? config.ports.map(port => 
    `config.vm.network "forwarded_port", guest: ${port.guest}, host: ${port.host}`
  ).join('\n  ') : ''}
end
`;

    await fs.writeFile(vagrantfilePath, vagrantfileContent, 'utf-8');
    console.log(`[Vagrant] Vagrantfile créé: ${vagrantfilePath}`);
    return vagrantfilePath;
  }

  /**
   * Initialise un nouveau lab Vagrant
   * @param {string} labId - ID du lab
   * @param {object} config - Configuration du lab
   */
  async initializeLab(labId, config) {
    try {
      const labPath = path.join(this.labsDirectory, `lab_${labId}`);
      
      // Créer le répertoire du lab
      await fs.mkdir(labPath, { recursive: true });
      
      // Créer le Vagrantfile
      await this.createVagrantfile(labPath, config);
      
      console.log(`[Vagrant] Lab initialisé: ${labPath}`);
      return labPath;
    } catch (error) {
      console.error('[Vagrant] Erreur lors de l\'initialisation:', error);
      throw new Error(`Échec de l'initialisation du lab: ${error.message}`);
    }
  }

  /**
   * Lance une VM Vagrant (vagrant up)
   * @param {string} labPath - Chemin du répertoire du lab
   */
  async startVM(labPath) {
    try {
      // Vérifier que le Vagrantfile existe
      const vagrantfilePath = path.join(labPath, 'Vagrantfile');
      await fs.access(vagrantfilePath);

      // Commande vagrant up
      const startCommand = `vagrant up`;
      
      console.log(`[Vagrant] Démarrage de la VM: ${startCommand}`);
      console.log(`[Vagrant] Chemin: ${labPath}`);
      
      // Exécuter dans le répertoire du lab
      const { stdout, stderr } = await execAsync(startCommand, {
        cwd: labPath,
        timeout: 300000, // 5 minutes timeout
      });

      if (stderr && !stderr.includes('Bringing machine') && !stderr.includes('default')) {
        console.warn('[Vagrant] Avertissements:', stderr);
      }

      console.log(`[Vagrant] VM démarrée avec succès: ${labPath}`);
      return true;
    } catch (error) {
      console.error('[Vagrant] Erreur lors du démarrage:', error);
      throw new Error(`Échec du démarrage de la VM: ${error.message}`);
    }
  }

  /**
   * Arrête une VM Vagrant (vagrant halt)
   * @param {string} labPath - Chemin du répertoire du lab
   */
  async stopVM(labPath) {
    try {
      const stopCommand = `vagrant halt`;
      
      console.log(`[Vagrant] Arrêt de la VM: ${stopCommand}`);
      console.log(`[Vagrant] Chemin: ${labPath}`);
      
      const { stdout, stderr } = await execAsync(stopCommand, {
        cwd: labPath,
        timeout: 120000, // 2 minutes timeout
      });

      console.log(`[Vagrant] VM arrêtée: ${labPath}`);
      return true;
    } catch (error) {
      console.error('[Vagrant] Erreur lors de l\'arrêt:', error);
      throw new Error(`Échec de l'arrêt de la VM: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut d'une VM Vagrant
   * @param {string} labPath - Chemin du répertoire du lab
   */
  async getVMStatus(labPath) {
    try {
      const statusCommand = `vagrant status`;
      
      const { stdout } = await execAsync(statusCommand, {
        cwd: labPath,
        timeout: 10000,
      });

      // Parser la sortie de vagrant status
      if (stdout.includes('running')) {
        return 'RUNNING';
      } else if (stdout.includes('poweroff') || stdout.includes('stopped')) {
        return 'STOPPED';
      } else if (stdout.includes('not created')) {
        return 'CREATED';
      } else {
        return 'UNKNOWN';
      }
    } catch (error) {
      console.error('[Vagrant] Erreur lors de la vérification du statut:', error);
      return 'UNKNOWN';
    }
  }

  /**
   * Supprime une VM Vagrant (vagrant destroy)
   * @param {string} labPath - Chemin du répertoire du lab
   */
  async destroyVM(labPath) {
    try {
      const destroyCommand = `vagrant destroy -f`;
      
      console.log(`[Vagrant] Suppression de la VM: ${destroyCommand}`);
      console.log(`[Vagrant] Chemin: ${labPath}`);
      
      await execAsync(destroyCommand, {
        cwd: labPath,
        timeout: 120000,
      });

      // Supprimer le répertoire du lab
      await fs.rm(labPath, { recursive: true, force: true });

      console.log(`[Vagrant] VM supprimée: ${labPath}`);
      return true;
    } catch (error) {
      console.error('[Vagrant] Erreur lors de la suppression:', error);
      // Essayer de supprimer le répertoire même si vagrant destroy échoue
      try {
        await fs.rm(labPath, { recursive: true, force: true });
      } catch (rmError) {
        console.error('[Vagrant] Erreur lors de la suppression du répertoire:', rmError);
      }
      throw new Error(`Échec de la suppression de la VM: ${error.message}`);
    }
  }

  /**
   * Crée et lance une VM Vagrant
   * @param {string} labId - ID du lab
   * @param {object} config - Configuration du lab
   */
  async createAndStartVM(labId, config) {
    try {
      // Vérifier l'installation de Vagrant
      const isInstalled = await this.checkVagrantInstallation();
      if (!isInstalled) {
        throw new Error('Vagrant n\'est pas installé ou n\'est pas dans le PATH');
      }

      // Initialiser le lab
      const labPath = await this.initializeLab(labId, config);

      // Démarrer la VM
      await this.startVM(labPath);

      return labPath;
    } catch (error) {
      console.error('[Vagrant] Erreur lors de la création et du démarrage:', error);
      throw error;
    }
  }
}

module.exports = new VagrantService();



const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs').promises;

const execAsync = promisify(exec);

/**
 * Service pour gérer les VMs VMware Workstation
 */
class VMwareService {
  constructor() {
    // Chemin par défaut de VMware Workstation (peut être configuré via env)
    this.vmrunPath = process.env.VMWARE_VMRUN_PATH || 'C:\\Program Files (x86)\\VMware\\VMware Workstation\\vmrun.exe';
    this.vmwarePath = process.env.VMWARE_PATH || 'C:\\Program Files (x86)\\VMware\\VMware Workstation';
    this.vmsDirectory = process.env.VMS_DIRECTORY || 'C:\\VMs';
  }

  /**
   * Vérifie si VMware Workstation est installé
   */
  async checkVMwareInstallation() {
    try {
      await fs.access(this.vmrunPath);
      return true;
    } catch (error) {
      console.error('[VMware] VMware Workstation non trouvé:', error.message);
      return false;
    }
  }

  /**
   * Clone une VM depuis un template
   * @param {string} templatePath - Chemin vers le template de VM (.vmx)
   * @param {string} vmName - Nom de la nouvelle VM
   * @param {string} destinationPath - Chemin où créer la VM
   */
  async cloneVM(templatePath, vmName, destinationPath) {
    try {
      // Vérifier que le template existe
      await fs.access(templatePath);
      
      // Créer le répertoire de destination s'il n'existe pas
      await fs.mkdir(destinationPath, { recursive: true });

      // Commande vmrun pour cloner la VM
      const cloneCommand = `"${this.vmrunPath}" clone "${templatePath}" "${path.join(destinationPath, `${vmName}.vmx`)}" full -cloneName="${vmName}"`;

      console.log(`[VMware] Clonage de la VM: ${cloneCommand}`);
      
      const { stdout, stderr } = await execAsync(cloneCommand, {
        cwd: this.vmwarePath,
        timeout: 300000, // 5 minutes timeout
      });

      if (stderr && !stderr.includes('Cloning')) {
        throw new Error(`Erreur lors du clonage: ${stderr}`);
      }

      const vmPath = path.join(destinationPath, `${vmName}.vmx`);
      
      // Vérifier que le fichier .vmx a été créé
      await fs.access(vmPath);

      console.log(`[VMware] VM clonée avec succès: ${vmPath}`);
      return vmPath;
    } catch (error) {
      console.error('[VMware] Erreur lors du clonage:', error);
      throw new Error(`Échec du clonage de la VM: ${error.message}`);
    }
  }

  /**
   * Lance une VM
   * @param {string} vmPath - Chemin vers le fichier .vmx de la VM
   */
  async startVM(vmPath) {
    try {
      // Vérifier que la VM existe
      await fs.access(vmPath);

      // Commande vmrun pour démarrer la VM
      const startCommand = `"${this.vmrunPath}" start "${vmPath}"`;

      console.log(`[VMware] Démarrage de la VM: ${startCommand}`);
      
      const { stdout, stderr } = await execAsync(startCommand, {
        cwd: this.vmwarePath,
        timeout: 60000, // 1 minute timeout
      });

      if (stderr && !stderr.includes('started')) {
        throw new Error(`Erreur lors du démarrage: ${stderr}`);
      }

      console.log(`[VMware] VM démarrée avec succès: ${vmPath}`);
      return true;
    } catch (error) {
      console.error('[VMware] Erreur lors du démarrage:', error);
      throw new Error(`Échec du démarrage de la VM: ${error.message}`);
    }
  }

  /**
   * Arrête une VM
   * @param {string} vmPath - Chemin vers le fichier .vmx de la VM
   */
  async stopVM(vmPath) {
    try {
      const stopCommand = `"${this.vmrunPath}" stop "${vmPath}"`;

      console.log(`[VMware] Arrêt de la VM: ${stopCommand}`);
      
      const { stdout, stderr } = await execAsync(stopCommand, {
        cwd: this.vmwarePath,
        timeout: 60000,
      });

      console.log(`[VMware] VM arrêtée: ${vmPath}`);
      return true;
    } catch (error) {
      console.error('[VMware] Erreur lors de l\'arrêt:', error);
      throw new Error(`Échec de l'arrêt de la VM: ${error.message}`);
    }
  }

  /**
   * Vérifie le statut d'une VM
   * @param {string} vmPath - Chemin vers le fichier .vmx de la VM
   */
  async getVMStatus(vmPath) {
    try {
      const statusCommand = `"${this.vmrunPath}" list`;

      const { stdout } = await execAsync(statusCommand, {
        cwd: this.vmwarePath,
        timeout: 10000,
      });

      // Vérifier si la VM est dans la liste des VMs en cours d'exécution
      const isRunning = stdout.includes(vmPath);
      return isRunning ? 'RUNNING' : 'STOPPED';
    } catch (error) {
      console.error('[VMware] Erreur lors de la vérification du statut:', error);
      return 'UNKNOWN';
    }
  }

  /**
   * Crée et lance une VM depuis un template
   * @param {string} templatePath - Chemin vers le template
   * @param {string} vmName - Nom de la VM
   * @param {string} destinationPath - Chemin de destination
   */
  async createAndStartVM(templatePath, vmName, destinationPath) {
    try {
      // Vérifier l'installation de VMware
      const isInstalled = await this.checkVMwareInstallation();
      if (!isInstalled) {
        throw new Error('VMware Workstation n\'est pas installé ou vmrun.exe n\'est pas trouvé');
      }

      // Cloner la VM
      const vmPath = await this.cloneVM(templatePath, vmName, destinationPath);

      // Attendre un peu pour que le clonage se termine
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Démarrer la VM
      await this.startVM(vmPath);

      return vmPath;
    } catch (error) {
      console.error('[VMware] Erreur lors de la création et du démarrage:', error);
      throw error;
    }
  }

  /**
   * Supprime une VM
   * @param {string} vmPath - Chemin vers le fichier .vmx de la VM
   */
  async deleteVM(vmPath) {
    try {
      // Arrêter la VM si elle est en cours d'exécution
      try {
        await this.stopVM(vmPath);
      } catch (error) {
        // Ignorer si la VM n'est pas en cours d'exécution
      }

      // Supprimer le répertoire de la VM
      const vmDirectory = path.dirname(vmPath);
      await fs.rm(vmDirectory, { recursive: true, force: true });

      console.log(`[VMware] VM supprimée: ${vmPath}`);
      return true;
    } catch (error) {
      console.error('[VMware] Erreur lors de la suppression:', error);
      throw new Error(`Échec de la suppression de la VM: ${error.message}`);
    }
  }
}

module.exports = new VMwareService();


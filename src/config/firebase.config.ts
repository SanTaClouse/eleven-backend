import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  onModuleInit() {
    try {
      // Inicializar Firebase Admin usando variables de entorno
      this.firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error.message);
      throw error;
    }
  }

  getAuth(): admin.auth.Auth {
    return admin.auth(this.firebaseApp);
  }

  getStorage(): admin.storage.Storage {
    return admin.storage(this.firebaseApp);
  }

  /**
   * Crea un Custom Token de Firebase para un usuario
   * @param userId ID del usuario (debe coincidir con el uid en Firebase)
   * @param additionalClaims Claims adicionales opcionales
   */
  async createCustomToken(userId: string, additionalClaims?: object): Promise<string> {
    try {
      const customToken = await this.getAuth().createCustomToken(userId, additionalClaims);
      this.logger.debug(`Custom token created for user: ${userId}`);
      return customToken;
    } catch (error) {
      this.logger.error(`Failed to create custom token for user ${userId}:`, error.message);
      throw error;
    }
  }
}
